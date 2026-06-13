#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const COMPONENT_BYTES = new Map([
  [5120, 1],
  [5121, 1],
  [5122, 2],
  [5123, 2],
  [5125, 4],
  [5126, 4],
]);
const TYPE_COMPONENTS = new Map([
  ['SCALAR', 1],
  ['VEC2', 2],
  ['VEC3', 3],
  ['VEC4', 4],
]);

export function createEvenSampleIndices(totalPoints, maxPoints) {
  if (!Number.isInteger(totalPoints) || totalPoints < 0) {
    throw new Error('totalPoints must be a non-negative integer');
  }
  if (!Number.isInteger(maxPoints) || maxPoints < 1) {
    throw new Error('maxPoints must be a positive integer');
  }

  const count = Math.min(totalPoints, maxPoints);
  if (count === 0) return new Uint32Array();
  if (count === 1) return Uint32Array.of(0);

  const indices = new Uint32Array(count);
  for (let index = 0; index < count; index += 1) {
    indices[index] = Math.round((index * (totalPoints - 1)) / (count - 1));
  }
  return indices;
}

function align4(value) {
  return (value + 3) & ~3;
}

function parseGlb(source) {
  if (source.readUInt32LE(0) !== 0x46546c67 || source.readUInt32LE(4) !== 2) {
    throw new Error('Input must be a glTF 2.0 binary file');
  }

  const jsonLength = source.readUInt32LE(12);
  const jsonType = source.readUInt32LE(16);
  if (jsonType !== JSON_CHUNK) throw new Error('GLB JSON chunk is missing');

  const json = JSON.parse(source.subarray(20, 20 + jsonLength).toString('utf8').trim());
  const binHeaderOffset = 20 + jsonLength;
  const binLength = source.readUInt32LE(binHeaderOffset);
  const binType = source.readUInt32LE(binHeaderOffset + 4);
  if (binType !== BIN_CHUNK) throw new Error('GLB binary chunk is missing');

  return {
    json,
    binary: source.subarray(binHeaderOffset + 8, binHeaderOffset + 8 + binLength),
  };
}

function readComponent(buffer, offset, componentType) {
  if (componentType === 5120) return buffer.readInt8(offset);
  if (componentType === 5121) return buffer.readUInt8(offset);
  if (componentType === 5122) return buffer.readInt16LE(offset);
  if (componentType === 5123) return buffer.readUInt16LE(offset);
  if (componentType === 5125) return buffer.readUInt32LE(offset);
  if (componentType === 5126) return buffer.readFloatLE(offset);
  throw new Error(`Unsupported component type: ${componentType}`);
}

function sampleAccessor(json, binary, accessorIndex, sampleIndices) {
  const accessor = json.accessors[accessorIndex];
  const view = json.bufferViews[accessor.bufferView];
  const componentBytes = COMPONENT_BYTES.get(accessor.componentType);
  const componentCount = TYPE_COMPONENTS.get(accessor.type);
  if (!componentBytes || !componentCount) {
    throw new Error(`Unsupported accessor ${accessorIndex}`);
  }

  const elementBytes = componentBytes * componentCount;
  const stride = view.byteStride ?? elementBytes;
  const sourceOffset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const output = Buffer.allocUnsafe(sampleIndices.length * elementBytes);
  const min = Array(componentCount).fill(Number.POSITIVE_INFINITY);
  const max = Array(componentCount).fill(Number.NEGATIVE_INFINITY);

  for (let outputIndex = 0; outputIndex < sampleIndices.length; outputIndex += 1) {
    const inputOffset = sourceOffset + sampleIndices[outputIndex] * stride;
    const outputOffset = outputIndex * elementBytes;
    binary.copy(output, outputOffset, inputOffset, inputOffset + elementBytes);

    for (let component = 0; component < componentCount; component += 1) {
      const value = readComponent(output, outputOffset + component * componentBytes, accessor.componentType);
      min[component] = Math.min(min[component], value);
      max[component] = Math.max(max[component], value);
    }
  }

  return {
    output,
    accessor: {
      ...accessor,
      bufferView: accessorIndex,
      byteOffset: 0,
      count: sampleIndices.length,
      min,
      max,
    },
  };
}

function encodeGlb(json, binary) {
  const jsonData = Buffer.from(JSON.stringify(json));
  const jsonLength = align4(jsonData.length);
  const binaryLength = align4(binary.length);
  const totalLength = 12 + 8 + jsonLength + 8 + binaryLength;
  const output = Buffer.alloc(totalLength);

  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(totalLength, 8);
  output.writeUInt32LE(jsonLength, 12);
  output.writeUInt32LE(JSON_CHUNK, 16);
  output.fill(0x20, 20, 20 + jsonLength);
  jsonData.copy(output, 20);

  const binHeaderOffset = 20 + jsonLength;
  output.writeUInt32LE(binaryLength, binHeaderOffset);
  output.writeUInt32LE(BIN_CHUNK, binHeaderOffset + 4);
  binary.copy(output, binHeaderOffset + 8);
  return output;
}

export function downsamplePointGlb(inputPath, outputPath, maxPoints) {
  const { json, binary } = parseGlb(fs.readFileSync(inputPath));
  const primitive = json.meshes?.[0]?.primitives?.[0];
  if (!primitive || primitive.mode !== 0 || primitive.indices !== undefined) {
    throw new Error('Expected one non-indexed POINTS primitive');
  }

  const attributeEntries = Object.entries(primitive.attributes);
  const counts = attributeEntries.map(([, accessorIndex]) => json.accessors[accessorIndex].count);
  if (counts.some((count) => count !== counts[0])) {
    throw new Error('Point attributes must have matching counts');
  }

  const sampleIndices = createEvenSampleIndices(counts[0], maxPoints);
  const sampled = attributeEntries.map(([, accessorIndex]) =>
    sampleAccessor(json, binary, accessorIndex, sampleIndices),
  );

  let byteOffset = 0;
  const chunks = [];
  json.bufferViews = sampled.map(({ output }) => {
    const view = { buffer: 0, byteOffset, byteLength: output.length };
    chunks.push(output);
    byteOffset += output.length;
    const padding = align4(byteOffset) - byteOffset;
    if (padding) {
      chunks.push(Buffer.alloc(padding));
      byteOffset += padding;
    }
    return view;
  });
  json.accessors = sampled.map(({ accessor }, index) => ({ ...accessor, bufferView: index }));
  primitive.attributes = Object.fromEntries(
    attributeEntries.map(([attribute], index) => [attribute, index]),
  );

  const outputBinary = Buffer.concat(chunks);
  json.buffers = [{ byteLength: outputBinary.length }];
  json.asset.generator = 'Pocket Cosmos deterministic point-cloud downsampler';

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, encodeGlb(json, outputBinary));
  return { sourcePoints: counts[0], outputPoints: sampleIndices.length };
}

function main() {
  const [inputPath, outputPath, maxPointsText = '400000'] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    console.error('Usage: node tools/downsample-point-glb.mjs <input.glb> <output.glb> [maxPoints]');
    process.exitCode = 1;
    return;
  }

  const result = downsamplePointGlb(inputPath, outputPath, Number(maxPointsText));
  console.log(`${result.sourcePoints} -> ${result.outputPoints} points: ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
