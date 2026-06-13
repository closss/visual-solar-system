# Point Cloud Frontend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Downsample the Lewis Queen and Nefertiti MapAnything point clouds and add both reconstruction results to the heritage solar-system frontend.

**Architecture:** A standalone Node script reads MapAnything POINTS GLBs, deterministically samples vertex attributes, and writes compact GLBs. The frontend keeps using `GLTFLoader`, but applies a dedicated vertex-color `PointsMaterial` to point-cloud artifacts while preserving the existing mesh path.

**Tech Stack:** TypeScript, Three.js, Node.js, Vitest, Vite

---

### Task 1: Deterministic point sampling

**Files:**
- Create: `tools/downsample-point-glb.mjs`
- Create: `tests/point-cloud-config.test.ts`
- Create: `src/point-cloud-config.ts`

- [ ] Write a failing Vitest test for deterministic, evenly distributed sample indices and point-cloud material settings.
- [ ] Run `npm test -- tests/point-cloud-config.test.ts` and verify failure because the module does not exist.
- [ ] Implement the sampling/config helpers and the GLB transformer, preserving `POSITION` and `COLOR_0`.
- [ ] Run the focused test and verify it passes.

### Task 2: Produce compact browser assets

**Files:**
- Create: `public/heritage/recon/lewis-queen-object-lite.glb`
- Create: `public/heritage/recon/nefertiti-object-lite.glb`

- [ ] Download the two object-only MapAnything GLBs from the server.
- [ ] Inspect their GLB primitives and vertex attributes.
- [ ] Downsample each object to at most 400,000 points with deterministic sampling.
- [ ] Verify output point counts, bounding boxes, color attributes, and file sizes.

### Task 3: Add frontend artifacts and point rendering

**Files:**
- Modify: `src/data/heritage-artifacts.ts`
- Modify: `src/main.ts`

- [ ] Extend model metadata with optional point-cloud rendering settings.
- [ ] Add Nefertiti as the normal reconstructed exhibit and Lewis Queen as an experimental reconstruction.
- [ ] Apply vertex-color `PointsMaterial`, normalize point-cloud size, and retain raycast selection.
- [ ] Update the overview and reconstruction labels so view counts are accurate per artifact.

### Task 4: Verify the experience

**Files:**
- Modify only if visual defects are found: `src/main.ts`, `src/styles/main.css`

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Start Vite and inspect desktop and mobile layouts in the in-app browser.
- [ ] Select both new artifacts and verify visibility, framing, color, rotation, and return interaction.
