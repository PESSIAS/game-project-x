import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x120a1f);
scene.fog = new THREE.Fog(0x120a1f, 35, 140);

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
hint.style.maxWidth = "260px";
hint.style.color = "#d9cfff";
hint.style.fontFamily = "Arial, sans-serif";
hint.style.fontSize = "14px";
hint.style.lineHeight = "1.4";
hint.style.textAlign = "right";
hint.style.textShadow = "0 2px 12px rgba(0,0,0,0.45)";
hint.style.zIndex = "10";
hint.innerHTML = "A/D or arrows to surf.<br>On mobile, drag the joystick.<br>Ride angled ramps to gain speed.";
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

const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(8, 14, 6);
scene.add(sunLight);

const fillLight = new THREE.PointLight(0x8844ff, 18, 60);
fillLight.position.set(0, 8, -10);
scene.add(fillLight);

const playerRadius = 0.6;
const player = new THREE.Mesh(
  new THREE.SphereGeometry(playerRadius, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xfff066,
    emissive: 0x664400,
    metalness: 0.25,
    roughness: 0.35,
  })
);
scene.add(player);

const trail = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.14, 2.6, 12),
  new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.28 })
);
trail.rotation.x = Math.PI / 2;
scene.add(trail);

const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x3b235a, roughness: 0.92, metalness: 0.04 });
const surfMaterialLeft = new THREE.MeshStandardMaterial({ color: 0x39d0ff, emissive: 0x0a2233, roughness: 0.55 });
const surfMaterialRight = new THREE.MeshStandardMaterial({ color: 0xff4fd8, emissive: 0x331122, roughness: 0.55 });
const markerMaterial = new THREE.MeshStandardMaterial({ color: 0xa784ff, emissive: 0x221133, roughness: 0.65 });

const laneHalfWidth = 7;
const floorY = 0;
const surfPlanes = [];
const resetPoint = new THREE.Vector3(0, 2.2, -6);

const tempVec = new THREE.Vector3();
const gravity = new THREE.Vector3(0, -24, 0);
const cameraLookTarget = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);

function addFloor(width, depth, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, depth), trackMaterial);
  mesh.position.set(0, floorY - 0.25, z);
  world.add(mesh);
  return mesh;
}

function addMarker(x, z, height = 0.5) {
  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.22, height, 4), markerMaterial);
  marker.position.set(x, height / 2 - 0.05, z);
  world.add(marker);
}

function addSurfRamp({ x, z, width = 6, length = 10, height = 3.4, side = "left" }) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: false,
  });
  geometry.rotateY(Math.PI);

  const isLeft = side === "left";
  const material = isLeft ? surfMaterialLeft : surfMaterialRight;
  const ramp = new THREE.Mesh(geometry, material);

  if (isLeft) {
    ramp.position.set(x, floorY, z + length / 2);
  } else {
    ramp.scale.x = -1;
    ramp.position.set(x, floorY, z - length / 2);
  }

  world.add(ramp);

  const normal = isLeft
    ? new THREE.Vector3(height, width, 0).normalize()
    : new THREE.Vector3(-height, width, 0).normalize();

  const planePoint = new THREE.Vector3(
    isLeft ? x + width * 0.5 : x - width * 0.5,
    height * 0.5,
    z
  );

  surfPlanes.push({
    side,
    xMin: isLeft ? x : x - width,
    xMax: isLeft ? x + width : x,
    zMin: z - length / 2,
    zMax: z + length / 2,
    plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, planePoint),
    normal,
    boost: 15 + height * 0.6,
    targetDir: isLeft ? 1 : -1,
  });
}

addFloor(18, 20, 0);
addSurfRamp({ side: "left", x: -6.5, z: 14, width: 6, length: 12, height: 3.5 });
addSurfRamp({ side: "right", x: 6.5, z: 28, width: 6, length: 12, height: 3.5 });
addSurfRamp({ side: "left", x: -6.5, z: 42, width: 6.5, length: 14, height: 3.8 });
addSurfRamp({ side: "right", x: 6.5, z: 58, width: 6.5, length: 14, height: 3.8 });
addSurfRamp({ side: "left", x: -7, z: 76, width: 7, length: 16, height: 4.1 });
addSurfRamp({ side: "right", x: 7, z: 96, width: 7, length: 16, height: 4.1 });
addFloor(18, 18, 118);

for (let z = -4; z <= 118; z += 8) {
  addMarker(-laneHalfWidth, z, 0.35);
  addMarker(laneHalfWidth, z, 0.35);
}

const keyboard = {
  left: false,
  right: false,
};

const input = {
  x: 0,
  y: 0,
};

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
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  let dx = x - knobCenter.x;
  let dy = y - knobCenter.y;
  const distance = Math.hypot(dx, dy);
  if (distance > knobRadius) {
    const scale = knobRadius / distance;
    dx *= scale;
    dy *= scale;
  }

  joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  input.x = dx / knobRadius;
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
  if (!pointerActive) return;
  updateJoystick(event.clientX, event.clientY);
});

joystickBase.addEventListener("pointerup", releaseJoystick);
joystickBase.addEventListener("pointercancel", releaseJoystick);

const state = {
  velocity: new THREE.Vector3(0, 0, 12),
  speed: 12,
  bestSpeed: 12,
  surfing: false,
  surfSide: "none",
  finished: false,
};

function resetPlayer() {
  player.position.copy(resetPoint);
  state.velocity.set(0, 0, 12);
  state.speed = 12;
  state.surfing = false;
  state.surfSide = "none";
  state.finished = false;
}

resetPlayer();

function getControlX() {
  const keyboardX = (keyboard.right ? 1 : 0) - (keyboard.left ? 1 : 0);
  if (Math.abs(input.x) > 0.01) return input.x;
  return keyboardX;
}

function findSurfContact(position) {
  for (const surf of surfPlanes) {
    if (position.z < surf.zMin || position.z > surf.zMax) continue;
    if (position.x < surf.xMin - playerRadius || position.x > surf.xMax + playerRadius) continue;

    const distance = surf.plane.distanceToPoint(position);
    if (distance >= -0.2 && distance <= playerRadius + 0.35) {
      const projected = tempVec.copy(position).addScaledVector(surf.normal, -distance);
      if (projected.x >= surf.xMin - 0.1 && projected.x <= surf.xMax + 0.1) {
        return { surf, distance, projected };
      }
    }
  }
  return null;
}

function updatePlayer(delta) {
  const controlX = getControlX();
  const desiredLateral = controlX * 10;
  state.velocity.x += (desiredLateral - state.velocity.x) * Math.min(1, delta * 4.5);
  state.velocity.addScaledVector(gravity, delta);

  let nextPosition = player.position.clone().addScaledVector(state.velocity, delta);
  let surfContact = findSurfContact(nextPosition);

  state.surfing = false;
  state.surfSide = "none";

  if (surfContact) {
    const { surf, distance } = surfContact;
    nextPosition.addScaledVector(surf.normal, playerRadius - distance + 0.02);

    const normalVelocity = surf.normal.dot(state.velocity);
    if (normalVelocity < 0) {
      state.velocity.addScaledVector(surf.normal, -normalVelocity);
    }

    const surfaceForward = new THREE.Vector3(0, 0, 1);
    const tangent = surfaceForward.clone().projectOnPlane(surf.normal).normalize();
    const tangentSpeed = Math.max(10, state.velocity.dot(tangent));
    const alignment = THREE.MathUtils.clamp(controlX * surf.targetDir, 0, 1);
    const carve = THREE.MathUtils.clamp((alignment + Math.max(0, -input.y) * 0.35), 0, 1);
    const gain = surf.boost * (0.25 + carve * 0.95);

    state.velocity.copy(tangent.multiplyScalar(tangentSpeed + gain * delta * 3.5));
    state.velocity.x += surf.targetDir * (3.8 + carve * 7.5) * delta;
    state.velocity.y = Math.max(state.velocity.y, -2);

    state.surfing = true;
    state.surfSide = surf.side;
  } else if (nextPosition.y <= playerRadius) {
    nextPosition.y = playerRadius;
    state.velocity.y = 0;
    state.velocity.x *= 0.96;
    state.velocity.z = Math.max(8, state.velocity.z - 6 * delta);
  }

  player.position.copy(nextPosition);
  state.speed = Math.max(0, state.velocity.length());
  state.bestSpeed = Math.max(state.bestSpeed, state.speed);

  const rollAxis = new THREE.Vector3(state.velocity.z, 0, -state.velocity.x).normalize();
  const rollAmount = state.speed * delta / playerRadius;
  player.rotateOnWorldAxis(rollAxis, -rollAmount);

  if (Math.abs(player.position.x) > laneHalfWidth + 3 || player.position.y < -8) {
    resetPlayer();
  }

  if (player.position.z > 126) {
    state.finished = true;
    state.velocity.multiplyScalar(0.985);
  }
}

function updateCamera(delta) {
  cameraTarget.set(
    player.position.x * 0.35,
    player.position.y + 3.8,
    player.position.z - 8.5
  );

  camera.position.lerp(cameraTarget, 4 * delta);

  cameraLookTarget.set(
    player.position.x * 0.6,
    player.position.y + 1,
    player.position.z + 10
  );
  camera.lookAt(cameraLookTarget);

  camera.fov = THREE.MathUtils.lerp(camera.fov, 70 + Math.min(18, state.speed * 0.35), 3 * delta);
  camera.updateProjectionMatrix();
}

function updateHud() {
  const surfText = state.surfing ? `surfing ${state.surfSide}` : "searching line";
  const endText = state.finished ? "<br>finish pad reached — press R or fall to reset" : "";
  hud.innerHTML = `Speed ${state.speed.toFixed(1)}<br>Best ${state.bestSpeed.toFixed(1)}<br>${surfText}${endText}`;

  trail.visible = state.speed > 10;
  trail.position.copy(player.position);
  trail.position.z -= 1.5;
  trail.position.y += 0.12;
  trail.scale.setScalar(THREE.MathUtils.clamp(state.speed / 18, 0.8, 2.4));
  trail.material.opacity = THREE.MathUtils.clamp((state.speed - 10) / 20, 0.12, 0.42);
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
