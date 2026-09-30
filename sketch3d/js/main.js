import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import {
  registerThree,
  createFloorOrCeilingTexture,
  createDiamondFloorTexture,
  createWallTexture,
  createPillarTexture,
  createElevatorInteriorTexture,
  createSignTexture,
  createBlameJohnTexture,
  createCharacterTexture,
  createCounterTexture,
} from './textures.js';

registerThree(THREE);

// Make sure the hand-lettered font is actually loaded before we bake it onto
// canvas textures below — otherwise the "1" sign and wall text get drawn
// with a generic fallback font and never redraw once the real font arrives.
try {
  await Promise.all([
    document.fonts.load('64px "Permanent Marker"'),
    document.fonts.load('700 48px "Caveat"'),
  ]);
} catch (e) { /* fonts are cosmetic; carry on with fallbacks */ }

const ROOM_HEIGHT = 5;
const INK = 0x1c1a14;
// Deliberately a shade further from the wall texture's paper tone (#f4efe2)
// than a matching cream would be — otherwise a wall filling the view at
// close range is nearly indistinguishable from the empty background behind it.
const PAPER_BG = 0xe4dcc4;

// --- Floor plan (axis-aligned rectangles the player can stand in) ---------
// These exact rectangles are what the walls/floors/ceilings below are built
// from, so the connecting doorway/opening between two rectangles lands on a
// single shared coordinate with no visual overlap or gap.
const REGIONS = [
  { xMin: -2.8, xMax: 2.8, zMin: -13.6, zMax: 2.4 },   // main corridor
  { xMin: -1.3, xMax: 1.3, zMin: -16.8, zMax: -13.6 }, // elevator alcove
  { xMin: 2.6, xMax: 8.6, zMin: -7.8, zMax: -1.0 },    // side room ("Blame John")
];

// Collision uses its own, separately-padded copies of those rectangles: an
// inward margin keeps the camera from poking through a wall, but shrinking
// every side by that margin would pinch a solid dead zone shut at a shared
// doorway (both sides losing ground at the exact same coordinate). So each
// region here is also grown outward at the sides that are actually openings
// into a neighboring region, well past twice the margin, guaranteeing the
// shrunk collision volumes still overlap where the player should walk through.
const COLLISION_MARGIN = 0.3;
const COLLISION_REGIONS = [
  { xMin: -2.8, xMax: 2.8, zMin: -13.6, zMax: 2.4 },        // main corridor
  { xMin: -1.3, xMax: 1.3, zMin: -16.8, zMax: -12.6 },      // alcove, extended toward corridor
  { xMin: 1.6, xMax: 8.6, zMin: -7.8, zMax: -1.0 },         // side room, extended toward corridor
].map(r => ({
  xMin: r.xMin + COLLISION_MARGIN,
  xMax: r.xMax - COLLISION_MARGIN,
  zMin: r.zMin + COLLISION_MARGIN,
  zMax: r.zMax - COLLISION_MARGIN,
}));

function insideAnyRegion(x, z) {
  return COLLISION_REGIONS.some(r => x > r.xMin && x < r.xMax && z > r.zMin && z < r.zMax);
}

// --- Renderer / scene / camera --------------------------------------------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(PAPER_BG);
scene.fog = new THREE.Fog(PAPER_BG, 10, 26);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
camera.position.set(0, 1.7, 1.6);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Hand-drawn outline helper ---------------------------------------------
// Cheap, well-known "inverted hull" outline: a slightly enlarged backface-only
// copy of the mesh, rendered in ink. A tiny per-vertex wobble driven by time
// gives the animated hand-drawn wiggle you see in sketch/pencil-test art.
const outlineMaterials = [];
function addOutline(mesh, thickness = 0.02) {
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, thickness: { value: thickness } },
    vertexShader: `
      uniform float time;
      uniform float thickness;
      void main() {
        float wobble = sin(time * 1.6 + position.x * 3.0 + position.y * 2.0 + position.z * 2.5) * 0.35;
        vec3 newPosition = position + normal * thickness * (1.0 + wobble);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
    fragmentShader: `
      void main() { gl_FragColor = vec4(0.110, 0.102, 0.078, 1.0); }
    `,
    side: THREE.BackSide,
  });
  outlineMaterials.push(material);
  const outline = new THREE.Mesh(mesh.geometry, material);
  mesh.add(outline);
  return outline;
}

function basicMat(texture) {
  return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
}

// --- Generic wall builder ---------------------------------------------------
// A vertical rectangular panel between two ground points (x1,z1)-(x2,z2).
function addWallSegment(x1, z1, x2, z2, yBottom, yTop, texture, outline = true) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const width = Math.hypot(dx, dz);
  const height = yTop - yBottom;
  const geo = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geo, basicMat(texture));
  mesh.position.set((x1 + x2) / 2, yBottom + height / 2, (z1 + z2) / 2);
  mesh.rotation.y = Math.atan2(-dz, dx);
  scene.add(mesh);
  if (outline) addOutline(mesh, 0.015);
  return mesh;
}

function addFloor(rect, texture, y = 0) {
  const w = rect.xMax - rect.xMin;
  const d = rect.zMax - rect.zMin;
  const geo = new THREE.PlaneGeometry(w, d);
  const mesh = new THREE.Mesh(geo, basicMat(texture));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set((rect.xMin + rect.xMax) / 2, y, (rect.zMin + rect.zMax) / 2);
  scene.add(mesh);
  return mesh;
}

function addCeiling(rect, texture, y = ROOM_HEIGHT) {
  const w = rect.xMax - rect.xMin;
  const d = rect.zMax - rect.zMin;
  const geo = new THREE.PlaneGeometry(w, d);
  const mesh = new THREE.Mesh(geo, basicMat(texture));
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set((rect.xMin + rect.xMax) / 2, y, (rect.zMin + rect.zMax) / 2);
  scene.add(mesh);
  return mesh;
}

// --- Textures ---------------------------------------------------------------
const corridorFloorTex = createFloorOrCeilingTexture({ focus: [0.5, 0.86] });
const corridorCeilingTex = createFloorOrCeilingTexture({ focus: [0.5, 0.14] });
const alcoveFloorTex = createDiamondFloorTexture();
const plainWallTex = createWallTexture({ scribbles: 3 });
const sideWallTex = createWallTexture({ scribbles: 6 });
const pillarTex = createPillarTexture();
const elevatorInteriorTex = createElevatorInteriorTexture();
const signTex = createSignTexture({ label: '1' });
const blameJohnTex = createBlameJohnTexture();
const characterTex = createCharacterTexture();
const counterTex = createCounterTexture();
[corridorFloorTex, corridorCeilingTex, alcoveFloorTex, plainWallTex, sideWallTex].forEach(t => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
});

// --- Build the corridor ------------------------------------------------------
const corridor = REGIONS[0];
const alcove = REGIONS[1];
const sideRoom = REGIONS[2];

addFloor(corridor, corridorFloorTex);
addCeiling(corridor, corridorCeilingTex);
addFloor(alcove, alcoveFloorTex, 0.02);
addCeiling(alcove, corridorCeilingTex);
addFloor(sideRoom, plainWallTex);
addCeiling(sideRoom, corridorCeilingTex);

// Corridor left wall (full length)
addWallSegment(corridor.xMin, corridor.zMin, corridor.xMin, corridor.zMax, 0, ROOM_HEIGHT, plainWallTex);

// Corridor right wall, split around the side-room opening
addWallSegment(corridor.xMax, corridor.zMin, corridor.xMax, sideRoom.zMin, 0, ROOM_HEIGHT, plainWallTex);
addWallSegment(corridor.xMax, sideRoom.zMax, corridor.xMax, corridor.zMax, 0, ROOM_HEIGHT, plainWallTex);

// Back wall with the elevator doorway cut out, plus header ("1" sign) above it
addWallSegment(corridor.xMin, alcove.zMax, alcove.xMin, alcove.zMax, 0, ROOM_HEIGHT, plainWallTex);
addWallSegment(alcove.xMax, alcove.zMax, corridor.xMax, alcove.zMax, 0, ROOM_HEIGHT, plainWallTex);
addWallSegment(alcove.xMin, alcove.zMax, alcove.xMax, alcove.zMax, 3.0, ROOM_HEIGHT, plainWallTex);

// Elevator sign above the doorway. Placed on the corridor side of the header
// wall (not behind it) — an opaque wall in front would otherwise hide it
// completely from the approaching player.
{
  const geo = new THREE.PlaneGeometry(1.0, 0.5);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide }));
  mesh.position.set(0, 3.55, alcove.zMax + 0.05);
  scene.add(mesh);
  addOutline(mesh, 0.01);
}

// Dark kick-pillars flanking the doorway, like in the reference sketch —
// standing just inside the corridor, in front of the door frame.
function addPillar(x) {
  const geo = new THREE.BoxGeometry(0.5, 1.2, 0.4);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: pillarTex }));
  mesh.position.set(x, 0.6, alcove.zMax + 0.25);
  scene.add(mesh);
  addOutline(mesh, 0.015);
}
addPillar(-1.8);
addPillar(1.8);

// Alcove walls + back (elevator interior)
addWallSegment(alcove.xMin, alcove.zMax, alcove.xMin, alcove.zMin, 0, ROOM_HEIGHT, elevatorInteriorTex);
addWallSegment(alcove.xMax, alcove.zMin, alcove.xMax, alcove.zMax, 0, ROOM_HEIGHT, elevatorInteriorTex);
addWallSegment(alcove.xMin, alcove.zMin, alcove.xMax, alcove.zMin, 0, ROOM_HEIGHT, elevatorInteriorTex);

// Side room walls ("Blame John" room)
addWallSegment(sideRoom.xMax, sideRoom.zMin, sideRoom.xMax, sideRoom.zMax, 0, ROOM_HEIGHT, blameJohnTex);
addWallSegment(sideRoom.xMin, sideRoom.zMin, sideRoom.xMax, sideRoom.zMin, 0, ROOM_HEIGHT, sideWallTex);
addWallSegment(sideRoom.xMax, sideRoom.zMax, sideRoom.xMin, sideRoom.zMax, 0, ROOM_HEIGHT, sideWallTex);

// Low counter the character stands behind
{
  const geo = new THREE.BoxGeometry(3.2, 1.1, 0.5);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: counterTex }));
  mesh.position.set(sideRoom.xMin + 1.8, 0.55, -4.6);
  scene.add(mesh);
  addOutline(mesh, 0.015);
}

// The character: a flat hand-drawn cut-out that always faces the player,
// exactly the "2D drawing standing inside a 3D space" effect that was asked for.
const character = new THREE.Mesh(
  new THREE.PlaneGeometry(1.4, 2.8),
  new THREE.MeshBasicMaterial({ map: characterTex, transparent: true, side: THREE.DoubleSide })
);
character.position.set(sideRoom.xMin + 2.0, 1.4, -4.9);
scene.add(character);

// Speech bubble trigger near the character
const speechEl = document.getElementById('speech');
const speechWorldPos = character.position.clone().add(new THREE.Vector3(0, 1.7, 0));
const speechProjected = new THREE.Vector3();
let nearCharacter = false;

// --- Player controls ---------------------------------------------------------
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

const overlay = document.getElementById('overlay');
const blocked = document.getElementById('blocked');

canvas.addEventListener('click', () => controls.lock());
controls.addEventListener('lock', () => {
  overlay.classList.add('hidden');
  blocked.classList.add('hidden');
});
controls.addEventListener('unlock', () => {
  blocked.classList.remove('hidden');
});

const keys = { forward: false, back: false, left: false, right: false };
window.addEventListener('keydown', (e) => setKey(e.code, true));
window.addEventListener('keyup', (e) => setKey(e.code, false));
function setKey(code, value) {
  switch (code) {
    case 'KeyW': case 'ArrowUp': keys.forward = value; break;
    case 'KeyS': case 'ArrowDown': keys.back = value; break;
    case 'KeyA': case 'ArrowLeft': keys.left = value; break;
    case 'KeyD': case 'ArrowRight': keys.right = value; break;
  }
}

const velocity = new THREE.Vector3();
const MOVE_SPEED = 4.2;
const DAMPING = 8;

// Pure horizontal right/forward vectors derived from the camera's own matrix
// (column 0 is already pitch-independent), computed by hand instead of
// relying on PointerLockControls' moveRight/moveForward — those mutate
// position.x and position.z together in one call each, which makes a clean
// per-axis collision rollback impossible to get right afterwards.
const rightVec = new THREE.Vector3();
const forwardVec = new THREE.Vector3();
function getPlanarAxes(camera) {
  rightVec.setFromMatrixColumn(camera.matrix, 0);
  rightVec.y = 0;
  rightVec.normalize();
  forwardVec.crossVectors(camera.up, rightVec);
  return { right: rightVec, forward: forwardVec };
}

// --- Animation loop -----------------------------------------------------------
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  outlineMaterials.forEach(m => { m.uniforms.time.value = t; });

  if (controls.isLocked) {
    velocity.x -= velocity.x * DAMPING * dt;
    velocity.z -= velocity.z * DAMPING * dt;

    const inputX = Number(keys.right) - Number(keys.left);
    const inputZ = Number(keys.forward) - Number(keys.back);
    const len = Math.hypot(inputX, inputZ) || 1;

    velocity.x += (inputX / len) * MOVE_SPEED * dt * 10;
    velocity.z += (inputZ / len) * MOVE_SPEED * dt * 10;

    const object = controls.getObject();
    const { right, forward } = getPlanarAxes(camera);
    const deltaX = (right.x * velocity.x + forward.x * velocity.z) * dt;
    const deltaZ = (right.z * velocity.x + forward.z * velocity.z) * dt;

    // Slide-friendly collision: resolve one world axis at a time so walking
    // into a wall at an angle slides along it instead of stopping dead, and
    // so a diagonal move can never land somewhere neither axis check saw.
    const triedX = object.position.x + deltaX;
    if (insideAnyRegion(triedX, object.position.z)) object.position.x = triedX;

    const triedZ = object.position.z + deltaZ;
    if (insideAnyRegion(object.position.x, triedZ)) object.position.z = triedZ;

    // Subtle head bob for a hand-made, slightly wobbly walk feel.
    const moving = inputX !== 0 || inputZ !== 0;
    if (moving) {
      camera.position.y = 1.7 + Math.sin(t * 8) * 0.03;
    } else {
      camera.position.y += (1.7 - camera.position.y) * Math.min(1, dt * 6);
    }
  }

  character.quaternion.copy(camera.quaternion);

  const dist = camera.position.distanceTo(character.position);
  nearCharacter = dist < 3.2;
  if (nearCharacter) {
    speechProjected.copy(speechWorldPos).project(camera);
    const x = (speechProjected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-speechProjected.y * 0.5 + 0.5) * window.innerHeight;
    const onScreen = speechProjected.z < 1;
    if (onScreen) {
      speechEl.textContent = 'Ne me demande pas, c’est John.';
      speechEl.style.left = `${x}px`;
      speechEl.style.top = `${y}px`;
      speechEl.classList.remove('hidden');
    } else {
      speechEl.classList.add('hidden');
    }
  } else {
    speechEl.classList.add('hidden');
  }

  renderer.render(scene, camera);
}
animate();
