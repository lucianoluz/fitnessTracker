// Feature 1 (3D): rotatable low-poly body. Loads the GLB base mesh, lets the
// user drag to orbit 360°, and maps a tap on the body to a muscle group, which
// opens the shared exercise panel (window.Panel).
//
// The model is a single mesh, so muscles are detected by SPATIAL ZONES: each
// vertex is assigned a muscle group from its normalized position, and a tap is
// resolved by the zone of the point that was hit. Selecting a muscle tints that
// zone via vertex colors.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../vendor/three/jsm/controls/OrbitControls.js';

const MODEL_URL = './assets/male-base-mesh.glb';

// +1 if the model faces +Z (chest toward +Z), -1 otherwise. Confirmed visually.
const FRONT_Z = 1;

const BASE_COLOR = new THREE.Color(0x9aa4b2);     // unselected body
const HILITE_COLOR = new THREE.Color(0x1f6feb);   // selected muscle zone
// Distinct colors for the debug/calibration overlay.
const ZONE_DEBUG = {
  core: 0xf0883e, chest: 0x3fb950, shoulders: 0xdb61a2, biceps: 0x58a6ff,
  triceps: 0xa371f7, back: 0xe3b341, legs: 0xff7b72, calves: 0x39c5cf,
  neutral: 0x444c56,
};

const container = document.getElementById('model-container');
const loadingEl = document.getElementById('model-loading');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Lighting tuned for a clean low-poly read.
scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x0d1117, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 1.4);
key.position.set(0.6, 1.0, 1.2);
scene.add(key);
const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
rim.position.set(-0.8, 0.4, -1.0);
scene.add(rim);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.9;
controls.minDistance = 1.4;
controls.maxDistance = 5;
controls.target.set(0, 0, 0);

let mesh = null;          // the body mesh
let modelRoot = null;     // the placed gltf scene root
let zonePerVertex = null; // Uint8-ish array of zone keys per vertex index
let worldBox = null;      // THREE.Box3 of the final placed model

function sizeToContainer() {
  const w = container.clientWidth || 1;
  const h = container.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// --- Muscle zone from a normalized position -------------------------------
// nx,nz ∈ [-1,1] (centered), hy ∈ [0,1] (0 = feet, 1 = head). Tuned visually.
function zoneFor(nx, hy, nz) {
  const ax = Math.abs(nx);
  const front = nz * FRONT_Z >= 0;
  if (hy > 0.90) return 'neutral';           // head
  if (ax > 0.52) {                            // arms (outer)
    if (hy > 0.74) return 'shoulders';        // deltoid
    if (hy > 0.46) return front ? 'biceps' : 'triceps';
    return 'neutral';                         // hands
  }
  if (hy > 0.82) return 'shoulders';          // traps / shoulder line
  if (hy > 0.62) return front ? 'chest' : 'back';
  if (hy > 0.49) return front ? 'core' : 'back';
  if (hy > 0.44) return 'neutral';            // pelvis
  if (hy > 0.20) return 'legs';               // thighs
  if (hy > 0.05) return 'calves';
  return 'neutral';                           // feet
}

function canonical(p) {
  const min = worldBox.min, max = worldBox.max;
  const hy = (p.y - min.y) / (max.y - min.y);
  const nx = (p.x - (min.x + max.x) / 2) / ((max.x - min.x) / 2);
  const nz = (p.z - (min.z + max.z) / 2) / ((max.z - min.z) / 2);
  return { nx, hy, nz };
}

// --- Vertex colour helpers ------------------------------------------------
function paintBase() {
  const colors = mesh.geometry.getAttribute('color');
  for (let i = 0; i < colors.count; i++) {
    colors.setXYZ(i, BASE_COLOR.r, BASE_COLOR.g, BASE_COLOR.b);
  }
  colors.needsUpdate = true;
}

function paintSelection(muscle) {
  const colors = mesh.geometry.getAttribute('color');
  for (let i = 0; i < colors.count; i++) {
    const c = zonePerVertex[i] === muscle ? HILITE_COLOR : BASE_COLOR;
    colors.setXYZ(i, c.r, c.g, c.b);
  }
  colors.needsUpdate = true;
}

function paintDebug() {
  const colors = mesh.geometry.getAttribute('color');
  const tmp = new THREE.Color();
  for (let i = 0; i < colors.count; i++) {
    tmp.setHex(ZONE_DEBUG[zonePerVertex[i]] || 0x444c56);
    colors.setXYZ(i, tmp.r, tmp.g, tmp.b);
  }
  colors.needsUpdate = true;
}

// --- Load + place the model ----------------------------------------------
function setupModel(root) {
  // Upright + center + scale to a consistent height.
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3(); box.getSize(size);
  const scale = 1.7 / size.y;
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3(); box.getCenter(center);
  root.position.sub(center);
  root.updateMatrixWorld(true);
  worldBox = new THREE.Box3().setFromObject(root);
  modelRoot = root;
  scene.add(root);

  root.traverse((o) => { if (o.isMesh && !mesh) mesh = o; });

  // Give the mesh a vertex-colour standard material with a faceted look.
  const geom = mesh.geometry;
  const pos = geom.getAttribute('position');
  geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
  mesh.material = new THREE.MeshStandardMaterial({
    vertexColors: true, color: 0xffffff, roughness: 0.92, metalness: 0.0,
    flatShading: true,
  });

  // Bake the muscle zone for every vertex (in world/canonical space).
  zonePerVertex = new Array(pos.count);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
    const { nx, hy, nz } = canonical(v);
    zonePerVertex[i] = zoneFor(nx, hy, nz);
  }
  paintBase();

  // Frame the camera.
  controls.target.copy(worldBox.getCenter(new THREE.Vector3()));
  camera.position.set(0, controls.target.y * 0 + 0.05, 3.0);
  controls.update();
}

// --- Tap → muscle ---------------------------------------------------------
const raycaster = new THREE.Raycaster();
let selected = null;

function selectMuscle(muscle) {
  if (!muscle || muscle === 'neutral') return;
  selected = muscle;
  paintSelection(muscle);
  Panel.open(muscle);
}

function clearSelection() {
  selected = null;
  paintBase();
}

function pickAt(clientX, clientY) {
  if (!mesh) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(mesh, true);
  if (!hits.length) return;
  const { nx, hy, nz } = canonical(hits[0].point);
  const muscle = zoneFor(nx, hy, nz);
  if (muscle === 'neutral') return;
  selectMuscle(muscle);
}

// Distinguish a tap (select) from a drag (rotate).
let down = null;
renderer.domElement.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  const dt = performance.now() - down.t;
  if (moved < 8 && dt < 500) pickAt(e.clientX, e.clientY);
  down = null;
});

Panel.onClose(() => clearSelection());

// --- Render loop ----------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', sizeToContainer);
if (window.ResizeObserver) new ResizeObserver(sizeToContainer).observe(container);

sizeToContainer();
animate();

new GLTFLoader().load(
  MODEL_URL,
  (gltf) => {
    setupModel(gltf.scene);
    sizeToContainer();
    if (loadingEl) loadingEl.hidden = true;
    window.__modelReady = true;
  },
  undefined,
  (err) => {
    if (loadingEl) loadingEl.textContent = 'Could not load the 3D model.';
    console.error('Model load failed', err);
  },
);

// Test/diagnostic hooks (used by the headless verification script).
window.__viewer = {
  rotateTo(deg) { if (modelRoot) { modelRoot.rotation.y = THREE.MathUtils.degToRad(deg); } },
  debug(on) { if (!mesh) return; on ? paintDebug() : (selected ? paintSelection(selected) : paintBase()); },
  pickNDC(x, y) {
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const hits = raycaster.intersectObject(mesh, true);
    if (!hits.length) return null;
    const { nx, hy, nz } = canonical(hits[0].point);
    const m = zoneFor(nx, hy, nz);
    if (m !== 'neutral') selectMuscle(m);
    return m;
  },
  zonesAtHeights() {
    // Sample the zone label down the vertical centre line (debug aid).
    const out = {};
    for (let h = 0; h <= 10; h++) out[h / 10] = zoneFor(0.0, h / 10, FRONT_Z);
    return out;
  },
};
