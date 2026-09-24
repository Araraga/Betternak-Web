import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import gsap from 'gsap';
import { initDynamicContent } from './contentLoader.js';

// Hydrate dynamic content from admin/API
initDynamicContent();

// 1. SCENE, CINEMATIC MODERN LIGHTS & STUDIO STAGE
const container = document.getElementById('webgl-canvas-container');
const scene = new THREE.Scene();

// Seamless Cinematic Atmospheric Fog (Clearer, less dense)
scene.fog = new THREE.FogExp2(0x0c1520, 0.015);

// Initial Camera Setup (Lifted framing for hero overview, text cleanly below)
let baseModelX = 0.0;
const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.0, 0.85, 10.2);

// Detect Mobile Device for Performance Optimization
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;
renderer.localClippingEnabled = true;
renderer.domElement.style.touchAction = 'pan-y';
container.appendChild(renderer.domElement);

// =========================================================================
// FLUID METALLIC GLASS FLOWING BACKGROUND (LOOPING WATER FLOW SHADER)
// =========================================================================
function initFluidGlassBackground() {
  const canvas = document.getElementById('fluid-glass-canvas');
  if (!canvas) return null;

  let gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance'
  });
  if (!gl) {
    gl = canvas.getContext('experimental-webgl', {
      alpha: true,
      premultipliedAlpha: true
    });
  }
  if (!gl) return null;

  const vsSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_scroll;

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

      // Very slow, calm, hypnotic time flow (strictly monotonic, no sudden jumps)
      float t = u_time * 0.16;
      
      // Smooth, gentle scroll offset: ribbon gracefully drifts and breathes with scroll
      float s = u_scroll * 0.40;

      // Primary Minimalist Fluid Ribbon:
      // Elegant, wide, single sweeping S-curve flowing diagonally across the scene
      float wave1 = sin(uv.x * 1.1 + t + s) * 0.18 + cos(uv.x * 2.0 - t * 0.7) * 0.06;
      float ribbonWidth1 = 0.18 + 0.04 * sin(uv.x * 1.4 + t * 0.5);
      float ribbonCenter1 = -0.05 - s * 0.25 + wave1;
      float dist1 = abs(uv.y - ribbonCenter1) / ribbonWidth1;

      // Secondary Faint Echo Ribbon (subtle depth layer):
      float wave2 = cos(uv.x * 1.3 - t * 0.8 - s * 0.5) * 0.15;
      float ribbonWidth2 = 0.12 + 0.03 * cos(uv.x * 1.6 + t * 0.4);
      float ribbonCenter2 = 0.22 - s * 0.15 + wave2;
      float dist2 = abs(uv.y - ribbonCenter2) / ribbonWidth2;

      // Soft smoothstep opacity for silky liquid glass edges
      float alpha1 = smoothstep(1.0, 0.25, dist1) * 0.55;
      float alpha2 = smoothstep(1.0, 0.25, dist2) * 0.28;

      float totalAlpha = max(alpha1, alpha2);
      if (totalAlpha <= 0.005) {
        gl_FragColor = vec4(0.0);
        return;
      }

      // 3D liquid tube volume profile
      float h1 = alpha1 > 0.0 ? sqrt(max(0.0, 1.0 - dist1 * dist1)) : 0.0;
      float h2 = alpha2 > 0.0 ? sqrt(max(0.0, 1.0 - dist2 * dist2)) : 0.0;

      // Surface normals for pristine specular sheen
      float dHdy = 0.0;
      float dHdx = 0.0;
      if (alpha1 > 0.0) {
        float dy1 = (uv.y - ribbonCenter1) / ribbonWidth1;
        dHdy += -dy1 * 1.8 / max(0.2, h1);
        dHdx += cos(uv.x * 1.1 + t + s) * 0.20;
      }
      if (alpha2 > 0.0) {
        float dy2 = (uv.y - ribbonCenter2) / ribbonWidth2;
        dHdy += -dy2 * 1.8 / max(0.2, h2);
        dHdx += -sin(uv.x * 1.3 - t * 0.8 - s * 0.5) * 0.20;
      }

      vec3 N = normalize(vec3(dHdx * 0.5, dHdy * 0.5, 1.0));
      vec3 V = vec3(0.0, 0.0, 1.0);

      // Soft cinematic studio lighting (Platinum Silver & Muted Emerald)
      vec3 L1 = normalize(vec3(-0.35, 0.60, 0.75));
      vec3 L2 = normalize(vec3(0.50, -0.30, 0.70));

      float spec1 = pow(max(0.0, dot(N, normalize(L1 + V))), 32.0);
      float spec2 = pow(max(0.0, dot(N, normalize(L2 + V))), 20.0);
      float fresnel = pow(1.0 - max(0.0, dot(N, V)), 2.5);

      vec3 colSilver = vec3(0.85, 0.92, 0.98);
      vec3 colEmerald = vec3(0.10, 0.75, 0.55);
      vec3 colDarkGlass = vec3(0.04, 0.12, 0.16);

      vec3 col = colDarkGlass * (0.3 + 0.7 * (h1 + h2 * 0.5));
      col += colSilver * (spec1 * 0.85);
      col += colEmerald * (spec2 * 0.50);
      col += mix(colSilver, colEmerald, 0.4) * (fresnel * 0.60);

      gl_FragColor = vec4(col * totalAlpha, totalAlpha);
    }
  `;

  function compileShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Fluid glass shader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const prog = gl.createProgram();
  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('Fluid glass link error:', gl.getProgramInfoLog(prog));
    return null;
  }

  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1, -1,  1,
    -1,  1,  1, -1,  1,  1
  ]), gl.STATIC_DRAW);

  const posAttr = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posAttr);
  gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_resolution');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uScroll = gl.getUniformLocation(prog, 'u_scroll');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  window.addEventListener('resize', resize);
  resize();

  return {
    render(time, scroll) {
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uScroll, scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  };
}
const fluidGlassController = initFluidGlassBackground();

// Controls with zoom disabled so scroll operates anywhere on screen seamlessly
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enableZoom = false;
controls.enablePan = false;
controls.minDistance = 3.0;
controls.maxDistance = 25.0;
controls.maxPolarAngle = Math.PI / 2 + 0.04;
controls.target.set(0.0, 0.45, 0.0);

// Cinematic Modern Studio Lighting
// Starts in dark silhouette mode; brightens dynamically on scroll!
const hemiLight = new THREE.HemisphereLight(0xd1d5db, 0x064e3b, 0.12);
scene.add(hemiLight);

// Key Daylight Spotlight
const sunLight = new THREE.DirectionalLight(0xffffff, 0.08);
sunLight.position.set(8.0, 14.0, 8.0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 32;
sunLight.shadow.bias = -0.00005;
sunLight.shadow.normalBias = 0.035;
const d = 6.5;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);

// Direct Front Key Fill Light
const frontKeyLight = new THREE.DirectionalLight(0xffffff, 0.02);
frontKeyLight.position.set(2.0, 4.0, 10.0);
scene.add(frontKeyLight);

// Primary Cinematic Emerald Rim Light (Silhouette edge glow)
const rimLightEmerald = new THREE.DirectionalLight(0x10b981, 2.8);
rimLightEmerald.position.set(-10.0, 8.0, -8.0);
scene.add(rimLightEmerald);

// Secondary Cool Cyan Accent Light (Silhouette edge glow)
const rimLightCyan = new THREE.DirectionalLight(0x38bdf8, 2.0);
rimLightCyan.position.set(10.0, 6.0, -10.0);
scene.add(rimLightCyan);

// Underside & Front Soft Studio Fill Light
const softFill = new THREE.DirectionalLight(0xf8fafc, 0.0);
softFill.position.set(0.0, -2.5, 7.5);
scene.add(softFill);

// High-Tech Illuminated Studio Pedestal Floor
// Hidden initially for pure dark floating silhouette!
const stageGroup = new THREE.Group();
stageGroup.position.set(baseModelX, 0, 0);
stageGroup.visible = false;
scene.add(stageGroup);

// Dark satin graphite pedestal cylinder
const stageDisc = new THREE.Mesh(
  new THREE.CylinderGeometry(4.8, 5.0, 0.12, 64),
  new THREE.MeshStandardMaterial({
    color: 0x0c141d,
    roughness: 0.32,
    metalness: 0.55,
    transparent: true,
    opacity: 0.0
  })
);
stageDisc.position.set(0, -2.18, 0);
stageDisc.receiveShadow = true;
stageGroup.add(stageDisc);

// Glowing Neon Emerald Rim Ring
const stageRing = new THREE.Mesh(
  new THREE.TorusGeometry(4.9, 0.025, 16, 64),
  new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.0 })
);
stageRing.rotation.x = Math.PI / 2;
stageRing.position.set(0, -2.12, 0);
stageGroup.add(stageRing);

// Soft Contact Shadow Disc under the Feeder
const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = 256; shadowCanvas.height = 256;
const sCtx = shadowCanvas.getContext('2d');
const sGrad = sCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
sGrad.addColorStop(0.5, 'rgba(5, 18, 10, 0.45)');
sGrad.addColorStop(0.8, 'rgba(16, 185, 129, 0.08)');
sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
sCtx.fillStyle = sGrad;
sCtx.fillRect(0, 0, 256, 256);

const contactShadow = new THREE.Mesh(
  new THREE.PlaneGeometry(6.8, 6.8),
  new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, opacity: 0.0, depthWrite: false })
);
contactShadow.rotation.x = -Math.PI / 2;
contactShadow.position.set(0, -2.11, 0);
stageGroup.add(contactShadow);

// 2. MODEL GROUP & MATERIALS (SLIGHTLY GLOSSY, MODERN FINISHES)
const iopakanGroup = new THREE.Group();
iopakanGroup.position.set(baseModelX, 0, 0);
scene.add(iopakanGroup);

const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10.0);

// Leg mount offset connects legs directly to the bottom bowl center hub (+0.73 offset)
const LEG_ATTACH_OFFSET = 0.73;

const partsData = [
  { id: 'part8_kaki', name: 'Kaki Tripod Modular', explodeY: 0.0, mesh: null, origY: LEG_ATTACH_OFFSET },
  { id: 'part7_bawah', name: 'Mangkuk Feeder Anti-Tumpah', explodeY: 0.55, mesh: null, origY: 0 },
  { id: 'part6_nemabracket', name: 'Bracket Motor NEMA', explodeY: 1.20, mesh: null, origY: 0 },
  { id: 'part5_piramid', name: 'Piramid 360° Deflektor', explodeY: 1.90, mesh: null, origY: 0 },
  { id: 'part4_sisibawah', name: 'Chute Body Bawah', explodeY: 2.70, mesh: null, origY: 0 },
  { id: 'part3_piring', name: 'Piringan Dosing Presisi', explodeY: 3.50, mesh: null, origY: 0 },
  { id: 'part2_sisiatas', name: 'Silo Pakan 10kg', explodeY: 4.50, mesh: null, origY: 0 },
  { id: 'part1_tutup', name: 'Tutup Kedap Cuaca', explodeY: 5.60, mesh: null, origY: 0 }
];

let isModelLoaded = false;
let autoRotate = true;

// Specifications:
// - Grey (abu-abu): piramid, piring, nema mount, kaki
// - Green (hijau): tutup, sisiatas (silo 10kg opaque), sisibawah, bawah
// - Slightly glossy finish (roughness 0.25 - 0.32, metalness 0.16 - 0.55)
// - DoubleSide ensures zero missing geometry, solid wall rendering, and accurate CAD cross-sections
const materials = {
  // HIJAU: Tutup Kedap Cuaca
  tutup: new THREE.MeshStandardMaterial({
    color: 0x12733f,
    roughness: 0.28,
    metalness: 0.18,
    flatShading: false,
    side: THREE.DoubleSide,
    clippingPlanes: [clipPlane],
    clipShadows: true
  }),
  // HIJAU: Silo Pakan 10kg (Opaque, glossy polymer)
  sisiatas: new THREE.MeshStandardMaterial({
    color: 0x126e3c,
    roughness: 0.28,
    metalness: 0.16,
    flatShading: false,
    side: THREE.DoubleSide,
    clippingPlanes: [clipPlane],
    clipShadows: true
  }),
  // ABU-ABU: Piringan Dosing Presisi
  piring: new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.26,
    metalness: 0.50,
    flatShading: false,
    side: THREE.DoubleSide
  }),
  // HIJAU: Chute Body Bawah
  sisibawah: new THREE.MeshStandardMaterial({
    color: 0x106838,
    roughness: 0.28,
    metalness: 0.16,
    flatShading: false,
    side: THREE.DoubleSide,
    clippingPlanes: [clipPlane],
    clipShadows: true
  }),
  // ABU-ABU: Piramid 360° Deflektor
  piramid: new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.28,
    metalness: 0.45,
    flatShading: false,
    side: THREE.DoubleSide
  }),
  // ABU-ABU: Bracket Motor NEMA
  nemabracket: new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.25,
    metalness: 0.55,
    flatShading: false,
    side: THREE.DoubleSide
  }),
  // HIJAU: Mangkuk Feeder Anti-Tumpah
  bawah: new THREE.MeshStandardMaterial({
    color: 0x0c542c,
    roughness: 0.28,
    metalness: 0.18,
    flatShading: false,
    side: THREE.DoubleSide,
    clippingPlanes: [clipPlane],
    clipShadows: true
  }),
  // ABU-ABU: Kaki Tripod Modular
  kaki: new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.32,
    metalness: 0.35,
    flatShading: false,
    side: THREE.DoubleSide,
    clippingPlanes: [clipPlane],
    clipShadows: true
  })
};

const BASE_URL = import.meta.env.BASE_URL || './';
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(BASE_URL + 'draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const loaderOverlay = document.getElementById('loader-overlay');
const loaderBar = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');

function smoothMeshGeometry(mesh) {
  if (!mesh.geometry) return;
  try {
    let geom = mesh.geometry;
    // 1. Weld duplicated CAD vertices with small distance threshold
    if (BufferGeometryUtils && BufferGeometryUtils.mergeVertices) {
      const merged = BufferGeometryUtils.mergeVertices(geom, 0.001);
      geom.dispose();
      geom = merged;
    }
    // 2. Compute smooth creased normals so curves are silky smooth without faceted boxes
    if (BufferGeometryUtils && BufferGeometryUtils.toCreasedNormals) {
      const creased = BufferGeometryUtils.toCreasedNormals(geom, THREE.MathUtils.degToRad(42));
      geom.dispose();
      geom = creased;
    } else {
      geom.computeVertexNormals();
    }
    mesh.geometry = geom;
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => { m.flatShading = false; m.needsUpdate = true; });
      } else {
        mesh.material.flatShading = false;
        mesh.material.needsUpdate = true;
      }
    }
  } catch (e) {
    console.warn('Mesh smoothing fallback:', e);
    try { mesh.geometry.computeVertexNormals(); } catch (err) {}
  }
}

function loadFeeder(path) {
  gltfLoader.load(
    path,
    (gltf) => {
      iopakanGroup.add(gltf.scene);
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          smoothMeshGeometry(child);
        }
      });
      partsData.forEach((part) => {
        const found = gltf.scene.getObjectByName(part.id);
        if (found) {
          part.mesh = found;
          if (part.id === 'part8_kaki') {
            found.position.y = LEG_ATTACH_OFFSET;
            part.origY = LEG_ATTACH_OFFSET;
            found.castShadow = true;
            found.receiveShadow = false; // Prevents shadow acne on thin ribbed legs
          } else {
            part.origY = found.position.y;
            found.castShadow = true;
            found.receiveShadow = true;
          }

          const key = part.id.replace('part', '').replace(/[0-9]_?/, '');
          if (materials[key]) found.material = materials[key];
        }
      });

      // Expose for inspection
      window.__iopakanGroup = iopakanGroup;
      window.__partsData = partsData;

      isModelLoaded = true;
      if (loaderBar) loaderBar.style.width = '100%';
      if (loaderText) loaderText.textContent = 'Siap!';
      if (loaderOverlay) {
        loaderOverlay.classList.add('hidden');
        setTimeout(() => { loaderOverlay.style.display = 'none'; }, 500);
      }

      // Initialize 3D Live Companion Model beside phone
      initCompanionViewer(gltf.scene);

      iopakanGroup.position.set(0, 0.55, 0);
      gsap.from(iopakanGroup.position, { y: -2.2, duration: 1.4, ease: 'power3.out' });
      gsap.from(iopakanGroup.rotation, { y: Math.PI * 1.5, duration: 1.8, ease: 'power3.out' });
    },
    (xhr) => {
      if (xhr.total > 0 && loaderBar) loaderBar.style.width = Math.round((xhr.loaded / xhr.total) * 100) + '%';
    },
    (err) => {
      console.error('Failed to load iopakan.glb:', err);
      if (loaderText) loaderText.textContent = 'Gagal memuat model 3D';
    }
  );
}
loadFeeder(BASE_URL + 'iopakan.glb');

// 3. REALISTIC 5-HOLE PELLET CASCADE & CAD DOSING DISC SIMULATION
const PELLET_COUNT = 20; // 5 apertures x 4 staggered pellets
// Authentic cylindrical poultry feed pellet geometry
const feedGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.092, 8);
feedGeo.rotateZ(0.35); // Realistic slight natural tumble
const feedMat = new THREE.MeshStandardMaterial({
  color: 0xc27a23, // Warm golden-amber animal feed pellet color
  roughness: 0.52,
  metalness: 0.08
});
const feedInst = new THREE.InstancedMesh(feedGeo, feedMat, PELLET_COUNT);
const dummy = new THREE.Object3D();

// CAD Analyzed 5 Dosing Holes in part3_piring:
// R = 0.62, base angle = 0.488 rad (28 deg), spaced 72 deg (2*PI/5)
class PelletParticle {
  constructor(index) {
    this.index = index;
    this.hole = index % 5;
    // Stagger initial progress across the 4 pellets per hole
    this.p = (index * 0.23 + (index % 5) * 0.20) % 1.0;
    // Tiny jitter so each pellet looks distinct
    this.jitterR = Math.sin(index * 12.3) * 0.04;
    this.jitterA = Math.cos(index * 7.7) * 0.06;
  }

  reset() {
    this.p = 0.0;
  }

  computePosition(progress, discRotation) {
    const prog = ((progress % 1.0) + 1.0) % 1.0;
    // Current angle of the assigned rotating hole
    const holeBaseAngle = 0.488 + this.hole * (Math.PI * 2 / 5);
    const holeAngle = discRotation + holeBaseAngle + this.jitterA;
    const holeR = 0.62 + this.jitterR;

    let x = 0, y = 0, z = 0;

    // Stage 1 (prog: 0.0 -> 0.25): Descending funnel neck directly above the hole (y: 0.88 -> 0.72)
    if (prog < 0.25) {
      const t = prog / 0.25;
      y = 0.88 - t * 0.16;
      x = Math.cos(holeAngle) * holeR;
      z = Math.sin(holeAngle) * holeR;
    }
    // Stage 2 (prog: 0.25 -> 0.50): Passing straight THROUGH the 5 holes of part3_piring! (y: 0.72 -> 0.56)
    else if (prog < 0.50) {
      const t = (prog - 0.25) / 0.25;
      y = 0.72 - t * 0.16;
      // Stays locked to the rotating aperture so it is unmistakably seen dropping through the hole!
      x = Math.cos(holeAngle) * holeR;
      z = Math.sin(holeAngle) * holeR;
    }
    // Stage 3 (prog: 0.50 -> 0.80): Deflecting outward down conical deflector below (y: 0.56 -> -0.22)
    else if (prog < 0.80) {
      const t = (prog - 0.50) / 0.30;
      y = 0.56 - t * 0.78;
      const curR = holeR + t * 0.58; // Expands outward along cone
      const curA = holeAngle + t * 0.18;
      x = Math.cos(curA) * curR;
      z = Math.sin(curA) * curR;
    }
    // Stage 4 (prog: 0.80 -> 1.00): Gently settling into outer feeding bowl (y: -0.22 -> -0.54)
    else {
      const t = (prog - 0.80) / 0.20;
      y = -0.22 - t * 0.32;
      const curR = 1.20 + t * 0.14;
      const curA = holeAngle + 0.18 + t * 0.05;
      x = Math.cos(curA) * curR;
      z = Math.sin(curA) * curR;
    }

    return { x, y, z };
  }
}

const pelletList = [];
for (let i = 0; i < PELLET_COUNT; i++) {
  pelletList.push(new PelletParticle(i));
}
feedInst.instanceMatrix.needsUpdate = true;
iopakanGroup.add(feedInst);

let isDispensing = false;
function triggerPakanDispense() {
  if (!isModelLoaded || isDispensing) return;
  isDispensing = true;
  const discPart = partsData.find(p => p.id === 'part3_piring');
  if (discPart && discPart.mesh) {
    gsap.to(discPart.mesh.rotation, {
      y: discPart.mesh.rotation.y + Math.PI * 2,
      duration: 2.2,
      ease: 'power1.inOut'
    });
  }

  feedInst.visible = true;
  setTimeout(() => {
    isDispensing = false;
  }, 2400);
}

// Scroll-driven pellet cascade for Anti-Tumpah: moves and drops proportionally as you scroll!
function updatePelletCascadeScroll(discRotation, antiT) {
  if (!feedInst || !isModelLoaded) return;
  feedInst.visible = true;

  for (let i = 0; i < PELLET_COUNT; i++) {
    const cycle = (antiT * 2.5 + (i * 0.23 + (i % 5) * 0.20)) % 1.0;
    const pos = pelletList[i].computePosition(cycle, discRotation);
    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.rotation.set(0.12, pos.x * 1.5, 0.25);
    dummy.scale.set(1.0, 1.0, 1.0);
    dummy.updateMatrix();
    feedInst.setMatrixAt(i, dummy.matrix);
  }
  feedInst.instanceMatrix.needsUpdate = true;
}

// Time-driven cascade when user triggers dispensing manually from smartphone companion
function updatePelletCascadeDispensing(delta) {
  if (!feedInst || !isModelLoaded) return;
  feedInst.visible = true;

  const discPart = partsData.find(p => p.id === 'part3_piring');
  const discRotation = discPart && discPart.mesh ? discPart.mesh.rotation.y : 0;

  for (let i = 0; i < PELLET_COUNT; i++) {
    pelletList[i].p += delta * 0.85;
    if (pelletList[i].p >= 1.0) pelletList[i].p -= 1.0;
    const pos = pelletList[i].computePosition(pelletList[i].p, discRotation);
    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.rotation.set(0.12, pos.x * 1.5, 0.25);
    dummy.scale.set(1.0, 1.0, 1.0);
    dummy.updateMatrix();
    feedInst.setMatrixAt(i, dummy.matrix);
  }
  feedInst.instanceMatrix.needsUpdate = true;
}

// 4. CONTINUOUS SCROLL TRACKING, GESTURES & CHAPTER CARDS
let targetScroll = 0;
let smoothScroll = 0;
let userOverrodeCamera = false;
let userInteractTimeout = null;

// Allow user to rotate the 3D model freely with mouse, but return to pose when scrolling occurs!
controls.addEventListener('start', () => {
  userOverrodeCamera = true;
  clearTimeout(userInteractTimeout);
});
controls.addEventListener('end', () => {
  clearTimeout(userInteractTimeout);
  userInteractTimeout = setTimeout(() => {
    userOverrodeCamera = false; // Smooth return after idle
  }, 2200);
});

function restoreCameraFromScroll() {
  if (userOverrodeCamera) {
    userOverrodeCamera = false;
    clearTimeout(userInteractTimeout);
  }
}

// 4. SCROLL PROGRESSION, HORIZONTAL PINNED GALLERY & SMART SECTION
let isInSmartSection = false;
let isMainCanvasActive = true;

// Pre-cached DOM elements to eliminate layout thrashing on scroll
const galPin = document.getElementById('gallery-pin-container');
const galTrack = document.getElementById('gallery-track');
const smartSec = document.getElementById('smart-control-section');
const canvasContainer = document.getElementById('webgl-canvas-container');
const fluidCanvas = document.getElementById('fluid-glass-canvas');
const storyCardsContainer = document.getElementById('story-cards-container');
const galBgLight = document.getElementById('gallery-bg-light');

// Lightweight IntersectionObserver for gallery kinetic typography entrances (Zero DOM layout thrashing)
const galleryKineticObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    entry.target.classList.toggle('in-view', entry.isIntersecting);
  });
}, { threshold: 0.18 });

document.querySelectorAll('.gallery-kinetic-text').forEach((el) => {
  galleryKineticObserver.observe(el);
});

function updateGalleryScroll() {
  if (!galPin || !galTrack) return;

  const rect = galPin.getBoundingClientRect();
  const totalPinDist = galPin.offsetHeight - window.innerHeight;
  
  // Progress through horizontal gallery section (0 to 1)
  const galProgress = Math.max(0, Math.min(1, -rect.top / Math.max(1, totalPinDist)));

  // Total horizontal travel needed so all cards scroll smoothly
  const maxTranslate = Math.max(0, galTrack.scrollWidth - window.innerWidth);
  galTrack.style.transform = `translateX(${-galProgress * maxTranslate}px)`;

  // Dynamic smooth transition of gallery background
  const tBg = Math.max(0, Math.min(1, (galProgress - 0.04) / 0.46));
  if (galBgLight) {
    galBgLight.style.opacity = tBg.toFixed(3);
  }
  if (tBg > 0.35) {
    galPin.classList.add('bright-gallery-theme');
  } else {
    galPin.classList.remove('bright-gallery-theme');
  }

  const sRect = smartSec ? smartSec.getBoundingClientRect() : null;
  const inSmart = sRect ? (sRect.top < window.innerHeight * 0.65) : false;
  isInSmartSection = inSmart;

  // Cinematic, generous, velvety exit fade from 3D narrative (Bibit DOC) into Gallery:
  // Spans a luxurious ~110vh scroll window with Hermite smoothstep easing for zero-cut, buttery transitions.
  const fadeStart = window.innerHeight * 1.15;
  const fadeEnd = window.innerHeight * 0.05;
  let hardwareExitOpacity = 1.0;

  if (rect.top <= fadeEnd) {
    hardwareExitOpacity = 0.0;
  } else if (rect.top < fadeStart) {
    const t = (rect.top - fadeEnd) / (fadeStart - fadeEnd);
    hardwareExitOpacity = t * t * (3 - 2 * t);
  } else {
    hardwareExitOpacity = 1.0;
  }

  const opacityStr = hardwareExitOpacity.toFixed(3);
  const isHardwareVisible = hardwareExitOpacity > 0.002;
  const floatUpY = ((1.0 - hardwareExitOpacity) * -36).toFixed(1);

  if (storyCardsContainer) {
    storyCardsContainer.style.opacity = opacityStr;
    storyCardsContainer.style.transform = `translate3d(0, ${floatUpY}px, 0)`;
    storyCardsContainer.style.pointerEvents = hardwareExitOpacity > 0.20 ? 'auto' : 'none';
    storyCardsContainer.style.visibility = isHardwareVisible ? 'visible' : 'hidden';
  }

  if (canvasContainer) {
    canvasContainer.style.opacity = opacityStr;
    canvasContainer.style.pointerEvents = hardwareExitOpacity > 0.20 ? 'auto' : 'none';
    canvasContainer.style.visibility = isHardwareVisible ? 'visible' : 'hidden';
  }

  // Fluid Metallic Glass Background:
  // Starts with the EXACT same dark obsidian background & metallic glass flow upon entering the gallery,
  // then seamlessly transitions to white as the user scrolls horizontally through the gallery.
  const isFluidActive = !isInSmartSection && (isHardwareVisible || tBg < 0.99);
  if (fluidCanvas) {
    const fluidOpacity = Math.max(0, 1.0 - tBg);
    fluidCanvas.style.opacity = fluidOpacity.toFixed(3);
    fluidCanvas.style.visibility = isFluidActive ? 'visible' : 'hidden';
  }

  isMainCanvasActive = isHardwareVisible && !isInSmartSection;
}

let scrollRafPending = false;
function updateScrollProgress() {
  restoreCameraFromScroll();
  const storyTrack = document.getElementById('story-scroll-track');
  if (storyTrack) {
    const maxStoryScroll = storyTrack.offsetHeight - window.innerHeight;
    targetScroll = maxStoryScroll > 0 ? Math.max(0, Math.min(1, window.scrollY / maxStoryScroll)) : 0;
  }
  updateGalleryScroll();
}

// RequestAnimationFrame throttled scroll listener (prevents frame drops & locks scroll to display vsync)
window.addEventListener('scroll', () => {
  if (!scrollRafPending) {
    scrollRafPending = true;
    requestAnimationFrame(() => {
      updateScrollProgress();
      scrollRafPending = false;
    });
  }
}, { passive: true });
updateScrollProgress();

// =========================================================================
// CINEMATIC SMOOTH SCROLL ENGINE (LEBIH HALUS, LEBIH LAMBAT & ADA BATAS KECEPATAN)
// =========================================================================
class CinematicSmoothScroll {
  constructor(options = {}) {
    // 1. LEBIH LAMBAT: 50% multiplier membuat rotasi & pergerakan 3D tenang dan teratur
    this.speedMultiplier = options.speedMultiplier ?? 0.50;
    // 2. BATAS KECEPATAN: Maksimum 85px per wheel event mencegah scroll melompat drastis
    this.maxVelocity = options.maxVelocity ?? 85;
    // 3. LEBIH HALUS: Easing lerp 0.075 memberikan inersia mentega tanpa lagging
    this.lerp = options.lerp ?? 0.075;

    this.targetY = window.scrollY;
    this.currentY = window.scrollY;
    this.isTicking = false;
    this.isProgrammatic = false;

    this.init();
  }

  init() {
    window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    window.addEventListener('scroll', () => this.onNativeScroll(), { passive: true });
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  isInsideScrollable(el) {
    let cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      const style = window.getComputedStyle(cur);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && cur.scrollHeight > cur.clientHeight) {
        return true;
      }
      cur = cur.parentElement;
    }
    return false;
  }

  onWheel(e) {
    // Biarkan scroll di dalam modal atau picker jadwal aplikasi berjalan lokal
    if (this.isInsideScrollable(e.target)) return;

    e.preventDefault();

    let rawDelta = e.deltaY;
    if (e.deltaMode === 1) rawDelta *= 24;      // Lines mode (Firefox)
    else if (e.deltaMode === 2) rawDelta *= 400; // Pages mode

    // 1. LEBIH LAMBAT: Penskalaan jarak scroll per putaran roda mouse
    let delta = rawDelta * this.speedMultiplier;

    // 2. BATAS KECEPATAN: Membatasi kecepatan agar tidak bisa melompat terlalu cepat
    delta = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, delta));

    // 3. Akumulasi posisi target dalam batas dokumen
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    this.targetY = Math.max(0, Math.min(maxScroll, this.targetY + delta));

    this.startLoop();
  }

  onKeyDown(e) {
    const active = document.activeElement?.tagName?.toLowerCase();
    if (active === 'input' || active === 'textarea' || active === 'select') return;

    let step = 0;
    if (e.code === 'ArrowDown') step = 70;
    else if (e.code === 'ArrowUp') step = -70;
    else if (e.code === 'PageDown' || (e.code === 'Space' && !e.shiftKey)) step = window.innerHeight * 0.65;
    else if (e.code === 'PageUp' || (e.code === 'Space' && e.shiftKey)) step = -window.innerHeight * 0.65;

    if (step !== 0) {
      e.preventDefault();
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      this.targetY = Math.max(0, Math.min(maxScroll, this.targetY + step * this.speedMultiplier));
      this.startLoop();
    }
  }

  onNativeScroll() {
    if (this.isTicking) {
      // Jika posisi scroll melenceng jauh dari animasi, artinya user menarik scrollbar
      if (Math.abs(window.scrollY - this.currentY) > 100) {
        this.targetY = window.scrollY;
        this.currentY = window.scrollY;
        this.isTicking = false;
      }
      return;
    }
    // Mengikuti saat user menarik scrollbar native secara manual ketika idle
    this.targetY = window.scrollY;
    this.currentY = window.scrollY;
  }

  startLoop() {
    if (this.isTicking) return;
    this.isTicking = true;
    requestAnimationFrame(() => this.tick());
  }

  tick() {
    const diff = this.targetY - this.currentY;

    if (Math.abs(diff) < 0.5) {
      this.currentY = this.targetY;
      window.scrollTo(0, this.currentY);
      this.isTicking = false;
      return;
    }

    // LEBIH HALUS: Interpolasi lerp kurva halus
    this.currentY += diff * this.lerp;
    window.scrollTo(0, this.currentY);

    requestAnimationFrame(() => this.tick());
  }

  scrollTo(targetY) {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    this.targetY = Math.max(0, Math.min(maxScroll, targetY));
    this.startLoop();
  }
}

const smoothScroller = new CinematicSmoothScroll({
  speedMultiplier: 0.50, // 50% lebih lambat
  maxVelocity: 85,       // Maksimum kecepatan 85px per tick
  lerp: 0.075            // Easing ultra halus
});
window.__smoothScroller = smoothScroller;

// Dynamic Slicing control (facing front camera)
let currentSlice = 0.0;
function updateSlicing(val) {
  currentSlice = val;
  clipPlane.constant = (1.0 - val * 2.0) * 10.0;
}

// Modular legs state
const legsPart = partsData.find(p => p.id === 'part8_kaki');
let isDocMode = false;

function setExplodedProgress(progress) {
  partsData.forEach((part) => {
    if (!part.mesh) return;
    if (part.id === 'part8_kaki' && isDocMode) return;
    part.mesh.position.y = part.origY + part.explodeY * progress;
  });
}

// Sticky Story Cards Active Chapter Controller
const ALL_STORY_CARDS = ['card-0', 'card-1', 'card-2', 'card-anti', 'card-3'];
let currentActiveCardId = null;

function updateActiveStoryCard(cardId) {
  if (currentActiveCardId === cardId) return;
  currentActiveCardId = cardId;

  ALL_STORY_CARDS.forEach((id) => {
    const card = document.getElementById(id);
    if (card) {
      card.classList.toggle('active', id === cardId);
    }
  });
}

// Dynamic Scroll-Driven Kinetic Word & Description Morph
// Order as user scrolls down: Berantakan -> Ribet -> Tumpah
function updateMorphScroll(antiProgress) {
  const s = Math.max(0.0, Math.min(1.0, antiProgress));
  function smooth(u) { return u * u * (3 - 2 * u); }

  // 1. Berantakan (Word 0)
  let y0 = 0, sc0 = 1.0, bl0 = 0, op0 = 1.0;
  if (s < 0.28) {
    y0 = 0; sc0 = 1.0; bl0 = 0; op0 = 1.0;
  } else if (s < 0.46) {
    const u = smooth((s - 0.28) / 0.18);
    y0 = -u * 28;
    sc0 = 1.0 - u * 0.20;
    bl0 = u * 8;
    op0 = 1.0 - u;
  } else {
    y0 = -28; sc0 = 0.80; bl0 = 8; op0 = 0.0;
  }

  // 2. Ribet (Word 1)
  let y1 = 28, sc1 = 0.80, bl1 = 8, op1 = 0.0;
  if (s < 0.28) {
    y1 = 28; sc1 = 0.80; bl1 = 8; op1 = 0.0;
  } else if (s < 0.46) {
    const u = smooth((s - 0.28) / 0.18);
    y1 = (1.0 - u) * 28;
    sc1 = 0.80 + u * 0.20;
    bl1 = (1.0 - u) * 8;
    op1 = u;
  } else if (s < 0.68) {
    y1 = 0; sc1 = 1.0; bl1 = 0; op1 = 1.0;
  } else if (s < 0.86) {
    const u = smooth((s - 0.68) / 0.18);
    y1 = -u * 28;
    sc1 = 1.0 - u * 0.20;
    bl1 = u * 8;
    op1 = 1.0 - u;
  } else {
    y1 = -28; sc1 = 0.80; bl1 = 8; op1 = 0.0;
  }

  // 3. Tumpah (Word 2)
  let y2 = 28, sc2 = 0.80, bl2 = 8, op2 = 0.0;
  if (s < 0.68) {
    y2 = 28; sc2 = 0.80; bl2 = 8; op2 = 0.0;
  } else if (s < 0.86) {
    const u = smooth((s - 0.68) / 0.18);
    y2 = (1.0 - u) * 28;
    sc2 = 0.80 + u * 0.20;
    bl2 = (1.0 - u) * 8;
    op2 = u;
  } else {
    y2 = 0; sc2 = 1.0; bl2 = 0; op2 = 1.0;
  }

  const elW0 = document.getElementById('word-berantakan');
  const elW1 = document.getElementById('word-ribet');
  const elW2 = document.getElementById('word-tumpah');
  const elD0 = document.getElementById('desc-berantakan');
  const elD1 = document.getElementById('desc-ribet');
  const elD2 = document.getElementById('desc-tumpah');
  const elLine = document.getElementById('morph-accent-line');

  if (elW0) {
    elW0.style.transform = `translateY(${y0}px) scale(${sc0})`;
    elW0.style.opacity = op0;
    elW0.style.filter = `blur(${bl0}px)`;
    elW0.style.visibility = op0 > 0.005 ? 'visible' : 'hidden';
    elW0.style.color = '#22c55e';
  }
  if (elD0) {
    elD0.style.transform = `translateY(${y0 * 0.5}px)`;
    elD0.style.opacity = op0;
    elD0.style.filter = `blur(${bl0 * 0.5}px)`;
    elD0.style.visibility = op0 > 0.005 ? 'visible' : 'hidden';
  }

  if (elW1) {
    elW1.style.transform = `translateY(${y1}px) scale(${sc1})`;
    elW1.style.opacity = op1;
    elW1.style.filter = `blur(${bl1}px)`;
    elW1.style.visibility = op1 > 0.005 ? 'visible' : 'hidden';
    elW1.style.color = '#22c55e';
  }
  if (elD1) {
    elD1.style.transform = `translateY(${y1 * 0.5}px)`;
    elD1.style.opacity = op1;
    elD1.style.filter = `blur(${bl1 * 0.5}px)`;
    elD1.style.visibility = op1 > 0.005 ? 'visible' : 'hidden';
  }

  if (elW2) {
    elW2.style.transform = `translateY(${y2}px) scale(${sc2})`;
    elW2.style.opacity = op2;
    elW2.style.filter = `blur(${bl2}px)`;
    elW2.style.visibility = op2 > 0.005 ? 'visible' : 'hidden';
    elW2.style.color = '#22c55e';
  }
  if (elD2) {
    elD2.style.transform = `translateY(${y2 * 0.5}px)`;
    elD2.style.opacity = op2;
    elD2.style.filter = `blur(${bl2 * 0.5}px)`;
    elD2.style.visibility = op2 > 0.005 ? 'visible' : 'hidden';
  }

  if (elLine) {
    elLine.style.background = 'linear-gradient(to right, #22c55e, #10b981, transparent)';
  }
}
updateMorphScroll(0.0);


// 5. CINEMATIC WAYPOINTS & CONTINUOUS CAMERA TRAJECTORY
const CINEMATIC_WAYPOINTS = [
  // 0: Silhouette Hero - IoPakan lifted up, camera eye level
  { scroll: 0.00, modelX: 0.0, modelY: 0.45, camX: 0.0, camY: 0.70, camZ: 10.2, targetX: 0.0, targetY: 0.35, targetZ: 0.0 },
  // 1: Daylight reveal hero, beginning trajectory
  { scroll: 0.12, modelX: 0.0, modelY: 0.40, camX: 0.0, camY: 0.70, camZ: 10.5, targetX: 0.0, targetY: 0.30, targetZ: 0.0 },
  // 2: Exploded Anatomy Arrives at Far Distance (Zoom out & positioned on right for left-side narrative card)
  { scroll: 0.22, modelX: 1.8, modelY: 0.0, camX: 0.0, camY: 3.0, camZ: 21.5, targetX: 1.8, targetY: 2.2, targetZ: 0.0 },
  // 3: Exploded Anatomy STAYS AT FAR DISTANCE (Gentle, slow rotation)
  { scroll: 0.36, modelX: 1.8, modelY: 0.0, camX: 0.0, camY: 3.0, camZ: 21.5, targetX: 1.8, targetY: 2.2, targetZ: 0.0 },
  // 4: Implode and Zoom in close to Silo 10kg
  { scroll: 0.44, modelX: 1.8, modelY: 0.0, camX: 1.8, camY: 0.85, camZ: 6.4, targetX: 1.8, targetY: 0.85, targetZ: 0.0 },
  // 5: Silo Cutaway 10kg stays close and stable (Slower & wider window 0.44 -> 0.64)
  { scroll: 0.64, modelX: 1.8, modelY: 0.0, camX: 1.8, camY: 0.85, camZ: 6.4, targetX: 1.8, targetY: 0.85, targetZ: 0.0 },
  // 6: Anti-Tumpah elevated angle looking down at rotating dosing disc & 5 apertures
  { scroll: 0.72, modelX: 1.4, modelY: 0.0, camX: 1.4, camY: 2.8, camZ: 5.6, targetX: 1.4, targetY: 0.60, targetZ: 0.0 },
  // 7: Anti-Tumpah 5-hole scroll-driven dosing disc & pellet cascade
  { scroll: 0.84, modelX: 1.4, modelY: 0.0, camX: 1.4, camY: 2.8, camZ: 5.6, targetX: 1.4, targetY: 0.60, targetZ: 0.0 },
  // 8: Modular Legs, slow relaxed glide into position, legs fully attached initially
  { scroll: 0.88, modelX: -1.8, modelY: 0.0, camX: -3.6, camY: 0.20, camZ: 8.8, targetX: -1.8, targetY: -0.20, targetZ: 0.0 },
  // 9: Modular Legs detached (DOC mode, body lowered to floor)
  { scroll: 0.91, modelX: -1.8, modelY: -0.73, camX: -3.6, camY: 0.05, camZ: 8.8, targetX: -1.8, targetY: -0.40, targetZ: 0.0 },
  // 10: Stays stably locked in position for slow inspection before moving to gallery!
  { scroll: 0.99, modelX: -1.8, modelY: -0.73, camX: -3.6, camY: 0.05, camZ: 8.8, targetX: -1.8, targetY: -0.40, targetZ: 0.0 },
  // 11: Smooth dissolved exit stably releasing into gallery
  { scroll: 1.00, modelX: -1.8, modelY: -0.73, camX: -3.6, camY: 0.05, camZ: 9.2, targetX: -1.8, targetY: -0.40, targetZ: 0.0 }
];

function getCinematicPose(p) {
  const isMobile = window.innerWidth < 1024;
  const clamped = Math.max(0, Math.min(1, p));
  let idx = 0;
  for (let i = 0; i < CINEMATIC_WAYPOINTS.length - 1; i++) {
    if (clamped >= CINEMATIC_WAYPOINTS[i].scroll && clamped <= CINEMATIC_WAYPOINTS[i + 1].scroll) {
      idx = i;
      break;
    }
  }
  const w0 = CINEMATIC_WAYPOINTS[idx];
  const w1 = CINEMATIC_WAYPOINTS[idx + 1];
  const t = (clamped - w0.scroll) / (w1.scroll - w0.scroll);
  const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);

  const lerp = THREE.MathUtils.lerp;
  let modelX = lerp(w0.modelX, w1.modelX, ease);
  let modelY = lerp(w0.modelY, w1.modelY, ease);
  let camX = lerp(w0.camX, w1.camX, ease);
  let camY = lerp(w0.camY, w1.camY, ease);
  let camZ = lerp(w0.camZ, w1.camZ, ease);
  let targetX = lerp(w0.targetX, w1.targetX, ease);
  let targetY = lerp(w0.targetY, w1.targetY, ease);
  let targetZ = lerp(w0.targetZ, w1.targetZ, ease);

  if (isMobile) {
    modelX = 0;
    camX = camX * 0.25;
    camZ = camZ * 1.35;
    targetX = 0;
    targetY = targetY + 0.35;
  }

  return { modelX, modelY, camX, camY, camZ, targetX, targetY, targetZ };
}

// 10kg Silo Dimension Measurement Overlay elements with laser scan & live counter animations
const dimOverlay = document.getElementById('silo-dim-overlay');
const dimTickTop = document.getElementById('dim-tick-top');
const dimTickBottom = document.getElementById('dim-tick-bottom');
const dimLineMain = document.getElementById('dim-line-main');
const dimLineBg = document.getElementById('dim-line-bg');
const dimPointTop = document.getElementById('dim-point-top');
const dimPointBottom = document.getElementById('dim-point-bottom');
const dimLabel = document.getElementById('silo-dim-label');

const dimVecTop = new THREE.Vector3();
const dimVecBottom = new THREE.Vector3();

let dimAnimProgress = 0.0;
let isDimActive = false;

function update10kgDimensionOverlay(isActive, delta) {
  if (!dimOverlay) return;

  // Slower, more deliberate, luxurious rate for drawing down the 10kg laser dimension
  const rate = isActive ? 0.85 : 1.8;
  const target = isActive ? 1.0 : 0.0;
  dimAnimProgress += (target - dimAnimProgress) * Math.min(1, (delta || 0.016) * rate * 2.2);

  if (dimAnimProgress < 0.005 && !isActive) {
    dimOverlay.style.display = 'none';
    dimOverlay.classList.remove('active');
    return;
  }

  dimOverlay.style.display = 'block';
  dimOverlay.classList.toggle('active', dimAnimProgress > 0.05);

  const isMobile = window.innerWidth < 1024;
  // Pin directly to the Silo outer boundary in world space:
  const radialOffset = isMobile ? 1.40 : 1.68;
  const worldX = iopakanGroup.position.x + radialOffset;
  const worldTopY = iopakanGroup.position.y + 2.82;
  const worldBotY = iopakanGroup.position.y + 0.74;

  dimVecTop.set(worldX, worldTopY, 0.0).project(camera);
  dimVecBottom.set(worldX, worldBotY, 0.0).project(camera);

  const topX = (dimVecTop.x * 0.5 + 0.5) * window.innerWidth;
  const topY = (-(dimVecTop.y * 0.5) + 0.5) * window.innerHeight;
  const botX = (dimVecBottom.x * 0.5 + 0.5) * window.innerWidth;
  const botY = (-(dimVecBottom.y * 0.5) + 0.5) * window.innerHeight;

  // Animated laser draw-down from top down
  const currentBotX = topX + (botX - topX) * dimAnimProgress;
  const currentBotY = topY + (botY - topY) * dimAnimProgress;

  if (dimLineBg) {
    dimLineBg.setAttribute('x1', topX);
    dimLineBg.setAttribute('y1', topY);
    dimLineBg.setAttribute('x2', currentBotX);
    dimLineBg.setAttribute('y2', currentBotY);
    dimLineBg.style.opacity = `${Math.min(0.55, dimAnimProgress * 1.5)}`;
  }
  if (dimLineMain) {
    dimLineMain.setAttribute('x1', topX);
    dimLineMain.setAttribute('y1', topY);
    dimLineMain.setAttribute('x2', currentBotX);
    dimLineMain.setAttribute('y2', currentBotY);
    dimLineMain.style.opacity = `${Math.min(1.0, dimAnimProgress * 1.5)}`;
  }
  if (dimTickTop) {
    dimTickTop.setAttribute('x1', topX - 16 * dimAnimProgress);
    dimTickTop.setAttribute('y1', topY);
    dimTickTop.setAttribute('x2', topX + 16 * dimAnimProgress);
    dimTickTop.setAttribute('y2', topY);
    dimTickTop.style.opacity = `${Math.min(1.0, dimAnimProgress * 2)}`;
  }
  if (dimTickBottom) {
    const bottomTickFade = Math.max(0, (dimAnimProgress - 0.6) / 0.4);
    dimTickBottom.setAttribute('x1', currentBotX - 16 * bottomTickFade);
    dimTickBottom.setAttribute('y1', currentBotY);
    dimTickBottom.setAttribute('x2', currentBotX + 16 * bottomTickFade);
    dimTickBottom.setAttribute('y2', currentBotY);
    dimTickBottom.style.opacity = `${bottomTickFade}`;
  }
  if (dimPointTop) {
    dimPointTop.setAttribute('cx', topX);
    dimPointTop.setAttribute('cy', topY);
    dimPointTop.style.opacity = `${Math.min(1.0, dimAnimProgress * 2)}`;
  }
  if (dimPointBottom) {
    dimPointBottom.setAttribute('cx', currentBotX);
    dimPointBottom.setAttribute('cy', currentBotY);
    dimPointBottom.style.opacity = `${Math.max(0, (dimAnimProgress - 0.4) / 0.6)}`;
  }
  const midX = (topX + currentBotX) / 2;
  const midY = (topY + currentBotY) / 2;

  const dimTickMid = document.getElementById('dim-tick-mid');
  if (dimTickMid) {
    const leaderFade = Math.max(0, (dimAnimProgress - 0.25) / 0.75);
    dimTickMid.setAttribute('x1', midX);
    dimTickMid.setAttribute('y1', midY);
    dimTickMid.setAttribute('x2', midX + 12 * leaderFade);
    dimTickMid.setAttribute('y2', midY);
    dimTickMid.style.opacity = `${leaderFade}`;
  }

  if (dimLabel) {
    const badgeFade = Math.max(0, (dimAnimProgress - 0.15) / 0.85);
    dimLabel.style.left = `${midX + 12}px`;
    dimLabel.style.top = `${midY}px`;
    dimLabel.style.opacity = `${badgeFade}`;
    dimLabel.style.transform = `translate(0, -50%) scale(${0.85 + 0.15 * badgeFade})`;

    const weightNumEl = document.getElementById('dim-weight-num');
    if (weightNumEl) {
      if (dimAnimProgress > 0.96) {
        weightNumEl.textContent = '10.0';
      } else {
        weightNumEl.textContent = (dimAnimProgress * 10.0).toFixed(1);
      }
    }
  }
}


// 5. ANIMATION & TIMELINE TICK
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const rawDelta = clock.getDelta();
  const delta = Math.min(rawDelta, 0.05);

  // Responsive lerp on mobile touch screens; smooth synchrony on desktop
  const scrollLerp = isMobileDevice ? 0.088 : 0.095;
  smoothScroll += (targetScroll - smoothScroll) * scrollLerp;
  if (Math.abs(targetScroll - smoothScroll) < 0.0002) {
    smoothScroll = targetScroll;
  }

  // 1. DYNAMIC LIGHTING TRANSITION: Dark Silhouette -> Studio Daylight
  const tReveal = Math.min(1, Math.max(0, smoothScroll / 0.12));
  sunLight.intensity = THREE.MathUtils.lerp(0.08, 1.45, tReveal);
  hemiLight.intensity = THREE.MathUtils.lerp(0.04, 0.40, tReveal);
  frontKeyLight.intensity = THREE.MathUtils.lerp(0.08, 1.25, tReveal);
  rimLightCyan.intensity = THREE.MathUtils.lerp(7.5, 3.8, tReveal);
  rimLightEmerald.intensity = THREE.MathUtils.lerp(8.5, 4.2, tReveal);

  if (stageDisc && stageDisc.material) {
    stageDisc.material.opacity = THREE.MathUtils.lerp(0.0, 0.95, tReveal);
  }
  if (stageRing && stageRing.material) {
    stageRing.material.opacity = THREE.MathUtils.lerp(0.0, 0.90, tReveal);
  }
  if (contactShadow && contactShadow.material) {
    contactShadow.material.opacity = THREE.MathUtils.lerp(0.0, 0.85, tReveal);
  }

  // Scene fog stays dark and atmospheric throughout 3D hardware presentation
  scene.fog.color.setHex(0x0c1520);

  // 2. ACTIVE STORY CARD DETERMINATION - Strictly synchronous to camera arriving!
  let activeCard = null;
  if (smoothScroll < 0.14) {
    activeCard = 'card-0';
  } else if (smoothScroll >= 0.20 && smoothScroll < 0.36) {
    // Anatomi terurai tiba di jarak pandang luas
    activeCard = 'card-1';
  } else if (smoothScroll >= 0.42 && smoothScroll < 0.65) {
    // 10kg Silo Cutaway (Slower & wider window 0.42 -> 0.65)
    activeCard = 'card-2';
  } else if (smoothScroll >= 0.70 && smoothScroll < 0.85) {
    // Anti-Tumpah Dosing (Berantakan -> Ribet -> Tumpah)
    activeCard = 'card-anti';
  } else if (smoothScroll >= 0.87) {
    // Modular Legs (Fase DOC hingga Dewasa - Climax of 3D narrative)
    activeCard = 'card-3';
  } else {
    activeCard = null;
  }
  updateActiveStoryCard(activeCard);

  if (isModelLoaded) {
    if (isInSmartSection) {
      // SECTION 3: KENDALI PRESISI (SMARTPHONE IOT & COMPANION 3D IOPAKAN)
      // Dedicated companion viewer in right column handles the 3D model
      feedInst.visible = false;
      update10kgDimensionOverlay(false, delta);

    } else {
      // NORMAL HARDWARE 3D SCROLLYTELLING
      const pose = getCinematicPose(smoothScroll);

      iopakanGroup.position.x = pose.modelX;
      iopakanGroup.position.y = pose.modelY;
      stageGroup.position.x = pose.modelX;
      stageGroup.position.y = pose.modelY;

      if (!userOverrodeCamera) {
        camera.position.set(pose.camX, pose.camY, pose.camZ);
        controls.target.set(pose.targetX, pose.targetY, pose.targetZ);
      }

      // 1. EXPLODE PROGRESS (Continuous & S-curve eased)
      if (smoothScroll < 0.12) {
        setExplodedProgress(0.0);
      } else if (smoothScroll < 0.22) {
        // Part meregang seiring kamera menjauh
        const t = (smoothScroll - 0.12) / 0.10;
        const ease = t * t * (3 - 2 * t);
        setExplodedProgress(ease);
      } else if (smoothScroll <= 0.36) {
        // Meledak penuh di posisi jauh
        setExplodedProgress(1.0);
        // IoPakan berputar lambat dan anggun memperlihatkan setiap komponen
        if (!userOverrodeCamera) {
          const rotFrac = (smoothScroll - 0.22) / 0.14;
          iopakanGroup.rotation.y = rotFrac * (Math.PI * 0.80);
        }
      } else if (smoothScroll < 0.44) {
        // Part merapat kembali utuh (implode)
        const t = (smoothScroll - 0.36) / 0.08;
        const ease = 1.0 - t * t * (3 - 2 * t);
        setExplodedProgress(Math.max(0, ease));
        if (!userOverrodeCamera) {
          iopakanGroup.rotation.y = THREE.MathUtils.lerp(iopakanGroup.rotation.y, 0.0, 0.10);
        }
      } else {
        setExplodedProgress(0.0);
      }

      // 2. SLICING PLANE (Continuous cutaway: UTUH by default, terbelah 50% HANYA di Silo 10kg & Anti-Tumpah)
      let sp = 0.0;
      if (smoothScroll < 0.36) {
        sp = 0.0; // Utuh di Hero & Anatomi
      } else if (smoothScroll < 0.44) {
        // Membelah perlahan 50% seiring kamera mendekati Silo
        const t = (smoothScroll - 0.36) / 0.08;
        sp = (t * t * (3 - 2 * t)) * 0.50;
      } else if (smoothScroll <= 0.86) {
        // Terbuka penuh 50% selama sesi 10kg Silo dan sesi Anti-Tumpah dosing disc
        sp = 0.50;
      } else if (smoothScroll < 0.93) {
        // Menutup kembali secara sangat mulus dan lambat menuju Kaki Modular (0.86 -> 0.93)
        const t = (smoothScroll - 0.86) / 0.07;
        sp = (1.0 - (t * t * (3 - 2 * t))) * 0.50;
      } else {
        sp = 0.0; // Utuh sempurna di Kaki Modular dan seterusnya
      }
      sp = Math.max(0, Math.min(0.50, sp));
      updateSlicing(sp);

      // Silo Dimension Overlay: Aktif kokoh & stabil selama sesi 10kg Silo (0.42 -> 0.66)
      const isSiloActive = (smoothScroll >= 0.42 && smoothScroll < 0.66);
      update10kgDimensionOverlay(isSiloActive, delta);

      if (smoothScroll >= 0.42 && smoothScroll < 0.66 && !userOverrodeCamera) {
        iopakanGroup.rotation.y = THREE.MathUtils.lerp(iopakanGroup.rotation.y, 0.0, 0.12);
      }
      
      // 3. ANTI-TUMPAH: DOSING DISC ROTATION, PELET JATUH & KINETIC MORPH (Berantakan -> Ribet -> Tumpah)
      const isAntiChapter = (smoothScroll >= 0.70 && smoothScroll < 0.86);
      if (isAntiChapter) {
        const antiProg = (smoothScroll - 0.70) / 0.16;
        const discPart = partsData.find(p => p.id === 'part3_piring');
        const scrollDiscRot = antiProg * 3.4;
        if (discPart && discPart.mesh) {
          discPart.mesh.rotation.y = scrollDiscRot;
        }
        // Pelet muter dan jatoh menembus 5 lubang CAD sesuai dengan pergerakan scroll
        updatePelletCascadeScroll(scrollDiscRot, antiProg);

        // Kinetic typography morphing driven directly by scroll:
        updateMorphScroll(antiProg);

        if (!userOverrodeCamera) {
          iopakanGroup.rotation.y = THREE.MathUtils.lerp(iopakanGroup.rotation.y, 0.28, 0.08);
        }
      } else if (isDispensing) {
        updatePelletCascadeDispensing(delta);
      } else {
        feedInst.visible = false;
      }

      // 4. MODULAR LEGS DETACHMENT & DOC MODE (Rotasi lambat & santai saat scroll)
      if (smoothScroll < 0.88) {
        // Kaki terpasang kokoh di ketinggian dewasa (57 cm)
        if (legsPart && legsPart.mesh) {
          legsPart.mesh.visible = true;
          legsPart.mesh.position.y = LEG_ATTACH_OFFSET;
        }
        if (isDocMode && !userManuallyToggledLegs) {
          isDocMode = false;
          btnAdult?.classList.add('active');
          btnDoc?.classList.remove('active');
        }
      } else {
        // Di scroll >= 0.88: Kaki terlepas turun perlahan dan bodi merendah ke fase DOC (40 cm)
        if (!userManuallyToggledLegs) {
          const tLeg = Math.max(0, Math.min(1, (smoothScroll - 0.88) / 0.03));
          const ease = tLeg * tLeg * (3 - 2 * tLeg);
          if (legsPart && legsPart.mesh) {
            legsPart.mesh.position.y = LEG_ATTACH_OFFSET - ease * 2.2;
            legsPart.mesh.visible = (ease < 0.98);
          }
          iopakanGroup.position.y = -ease * 0.73;
          if (ease > 0.5) {
            btnDoc?.classList.add('active');
            btnAdult?.classList.remove('active');
            isDocMode = true;
          } else {
            btnAdult?.classList.add('active');
            btnDoc?.classList.remove('active');
            isDocMode = false;
          }
        }

        // Putar alat perlahan & lambat secara bertahap selama scroll di fase DOC
        if (smoothScroll >= 0.91 && !userOverrodeCamera) {
          const docRotProgress = Math.max(0, Math.min(1, (smoothScroll - 0.91) / 0.085));
          const targetRot = docRotProgress * (Math.PI * 1.25); // Rotasi bertahap & lambat (tidak ngebut)
          iopakanGroup.rotation.y = THREE.MathUtils.lerp(iopakanGroup.rotation.y, targetRot, 0.04);
        } else if (autoRotate && !userOverrodeCamera) {
          iopakanGroup.rotation.y += delta * 0.07;
        }
      }

      // Gentle auto-rotation in hero daylight
      if (smoothScroll < 0.12 && autoRotate && !userOverrodeCamera) {
        iopakanGroup.rotation.y += delta * 0.16;
      }
    }
  }

  // Render fluid metallic glass whenever not fully obscured by white gallery or Smart Control
  if (fluidGlassController) {
    const tBgVal = galBgLight ? parseFloat(galBgLight.style.opacity || '0') : 0;
    const isFluidVisible = !isInSmartSection && tBgVal < 0.99;
    if (isFluidVisible) {
      fluidGlassController.render(clock.getElapsedTime(), smoothScroll);
    }
  }

  if (isMainCanvasActive) {
    controls.update();
    renderer.render(scene, camera);
  }
}
animate();

// 6. INTERACTIVE BUTTON HANDLERS
function scrollToProgress(p) {
  const storyTrack = document.getElementById('story-scroll-track');
  if (storyTrack) {
    const maxStoryScroll = storyTrack.offsetHeight - window.innerHeight;
    if (window.__smoothScroller) {
      window.__smoothScroller.scrollTo(maxStoryScroll * p);
    } else {
      window.scrollTo({ top: maxStoryScroll * p, behavior: 'smooth' });
    }
  }
}

// Modular legs toggles ("Satu Alat Semua Fase")
let userManuallyToggledLegs = false;
const btnDoc = document.getElementById('btn-mode-doc');
const btnAdult = document.getElementById('btn-mode-adult');

function applyLegMode(isDoc) {
  isDocMode = isDoc;
  if (!legsPart || !legsPart.mesh) return;
  if (isDoc) {
    btnDoc?.classList.add('active');
    btnAdult?.classList.remove('active');
    // Animate legs dropping down and disappearing - ONLY LEGS HIDE!
    gsap.to(legsPart.mesh.position, {
      y: -3.2,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        if (isDocMode) legsPart.mesh.visible = false;
      }
    });
    // Feeder bottom bowl part7_bawah remains completely visible and sits right on the pedestal
    gsap.to(iopakanGroup.position, { y: -0.85, duration: 0.6, ease: 'power2.out' });
  } else {
    btnAdult?.classList.add('active');
    btnDoc?.classList.remove('active');
    legsPart.mesh.visible = true;
    gsap.to(legsPart.mesh.position, { y: LEG_ATTACH_OFFSET, duration: 0.7, ease: 'back.out(1.4)' });
    gsap.to(iopakanGroup.position, { y: 0.0, duration: 0.6, ease: 'power2.out' });
  }
}

btnDoc?.addEventListener('click', () => {
  userManuallyToggledLegs = true;
  applyLegMode(true);
});
btnAdult?.addEventListener('click', () => {
  userManuallyToggledLegs = true;
  applyLegMode(false);
});

// 7. COMPANION 3D HARDWARE VIEWER (Right Column Model next to Phone)
let companionScene, companionCamera, companionRenderer, companionControls;
let companionPiring = null;
let companionTutup = null;
let companionClipPlane = null;
let isCompanionCutaway = false;
let isCompanionTopView = false;
let isCompanionSpinning = false;
let companionSpinTimer = null;

function initCompanionViewer(sourceScene) {
  const mount = document.getElementById('companion-canvas-mount');
  if (!mount || companionRenderer) return;

  const width = mount.clientWidth || 440;
  const height = mount.clientHeight || 560;

  companionScene = new THREE.Scene();
  companionCamera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
  companionCamera.position.set(0, 0.70, 7.8);

  companionRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  companionRenderer.setSize(width, height);
  companionRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  companionRenderer.outputColorSpace = THREE.SRGBColorSpace;
  companionRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Brighter exposure so the 3D model looks clean and vibrant against the light theme
  companionRenderer.toneMappingExposure = 1.48;
  // Local clipping enabled for cutaway / split cross-section mode
  companionRenderer.localClippingEnabled = true;

  mount.appendChild(companionRenderer.domElement);

  // Clipping plane for cutaway inspection (constant = 10 is un-sliced, constant = 0 slices vertically at center)
  companionClipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10.0);

  companionControls = new OrbitControls(companionCamera, companionRenderer.domElement);
  companionControls.enableDamping = true;
  companionControls.dampingFactor = 0.05;
  companionControls.enableZoom = true;
  companionControls.minDistance = 3.5;
  companionControls.maxDistance = 14.0;
  companionControls.maxPolarAngle = Math.PI * 0.58;
  companionControls.minPolarAngle = 0.04; // Allows full vertical top-down view looking into hopper!
  companionControls.autoRotate = true;
  companionControls.autoRotateSpeed = 0.6;
  companionControls.target.set(0, 0.15, 0);

  // Ultra-Bright Multi-Directional Studio Lighting for Light Section
  const compHemi = new THREE.HemisphereLight(0xffffff, 0xdcfce7, 1.6);
  companionScene.add(compHemi);

  const compDir = new THREE.DirectionalLight(0xffffff, 2.5);
  compDir.position.set(5, 9, 6);
  companionScene.add(compDir);

  const compFill = new THREE.DirectionalLight(0xffffff, 1.8);
  compFill.position.set(-5, 6, 5);
  companionScene.add(compFill);

  const compFront = new THREE.DirectionalLight(0xffffff, 1.3);
  compFront.position.set(0, 2, 7);
  companionScene.add(compFront);

  const compTop = new THREE.DirectionalLight(0xffffff, 2.2);
  compTop.position.set(0, 10, 0);
  companionScene.add(compTop);

  const compRim = new THREE.DirectionalLight(0x34d399, 1.5);
  compRim.position.set(-5, 4, -4);
  companionScene.add(compRim);

  // Soft ground shadow disc
  const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.10,
    depthWrite: false
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -1.22;
  companionScene.add(shadowMesh);

  // Clone IoPakan hardware model
  const clone = sourceScene.clone(true);
  clone.position.set(0, -0.15, 0);
  clone.scale.set(0.92, 0.92, 0.92);

  // Assign cloned materials with double-side rendering, brighter colors, and cutaway plane
  clone.traverse((child) => {
    if (child.isMesh) {
      if (child.material) {
        child.material = child.material.clone();
        child.material.clippingPlanes = [companionClipPlane];
        child.material.clipShadows = true;
        child.material.side = THREE.DoubleSide; // Clean solid interior when cutaway is active

        if (child.material.color) {
          const hex = child.material.color.getHex();
          if (hex === 0x12733f || hex === 0x126e3c || hex === 0x106838) {
            child.material.color.setHex(0x159a54); // Bright vivid emerald polymer
          } else if (hex === 0x475569 || hex === 0x64748b) {
            child.material.color.setHex(0x64748b); // Polished clean silver-grey
          }
        }
        child.material.roughness = 0.22;
        child.material.needsUpdate = true;
      }
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  companionScene.add(clone);

  // Find piring and top lid inside clone
  companionPiring = clone.getObjectByName('part3_piring');
  companionTutup = clone.getObjectByName('part1_tutup');

  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    if (!mount || !companionRenderer || !companionCamera) return;
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    if (w > 0 && h > 0) {
      companionCamera.aspect = w / h;
      companionCamera.updateProjectionMatrix();
      companionRenderer.setSize(w, h);
    }
  });
  resizeObserver.observe(mount);

  // IntersectionObserver to PAUSE companion rendering when offscreen (saves 100% GPU / CPU)
  let isCompanionInView = false;
  const companionVisibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isCompanionInView = entry.isIntersecting;
    });
  }, { threshold: 0.02, rootMargin: '120px' });
  companionVisibilityObserver.observe(mount);

  // Animate companion model - ONLY renders when visible on screen!
  function animateCompanion() {
    requestAnimationFrame(animateCompanion);
    if (!isCompanionInView || !companionRenderer) return;
    companionControls.update();
    if (isCompanionSpinning && companionPiring) {
      companionPiring.rotation.y += 0.04;
    }
    companionRenderer.render(companionScene, companionCamera);
  }
  animateCompanion();
}

function spinCompanionPiring(duration = 3.6) {
  isCompanionSpinning = true;
  const badge = document.getElementById('companion-badge');
  const label = document.getElementById('companion-label');
  const indicator = document.getElementById('companion-indicator');

  if (badge && label && indicator) {
    label.textContent = 'Memutar Piringan Dosing Presisi...';
    badge.classList.remove('text-emerald-800', 'border-emerald-300/70');
    badge.classList.add('text-emerald-600', 'border-emerald-500', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/40');
    indicator.classList.remove('bg-emerald-500');
    indicator.classList.add('bg-amber-400', 'animate-ping');
  }

  if (companionSpinTimer) clearTimeout(companionSpinTimer);
  companionSpinTimer = setTimeout(() => {
    isCompanionSpinning = false;
    if (badge && label && indicator) {
      label.textContent = 'IoPakan Siap • Sinkron Jadwal';
      badge.classList.remove('text-emerald-600', 'border-emerald-500', 'bg-emerald-50', 'ring-2', 'ring-emerald-400/40');
      badge.classList.add('text-emerald-800', 'border-emerald-300/70');
      indicator.classList.remove('bg-amber-400', 'animate-ping');
      indicator.classList.add('bg-emerald-500');
    }
  }, duration * 1000);
}

// 3D Inspection Mode Controllers: Top-Down View without Lid & Cutaway Slicing
function setCompanionTopView(active) {
  isCompanionTopView = active;
  const btnTop = document.getElementById('companion-btn-topview');
  const label = document.getElementById('companion-label');

  if (active) {
    btnTop?.classList.add('active');
    // Tutup gaada: sembunyikan penutup atas agar isi dalam silo langsung terlihat jelas
    if (companionTutup) companionTutup.visible = false;

    // Gerakkan kamera ke atas (top-down) mengarah langsung ke dalam hopper
    gsap.to(companionCamera.position, { x: 0.0, y: 6.6, z: 2.2, duration: 1.1, ease: 'power2.inOut' });
    gsap.to(companionControls.target, { x: 0.0, y: 0.05, z: 0.0, duration: 1.1, ease: 'power2.inOut' });

    if (label) label.textContent = 'Inspeksi Dari Atas • Tutup Dibuka';
  } else {
    btnTop?.classList.remove('active');
    // Kembalikan tutup terpasang
    if (companionTutup) companionTutup.visible = true;

    // Kembalikan posisi kamera ke sudut default
    gsap.to(companionCamera.position, { x: 0.0, y: 0.70, z: 7.8, duration: 1.1, ease: 'power2.inOut' });
    gsap.to(companionControls.target, { x: 0.0, y: 0.15, z: 0.0, duration: 1.1, ease: 'power2.inOut' });

    if (label) label.textContent = isCompanionCutaway ? 'Mode Belah • Tampak Dalam' : 'IoPakan Siap • Sinkron Jadwal';
  }
}

function setCompanionCutaway(active) {
  isCompanionCutaway = active;
  const btnCut = document.getElementById('companion-btn-cutaway');
  const label = document.getElementById('companion-label');

  if (active) {
    btnCut?.classList.add('active');
    // Potong melintang di tengah bodi (constant: 0.0 membelah tepat di sumbu Z=0)
    if (companionClipPlane) {
      gsap.to(companionClipPlane, {
        constant: 0.0,
        duration: 0.75,
        ease: 'power2.out',
        onUpdate: () => {
          if (companionRenderer) companionRenderer.render(companionScene, companionCamera);
        }
      });
    }
    if (label) label.textContent = isCompanionTopView ? 'Inspeksi Atas & Belah Melintang' : 'Mode Belah • Tampak Dalam';
  } else {
    btnCut?.classList.remove('active');
    // Kembalikan bodi utuh tanpa belahan
    if (companionClipPlane) {
      gsap.to(companionClipPlane, {
        constant: 10.0,
        duration: 0.75,
        ease: 'power2.out',
        onUpdate: () => {
          if (companionRenderer) companionRenderer.render(companionScene, companionCamera);
        }
      });
    }
    if (label) label.textContent = isCompanionTopView ? 'Inspeksi Dari Atas • Tutup Dibuka' : 'IoPakan Siap • Sinkron Jadwal';
  }
}

function resetCompanionView() {
  setCompanionTopView(false);
  setCompanionCutaway(false);
}

// Event Listeners for Inspection Tools
document.getElementById('companion-btn-topview')?.addEventListener('click', () => {
  setCompanionTopView(!isCompanionTopView);
});

document.getElementById('companion-btn-cutaway')?.addEventListener('click', () => {
  setCompanionCutaway(!isCompanionCutaway);
});

document.getElementById('companion-btn-resetview')?.addEventListener('click', () => {
  resetCompanionView();
});

document.getElementById('companion-manual-spin-btn')?.addEventListener('click', () => spinCompanionPiring(3.5));


// 8. FLUTTER SMARTPHONE SCHEDULE & CONTROLS (Matching Screenshot)
let phoneToastTimer = null;

function showPhoneToast(msg) {
  const toast = document.getElementById('phone-toast');
  const toastText = document.getElementById('phone-toast-text');
  if (!toast || !toastText) return;

  toastText.textContent = msg;
  toast.classList.remove('translate-y-16', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  if (phoneToastTimer) clearTimeout(phoneToastTimer);
  phoneToastTimer = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-16', 'opacity-0', 'pointer-events-none');
  }, 2500);
}

// Phone Schedule State (Default matching screenshot)
let phoneSchedules = [
  { id: 1, time: '01:47', portion: 'Sedang' },
  { id: 2, time: '06:39', portion: 'Banyak' },
  { id: 3, time: '10:30', portion: 'Sedang' },
  { id: 4, time: '23:44', portion: 'Sedikit' }
];

function renderPhoneSchedules() {
  const list = document.getElementById('phone-schedule-items');
  const countBadge = document.getElementById('phone-sched-count');
  if (!list) return;

  if (countBadge) {
    countBadge.textContent = `${phoneSchedules.length} Jadwal`;
  }

  list.innerHTML = '';
  phoneSchedules.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'phone-schedule-card flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:shadow-sm select-none';
    card.dataset.id = item.id;
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-[#e8f8ef] text-[#10b981] flex items-center justify-center shrink-0 shadow-2xs">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/></svg>
        </div>
        <div>
          <div class="text-lg font-bold text-slate-900 font-display leading-tight tracking-tight">${item.time}</div>
          <div class="text-xs text-slate-400 font-medium mt-0.5">Porsi: ${item.portion}</div>
        </div>
      </div>
      <button type="button" class="phone-item-delete w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors cursor-pointer" title="Hapus Jadwal">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    `;
    list.appendChild(card);
  });
}
renderPhoneSchedules();

// Delegated Delete click on schedule cards
const phoneSchedItems = document.getElementById('phone-schedule-items');
phoneSchedItems?.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('.phone-item-delete');
  if (deleteBtn) {
    const card = deleteBtn.closest('.phone-schedule-card');
    const id = parseInt(card?.dataset.id, 10);
    phoneSchedules = phoneSchedules.filter(s => s.id !== id);
    gsap.to(card, {
      x: -25,
      opacity: 0,
      height: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        card.remove();
        const countBadge = document.getElementById('phone-sched-count');
        if (countBadge) countBadge.textContent = `${phoneSchedules.length} Jadwal`;
        showPhoneToast('Jadwal berhasil dihapus.');
      }
    });
  }
});

// App Bar Trash Icon (Clear all / Reset schedules)
document.getElementById('phone-btn-clear-all')?.addEventListener('click', () => {
  if (phoneSchedules.length === 0) {
    phoneSchedules = [
      { id: 1, time: '01:47', portion: 'Sedang' },
      { id: 2, time: '06:39', portion: 'Banyak' },
      { id: 3, time: '10:30', portion: 'Sedang' },
      { id: 4, time: '23:44', portion: 'Sedikit' }
    ];
    renderPhoneSchedules();
    showPhoneToast('Jadwal diatur ulang!');
  } else {
    phoneSchedules = [];
    renderPhoneSchedules();
    showPhoneToast('Semua jadwal dihapus.');
  }
});

// Vertical Wheel Drum Slider for Hour & Minute
let selectedWheelHour = 14;
let selectedWheelMin = 0;
let selectedPortionLabel = 'Sedang';

function initTimeWheels() {
  const wheelHour = document.getElementById('wheel-hour');
  const wheelMin = document.getElementById('wheel-min');
  const displayTime = document.getElementById('picker-display-time');
  if (!wheelHour || !wheelMin) return;

  wheelHour.innerHTML = '';
  for (let h = 0; h < 24; h++) {
    const el = document.createElement('div');
    el.className = `wheel-item ${h === selectedWheelHour ? 'active' : ''}`;
    el.textContent = String(h).padStart(2, '0');
    el.dataset.val = h;
    el.addEventListener('click', () => {
      selectedWheelHour = h;
      wheelHour.scrollTo({ top: h * 32, behavior: 'smooth' });
      updateWheelActive();
    });
    wheelHour.appendChild(el);
  }

  wheelMin.innerHTML = '';
  for (let m = 0; m < 60; m++) {
    const el = document.createElement('div');
    el.className = `wheel-item ${m === selectedWheelMin ? 'active' : ''}`;
    el.textContent = String(m).padStart(2, '0');
    el.dataset.val = m;
    el.addEventListener('click', () => {
      selectedWheelMin = m;
      wheelMin.scrollTo({ top: m * 32, behavior: 'smooth' });
      updateWheelActive();
    });
    wheelMin.appendChild(el);
  }

  function updateWheelActive() {
    wheelHour.querySelectorAll('.wheel-item').forEach((item, i) => {
      item.classList.toggle('active', i === selectedWheelHour);
    });
    wheelMin.querySelectorAll('.wheel-item').forEach((item, i) => {
      item.classList.toggle('active', i === selectedWheelMin);
    });
    if (displayTime) {
      displayTime.textContent = `${String(selectedWheelHour).padStart(2, '0')}:${String(selectedWheelMin).padStart(2, '0')}`;
    }
  }

  let hourScrollTimer, minScrollTimer;
  wheelHour.addEventListener('scroll', () => {
    clearTimeout(hourScrollTimer);
    hourScrollTimer = setTimeout(() => {
      selectedWheelHour = Math.max(0, Math.min(23, Math.round(wheelHour.scrollTop / 32)));
      updateWheelActive();
    }, 40);
  }, { passive: true });

  wheelMin.addEventListener('scroll', () => {
    clearTimeout(minScrollTimer);
    minScrollTimer = setTimeout(() => {
      selectedWheelMin = Math.max(0, Math.min(59, Math.round(wheelMin.scrollTop / 32)));
      updateWheelActive();
    }, 40);
  }, { passive: true });

  document.getElementById('btn-hour-up')?.addEventListener('click', () => {
    selectedWheelHour = (selectedWheelHour - 1 + 24) % 24;
    wheelHour.scrollTo({ top: selectedWheelHour * 32, behavior: 'smooth' });
    updateWheelActive();
  });
  document.getElementById('btn-hour-down')?.addEventListener('click', () => {
    selectedWheelHour = (selectedWheelHour + 1) % 24;
    wheelHour.scrollTo({ top: selectedWheelHour * 32, behavior: 'smooth' });
    updateWheelActive();
  });
  document.getElementById('btn-min-up')?.addEventListener('click', () => {
    selectedWheelMin = (selectedWheelMin - 5 + 60) % 60;
    wheelMin.scrollTo({ top: selectedWheelMin * 32, behavior: 'smooth' });
    updateWheelActive();
  });
  document.getElementById('btn-min-down')?.addEventListener('click', () => {
    selectedWheelMin = (selectedWheelMin + 5) % 60;
    wheelMin.scrollTo({ top: selectedWheelMin * 32, behavior: 'smooth' });
    updateWheelActive();
  });

  setTimeout(() => {
    wheelHour.scrollTop = selectedWheelHour * 32;
    wheelMin.scrollTop = selectedWheelMin * 32;
    updateWheelActive();
  }, 100);
}
initTimeWheels();

// Add Schedule Modal controls
const phoneAddModal = document.getElementById('phone-add-modal');
const btnOpenAdd = document.getElementById('phone-btn-open-add');
const btnCancelAdd = document.getElementById('phone-modal-cancel');
const btnSaveAdd = document.getElementById('phone-modal-save');
const portionButtons = document.querySelectorAll('#portion-selector .portion-btn');

portionButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    portionButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPortionLabel = btn.dataset.label || 'Sedang';
  });
});

function openScheduleModal() {
  if (!phoneAddModal) return;
  phoneAddModal.classList.remove('hidden');
}

function closeScheduleModal() {
  if (!phoneAddModal) return;
  phoneAddModal.classList.add('hidden');
}

btnOpenAdd?.addEventListener('click', openScheduleModal);
document.getElementById('companion-add-schedule-btn')?.addEventListener('click', () => {
  openScheduleModal();
  document.getElementById('smart-control-section')?.scrollIntoView({ behavior: 'smooth' });
});
btnCancelAdd?.addEventListener('click', closeScheduleModal);

// When a new schedule is saved, dosing disc of companion 3D model spins!
btnSaveAdd?.addEventListener('click', () => {
  const timeStr = `${String(selectedWheelHour).padStart(2, '0')}:${String(selectedWheelMin).padStart(2, '0')}`;
  phoneSchedules.push({
    id: Date.now(),
    time: timeStr,
    portion: selectedPortionLabel
  });
  renderPhoneSchedules();
  closeScheduleModal();
  showPhoneToast(`Jadwal ${timeStr} tersimpan!`);
  
  // 3D Companion IoPakan Dosing Disc spins when schedule is added!
  spinCompanionPiring(3.8);
});


// Responsive resize
window.addEventListener('resize', () => {
  baseModelX = window.innerWidth > 1024 ? 2.3 : 0.0;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
});
