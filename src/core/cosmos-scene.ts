import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import type { DemoMode, Quality, ScenePreset } from '../state/app-state';

interface CosmosSceneOptions {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  labels: HTMLElement;
  preset: ScenePreset;
  quality: Quality;
}

interface LabelTarget {
  element: HTMLElement;
  target: THREE.Object3D;
}

const tempVector = new THREE.Vector3();

export class CosmosScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly stage: HTMLElement;
  private readonly labelsLayer: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  private readonly controls: OrbitControls;
  private readonly anchor = new THREE.Group();
  private readonly earthOrbit = new THREE.Object3D();
  private readonly moonOrbit = new THREE.Object3D();
  private readonly probe = new THREE.Group();
  private readonly bloomPass: UnrealBloomPass;
  private readonly clock = new THREE.Clock();
  private readonly path: THREE.CatmullRomCurve3;
  private readonly labels: LabelTarget[] = [];
  private mode: DemoMode = 'science';
  private timeScale = 1;
  private elapsed = 0;
  private animationFrame = 0;
  private placed = false;
  private shadow: THREE.Mesh;
  private quality: Quality;

  constructor(options: CosmosSceneOptions) {
    this.canvas = options.canvas;
    this.stage = options.stage;
    this.labelsLayer = options.labels;
    this.quality = options.quality;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 13;
    this.controls.enablePan = false;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera, null, new THREE.Color(0x000000), 0));
    this.composer.addPass(new SMAAPass());
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.74, 0.34, 0.78);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    this.path = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-2.4, 0.5, 1.4),
        new THREE.Vector3(-0.2, 1.5, 2.1),
        new THREE.Vector3(2.9, 0.35, 0.7),
        new THREE.Vector3(1.2, 1.65, -1.8),
      ],
      true,
      'centripetal',
      0.5,
    );

    this.shadow = this.createShadow();
    this.setupScene();
    this.applyPreset(options.preset);
    this.applyQuality(options.quality);
    this.resize();
    this.animate();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrame);
    this.renderer.dispose();
    this.composer.dispose();
  }

  applyPreset(preset: ScenePreset): void {
    this.camera.position.set(preset.camera.position.x, preset.camera.position.y, preset.camera.position.z);
    this.controls.target.set(preset.camera.target.x, preset.camera.target.y, preset.camera.target.z);
    this.controls.update();
    this.anchor.position.set(preset.anchor.x, preset.anchor.y, preset.anchor.z);
    this.placed = false;
    this.anchor.visible = false;
  }

  setMode(mode: DemoMode): void {
    this.mode = mode;
    this.labelsLayer.dataset.mode = mode;
    this.bloomPass.strength = mode === 'cinematic' ? 1.15 : 0.58;
    this.bloomPass.radius = mode === 'cinematic' ? 0.48 : 0.26;
    this.renderer.toneMappingExposure = mode === 'cinematic' ? 1.22 : 1.02;
  }

  setTimeScale(value: number): void {
    this.timeScale = value;
  }

  applyQuality(quality: Quality): void {
    this.quality = quality;
    const dpr = quality === 'cinematic' ? 1.75 : quality === 'balanced' ? 1.35 : 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    this.shadow.visible = quality !== 'safe';
    this.bloomPass.enabled = quality !== 'safe';
    this.resize();
  }

  placeFromPointer(clientX: number, clientY: number): void {
    const rect = this.stage.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width - 0.5) * 3.4;
    const y = -0.92 + (0.5 - (clientY - rect.top) / rect.height) * 0.7;
    this.anchor.position.set(x, THREE.MathUtils.clamp(y, -1.08, -0.36), 0);
    this.anchor.visible = true;
    this.placed = true;
  }

  resetPlacement(): void {
    this.anchor.visible = false;
    this.placed = false;
  }

  capture(): string {
    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL('image/png');
  }

  isPlaced(): boolean {
    return this.placed;
  }

  resize(): void {
    const width = Math.max(1, this.stage.clientWidth);
    const height = Math.max(1, this.stage.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
  }

  private setupScene(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff3d2, 0x223040, 1.35));

    const keyLight = new THREE.DirectionalLight(0xfff0d2, 2.5);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x77d4ff, 18, 12, 2);
    fillLight.position.set(-3, 2.4, 2.2);
    this.scene.add(fillLight);

    this.anchor.visible = false;
    this.scene.add(this.anchor);
    this.anchor.add(this.shadow);
    this.createCosmos();
    this.createProbe();
    this.createEnergyTrail();
    this.createLabels();
  }

  private createCosmos(): void {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.65, 0.2, 72),
      new THREE.MeshStandardMaterial({
        color: 0x1e2b2e,
        metalness: 0.55,
        roughness: 0.34,
      }),
    );
    base.position.y = -0.18;
    base.castShadow = true;
    base.receiveShadow = true;

    const sun = this.createPlanet(0.74, 0xffc64d, 0xff7a18, true);
    sun.name = '太阳核心';
    sun.position.y = 0.72;

    const earth = this.createPlanet(0.28, 0x4aa3ff, 0x3be2a8, false);
    earth.name = '地球';
    earth.position.set(2.2, 0.72, 0);

    const moon = this.createPlanet(0.1, 0xd8d2bf, 0xffffff, false);
    moon.name = '月球';
    moon.position.set(0.52, 0, 0);

    this.earthOrbit.add(earth, this.moonOrbit);
    this.moonOrbit.position.copy(earth.position);
    this.moonOrbit.add(moon);

    this.anchor.add(base, sun, this.earthOrbit);
    this.anchor.add(this.createOrbit(2.2, 0x83e5ff, 0.46));
    const moonOrbitLine = this.createOrbit(0.52, 0xd9d6c7, 0.34);
    moonOrbitLine.position.copy(earth.position);
    this.earthOrbit.add(moonOrbitLine);
  }

  private createPlanet(radius: number, color: number, emissive: number, isSun: boolean): THREE.Mesh {
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 32),
      new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: isSun ? 1.45 : 0.14,
        roughness: isSun ? 0.48 : 0.38,
        metalness: isSun ? 0.1 : 0.05,
      }),
    );
    planet.castShadow = true;
    planet.receiveShadow = true;
    return planet;
  }

  private createOrbit(radius: number, color: number, opacity: number): THREE.LineLoop {
    const points = Array.from({ length: 160 }, (_, index) => {
      const angle = (index / 160) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * radius, 0.72, Math.sin(angle) * radius);
    });
    return new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
  }

  private createShadow(): THREE.Mesh {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 72),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.3;
    shadow.scale.z = 0.45;
    return shadow;
  }

  private createProbe(): void {
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.34, 5),
      new THREE.MeshStandardMaterial({
        color: 0xf4f0d6,
        emissive: 0x5edcff,
        emissiveIntensity: 0.45,
        metalness: 0.6,
        roughness: 0.2,
      }),
    );
    body.rotation.x = Math.PI / 2;
    const light = new THREE.PointLight(0x7ce7ff, 8, 2);
    this.probe.add(body, light);
    this.anchor.add(this.probe);
  }

  private createEnergyTrail(): void {
    const points = this.path.getPoints(120);
    const trail = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0x8df2ff, transparent: true, opacity: 0.42 }),
    );
    this.anchor.add(trail);
  }

  private createLabels(): void {
    const labelSpecs = [
      { text: '太阳：发光核心', object: this.anchor.children[1] },
      { text: '地球：父级轨道', object: this.earthOrbit.children[0] },
      { text: '月球：局部坐标', object: this.moonOrbit.children[0] },
      { text: '探测器：样条路径', object: this.probe },
    ];

    labelSpecs.forEach(({ text, object }) => {
      const element = document.createElement('span');
      element.className = 'scene-label';
      element.textContent = text;
      this.labelsLayer.appendChild(element);
      this.labels.push({ element, target: object });
    });
  }

  private animate = (): void => {
    const delta = this.clock.getDelta();
    this.elapsed += delta * this.timeScale;
    this.controls.update();
    this.updateObjects(this.elapsed);
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private updateObjects(t: number): void {
    this.anchor.rotation.y = Math.sin(t * 0.18) * 0.08;
    this.earthOrbit.rotation.y = t * 0.52;
    this.moonOrbit.rotation.y = t * 1.9;
    this.anchor.children.forEach((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) child.rotation.y += 0.003 * this.timeScale;
    });

    const u = (t * 0.06) % 1;
    this.path.getPointAt(u, this.probe.position);
    this.probe.position.y += Math.sin(t * 1.6) * 0.08;
    this.probe.lookAt(this.path.getPointAt((u + 0.012) % 1));
  }

  private updateLabels(): void {
    const rect = this.stage.getBoundingClientRect();
    this.labels.forEach(({ element, target }) => {
      target.getWorldPosition(tempVector);
      tempVector.project(this.camera);
      const x = (tempVector.x * 0.5 + 0.5) * rect.width;
      const y = (-tempVector.y * 0.5 + 0.5) * rect.height;
      const visible = this.mode === 'science' && this.placed && tempVector.z < 1;
      element.style.transform = `translate(${x}px, ${y}px)`;
      element.style.opacity = visible ? '1' : '0';
    });
  }
}
