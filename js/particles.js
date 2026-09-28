/* ==========================================================================
   Ultra-Luxury Three.js WebGL 3D Photo & Particle Render Engine (r160)
   Features:
   - 20,000+ GPU Accelerated Particles using THREE.Points & Custom Shaders
   - UnrealBloomPass Post-Processing for Glowing Magical Aura
   - Real 3D Z-Buffer & Additive Blending
   - 3D Floating Canvas Photo Mesh with Gold Aura & Light Trails
   ========================================================================== */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width || window.innerWidth;
    this.height = canvas.height || window.innerHeight;

    this.mode = 0;
    this.time = 0;
    this.rotationY = 0;
    this.handPos = { x: 0.5, y: 0.5 };
    this.targetHand3D = new THREE.Vector3(0, 0, 0);
    this.pulseScale = 1.0;
    this.activePromptText = null;

    // Photo state
    this.activePhotoImg = null;
    this.activePhotoCaption = null;
    this.photoAlpha = 0;
    this.photoScale = 0;

    // Three.js Core Components
    this.initThree();

    // System Geometry Anchors
    this.particleCount = 24000;
    this.snowCount = 1000;

    // Aurora wind state
    this.auroraWind = { x: 0, y: 0 };
    this.auroraWindTarget = { x: 0, y: 0 };

    // Text morphing state
    this.textMorphPos = null;
    this.textMorphTime = 0;

    this.initBuffers();
    this.initPhotoMesh();
    this.initPromptMesh();
    this.initSnow();
    this.initAurora();
    this.initCandleFlames();

    this.fireworks = [];
  }

  initThree() {
    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x040a14, 0.0005);

    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 1, 4000);
    this.camera.position.set(0, 0, 750);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(this.camera); // Required for camera-space children

    // 4. Raycaster for hand 2D -> 3D mapping
    this.raycaster = new THREE.Raycaster();
    this.planeZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    // 5. OrbitControls for 360 degree 3D rotation with mouse/touch
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.25;
    this.controls.minDistance = 250;
    this.controls.maxDistance = 1600;

    // 6. Post-processing Bloom
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      1.35, // strength
      0.60, // radius
      0.10  // threshold
    );
    this.composer.addPass(this.bloomPass);

    this.init3DStar();
    this.init3DOrnaments();
  }

  init3DStar() {
    const starGeo = new THREE.OctahedronGeometry(32, 0);
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      wireframe: false
    });
    this.starMesh = new THREE.Mesh(starGeo, starMat);
    this.starMesh.position.set(0, 250, 0);

    const haloGeo = new THREE.OctahedronGeometry(48, 0);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    this.starHalo = new THREE.Mesh(haloGeo, haloMat);
    this.starHalo.position.set(0, 250, 0);

    this.scene.add(this.starMesh);
    this.scene.add(this.starHalo);
  }

  init3DOrnaments() {
    // Add lights for glass effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff0cc, 1.2);
    dirLight.position.set(200, 400, 300);
    this.scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x6688cc, 0.5);
    backLight.position.set(-200, -100, -200);
    this.scene.add(backLight);

    const count = 130;
    const sphereGeo = new THREE.SphereGeometry(7, 24, 24); // Higher segments for smooth glass
    this.ornaments = [];
    const colors = [0xff2244, 0xffd700, 0x00d2ff, 0xff00bb, 0xffffff, 0xff6600, 0x00ff88];

    for (let i = 0; i < count; i++) {
      const progress = 0.12 + (i / count) * 0.80;
      const y = (0.5 - progress) * 520;
      const radius = progress * 230 * 0.82;
      const theta = Math.random() * Math.PI * 2;

      // Glass-like Phong Material with specular highlight
      const baseColor = colors[i % colors.length];
      const mat = new THREE.MeshPhongMaterial({
        color: baseColor,
        specular: 0xffffff,
        shininess: 120,
        transparent: true,
        opacity: 0.90,
        reflectivity: 0.8,
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      mesh.position.set(x, y - 20, z);
      mesh.userData = { origX: x, origY: y - 20, origZ: z, phase: Math.random() * Math.PI * 2 };

      this.scene.add(mesh);
      this.ornaments.push(mesh);
    }
  }

  setPromptText(text) {
    this.activePromptText = text;
    this.updatePromptTexture();
  }

  setActivePhoto(imgElement, captionText) {
    this.activePhotoImg = imgElement;
    this.activePhotoCaption = captionText;
    this.updatePhotoTexture();
  }

  clearActivePhoto() {
    this.activePhotoImg = null;
    this.activePhotoCaption = null;
  }

  initBuffers() {
    const count = this.particleCount;

    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.alphas = new Float32Array(count);

    // Stored target positions per mode
    this.treePos = new Float32Array(count * 3);
    this.neonPos = new Float32Array(count * 3);
    this.icePos  = new Float32Array(count * 3);
    this.solarPos= new Float32Array(count * 3);
    this.heartPos= new Float32Array(count * 3);
    this.textPos = new Float32Array(count * 3); // Mode 4: Particle Text

    this.hueShifts = new Float32Array(count);
    this.phases = new Float32Array(count);

    const treeHeight = 520;
    this.treeHeight = treeHeight;
    const baseRadius = 230;
    this.baseRadius = baseRadius;
    const centerY = -20;
    this.centerY = centerY;

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const progress = i / count;
      const y = (0.5 - progress) * treeHeight; // Top (+260) to Bottom (-260)

      // --- MODE 0: CLASSIC 3D CHRISTMAS TREE ---
      const tierCount = 5;
      const tierProgress = (progress * tierCount) % 1;
      const tierFactor = 0.55 + 0.45 * Math.sin(tierProgress * Math.PI);
      const maxR = progress * baseRadius * tierFactor;
      const radius = maxR * Math.sqrt(Math.random()) * (0.8 + Math.random() * 0.3);

      const theta = i * goldenAngle;
      const tx = radius * Math.cos(theta);
      const ty = centerY + y;
      const tz = radius * Math.sin(theta);

      this.treePos[i*3+0] = tx;
      this.treePos[i*3+1] = ty;
      this.treePos[i*3+2] = tz;

      // --- MODE 1: CYBERPUNK HELICAL VORTEX ---
      const helixTurn = progress * Math.PI * 2 * 9;
      const helixRadius = (0.15 + progress * 0.85) * baseRadius * 1.3;
      this.neonPos[i*3+0] = helixRadius * Math.cos(helixTurn + (i % 2 === 0 ? 0 : Math.PI));
      this.neonPos[i*3+1] = centerY + y * 1.15;
      this.neonPos[i*3+2] = helixRadius * Math.sin(helixTurn + (i % 2 === 0 ? 0 : Math.PI));

      // --- MODE 2: FROSTED ICE CRYSTAL CYLINDER ---
      const iceRadius = baseRadius * 0.9;
      const iceAngle = Math.random() * Math.PI * 2;
      this.icePos[i*3+0] = iceRadius * Math.cos(iceAngle);
      this.icePos[i*3+1] = centerY + (Math.random() - 0.5) * treeHeight * 1.1;
      this.icePos[i*3+2] = iceRadius * Math.sin(iceAngle);

      // --- MODE 3: GOLDEN SOLAR STARBURST SPHERE ---
      const sphereR = baseRadius * 1.05;
      const phi = Math.acos(2 * Math.random() - 1);
      const lam = 2 * Math.PI * Math.random();
      this.solarPos[i*3+0] = sphereR * Math.sin(phi) * Math.cos(lam);
      this.solarPos[i*3+1] = centerY + sphereR * Math.cos(phi) * 0.85;
      this.solarPos[i*3+2] = sphereR * Math.sin(phi) * Math.sin(lam);

      // --- MODE 8: 3D PARAMETRIC HEART ---
      const tHeart = progress * Math.PI * 2;
      const heartScale = 14.0;
      const hx = 16 * Math.pow(Math.sin(tHeart), 3) * heartScale;
      const hy = (13 * Math.cos(tHeart) - 5 * Math.cos(2*tHeart) - 2 * Math.cos(3*tHeart) - Math.cos(4*tHeart)) * heartScale;
      const hz = (Math.random() - 0.5) * 120;
      this.heartPos[i*3+0] = hx + (Math.random() - 0.5) * 25;
      this.heartPos[i*3+1] = centerY + hy + (Math.random() - 0.5) * 25;
      this.heartPos[i*3+2] = hz;

      // Colors & Properties
      let color = new THREE.Color();
      if (i < 300) {
        // Star / Ornaments
        color.setHSL(0.12, 1.0, 0.7); // Gold
      } else if (Math.random() < 0.7) {
        color.setHSL(0.38 + Math.random() * 0.08, 0.9, 0.45 + Math.random() * 0.2); // Emerald Green
      } else {
        color.setHSL(0.98 + Math.random() * 0.05, 0.95, 0.6); // Crimson Red
      }

      this.colors[i*3+0] = color.r;
      this.colors[i*3+1] = color.g;
      this.colors[i*3+2] = color.b;

      this.positions[i*3+0] = tx;
      this.positions[i*3+1] = ty;
      this.positions[i*3+2] = tz;

      this.sizes[i] = i < 300 ? (Math.random() * 8.0 + 5.0) : (Math.random() * 4.0 + 2.0);
      this.alphas[i] = Math.random() * 0.6 + 0.4;
      this.hueShifts[i] = Math.random() * 360;
      this.phases[i] = Math.random() * Math.PI * 2;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));

    // Custom Glowing Particle Shader Material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uTime: { value: 0 }
      },
      vertexShader: /* glsl */`
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (600.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          glow = pow(glow, 1.4);
          gl_FragColor = vec4(vColor * 1.3, vAlpha * glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    // Pre-generate text morph positions for Mode 4
    // Must be done after canvas is available (DOM ready)
    setTimeout(() => {
      const textSamples = this.generateTextMorphPositions('Merry Christmas');
      if (textSamples.length > 0) {
        for (let i = 0; i < count; i++) {
          const sample = textSamples[i % textSamples.length];
          this.textPos[i*3+0] = sample.x + (Math.random() - 0.5) * 15;
          this.textPos[i*3+1] = sample.y + (Math.random() - 0.5) * 15;
          this.textPos[i*3+2] = (Math.random() - 0.5) * 80;
        }
      }
    }, 100);
  }

  initPhotoMesh() {
    this.photoCanvas = document.createElement('canvas');
    this.photoCanvas.width = 512;
    this.photoCanvas.height = 640;
    this.photoCtx = this.photoCanvas.getContext('2d');

    this.photoTexture = new THREE.CanvasTexture(this.photoCanvas);
    this.photoTexture.minFilter = THREE.LinearFilter;
    this.photoTexture.magFilter = THREE.LinearFilter;

    // Photo Plane Mesh
    const planeGeo = new THREE.PlaneGeometry(240, 300);
    const planeMat = new THREE.MeshBasicMaterial({
      map: this.photoTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: true
    });
    this.photoMesh = new THREE.Mesh(planeGeo, planeMat);
    this.photoMesh.visible = false;
    // Will be camera.add'd below (after auraMesh)

    // Glowing Aura Plane Mesh (Behind photo)
    const auraGeo = new THREE.PlaneGeometry(360, 440);
    this.auraCanvas = document.createElement('canvas');
    this.auraCanvas.width = 256;
    this.auraCanvas.height = 256;
    const actx = this.auraCanvas.getContext('2d');
    const grad = actx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    grad.addColorStop(0.5, 'rgba(255, 117, 140, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    actx.fillStyle = grad;
    actx.fillRect(0, 0, 256, 256);

    const auraTexture = new THREE.CanvasTexture(this.auraCanvas);
    const auraMat = new THREE.MeshBasicMaterial({
      map: auraTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.auraMesh.position.set(0, 0, -383); // camera-space: just behind photo
    this.auraMesh.visible = false;
    this.camera.add(this.auraMesh); // Parented to camera → always visible

    this.photoMesh.position.set(0, 0, -380); // camera-space: in front of camera
    this.camera.add(this.photoMesh);         // Parented to camera → always visible

  updatePhotoTexture() {
    if (!this.activePhotoImg || !this.activePhotoImg.complete) return;

    const ctx = this.photoCtx;
    const w = 512;
    const h = 640;
    ctx.clearRect(0, 0, w, h);

    // Gold Outer Border & Background
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#0a0512';
    ctx.fillRect(8, 8, w - 16, h - 16);

    // Image Draw
    const img = this.activePhotoImg;
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;

    const areaW = w - 32;
    const areaH = h - 110;
    const scale = Math.min(areaW / iw, areaH / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = 16 + (areaW - dw) / 2;
    const dy = 16 + (areaH - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);

    // Gold Inner Border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(dx, dy, dw, dh);

    // Caption
    if (this.activePhotoCaption) {
      ctx.font = 'bold italic 34px "Great Vibes", cursive';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(this.activePhotoCaption, w / 2, h - 40);
      ctx.shadowBlur = 0;
    }

    this.photoTexture.needsUpdate = true;
  }

  initPromptMesh() {
    this.promptCanvas = document.createElement('canvas');
    this.promptCanvas.width = 1024;
    this.promptCanvas.height = 128;
    this.promptCtx = this.promptCanvas.getContext('2d');

    this.promptTexture = new THREE.CanvasTexture(this.promptCanvas);
    const planeGeo = new THREE.PlaneGeometry(500, 62.5);
    const planeMat = new THREE.MeshBasicMaterial({
      map: this.promptTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.promptMesh = new THREE.Mesh(planeGeo, planeMat);
    this.promptMesh.position.set(0, 240, 50);
    this.promptMesh.visible = false;
    this.scene.add(this.promptMesh);
  }

  updatePromptTexture() {
    if (!this.activePromptText) {
      this.promptMesh.visible = false;
      return;
    }

    const ctx = this.promptCtx;
    const w = 1024;
    const h = 128;
    ctx.clearRect(0, 0, w, h);

    ctx.font = 'bold 44px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
    ctx.shadowBlur = 16;
    ctx.fillText(this.activePromptText, w / 2, h / 2 + 14);

    this.promptTexture.needsUpdate = true;
    this.promptMesh.visible = true;
  }

  initSnow() {
    const snowPositions = new Float32Array(this.snowCount * 3);
    this.snowVelocities = new Float32Array(this.snowCount * 3);

    for (let i = 0; i < this.snowCount; i++) {
      snowPositions[i*3+0] = (Math.random() - 0.5) * 1200;
      snowPositions[i*3+1] = (Math.random() - 0.5) * 1000;
      snowPositions[i*3+2] = (Math.random() - 0.5) * 800;

      this.snowVelocities[i*3+0] = (Math.random() - 0.5) * 0.6;
      this.snowVelocities[i*3+1] = - (Math.random() * 1.5 + 0.8);
      this.snowVelocities[i*3+2] = (Math.random() - 0.5) * 0.4;
    }

    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 4.0,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.snowPoints = new THREE.Points(snowGeo, snowMat);
    this.scene.add(this.snowPoints);
  }

  // ── AURORA BOREALIS ──────────────────────────────────────────────────────────
  initAurora() {
    const segments = 80;
    const layers = 4;
    this.auroraMeshes = [];

    // Natural northern lights: emerald → teal → cyan → violet (no red/yellow/orange)
    const auroraHues = [0.37, 0.46, 0.54, 0.67];

    for (let layer = 0; layer < layers; layer++) {
      const positions = [];
      const colors = [];
      const indices = [];

      const baseZ = -500 - layer * 80;
      const baseY = 300 + layer * 20;
      const width = 1600 + layer * 150;

      const baseHue = auroraHues[layer];

      for (let i = 0; i <= segments; i++) {
        const x = (i / segments - 0.5) * width;
        positions.push(x, baseY, baseZ);
        positions.push(x, baseY - 180 - Math.random() * 60, baseZ);

        // Tiny hue variation within strip only (±0.04)
        const hue = baseHue + (i / segments - 0.5) * 0.08;
        const c = new THREE.Color().setHSL(hue, 0.80, 0.48);
        colors.push(c.r, c.g, c.b, 0.0);  // top: transparent
        colors.push(c.r, c.g, c.b, 0.45); // bottom: soft
      }

      for (let i = 0; i < segments; i++) {
        const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
        indices.push(a, b, c,  b, d, c);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4));
      geo.setIndex(indices);

      const mat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.10 + layer * 0.03, // Much subtler
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { layer, baseY, baseZ, width, segments, phaseOffset: Math.random() * Math.PI * 2, baseHue };
      this.scene.add(mesh);
      this.auroraMeshes.push(mesh);
    }
  }

  updateAurora() {
    if (!this.auroraMeshes) return;
    for (const mesh of this.auroraMeshes) {
      const { layer, baseY, baseZ, width, segments, phaseOffset } = mesh.userData;
      const posArr = mesh.geometry.attributes.position.array;

      // Smoothly shift aurora wind target
      if (Math.random() < 0.005) {
        this.auroraWindTarget.x = (Math.random() - 0.5) * 80;
        this.auroraWindTarget.y = (Math.random() - 0.5) * 30;
      }
      this.auroraWind.x += (this.auroraWindTarget.x - this.auroraWind.x) * 0.01;
      this.auroraWind.y += (this.auroraWindTarget.y - this.auroraWind.y) * 0.01;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * width;
        const wave1 = Math.sin(t * Math.PI * 3 + this.time * 0.4 + phaseOffset) * 40;
        const wave2 = Math.sin(t * Math.PI * 7 - this.time * 0.25 + phaseOffset * 1.3) * 15;
        const windX = this.auroraWind.x * t;
        const windY = this.auroraWind.y;

        const topIdx = i * 6;
        const botIdx = topIdx + 3;

        posArr[topIdx]   = x + wave1 * 0.4 + windX;
        posArr[topIdx+1] = baseY + wave1 * 0.15 + wave2 + windY;
        posArr[topIdx+2] = baseZ + Math.sin(t * Math.PI * 2 + this.time * 0.3) * 20;

        posArr[botIdx]   = x + wave1 + wave2 + windX;
        posArr[botIdx+1] = baseY - 200 + Math.sin(t * Math.PI * 4 + this.time * 0.5 + phaseOffset) * 30 + windY;
        posArr[botIdx+2] = baseZ + Math.cos(t * Math.PI * 2 - this.time * 0.2) * 30;
      }
      mesh.geometry.attributes.position.needsUpdate = true;

      // Pulse aurora opacity
      mesh.material.opacity = (0.18 + layer * 0.03) + Math.sin(this.time * 0.8 + phaseOffset) * 0.06;
    }
  }

  // ── CANDLE FLAMES ────────────────────────────────────────────────────────────
  initCandleFlames() {
    const candleCount = 7;
    const flameParticlesPerCandle = 40;
    const total = candleCount * flameParticlesPerCandle;

    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const sizes = new Float32Array(total);

    this.candleBasePositions = [];
    this.candleFlameVels = new Float32Array(total * 3);
    this.candleFlameLife = new Float32Array(total);

    for (let c = 0; c < candleCount; c++) {
      const angle = (c / candleCount) * Math.PI * 2;
      const r = 180 + (c % 2) * 40;
      const bx = Math.cos(angle) * r;
      const by = -265; // base of tree
      const bz = Math.sin(angle) * r;
      this.candleBasePositions.push({ x: bx, y: by, z: bz });

      for (let p = 0; p < flameParticlesPerCandle; p++) {
        const idx = c * flameParticlesPerCandle + p;
        positions[idx*3]   = bx + (Math.random() - 0.5) * 8;
        positions[idx*3+1] = by + Math.random() * 30;
        positions[idx*3+2] = bz + (Math.random() - 0.5) * 8;

        this.candleFlameVels[idx*3]   = (Math.random() - 0.5) * 0.4;
        this.candleFlameVels[idx*3+1] = Math.random() * 1.2 + 0.3;
        this.candleFlameVels[idx*3+2] = (Math.random() - 0.5) * 0.4;
        this.candleFlameLife[idx]     = Math.random();

        const lifeCol = this.candleFlameLife[idx];
        const col = new THREE.Color().setHSL(0.06 - lifeCol * 0.04, 1.0, 0.5 + lifeCol * 0.3);
        colors[idx*3]   = col.r;
        colors[idx*3+1] = col.g;
        colors[idx*3+2] = col.b;

        sizes[idx] = 5.0 + Math.random() * 8.0;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 8.0,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.candlePoints = new THREE.Points(geo, mat);
    this.scene.add(this.candlePoints);
  }

  updateCandleFlames() {
    if (!this.candlePoints) return;
    const posArr = this.candlePoints.geometry.attributes.position.array;
    const colArr = this.candlePoints.geometry.attributes.color.array;
    const total = posArr.length / 3;
    const flamePerCandle = 40;

    for (let idx = 0; idx < total; idx++) {
      const c = Math.floor(idx / flamePerCandle);
      const base = this.candleBasePositions[c];

      this.candleFlameLife[idx] += 0.025;
      if (this.candleFlameLife[idx] > 1.0) {
        // Reset particle to candle base
        this.candleFlameLife[idx] = 0;
        posArr[idx*3]   = base.x + (Math.random() - 0.5) * 6;
        posArr[idx*3+1] = base.y;
        posArr[idx*3+2] = base.z + (Math.random() - 0.5) * 6;
        this.candleFlameVels[idx*3]   = (Math.random() - 0.5) * 0.5;
        this.candleFlameVels[idx*3+1] = Math.random() * 1.3 + 0.3;
        this.candleFlameVels[idx*3+2] = (Math.random() - 0.5) * 0.5;
      }

      // Wind influence
      const windFlicker = Math.sin(this.time * 8 + idx * 0.3) * 0.15;
      posArr[idx*3]   += this.candleFlameVels[idx*3] + windFlicker;
      posArr[idx*3+1] += this.candleFlameVels[idx*3+1] * (1.0 - this.candleFlameLife[idx] * 0.3);
      posArr[idx*3+2] += this.candleFlameVels[idx*3+2];

      // Color: yellow → orange → red → transparent
      const life = this.candleFlameLife[idx];
      const hue = 0.07 - life * 0.05;
      const col = new THREE.Color().setHSL(hue, 1.0, 0.6 - life * 0.2);
      colArr[idx*3]   = col.r;
      colArr[idx*3+1] = col.g;
      colArr[idx*3+2] = col.b;
    }

    this.candlePoints.geometry.attributes.position.needsUpdate = true;
    this.candlePoints.geometry.attributes.color.needsUpdate = true;

    // Only show candles in classic tree mode
    this.candlePoints.visible = (this.mode === 0);
  }

  // ── PARTICLE TEXT MORPHING ───────────────────────────────────────────────────
  generateTextMorphPositions(text) {
    const offscreen = document.createElement('canvas');
    offscreen.width = 512;
    offscreen.height = 128;
    const ctx = offscreen.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);

    const imageData = ctx.getImageData(0, 0, 512, 128);
    const data = imageData.data;
    const points = [];

    for (let y = 0; y < 128; y += 3) {
      for (let x = 0; x < 512; x += 3) {
        const idx = (y * 512 + x) * 4;
        if (data[idx + 3] > 128) {
          // Map to 3D world space: center around 0
          points.push({
            x: (x / 512 - 0.5) * 600,
            y: -(y / 128 - 0.5) * 150,
            z: 0
          });
        }
      }
    }
    return points;
  }

  triggerFirework(x2D, y2D) {
    const count = 60;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Map 2D screen coords to 3D plane z=50
    const ndc = new THREE.Vector2(
      (x2D / this.width) * 2 - 1,
      -(y2D / this.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const target3D = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.planeZ0, target3D);

    const hue = Math.random();

    for (let i = 0; i < count; i++) {
      positions[i*3+0] = target3D.x;
      positions[i*3+1] = target3D.y;
      positions[i*3+2] = target3D.z + 50;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 3;
      const phi = (Math.random() - 0.5) * Math.PI;

      velocities[i*3+0] = Math.cos(angle) * Math.cos(phi) * speed;
      velocities[i*3+1] = Math.sin(angle) * Math.cos(phi) * speed;
      velocities[i*3+2] = Math.sin(phi) * speed;

      const c = new THREE.Color().setHSL(hue, 1.0, 0.65);
      colors[i*3+0] = c.r;
      colors[i*3+1] = c.g;
      colors[i*3+2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 5.0,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const fw = new THREE.Points(geo, mat);
    fw.userData = { velocities, life: 1.0, decay: Math.random() * 0.03 + 0.02 };
    this.scene.add(fw);
    this.fireworks.push(fw);
  }

  setMode(mode, handPos = { x: 0.5, y: 0.5 }) {
    this.mode = mode;
    if (handPos) {
      this.handPos = handPos;
      // Map handPos 2D (0..1) to 3D world coords
      const ndc = new THREE.Vector2(
        (handPos.x * 2 - 1),
        -(handPos.y * 2 - 1)
      );
      this.raycaster.setFromCamera(ndc, this.camera);
      this.raycaster.ray.intersectPlane(this.planeZ0, this.targetHand3D);
    }

    if (mode === 2 || mode === 5 || mode === 8) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const fx = (Math.random() * 0.6 + 0.2) * this.width;
          const fy = (Math.random() * 0.5 + 0.2) * this.height;
          this.triggerFirework(fx, fy);
        }, i * 200);
      }
    }
  }

  update() {
    this.time += 0.02;
    this.material.uniforms.uTime.value = this.time;

    if (this.controls) this.controls.update();

    // 3D Glowing Star Animation
    if (this.starMesh) {
      this.starMesh.rotation.y += 0.02;
      this.starMesh.rotation.z = Math.sin(this.time * 2) * 0.08;
      this.starHalo.rotation.y -= 0.015;
      const s = 1.0 + Math.sin(this.time * 4) * 0.15;
      this.starHalo.scale.set(s, s, s);
      const isClassicTree = (this.mode === 0 && (!this.activePhotoImg || this.photoScale <= 0.1));
      this.starMesh.visible = isClassicTree;
      this.starHalo.visible = isClassicTree;
    }

    // 3D Baubles/Ornaments Animation
    if (this.ornaments) {
      const isClassicTree = (this.mode === 0 && (!this.activePhotoImg || this.photoScale <= 0.1));
      const cosR = Math.cos(this.rotationY);
      const sinR = Math.sin(this.rotationY);

      for (let i = 0; i < this.ornaments.length; i++) {
        const o = this.ornaments[i];
        if (isClassicTree) {
          o.visible = true;
          const rx = o.userData.origX * cosR - o.userData.origZ * sinR;
          const rz = o.userData.origX * sinR + o.userData.origZ * cosR;
          o.position.x = rx;
          o.position.z = rz;
          o.position.y = o.userData.origY + Math.sin(this.time * 3 + o.userData.phase) * 4;
        } else {
          o.visible = false;
        }
      }
    }

    const isReveal = !!(this.activePhotoImg && this.photoScale > 0.1);

    // Photo scale/alpha interpolation
    if (this.activePhotoImg) {
      this.photoAlpha += (1.0 - this.photoAlpha) * 0.1;
      this.photoScale += (1.0 - this.photoScale) * 0.1;
    } else {
      this.photoAlpha += (0.0 - this.photoAlpha) * 0.15;
      this.photoScale += (0.0 - this.photoScale) * 0.15;
    }

    if (this.photoAlpha > 0.05) {
      this.photoMesh.visible = true;
      this.auraMesh.visible = true;

      const s = this.photoScale;
      this.photoMesh.scale.set(s, s, s);
      this.auraMesh.scale.set(s, s, s);

      // Bob in camera-space Y (always relative to camera view, never disappears)
      const bobY = Math.sin(this.time * 2) * 8;
      this.photoMesh.position.set(0, bobY, -380);
      this.auraMesh.position.set(0, bobY, -383);

      this.photoMesh.material.opacity = this.photoAlpha;
      this.auraMesh.material.opacity = this.photoAlpha * 0.85;
    } else {
      this.photoMesh.visible = false;
      this.auraMesh.visible = false;
    }

    // Rotation speed
    if (isReveal) {
      this.rotationY += (0 - this.rotationY) * 0.05; // Lock camera straight when revealing photo
    } else {
      const rotSpeed = (this.mode === 1 || this.mode === 8) ? 0.02 : 0.008;
      this.rotationY += rotSpeed;
    }

    const cosR = Math.cos(this.rotationY);
    const sinR = Math.sin(this.rotationY);

    if (this.mode === 3 || this.mode === 8) {
      this.pulseScale = 1.0 + Math.sin(this.time * 4) * 0.15;
    } else {
      this.pulseScale = 1.0;
    }

    const posAttr = this.geometry.attributes.position;
    const colAttr = this.geometry.attributes.color;
    const alphaAttr = this.geometry.attributes.alpha;
    const count = this.particleCount;

    for (let i = 0; i < count; i++) {
      let targetX, targetY, targetZ;

      if (isReveal) {
        // Enlarge gift shape around floating photo (1.5x)
        const boost = 1.45;
        if (this.mode === 1) {
          targetX = this.neonPos[i*3+0] * boost;
          targetY = this.neonPos[i*3+1];
          targetZ = this.neonPos[i*3+2] * boost;
        } else if (this.mode === 2) {
          targetX = this.icePos[i*3+0] * boost;
          targetY = this.icePos[i*3+1];
          targetZ = this.icePos[i*3+2] * boost;
        } else if (this.mode === 3) {
          targetX = this.solarPos[i*3+0] * boost * this.pulseScale;
          targetY = this.solarPos[i*3+1];
          targetZ = this.solarPos[i*3+2] * boost * this.pulseScale;
        } else if (this.mode === 5) {
          // Circular orbit around floating 3D photo card
          const angle = this.time * 0.6 + (i / count) * Math.PI * 2;
          const radius = 220 + (i % 120) * 0.5;
          targetX = Math.cos(angle) * radius;
          targetY = Math.sin(angle) * radius * 0.6;
          targetZ = Math.sin(angle) * radius * 0.5;
      } else if (this.mode === 4) {
          // Text morph reveal boost
          targetX = this.textPos[i*3+0] * 1.2;
          targetY = this.textPos[i*3+1] * 1.2;
          targetZ = this.textPos[i*3+2];
        } else {
          targetX = this.treePos[i*3+0];
          targetY = this.treePos[i*3+1];
          targetZ = this.treePos[i*3+2];
        }
      } else if (this.mode === 1) {
        targetX = this.neonPos[i*3+0];
        targetY = this.neonPos[i*3+1];
        targetZ = this.neonPos[i*3+2];
      } else if (this.mode === 2) {
        targetX = this.icePos[i*3+0];
        targetY = this.icePos[i*3+1];
        targetZ = this.icePos[i*3+2];
      } else if (this.mode === 3) {
        targetX = this.solarPos[i*3+0] * this.pulseScale;
        targetY = this.solarPos[i*3+1];
        targetZ = this.solarPos[i*3+2] * this.pulseScale;
      } else if (this.mode === 4) {
        // ✨ Particle Text Morphing: "Merry Christmas"
        const breathe = Math.sin(this.time * 1.5 + this.phases[i] * 3) * 8;
        targetX = this.textPos[i*3+0];
        targetY = this.textPos[i*3+1] + breathe * 0.3;
        targetZ = this.textPos[i*3+2] + breathe;
      } else if (this.mode === 5) {
        // Swirl around 3D hand position
        const angle = this.time * 2.0 + (i * 0.002);
        const radius = (i % 300) * 1.0 + 30;
        targetX = this.targetHand3D.x + Math.cos(angle) * radius;
        targetY = this.targetHand3D.y + Math.sin(angle * 0.8) * radius * 0.5;
        targetZ = Math.sin(angle) * radius;
      } else if (this.mode === 8) {
        targetX = this.heartPos[i*3+0] * this.pulseScale;
        targetY = this.heartPos[i*3+1];
        targetZ = this.heartPos[i*3+2] * this.pulseScale;
      } else {
        targetX = this.treePos[i*3+0];
        targetY = this.treePos[i*3+1];
        targetZ = this.treePos[i*3+2];
      }

      // Rotate around Y axis
      const rx = targetX * cosR - targetZ * sinR;
      const rz = targetX * sinR + targetZ * cosR;

      // Lerp position
      posAttr.array[i*3+0] += (rx - posAttr.array[i*3+0]) * 0.12;
      posAttr.array[i*3+1] += (targetY - posAttr.array[i*3+1]) * 0.12;
      posAttr.array[i*3+2] += (rz - posAttr.array[i*3+2]) * 0.12;

      // Dynamic Color & Light Trail Flow Opacity
      let color = new THREE.Color();
      if (this.mode === 1) {
        const hue = (this.time * 0.15 + this.hueShifts[i] / 360) % 1.0;
        color.setHSL(hue, 1.0, 0.65);
      } else if (this.mode === 2) {
        const hue = 0.5 + (this.hueShifts[i] % 30) / 360;
        color.setHSL(hue, 1.0, 0.75);
      } else if (this.mode === 3) {
        const hue = 0.1 + (this.hueShifts[i] % 20) / 360;
        color.setHSL(hue, 1.0, 0.65);
      } else if (this.mode === 4) {
        // Gold & white shimmer for text
        const hue = (0.12 + Math.sin(this.time * 0.5 + this.hueShifts[i] * 0.01) * 0.06);
        const lightness = 0.65 + Math.sin(this.time * 3 + this.phases[i]) * 0.20;
        color.setHSL(hue, 0.9, lightness);
      } else if (this.mode === 8) {
        const hue = 0.92 + (this.hueShifts[i] % 40) / 360;
        color.setHSL(hue, 1.0, 0.68);
      } else {
        color.setRGB(this.colors[i*3+0], this.colors[i*3+1], this.colors[i*3+2]);
      }

      colAttr.array[i*3+0] = color.r;
      colAttr.array[i*3+1] = color.g;
      colAttr.array[i*3+2] = color.b;

      // Poetic Light Trail Sweeping Effect
      if (isReveal) {
        if (this.mode === 1) {
          const nh = (targetY - this.centerY) / (this.treeHeight * 0.55);
          const sweep = (this.time * 0.4) % 1.0;
          const streakPos = -1.0 + sweep * 2.0;
          const dist = nh - streakPos;
          alphaAttr.array[i] = Math.exp(-Math.abs(dist) * 9.0);
        } else {
          const nh = (targetY - this.centerY) / (this.treeHeight * 0.6);
          const sweep = (this.time * 0.35) % 1.0;
          const streakPos = 0.5 - sweep;
          const dist = nh - streakPos;
          alphaAttr.array[i] = Math.exp(-Math.abs(dist) * 5.5);
        }
      } else if (this.mode === 1) {
        const helixHeight = this.treeHeight * 1.15;
        const nh = (targetY - this.centerY) / helixHeight;
        const wave = Math.sin((nh + 0.5) * Math.PI * 6 - this.time * 2.0);
        alphaAttr.array[i] = Math.max(0.3, Math.min(1.0, 0.4 + 0.6 * (0.5 + 0.5 * wave)));
      } else {
        alphaAttr.array[i] = Math.max(0.35, Math.min(1.0, 0.5 + Math.sin(this.time * 4 + this.phases[i]) * 0.45));
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;

    // ── SNOW STORM with dynamic wind ─────────────────────────────────────────
    const snowArray = this.snowPoints.geometry.attributes.position.array;
    const windX = Math.sin(this.time * 0.12) * 1.8;  // slow gust cycles
    const windZ = Math.cos(this.time * 0.08) * 0.9;

    for (let i = 0; i < this.snowCount; i++) {
      snowArray[i*3+1] += this.snowVelocities[i*3+1];
      snowArray[i*3+0] += windX + Math.sin(this.time * 3.5 + i * 0.1) * 0.3;  // gust + flicker
      snowArray[i*3+2] += windZ + Math.cos(this.time * 2.8 + i * 0.07) * 0.2;

      if (snowArray[i*3+1] < -500) {
        snowArray[i*3+1] = 500;
        snowArray[i*3+0] = (Math.random() - 0.5) * 1400;
        snowArray[i*3+2] = (Math.random() - 0.5) * 900;
      }
    }
    this.snowPoints.geometry.attributes.position.needsUpdate = true;

    // ── AURORA BOREALIS ───────────────────────────────────────────────────────
    this.updateAurora();

    // ── CANDLE FLAMES ─────────────────────────────────────────────────────────
    this.updateCandleFlames();

    // Fireworks animation
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];
      const pos = fw.geometry.attributes.position.array;
      const vels = fw.userData.velocities;
      const fCount = pos.length / 3;

      for (let j = 0; j < fCount; j++) {
        pos[j*3+0] += vels[j*3+0];
        pos[j*3+1] += vels[j*3+1];
        pos[j*3+2] += vels[j*3+2];
        vels[j*3+1] -= 0.15; // Gravity
      }

      fw.userData.life -= fw.userData.decay;
      fw.material.opacity = Math.max(0, fw.userData.life);
      fw.geometry.attributes.position.needsUpdate = true;

      if (fw.userData.life <= 0) {
        this.scene.remove(fw);
        fw.geometry.dispose();
        fw.material.dispose();
        this.fireworks.splice(i, 1);
      }
    }
  }

  render() {
    this.composer.render();
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }
}

window.ParticleSystem = ParticleSystem;
