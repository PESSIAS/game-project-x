import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x120a1f);
scene.fog = new THREE.Fog(0x120a1f, 50, 190);

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
hint.style.maxWidth = "290px";
hint.style.color = "#d9cfff";
hint.style.fontFamily = "Arial, sans-serif";
hint.style.fontSize = "14px";
hint.style.lineHeight = "1.4";
hint.style.textAlign = "right";
hint.style.textShadow = "0 2px 12px rgba(0,0,0,0.45)";
hint.style.zIndex = "10";
hint.innerHTML = "A/D or arrows to steer.<br>On mobile, drag the joystick.<br>Drop onto the ramp, then swap sides and reach the finish.";
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

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(10, 16, 8);
scene.add(sunLight);

const fillLight = new THREE.PointLight(0x8844ff, 18, 90);
fillLight.position.set(0, 12, -8);
scene.add(fillLight);

const world = new THREE.Group();
scene.add(world);

const playerRadius = 0.6;
const player = new THREE.Mesh(
  new THREE.SphereGeometry(playerRadius, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xffef7a,
    emissive: 0x665000,
    metalness: 0.24,
    roughness: 0.34,
  })
);
scene.add(player);

const trail = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.16, 3.2, 12),
  new THREE.MeshBasicMaterial({ color: 0xffd95a, transparent: true, opacity: 0.28 })
);
trail.rotation.x = Math.PI / 2;
scene.add(trail);

const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x44305f, roughness: 0.88, metalness: 0.04 });
const leftRampMaterial = new THREE.MeshStandardMaterial({ color: 0x35d0ff, emissive: 0x0b2230, roughness: 0.55 });
const rightRampMaterial = new THREE.MeshStandardMaterial({ color: 0xff58d2, emissive: 0x321126, roughness: 0.55 });
const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x9578e7, emissive: 0x241637, roughness: 0.6 });

const laneHalfWidth = 8;
const finishZ = 98;
const resetPoint = new THREE.Vector3(-2.5, 6.0, -25);
const gravity = new THREE.Vector3(0, -24, 0);
const cameraTarget = new THREE.Vector3();
const cameraLookTarget = new THREE.Vector3();
const clamp = THREE.MathUtils.clamp;

const floors = [];
const ramps = [];

function addBox(width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  world.add(mesh);
}

function addFloor(width, depth, x, y, z) {
  addBox(width, 0.8, depth, x, y - 0.4, z, floorMaterial);
  floors.push({
    xMin: x - width / 2,
    xMax: x + width / 2,
    zMin: z - depth / 2,
    zMax: z + depth / 2,
    y,
  });
}

function addGuide(x, y, z) {
  addBox(0.24, 0.45, 4, x, y + 0.22, z, markerMaterial);
}

function addRamp({ side, z, width, length, topY, bottomY }) {
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
  world.add(mesh);

  ramps.push({
    side,
    width,
    zMin: z - length / 2,
    zMax: z + length / 2,
    xMin: isLeft ? -width : 0,
    xMax: isLeft ? 0 : width,
    topY,
    bottomY,
    targetDir: isLeft ? -1 : 1,
  });
}

addFloor(12, 12, 0, 4.8, -24);
addRamp({ side: "left", z: 6, width: 8, length: 26, topY: 1.6, bottomY: -1.2 });
addFloor(12, 10, 0, -1.2, 28);
addRamp({ side: "right", z: 50, width: 8, length: 22, topY: 1.2, bottomY: -0.8 });
addFloor(14, 10, 0, -0.8, finishZ);

for (let z = -20; z <= finishZ; z += 10) {
  addGuide(-laneHalfWidth, 0, z);
  addGuide(laneHalfWidth, 0, z);
}

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
  velocity: new THREE.Vector3(),
  speed: 0,
  bestSpeed: 0,
  surfing: false,
  surfSide: "none",
  finished: false,
};

function resetPlayer() {
  player.position.copy(resetPoint);
  state.velocity.set(0.9, -2.4, 7.2);
  state.speed = state.velocity.length();
  state.surfing = false;
  state.surfSide = "none";
  state.finished = false;
}

resetPlayer();

function getControlX() {
  const keyboardX = (keyboard.right ? 1 : 0) - (keyboard.left ? 1 : 0);
  return Math.abs(input.x) > 0.01 ? input.x : keyboardX;
}

function getFloorHeight(position) {
  let best = -Infinity;
  for (const floor of floors) {
    if (position.x >= floor.xMin && position.x <= floor.xMax && position.z >= floor.zMin && position.z <= floor.zMax) {
      best = Math.max(best, floor.y + playerRadius);
    }
  }
  return best;
}

function getRampSurface(ramp, x) {
  const t = clamp((x - ramp.xMin) / (ramp.xMax - ramp.xMin), 0, 1);
  return ramp.side === "left"
    ? THREE.MathUtils.lerp(ramp.bottomY, ramp.topY, 1 - t)
    : THREE.MathUtils.lerp(ramp.bottomY, ramp.topY, t);
}

function getRampContact(position, nextY) {
  for (const ramp of ramps) {
    if (position.z < ramp.zMin || position.z > ramp.zMax) continue;
    if (position.x < ramp.xMin - playerRadius || position.x > ramp.xMax + playerRadius) continue;

    const surfaceY = getRampSurface(ramp, position.x);
    const topOfBall = nextY + playerRadius;
    const bottomOfBall = nextY - playerRadius;

    if (bottomOfBall <= surfaceY + 0.2 && topOfBall >= surfaceY - 0.2) {
      return { ramp, surfaceY };
    }
  }
  return null;
}

function updatePlayer(delta) {
  const controlX = getControlX();

  state.velocity.addScaledVector(gravity, delta);
  state.velocity.x += controlX * 15 * delta;
  state.velocity.z += 4.2 * delta;

  let nextX = player.position.x + state.velocity.x * delta;
  let nextY = player.position.y + state.velocity.y * delta;
  let nextZ = player.position.z + state.velocity.z * delta;

  state.surfing = false;
  state.surfSide = "none";

  const rampContact = getRampContact(new THREE.Vector3(nextX, nextY, nextZ), nextY);
  if (rampContact) {
    const { ramp, surfaceY } = rampContact;
    nextY = surfaceY + playerRadius;

    const alignment = clamp(controlX * ramp.targetDir, 0, 1);
    state.velocity.y = Math.min(state.velocity.y, -0.8);
    state.velocity.z += (7 + alignment * 8) * delta;
    state.velocity.x += ramp.targetDir * (8 + alignment * 12) * delta;

    state.surfing = true;
    state.surfSide = ramp.side;
  } else {
    const floorHeight = getFloorHeight(new THREE.Vector3(nextX, nextY, nextZ));
    if (floorHeight > -Infinity && nextY <= floorHeight) {
      nextY = floorHeight;
      if (state.velocity.y < 0) state.velocity.y = 0;
      state.velocity.x *= 0.985;
      state.velocity.z *= 0.995;
    }
  }

  const planarSpeed = Math.hypot(state.velocity.x, state.velocity.z);
  const maxPlanar = state.surfing ? 26 : 20;
  if (planarSpeed > maxPlanar) {
    const scale = maxPlanar / planarSpeed;
    state.velocity.x *= scale;
    state.velocity.z *= scale;
  }

  player.position.set(nextX, nextY, nextZ);
  state.speed = state.velocity.length();
  state.bestSpeed = Math.max(state.bestSpeed, state.speed);

  const planar = new THREE.Vector3(state.velocity.x, 0, state.velocity.z);
  if (planar.lengthSq() > 0.0001) {
    const rollAxis = new THREE.Vector3(planar.z, 0, -planar.x).normalize();
    player.rotateOnWorldAxis(rollAxis, -(planar.length() * delta) / playerRadius);
  }

  if (Math.abs(player.position.x) > laneHalfWidth + 3 || player.position.y < -8) {
    resetPlayer();
  }

  if (player.position.z > finishZ + 6) {
    state.finished = true;
    state.velocity.multiplyScalar(0.99);
  }
}

function updateCamera(delta) {
  cameraTarget.set(
    player.position.x * 0.22,
    player.position.y + 4.8,
    player.position.z - 10.8
  );
  camera.position.lerp(cameraTarget, 4 * delta);

  cameraLookTarget.set(
    player.position.x * 0.28,
    player.position.y + 0.4,
    player.position.z + 18
  );
  camera.lookAt(cameraLookTarget);

  const targetFov = 70 + Math.min(16, state.speed * 0.32);
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 3 * delta);
  camera.updateProjectionMatrix();
}

function updateHud() {
  const status = state.finished ? "finish" : state.surfing ? `surfing ${state.surfSide}` : "air / floor";
  hud.innerHTML = `Speed ${state.speed.toFixed(1)}<br>Best ${state.bestSpeed.toFixed(1)}<br>${status}`;

  trail.visible = state.speed > 7;
  trail.position.copy(player.position);
  trail.position.z -= 1.6;
  trail.position.y += 0.12;
  trail.scale.setScalar(clamp(state.speed / 15, 0.8, 2.4));
  trail.material.opacity = clamp((state.speed - 7) / 16, 0.12, 0.42);
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

  updatePlayer(delta);
  updateCamera(delta);
  updateHud();

  renderer.render(scene, camera);
}

animate();
