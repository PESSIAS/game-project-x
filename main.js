import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87c77b);
scene.fog = new THREE.Fog(0x87c77b, 18, 36);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
const cameraOffset = new THREE.Vector3(0, 14, 10);
camera.position.copy(cameraOffset);
camera.lookAt(0, 0, 0);

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
hud.style.color = "#ffffff";
hud.style.fontFamily = "Arial, sans-serif";
hud.style.fontSize = "18px";
hud.style.lineHeight = "1.45";
hud.style.textShadow = "0 2px 8px rgba(0,0,0,0.35)";
hud.style.zIndex = "10";
document.body.appendChild(hud);

const hint = document.createElement("div");
hint.style.position = "fixed";
hint.style.top = "16px";
hint.style.right = "16px";
hint.style.maxWidth = "300px";
hint.style.color = "#ffffff";
hint.style.fontFamily = "Arial, sans-serif";
hint.style.fontSize = "14px";
hint.style.lineHeight = "1.4";
hint.style.textAlign = "right";
hint.style.textShadow = "0 2px 8px rgba(0,0,0,0.35)";
hint.style.zIndex = "10";
hint.innerHTML = "Move with joystick or WASD.<br>Trees inside the white ring get chopped automatically.<br>Stand on the yellow pad to sell wood.";
document.body.appendChild(hint);

const upgradeButton = document.createElement("button");
upgradeButton.textContent = "Upgrade Hit";
upgradeButton.style.position = "fixed";
upgradeButton.style.right = "16px";
upgradeButton.style.bottom = "24px";
upgradeButton.style.padding = "12px 16px";
upgradeButton.style.border = "none";
upgradeButton.style.borderRadius = "12px";
upgradeButton.style.background = "#2d6cdf";
upgradeButton.style.color = "white";
upgradeButton.style.fontSize = "16px";
upgradeButton.style.fontWeight = "bold";
upgradeButton.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
upgradeButton.style.zIndex = "20";
document.body.appendChild(upgradeButton);

const joystickBase = document.createElement("div");
joystickBase.style.position = "fixed";
joystickBase.style.left = "24px";
joystickBase.style.bottom = "24px";
joystickBase.style.width = "120px";
joystickBase.style.height = "120px";
joystickBase.style.borderRadius = "50%";
joystickBase.style.background = "rgba(255,255,255,0.12)";
joystickBase.style.border = "1px solid rgba(255,255,255,0.22)";
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

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
sunLight.position.set(6, 12, 6);
scene.add(sunLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(20, 64),
  new THREE.MeshStandardMaterial({ color: 0x6fb465, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const sellPad = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.5, 0.2, 24),
  new THREE.MeshStandardMaterial({ color: 0xf3cf59, roughness: 0.9 })
);
sellPad.position.set(-9, 0.1, 8);
scene.add(sellPad);

const sellLabel = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 0.1, 1.2),
  new THREE.MeshStandardMaterial({ color: 0xffef9a, roughness: 1 })
);
sellLabel.position.set(-9, 0.22, 8);
scene.add(sellLabel);

const playerRoot = new THREE.Group();
scene.add(playerRoot);

const playerGroup = new THREE.Group();
playerRoot.add(playerGroup);

const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xf2d7c7, roughness: 0.95 });
const shirtMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 });
const pantsMaterial = new THREE.MeshStandardMaterial({ color: 0x8f8f8f, roughness: 0.9 });
const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x5b4a3d, roughness: 1 });
const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x7b4b2a, roughness: 0.8 });
const metalMaterial = new THREE.MeshStandardMaterial({ color: 0xd8dde5, roughness: 0.35, metalness: 0.6 });

const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), shirtMaterial);
torso.position.y = 1.2;
playerGroup.add(torso);

const hips = new THREE.Group();
hips.position.y = 0.65;
playerGroup.add(hips);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 16), skinMaterial);
head.position.y = 2.0;
playerGroup.add(head);

const leftArmPivot = new THREE.Group();
leftArmPivot.position.set(-0.55, 1.55, 0);
playerGroup.add(leftArmPivot);
const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, 0.22), shirtMaterial);
leftArm.position.y = -0.4;
leftArmPivot.add(leftArm);

const rightArmPivot = new THREE.Group();
rightArmPivot.position.set(0.55, 1.55, 0);
playerGroup.add(rightArmPivot);
const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, 0.22), shirtMaterial);
rightArm.position.y = -0.4;
rightArmPivot.add(rightArm);

const leftLegPivot = new THREE.Group();
leftLegPivot.position.set(-0.22, 0.65, 0);
hips.add(leftLegPivot);
const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.24), pantsMaterial);
leftLeg.position.y = -0.45;
leftLegPivot.add(leftLeg);
const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.4), shoeMaterial);
leftFoot.position.set(0, -0.92, 0.08);
leftLegPivot.add(leftFoot);

const rightLegPivot = new THREE.Group();
rightLegPivot.position.set(0.22, 0.65, 0);
hips.add(rightLegPivot);
const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.24), pantsMaterial);
rightLeg.position.y = -0.45;
rightLegPivot.add(rightLeg);
const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.4), shoeMaterial);
rightFoot.position.set(0, -0.92, 0.08);
rightLegPivot.add(rightFoot);

const axeHandle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), woodMaterial);
axeHandle.position.set(0, -0.45, 0);
rightArmPivot.add(axeHandle);
const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.08), metalMaterial);
axeHead.position.set(-0.08, -0.12, 0);
axeHandle.add(axeHead);

const chopRange = new THREE.Mesh(
  new THREE.RingGeometry(1.9, 2.05, 48),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
);
chopRange.rotation.x = -Math.PI / 2;
chopRange.position.y = 0.02;
playerRoot.add(chopRange);

const treeTrunkMaterial = new THREE.MeshStandardMaterial({ color: 0x7a4b25, roughness: 1 });
const treeLeafMaterial = new THREE.MeshStandardMaterial({ color: 0x2f8f3a, roughness: 1 });
const logMaterial = new THREE.MeshStandardMaterial({ color: 0x9a6232, roughness: 1 });

const trees = [];
const logs = [];
let woodCount = 0;
let coins = 0;
let hitPower = 1;
let upgradeCost = 5;
let chopTimer = 0;
let chopping = false;
let selling = false;
let animationTime = 0;
let isMoving = false;

function createTree(x, z) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.4, 10), treeTrunkMaterial);
  trunk.position.y = 0.7;
  tree.add(trunk);

  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 18), treeLeafMaterial);
  crown.position.y = 1.8;
  tree.add(crown);

  tree.position.set(x, 0, z);
  scene.add(tree);

  trees.push({ mesh: tree, health: 5, maxHealth: 5, x, z });
}

function spawnLog(x, z) {
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 10), logMaterial);
  log.rotation.z = Math.PI / 2;
  log.position.set(x, 0.18, z);
  scene.add(log);
  logs.push(log);
}

createTree(-6, -4);
createTree(-2, 5);
createTree(4, -3);
createTree(7, 6);
createTree(0, -8);
createTree(8, 0);
createTree(6, 9);
createTree(-8, 1);

const keyboard = { up: false, down: false, left: false, right: false };
const input = { x: 0, y: 0 };

window.addEventListener("keydown", (event) => {
  if (event.key === "w" || event.key === "ArrowUp") keyboard.up = true;
  if (event.key === "s" || event.key === "ArrowDown") keyboard.down = true;
  if (event.key === "a" || event.key === "ArrowLeft") keyboard.left = true;
  if (event.key === "d" || event.key === "ArrowRight") keyboard.right = true;
});

window.addEventListener("keyup", (event) => {
  if (event.key === "w" || event.key === "ArrowUp") keyboard.up = false;
  if (event.key === "s" || event.key === "ArrowDown") keyboard.down = false;
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
  if (pointerActive) updateJoystick(event.clientX, event.clientY);
});
joystickBase.addEventListener("pointerup", releaseJoystick);
joystickBase.addEventListener("pointercancel", releaseJoystick);

const player = {
  position: new THREE.Vector3(0, 0, 0),
  speed: 4.5,
  chopRange: 2,
};

upgradeButton.addEventListener("click", () => {
  if (coins >= upgradeCost) {
    coins -= upgradeCost;
    hitPower += 1;
    upgradeCost += 5;
  }
});

function getMoveInput() {
  const x = Math.abs(input.x) > 0.01 ? input.x : (keyboard.right ? 1 : 0) - (keyboard.left ? 1 : 0);
  const y = Math.abs(input.y) > 0.01 ? input.y : (keyboard.down ? 1 : 0) - (keyboard.up ? 1 : 0);
  return new THREE.Vector2(x, y);
}

function updatePlayer(delta) {
  const move = getMoveInput();
  if (move.lengthSq() > 1) move.normalize();

  isMoving = move.lengthSq() > 0.001;

  player.position.x += move.x * player.speed * delta;
  player.position.z += move.y * player.speed * delta;

  const maxRadius = 12;
  const distFromCenter = Math.hypot(player.position.x, player.position.z);
  if (distFromCenter > maxRadius) {
    const scale = maxRadius / distFromCenter;
    player.position.x *= scale;
    player.position.z *= scale;
  }

  playerRoot.position.copy(player.position);

  if (isMoving) {
    playerRoot.rotation.y = Math.atan2(move.x, move.y);
  }
}

function updateSelling() {
  const dx = player.position.x - sellPad.position.x;
  const dz = player.position.z - sellPad.position.z;
  const distance = Math.hypot(dx, dz);
  selling = distance < 1.7;

  sellPad.material.emissive = new THREE.Color(selling ? 0x554400 : 0x000000);

  if (selling && woodCount > 0) {
    coins += woodCount;
    woodCount = 0;
  }
}

function updateChopping(delta) {
  let closestTree = null;
  let closestDistance = Infinity;

  for (const tree of trees) {
    const dx = tree.mesh.position.x - player.position.x;
    const dz = tree.mesh.position.z - player.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= player.chopRange && distance < closestDistance) {
      closestTree = tree;
      closestDistance = distance;
    }
  }

  chopping = !!closestTree;

  if (closestTree) {
    chopTimer += delta;
    const pulse = 0.9 + Math.sin(chopTimer * 20) * 0.08;
    chopRange.scale.setScalar(pulse);

    if (chopTimer >= 0.45) {
      chopTimer = 0;
      closestTree.health -= hitPower;
      closestTree.mesh.scale.setScalar(Math.max(0.75, closestTree.health / closestTree.maxHealth));

      if (closestTree.health <= 0) {
        scene.remove(closestTree.mesh);
        const index = trees.indexOf(closestTree);
        if (index >= 0) trees.splice(index, 1);
        spawnLog(closestTree.x + (Math.random() - 0.5) * 0.6, closestTree.z + (Math.random() - 0.5) * 0.6);
      }
    }
  } else {
    chopTimer = 0;
    chopRange.scale.setScalar(1);
  }
}

function updateLogs(delta) {
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    log.rotation.x += delta * 1.5;
    const dx = log.position.x - player.position.x;
    const dz = log.position.z - player.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 1.1) {
      scene.remove(log);
      logs.splice(i, 1);
      woodCount += 1;
    }
  }
}

function updateCharacterAnimation(delta) {
  animationTime += delta;

  let walkSwing = 0;
  let walkBounce = 0;
  let chopSwing = 0;

  if (isMoving) {
    walkSwing = Math.sin(animationTime * 10) * 0.7;
    walkBounce = Math.abs(Math.sin(animationTime * 10)) * 0.08;
  }

  if (chopping) {
    chopSwing = Math.sin(animationTime * 20) * 1.1;
  }

  playerGroup.position.y = walkBounce;
  leftLegPivot.rotation.x = walkSwing;
  rightLegPivot.rotation.x = -walkSwing;
  leftArmPivot.rotation.x = -walkSwing * 0.6;
  rightArmPivot.rotation.x = walkSwing * 0.35 - Math.max(0, chopSwing);
  rightArmPivot.rotation.z = -0.15 - Math.max(0, chopSwing) * 0.2;
  leftArmPivot.rotation.z = 0.08;
  torso.rotation.z = isMoving ? Math.sin(animationTime * 10) * 0.04 : 0;
  head.rotation.z = isMoving ? Math.sin(animationTime * 5) * 0.05 : 0;
}

function updateHud() {
  hud.innerHTML = `Wood ${woodCount}<br>Coins ${coins}<br>Hit Power ${hitPower}<br>${chopping ? "Chopping" : selling ? "Selling" : "Move near a tree"}`;
  upgradeButton.textContent = `Upgrade Hit (${upgradeCost})`;
}

function updateCamera(delta) {
  const targetPosition = player.position.clone().add(cameraOffset);
  camera.position.lerp(targetPosition, 4 * delta);
  camera.lookAt(player.position.x, 0.8, player.position.z);
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
  updateSelling();
  updateChopping(delta);
  updateLogs(delta);
  updateCharacterAnimation(delta);
  updateHud();
  updateCamera(delta);

  renderer.render(scene, camera);
}

animate();
