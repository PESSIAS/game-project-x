import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x120a1f);
scene.fog = new THREE.Fog(0x120a1f, 50, 240);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

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
hud.style.lineHeight = "1.5";
hud.style.textShadow = "0 2px 12px rgba(0,0,0,0.45)";
hud.style.zIndex = "10";
hud.innerHTML = "Surf MVP";
document.body.appendChild(hud);

const hint = document.createElement("div");
hint.style.position = "fixed";
hint.style.top = "16px";
hint.style.right = "16px";
hint.style.maxWidth = "280px";
hint.style.color = "#d9cfff";
hint.style.fontFamily = "Arial, sans-serif";
hint.style.fontSize = "14px";
hint.style.lineHeight = "1.4";
hint.style.textAlign = "right";
hint.style.textShadow = "0 2px 12px rgba(0,0,0,0.45)";
hint.style.zIndex = "10";
hint.innerHTML = "A/D or arrows to surf.<br>On mobile, drag the joystick.<br>Ride down angled faces to gain speed and transfer between ramps.";
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

const world = new THREE.Group();
scene.add(world);

scene.add(new THREE.AmbientLight(0xffffff, 0.62));

const sunLight = new THREE.DirectionalLight(0xffffff, 1.25);
sunLight.position.set(10, 16, 6);
scene.add(sunLight);

const fillLight = new THREE.PointLight(0x8844ff, 20, 90);
fillLight.position.set(0, 12, -12);
scene.add(fillLight);

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
  new THREE.CylinderGeometry(0.08, 0.15, 3.1, 12),
  new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.3 })
);
trail.rotation.x = Math.PI / 2;
scene.add(trail);

const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x2a183f, roughness: 0.94, metalness: 0.03 });
const surfMaterialLeft = new THREE.MeshStandardMaterial({ color: 0x35cfff, emissive: 0x09202f, roughness: 0.56 });
const surfMaterialRight = new THREE.MeshStandardMaterial({ color: 0xff58d2, emissive: 0x351327, roughness: 0.56 });
const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x8f73dd, emissive: 0x231533, roughness: 0.62 });
const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x483061, roughness: 0.86, metalness: 0.05 });

const laneHalfWidth = 8;
const surfPlanes = [];
const floorSegments = [];
const finishZ = 236;
const resetPoint = new THREE.Vector3(-1.8, 4.4, -10);

const gravity = new THREE.Vector3(0, -28, 0);
const cameraTarget = new THREE.Vector3();
const cameraLookTarget = new THREE.Vector3();
const tmpProjected = new THREE.Vector3();

function addPlatform(width, depth, center, material = trackMaterial, thickness = 0.6) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, depth), material);
  mesh.position.copy(center);
  world.add(mesh);
  return mesh;
}

function addMarker(x, y, z, height = 0.55) {
  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.24, height, 4), markerMaterial);
  marker.position.set(x, y + height / 2, z);
  world.add(marker);
}

function addFloorSegment(width, depth, center) {
  addPlatform(width, depth, center, platformMaterial, 0.6);
  floorSegments.push({
    xMin: center.x - width / 2,
    xMax: center.x + width / 2,
    zMin: center.z - depth / 2,
    zMax: center.z + depth / 2,
    y: center.y + 0.3,
  });
}

function addSurfRamp({ anchorX, centerZ, baseY, width, length, height, side }) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  geometry.rotateY(Math.PI);

  const isLeft = side === "left";
  const material = isLeft ? surfMaterialLeft : surfMaterialRight;
  const ramp = new THREE.Mesh(geometry, material);

  if (isLeft) {
    ramp.scale.x = -1;
    ramp.position.set(anchorX, baseY, centerZ - length / 2);
  } else {
    ramp.position.set(anchorX, baseY, centerZ + length / 2);
  }

  world.add(ramp);

  const normal = isLeft
    ? new THREE.Vector3(-height, width, 0).normalize()
    : new THREE.Vector3(height, width, 0).normalize();

  const planePoint = new THREE.Vector3(
    isLeft ? anchorX - width * 0.5 : anchorX + width * 0.5,
    baseY + height * 0.5,
    centerZ
  );

  surfPlanes.push({
    side,
    xMin: isLeft ? anchorX - width : anchorX,
    xMax: isLeft ? anchorX : anchorX + width,
    zMin: centerZ - length / 2,
    zMax: centerZ + length / 2,
    plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, planePoint),
    normal,
    tangentDown: new THREE.Vector3(0, -1, 0).projectOnPlane(normal).normalize(),
    targetDir: isLeft ? -1 : 1,
  });
}

addFloorSegment(22, 30, new THREE.Vector3(0, 3.2, -8));
addFloorSegment(12, 18, new THREE.Vector3(-3.2, 2.8, 3));

const rampLayout = [
  { side: "left", anchorX: -0.8, centerZ: 18, baseY: 0, width: 6, length: 16, height: 3.6 },
  { side: "right", anchorX: 1.2, centerZ: 36, baseY: 1.3, width: 6.4, length: 14, height: 4.4 },
  { side: "left", anchorX: -1.5, centerZ: 58, baseY: 3.2, width: 7.4, length: 18, height: 4.8 },
  { side: "right", anchorX: 1.6, centerZ: 82, baseY: 2.1, width: 6.6, length: 20, height: 4.3 },
  { side: "left", anchorX: -2.2, centerZ: 108, baseY: 4.6, width: 8.2, length: 22, height: 5.2 },
  { side: "right", anchorX: 2.2, centerZ: 136, baseY: 7.2, width: 7.4, length: 18, height: 5.5 },
  { side: "left", anchorX: -1.8, centerZ: 162, baseY: 9.8, width: 8.4, length: 20, height: 5.8 },
  { side: "right", anchorX: 2.8, centerZ: 190, baseY: 12.4, width: 9, length: 24, height: 6.2 },
  { side: "left", anchorX: -2.4, centerZ: 220, baseY: 10.2, width: 7.6, length: 18, height: 4.6 },
];

for (const ramp of rampLayout) {
  addSurfRamp(ramp);
  addMarker(-laneHalfWidth, ramp.baseY, ramp.centerZ, 0.42);
  addMarker(laneHalfWidth, ramp.baseY, ramp.centerZ, 0.42);
}

addFloorSegment(22, 22, new THREE.Vector3(0, 14.8, finishZ));

for (let z = -6; z <= finishZ; z += 10) {
  const t = Math.max(0, Math.min(1, z / finishZ));
  const y = 2 + t * 12;
  addMarker(-laneHalfWidth, y, z, 0.34);
  addMarker(laneHalfWidth, y, z, 0.34);
}

const keyboard = { left: false, right: false };
const input = { x: 0, y: 0 };

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
  input.y = dy / knobRadius;
}

function releaseJoystick() {
  pointerActive = false;
  joystickKnob.style.transform = "translate(0px, 0px)";
  input.x = 0;
  input.y = 0;
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
  velocity: new THREE.Vector3(0, 0, 8),
  speed: 8,
  bestSpeed: 8,
  surfing: false,
  surfSide: "none",
  finished: false,
};

function resetPlayer() {
  player.position.copy(resetPoint);
  state.velocity.set(0.4, -1.5, 11.5);
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

function findFloorHeight(position) {
  let bestHeight = -Infinity;
  for (const floor of floorSegments) {
    if (position.x >= floor.xMin && position.x <= floor.xMax && position.z >= floor.zMin && position.z <= floor.zMax) {
      bestHeight = Math.max(bestHeight, floor.y + playerRadius);
    }
  }
  return bestHeight;
}

function findSurfContact(position) {
  for (const surf of surfPlanes) {
    if (position.z < surf.zMin || position.z > surf.zMax) continue;
    if (position.x < surf.xMin - playerRadius || position.x > surf.xMax + playerRadius) continue;

    const distance = surf.plane.distanceToPoint(position);
    if (distance >= -0.25 && distance <= playerRadius + 0.28) {
      const projected = tmpProjected.copy(position).addScaledVector(surf.normal, -distance);
      if (projected.x >= surf.xMin - 0.15 && projected.x <= surf.xMax + 0.15) {
        return { surf, distance };
      }
    }
  }
  return null;
}

function updatePlayer(delta) {
  const controlX = getControlX();

  state.velocity.addScaledVector(gravity, delta);
  state.velocity.x += controlX * 22 * delta;
  state.velocity.z += Math.max(0, -input.y) * 5.5 * delta;

  const horizontalSpeed = Math.hypot(state.velocity.x, state.velocity.z);
  const maxHorizontal = state.surfing ? 38 : 24;
  if (horizontalSpeed > maxHorizontal) {
    const scale = maxHorizontal / horizontalSpeed;
    state.velocity.x *= scale;
    state.velocity.z *= scale;
  }

  const nextPosition = player.position.clone().addScaledVector(state.velocity, delta);
  const surfContact = findSurfContact(nextPosition);
  state.surfing = false;
  state.surfSide = "none";

  if (surfContact) {
    const { surf, distance } = surfContact;
    nextPosition.addScaledVector(surf.normal, playerRadius - distance + 0.03);

    const intoPlane = surf.normal.dot(state.velocity);
    if (intoPlane < 0) {
      state.velocity.addScaledVector(surf.normal, -intoPlane);
    }

    const downhill = surf.tangentDown.clone();
    const alongDownhill = state.velocity.dot(downhill);
    const alignment = THREE.MathUtils.clamp(controlX * surf.targetDir, 0, 1);
    const carve = 0.35 + alignment * 0.95 + Math.max(0, -input.y) * 0.35;

    state.velocity.addScaledVector(downhill, carve * 34 * delta);
    state.velocity.z += carve * 11 * delta;
    state.velocity.x += surf.targetDir * (7 + alignment * 18) * delta;

    if (alignment < 0.12) {
      state.velocity.x *= 0.992;
      state.velocity.z *= 0.996;
    }

    if (alongDownhill < 2) {
      state.velocity.addScaledVector(downhill, (2 - alongDownhill) * 0.9);
    }

    state.surfing = true;
    state.surfSide = surf.side;
  } else {
    const floorHeight = findFloorHeight(nextPosition);
    if (floorHeight > -Infinity && nextPosition.y <= floorHeight) {
      nextPosition.y = floorHeight;
      if (state.velocity.y < 0) state.velocity.y = 0;
      state.velocity.x *= 0.988;
      state.velocity.z *= 0.996;
    }
  }

  player.position.copy(nextPosition);
  state.speed = state.velocity.length();
  state.bestSpeed = Math.max(state.bestSpeed, state.speed);

  const horizontal = new THREE.Vector3(state.velocity.x, 0, state.velocity.z);
  if (horizontal.lengthSq() > 0.0001) {
    const rollAxis = new THREE.Vector3(horizontal.z, 0, -horizontal.x).normalize();
    player.rotateOnWorldAxis(rollAxis, -(horizontal.length() * delta) / playerRadius);
  }

  if (Math.abs(player.position.x) > laneHalfWidth + 4 || player.position.y < -18) {
    resetPlayer();
  }

  if (player.position.z > finishZ + 8) {
    state.finished = true;
    state.velocity.multiplyScalar(0.992);
  }
}

function updateCamera(delta) {
  cameraTarget.set(
    player.position.x * 0.45,
    player.position.y + 4.6,
    player.position.z - 10.5
  );
  camera.position.lerp(cameraTarget, 3.8 * delta);

  cameraLookTarget.set(
    player.position.x * 0.65,
    player.position.y + 1.1,
    player.position.z + 16
  );
  camera.lookAt(cameraLookTarget);

  const targetFov = 70 + Math.min(20, state.speed * 0.42);
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 2.8 * delta);
  camera.updateProjectionMatrix();
}

function updateHud() {
  const surfText = state.surfing ? `surfing ${state.surfSide}` : "air / flat";
  const finishText = state.finished ? "<br>finish reached" : "";
  hud.innerHTML = `Speed ${state.speed.toFixed(1)}<br>Best ${state.bestSpeed.toFixed(1)}<br>${surfText}${finishText}`;

  trail.visible = state.speed > 8;
  trail.position.copy(player.position);
  trail.position.z -= 1.8;
  trail.position.y += 0.15;
  trail.scale.setScalar(THREE.MathUtils.clamp(state.speed / 16, 0.8, 2.8));
  trail.material.opacity = THREE.MathUtils.clamp((state.speed - 8) / 24, 0.12, 0.46);
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
