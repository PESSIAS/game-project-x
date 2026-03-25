import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87c77b);
scene.fog = new THREE.Fog(0x87c77b, 18, 36);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 14, 10);
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
hint.style.maxWidth = "260px";
hint.style.color = "#ffffff";
hint.style.fontFamily = "Arial, sans-serif";
hint.style.fontSize = "14px";
hint.style.lineHeight = "1.4";
hint.style.textAlign = "right";
hint.style.textShadow = "0 2px 8px rgba(0,0,0,0.35)";
hint.style.zIndex = "10";
hint.innerHTML = "Move with joystick or WASD.<br>Trees inside the white ring get chopped automatically.";
document.body.appendChild(hint);

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

const playerGroup = new THREE.Group();
scene.add(playerGroup);

const body = new THREE.Mesh(
  new THREE.CylinderGeometry(0.45, 0.55, 1.1, 16),
  new THREE.MeshStandardMaterial({ color: 0x4a7bd1, roughness: 0.8 })
);
body.position.y = 0.55;
playerGroup.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.32, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xf0d0b0, roughness: 0.9 })
);
head.position.y = 1.3;
playerGroup.add(head);

const axe = new THREE.Mesh(
  new THREE.BoxGeometry(0.08, 0.7, 0.08),
  new THREE.MeshStandardMaterial({ color: 0x7b4b2a, roughness: 0.8 })
);
axe.position.set(0.42, 0.65, 0);
playerGroup.add(axe);

const axeHead = new THREE.Mesh(
  new THREE.BoxGeometry(0.22, 0.16, 0.08),
  new THREE.MeshStandardMaterial({ color: 0xd8dde5, roughness: 0.35, metalness: 0.6 })
);
axeHead.position.set(0.32, 0.95, 0);
playerGroup.add(axeHead);

const chopRange = new THREE.Mesh(
  new THREE.RingGeometry(1.9, 2.05, 48),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
);
chopRange.rotation.x = -Math.PI / 2;
chopRange.position.y = 0.02;
playerGroup.add(chopRange);

const trees = [];
const logs = [];
let woodCount = 0;
let chopTimer = 0;
let chopping = false;

function createTree(x, z) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.3, 1.4, 10),
    new THREE.MeshStandardMaterial({ color: 0x7a4b25, roughness: 1 })
  );
  trunk.position.y = 0.7;
  tree.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0x2f8f3a, roughness: 1 })
  );
  crown.position.y = 1.8;
  tree.add(crown);

  tree.position.set(x, 0, z);
  scene.add(tree);

  trees.push({ mesh: tree, health: 5, maxHealth: 5, x, z });
}

function spawnLog(x, z) {
  const log = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x9a6232, roughness: 1 })
  );
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

function getMoveInput() {
  const x = Math.abs(input.x) > 0.01 ? input.x : (keyboard.right ? 1 : 0) - (keyboard.left ? 1 : 0);
  const y = Math.abs(input.y) > 0.01 ? input.y : (keyboard.down ? 1 : 0) - (keyboard.up ? 1 : 0);
  return new THREE.Vector2(x, y);
}

function updatePlayer(delta) {
  const move = getMoveInput();
  if (move.lengthSq() > 1) move.normalize();

  player.position.x += move.x * player.speed * delta;
  player.position.z += move.y * player.speed * delta;

  const maxRadius = 12;
  const distFromCenter = Math.hypot(player.position.x, player.position.z);
  if (distFromCenter > maxRadius) {
    const scale = maxRadius / distFromCenter;
    player.position.x *= scale;
    player.position.z *= scale;
  }

  playerGroup.position.copy(player.position);

  if (move.lengthSq() > 0.001) {
    playerGroup.rotation.y = Math.atan2(move.x, move.y);
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
    axe.rotation.z = Math.sin(chopTimer * 20) * 0.6;
    axeHead.rotation.z = axe.rotation.z;

    if (chopTimer >= 0.45) {
      chopTimer = 0;
      closestTree.health -= 1;
      closestTree.mesh.scale.setScalar(0.96);

      if (closestTree.health <= 0) {
        scene.remove(closestTree.mesh);
        const index = trees.indexOf(closestTree);
        if (index >= 0) trees.splice(index, 1);
        spawnLog(closestTree.x + (Math.random() - 0.5) * 0.6, closestTree.z + (Math.random() - 0.5) * 0.6);
        woodCount += 1;
      }
    }
  } else {
    chopTimer = 0;
    chopRange.scale.setScalar(1);
    axe.rotation.z = 0;
    axeHead.rotation.z = 0;
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

function updateHud() {
  hud.innerHTML = `Wood ${woodCount}<br>Trees ${trees.length}<br>${chopping ? "Chopping" : "Move near a tree"}`;
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
  updateChopping(delta);
  updateLogs(delta);
  updateHud();

  renderer.render(scene, camera);
}

animate();
