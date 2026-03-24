import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

await RAPIER.init();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x120a1f);
scene.fog = new THREE.Fog(0x120a1f, 50, 220);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

const hud = document.createElement("div");
hud.style.position = "fixed";
hud.style.top = "16px";
hud.style.left = "16px";
hud.style.color = "#f8f4ff";
hud.style.fontFamily = "Arial, sans-serif";
hud.style.fontSize = "18px";
hud.style.lineHeight = "1.45";
hud.style.textShadow = "0 2px 12px rgba(0,0,0,0.45)";
hud.style.zIndex = "10";
document.body.appendChild(hud);

const hint = document.createElement("div");
hint.style.position = "fixed";
hint.style.top = "16px";
hint.style.right = "16px";
hint.style.maxWidth = "320px";
hint.style.color = "#d9cfff";
hint.style.fontFamily = "Arial, sans-serif";
hint.style.fontSize = "14px";
hint.style.lineHeight = "1.4";
hint.style.textAlign = "right";
hint.style.textShadow = "0 2px 12px rgba(0,0,0,0.45)";
hint.style.zIndex = "10";
hint.innerHTML = "Physics tutorial lane:<br>Drop onto blue ramp<br>Land center<br>Move right to pink ramp<br>Reach green finish";
document.body.appendChild(hint);

const joystickBase = document.createElement("div");
joystickBase.style.position = "fixed";
joystickBase.style.left = "24px";
joystickBase.style.bottom = "24px";
joystickBase.style.width = "120px";
joystickBase.style.height = "120px";
joystickBase.style.borderRadius = "50%";
joystickBase.style.background = "rgba(255,255,255,0.08)";
joystickBase.style.border = "1px solid rgba(255,255,255,0.18)";
joystickBase.style.backdropFilter = "blur(4px)";
joystickBase.style.touchAction = "none";
joystickBase.style.zIndex = "20";
document.body.appendChild(joystickBase);

const joystickKnob = document.createElement("div");
joystickKnob.style.position = "absolute";
joystickKnob.style.left = "35px";
joystickKnob.style.top = "35px";
joystickKnob.style.width = "50px";
joystickKnob.style.height = "50px";
joystickKnob.style.borderRadius = "50%";
joystickKnob.style.background = "rgba(255,255,255,0.28)";
joystickKnob.style.border = "1px solid rgba(255,255,255,0.35)";
joystickBase.appendChild(joystickKnob);

scene.add(new THREE.AmbientLight(0xffffff, 0.72));
const sunLight = new THREE.DirectionalLight(0xffffff, 1.15);
sunLight.position.set(12, 18, 8);
scene.add(sunLight);

const fillLight = new THREE.PointLight(0x8844ff, 20, 100);
fillLight.position.set(0, 12, -8);
scene.add(fillLight);

const worldVisuals = new THREE.Group();
scene.add(worldVisuals);

const physicsWorld = new RAPIER.World({ x: 0, y: -18, z: 0 });

const playerRadius = 0.6;
const finishZ = 96;
const resetPosition = { x: -2.5, y: 7.0, z: -28 };
const laneHalfWidth = 8;

const playerMesh = new THREE.Mesh(
  new THREE.SphereGeometry(playerRadius, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xffef7a,
    emissive: 0x665000,
    metalness: 0.24,
    roughness: 0.34,
  })
);
scene.add(playerMesh);

const trail = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.16, 3.2, 12),
  new THREE.MeshBasicMaterial({ color: 0xffd95a, transparent: true, opacity: 0.28 })
);
trail.rotation.x = Math.PI / 2;
scene.add(trail);

const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x4d356f, roughness: 0.86, metalness: 0.04 });
const leftRampMaterial = new THREE.MeshStandardMaterial({ color: 0x35d0ff, emissive: 0x0b2230, roughness: 0.55 });
const rightRampMaterial = new THREE.MeshStandardMaterial({ color: 0xff58d2, emissive: 0x321126, roughness: 0.55 });
const finishMaterial = new THREE.MeshStandardMaterial({ color: 0x9cff7a, emissive: 0x1d3312, roughness: 0.55 });
const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x9578e7, emissive: 0x241637, roughness: 0.6 });

function addRigidBox(width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  worldVisuals.add(mesh);

  const body = physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z));
  const collider = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2);
  physicsWorld.createCollider(collider, body);
}

function addGuide(x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 4), markerMaterial);
  mesh.position.set(x, y + 0.22, z);
  worldVisuals.add(mesh);
}

function addRamp(side, z, width, length, topY, bottomY) {
  const height = topY - bottomY;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  geometry.rotateY(Math.PI);

  const isLeft = side === "left";
  const mesh = new THREE.Mesh(geometry, isLeft ? leftRampMaterial : rightRampMaterial);
  if (isLeft) {
    mesh.scale.x = -1;
    mesh.position.set(0, bottomY, z - length / 2);
  } else {
    mesh.position.set(0, bottomY, z + length / 2);
  }
  worldVisuals.add(mesh);

  const body = physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfLength = length / 2;
  const slopeLength = Math.sqrt(width * width + height * height);
  const angle = Math.atan2(height, width);

  const centerX = isLeft ? -halfWidth : halfWidth;
  const centerY = bottomY + halfHeight;

  body.setTranslation({ x: centerX, y: centerY, z }, true);
  const rotation = isLeft
    ? new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, angle))
    : new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -angle));
  body.setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w }, true);

  const collider = RAPIER.ColliderDesc.cuboid(slopeLength / 2, 0.25, halfLength)
    .setRestitution(0)
    .setFriction(0.2);
  physicsWorld.createCollider(collider, body);
}

addRigidBox(12, 0.8, 12, 0, 5.2, -28, floorMaterial);
addRamp("left", 6, 8, 28, 2.4, 0.2);
addRigidBox(10, 0.8, 10, 0, 0.2, 34, floorMaterial);
addRamp("right", 62, 8, 24, 1.6, 0.2);
addRigidBox(14, 0.8, 12, 0, 0.2, finishZ, finishMaterial);

for (let z = -20; z <= finishZ; z += 10) {
  addGuide(-laneHalfWidth, 0, z);
  addGuide(laneHalfWidth, 0, z);
}

const playerBody = physicsWorld.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(resetPosition.x, resetPosition.y, resetPosition.z)
    .setLinearDamping(0.15)
    .setAngularDamping(0.6)
    .setCanSleep(false)
);
physicsWorld.createCollider(
  RAPIER.ColliderDesc.ball(playerRadius)
    .setRestitution(0)
    .setFriction(0.3),
  playerBody
);

const keyboard = { left: false, right: false };
const input = { x: 0 };

window.addEventListener("keydown", (event) => {
  if (event.key === "a" || event.key === "ArrowLeft") keyboard.left = true;
  if (event.key === "d" || event.key === "ArrowRight") keyboard.right = true;
  if (event.key === "r") resetPlayer();
});

window.addEventListener("keyup", (event) => {
  if (event.key === "a" || event.key === "ArrowLeft") keyboard.left = false;
  if (event.key === "d" || event.key === "ArrowRight") keyboard.right = false;
});

let pointerActive = false;
const knobCenter = { x: 60, y: 60 };
const knobRadius = 40;

function updateJoystick(clientX, clientY) {
  const rect = joystickBase.getBoundingClientRect();
  let dx = clientX - rect.left - knobCenter.x;
  let dy = clientY - rect.top - knobCenter.y;
  const distance = Math.hypot(dx, dy);
  if (distance > knobRadius) {
    const scale = knobRadius / distance;
    dx *= scale;
    dy *= scale;
  }

  joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  input.x = -(dx / knobRadius);
}

function releaseJoystick() {
  pointerActive = false;
  joystickKnob.style.transform = "translate(0px, 0px)";
  input.x = 0;
}

joystickBase.addEventListener("pointerdown", (event) => {
  pointerActive = true;
  joystickBase.setPointerCapture(event.pointerId);
  updateJoystick(event.clientX, event.clientY);
});
joystickBase.addEventListener("pointermove", (event) => {
  if (pointerActive) updateJoystick(event.clientX, event.clientY);
});
joystickBase.addEventListener("pointerup", releaseJoystick);
joystickBase.addEventListener("pointercancel", releaseJoystick);

const state = {
  speed: 0,
  bestSpeed: 0,
  finished: false,
};

function resetPlayer() {
  playerBody.setTranslation(resetPosition, true);
  playerBody.setLinvel({ x: 0.8, y: -1.5, z: 7.0 }, true);
  playerBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  state.finished = false;
}

resetPlayer();

function getControlX() {
  const keyboardX = (keyboard.right ? 1 : 0) - (keyboard.left ? 1 : 0);
  return Math.abs(input.x) > 0.01 ? input.x : keyboardX;
}

function updatePlayer() {
  const controlX = getControlX();
  const vel = playerBody.linvel();

  playerBody.addForce({ x: controlX * 14, y: 0, z: 26 }, true);

  const onLeftHalf = playerBody.translation().x < 0;
  if (onLeftHalf) {
    playerBody.addForce({ x: -6, y: -2, z: 0 }, true);
  } else {
    playerBody.addForce({ x: 6, y: -2, z: 0 }, true);
  }

  const planarSpeed = Math.hypot(vel.x, vel.z);
  if (planarSpeed > 24) {
    const scale = 24 / planarSpeed;
    playerBody.setLinvel({ x: vel.x * scale, y: vel.y, z: vel.z * scale }, true);
  }

  if (playerBody.translation().z > finishZ + 6) {
    state.finished = true;
  }

  if (Math.abs(playerBody.translation().x) > laneHalfWidth + 4 || playerBody.translation().y < -8) {
    resetPlayer();
  }
}

function updateVisuals(delta) {
  const pos = playerBody.translation();
  const vel = playerBody.linvel();

  playerMesh.position.set(pos.x, pos.y, pos.z);

  const planar = new THREE.Vector3(vel.x, 0, vel.z);
  if (planar.lengthSq() > 0.0001) {
    const rollAxis = new THREE.Vector3(planar.z, 0, -planar.x).normalize();
    playerMesh.rotateOnWorldAxis(rollAxis, -(planar.length() * delta) / playerRadius);
  }

  state.speed = Math.hypot(vel.x, vel.y, vel.z);
  state.bestSpeed = Math.max(state.bestSpeed, state.speed);

  trail.visible = state.speed > 6;
  trail.position.copy(playerMesh.position);
  trail.position.z -= 1.6;
  trail.position.y += 0.12;
  trail.scale.setScalar(THREE.MathUtils.clamp(state.speed / 14, 0.8, 2.4));
  trail.material.opacity = THREE.MathUtils.clamp((state.speed - 6) / 14, 0.12, 0.42);
}

function updateCamera(delta) {
  const pos = playerBody.translation();
  cameraTarget.set(pos.x * 0.18, pos.y + 5.4, pos.z - 12);
  camera.position.lerp(cameraTarget, 4 * delta);

  cameraLookTarget.set(pos.x * 0.22, pos.y + 0.8, pos.z + 20);
  camera.lookAt(cameraLookTarget);

  const targetFov = 70 + Math.min(16, state.speed * 0.28);
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 3 * delta);
  camera.updateProjectionMatrix();
}

function updateHud() {
  const status = state.finished ? "finish" : "physics active";
  hud.innerHTML = `Physics Surf<br>Speed ${state.speed.toFixed(1)}<br>${status}`;
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.033);

  updatePlayer();
  physicsWorld.step();
  updateVisuals(delta);
  updateCamera(delta);
  updateHud();

  renderer.render(scene, camera);
}

animate();
