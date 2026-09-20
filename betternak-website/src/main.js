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

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;
renderer.localClippingEnabled = true;
renderer.domElement.style.touchAction = 'pan-y';
container.appendChild(renderer.domElement);

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
        setTimeout(() => { loaderOverlay.style.display = 'none'; }, 200);
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

function updateGalleryScroll() {
  const galPin = document.getElementById('gallery-pin-container');
  const galTrack = document.getElementById('gallery-track');
  const smartSec = document.getElementById('smart-control-section');
  const canvasContainer = document.getElementById('webgl-canvas-container');
  const storyCardsContainer = document.getElementById('story-cards-container');
  const footerEl = document.querySelector('.betternak-footer');
  if (!galPin || !galTrack) return;

  const rect = galPin.getBoundingClientRect();
  const totalPinDist = galPin.offsetHeight - window.innerHeight;
  
  // Progress through horizontal gallery section (0 to 1)
  const galProgress = Math.max(0, Math.min(1, -rect.top / Math.max(1, totalPinDist)));

  // Total horizontal travel needed so all cards scroll smoothly
  const maxTranslate = Math.max(0, galTrack.scrollWidth - window.innerWidth);
  galTrack.style.transform = `translateX(${-galProgress * maxTranslate}px)`;

  // Dynamic entrance animation for unique gallery typography (no boxes)
  document.querySelectorAll('.gallery-kinetic-text').forEach((el) => {
    const r = el.getBoundingClientRect();
    const inView = (r.left < window.innerWidth * 0.90 && r.right > window.innerWidth * 0.06);
    el.classList.toggle('in-view', inView);
  });

  // Dynamic smooth transition of gallery background:
  // Starts at 0 (100% dark cinema, identical to previous section)
  // Cross-fades smoothly into #f8fafc (pure light ivory) matching #smart-control-section!
  const galBgLight = document.getElementById('gallery-bg-light');
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
  const fRect = footerEl ? footerEl.getBoundingClientRect() : null;

  // Fade out story cards completely as user reaches the gallery
  if (storyCardsContainer) {
    if (rect.top < window.innerHeight * 0.55) {
      const cardFade = Math.max(0, Math.min(1, (rect.top - window.innerHeight * 0.10) / (window.innerHeight * 0.45)));
      storyCardsContainer.style.opacity = cardFade.toFixed(3);
      storyCardsContainer.style.pointerEvents = cardFade > 0.1 ? 'auto' : 'none';
    } else {
      storyCardsContainer.style.opacity = '1';
      storyCardsContainer.style.pointerEvents = 'auto';
    }
  }

  // Determine active view mode
  const inGallery = (rect.top < window.innerHeight * 0.25) && (rect.bottom > window.innerHeight * 0.35);
  const inSmart = sRect && (sRect.top < window.innerHeight * 0.65) && (!fRect || fRect.top > window.innerHeight * 0.35);
  const inFooter = fRect && (fRect.top <= window.innerHeight * 0.35);

  isInSmartSection = inSmart;

  // Smooth Canvas Opacity Transition - stays fully active during Chapter 3 360 inspection!
  if (canvasContainer) {
    if (inFooter) {
      canvasContainer.style.opacity = '0';
      canvasContainer.style.pointerEvents = 'none';
    } else if (inSmart) {
      if (sRect) {
        const smartFadeIn = Math.max(0, Math.min(1, (window.innerHeight * 0.85 - sRect.top) / (window.innerHeight * 0.45)));
        canvasContainer.style.opacity = smartFadeIn.toFixed(3);
        canvasContainer.style.pointerEvents = smartFadeIn > 0.4 ? 'auto' : 'none';
      } else {
        canvasContainer.style.opacity = '1';
        canvasContainer.style.pointerEvents = 'auto';
      }
    } else if (inGallery) {
      canvasContainer.style.opacity = '0';
      canvasContainer.style.pointerEvents = 'none';
    } else if (rect.top < window.innerHeight * 0.50) {
      // Gentle fade out dissolving into the gallery only after 360 rotation is complete
      const fade = Math.max(0, Math.min(1, (rect.top - window.innerHeight * 0.05) / (window.innerHeight * 0.45)));
      canvasContainer.style.opacity = fade.toFixed(3);
      canvasContainer.style.pointerEvents = fade < 0.1 ? 'none' : 'auto';
    } else {
      canvasContainer.style.opacity = '1';
      canvasContainer.style.pointerEvents = 'auto';
    }
  }

  // Highlight Gallery Chapter Dot (index 4) or Smart Section (index 5)
  if (inSmart) {
    document.querySelectorAll('.chapter-dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === 5);
    });
  } else if (inGallery || (rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.2)) {
    document.querySelectorAll('.chapter-dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === 4);
    });
  }
}

function updateScrollProgress() {
  restoreCameraFromScroll();
  const storyTrack = document.getElementById('story-scroll-track');
  if (storyTrack) {
    const maxStoryScroll = storyTrack.offsetHeight - window.innerHeight;
    targetScroll = maxStoryScroll > 0 ? Math.max(0, Math.min(1, window.scrollY / maxStoryScroll)) : 0;
  }
  updateGalleryScroll();
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

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

// Sticky Story Cards & Dots Active Chapter Controller
const ALL_STORY_CARDS = ['card-0', 'card-1', 'card-2', 'card-anti', 'card-3'];
let currentActiveCardId = null;

function updateActiveStoryCard(cardId) {
  if (currentActiveCardId === cardId) return;
  currentActiveCardId = cardId;

  const storyContainer = document.getElementById('story-cards-container');
  if (storyContainer) {
    storyContainer.classList.toggle('hidden', cardId === null);
  }

  ALL_STORY_CARDS.forEach((id) => {
    const card = document.getElementById(id);
    if (card) {
      card.classList.toggle('active', id === cardId);
    }
  });

  // Map to dots 0-3
  let dotIdx = -1;
  if (cardId === 'card-0') dotIdx = 0;
  else if (cardId === 'card-1') dotIdx = 1;
  else if (cardId === 'card-2' || cardId === 'card-anti') dotIdx = 2;
  else if (cardId === 'card-3') dotIdx = 3;

  const galPin = document.getElementById('gallery-pin-container');
  const inGalleryOrBeyond = galPin && galPin.getBoundingClientRect().top < window.innerHeight * 0.7;
  if (!inGalleryOrBeyond && !isInSmartSection) {
    document.querySelectorAll('.chapter-dot').forEach((dot) => {
      const dIdx = parseInt(dot.dataset.chapter, 10);
      dot.classList.toggle('active', dIdx === dotIdx);
    });
  }
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
  // 2: Exploded Anatomy Arrives at Far Distance (Zoom out & shift left)
  { scroll: 0.22, modelX: -2.0, modelY: 0.0, camX: -3.8, camY: 3.0, camZ: 21.5, targetX: -2.0, targetY: 2.2, targetZ: 0.0 },
  // 3: Exploded Anatomy STAYS AT FAR DISTANCE (Gentle, slow rotation)
  { scroll: 0.36, modelX: -2.0, modelY: 0.0, camX: -3.8, camY: 3.0, camZ: 21.5, targetX: -2.0, targetY: 2.2, targetZ: 0.0 },
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
    dimTickTop.setAttribute('x1', topX - 18 * dimAnimProgress);
    dimTickTop.setAttribute('y1', topY);
    dimTickTop.setAttribute('x2', topX + 24 * dimAnimProgress);
    dimTickTop.setAttribute('y2', topY);
    dimTickTop.style.opacity = `${Math.min(1.0, dimAnimProgress * 2)}`;
  }
  if (dimTickBottom) {
    const bottomTickFade = Math.max(0, (dimAnimProgress - 0.6) / 0.4);
    dimTickBottom.setAttribute('x1', currentBotX - 18 * bottomTickFade);
    dimTickBottom.setAttribute('y1', currentBotY);
    dimTickBottom.setAttribute('x2', currentBotX + 24 * bottomTickFade);
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
  if (dimLabel) {
    const midX = (topX + currentBotX) / 2;
    const midY = (topY + currentBotY) / 2;
    const badgeFade = Math.max(0, (dimAnimProgress - 0.15) / 0.85);
    dimLabel.style.left = `${midX + 22}px`;
    dimLabel.style.top = `${midY}px`;
    dimLabel.style.opacity = `${badgeFade}`;
    dimLabel.style.transform = `translate(0, -50%) scale(${0.80 + 0.20 * badgeFade})`;

    const weightNumEl = document.getElementById('dim-weight-num');
    if (weightNumEl) {
      weightNumEl.textContent = (dimAnimProgress * 10.0).toFixed(1);
    }
  }
}


// 5. ANIMATION & TIMELINE TICK
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Luxurious, velvety smooth inertia (slower and silky smooth)
  smoothScroll += (targetScroll - smoothScroll) * 0.058;
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
  } else if (smoothScroll >= 0.87 && smoothScroll < 0.995) {
    // Modular Legs (Fase DOC hingga Dewasa - Slow gentle inspection)
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
      updatePelletCascade(delta, false);
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

  controls.update();
  renderer.render(scene, camera);
}
animate();

// 6. INTERACTIVE BUTTON & DOT HANDLERS
function scrollToProgress(p) {
  const storyTrack = document.getElementById('story-scroll-track');
  if (storyTrack) {
    const maxStoryScroll = storyTrack.offsetHeight - window.innerHeight;
    window.scrollTo({ top: maxStoryScroll * p, behavior: 'smooth' });
  }
}

// Chapter dots click navigation (Dots 0-3: 3D hardware, Dot 4: Gallery, Dot 5: Smart IoT Section)
document.querySelectorAll('.chapter-dot').forEach((dot) => {
  dot.addEventListener('click', () => {
    const cIdx = parseInt(dot.dataset.chapter, 10);
    if (cIdx === 4) {
      document.getElementById('gallery-pin-container')?.scrollIntoView({ behavior: 'smooth' });
    } else if (cIdx === 5) {
      document.getElementById('smart-control-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      const targets = [0.05, 0.28, 0.52, 0.94];
      scrollToProgress(targets[cIdx] || 0.0);
    }
  });
});

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

  companionRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  companionRenderer.setSize(width, height);
  companionRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

  // Animate companion model
  function animateCompanion() {
    requestAnimationFrame(animateCompanion);
    companionControls.update();
    if (isCompanionSpinning && companionPiring) {
      companionPiring.rotation.y += 0.22;
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
