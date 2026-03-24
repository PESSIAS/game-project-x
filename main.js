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
hint.style.maxWidth = "300px";
hint.style.color = "#d9cfff";
hint.style.fontFamily = "Arial, sans-serif";
hint.style.fontSize = "14px";
hint.style.lineHeight = "1.4";
hint.style.textAlign = "right";
hint.style.textShadow = "0 2px 12px rgba(0,0,0,0.45)";
hint.style.zIndex = "10";
hint.innerHTML = "Visual baseline restored.<br>Next step is rebuilding collisions without black-screen regressions.";
document.body.appendChild(hint);

scene.add(new THREE.AmbientLight(0xffffff, 0.72));
const sunLight = new THREE.DirectionalLight(0xffffff, 1.15);
sunLight.position.set(12, 18, 8);
scene.add(sunLight);

const fillLight = new THREE.PointLight(0x8844ff, 20, 100);
fillLight.position.set(0, 12, -8);
scene.add(fillLight);

const world = new THREE.Group();
scene.add(world);

function addBox(width, height, depth, x, y, z, color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.04 })
  );
  mesh.position.set(x, y, z);
  world.add(mesh);
}

function addRampVisual(side, z, width, length, topY, bottomY, color) {
  const height = topY - bottomY;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  geometry.rotateY(Math.PI);

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: 0.55, emissive: new THREE.Color(color).multiplyScalar(0.12) })
  );

  if (side === "left") {
    mesh.scale.x = -1;
    mesh.position.set(0, bottomY, z - length / 2);
  } else {
    mesh.position.set(0, bottomY, z + length / 2);
  }

  world.add(mesh);
}

addBox(12, 0.8, 12, 0, 5.2, -28, 0x4d356f);
addRampVisual("left", 6, 8, 28, 2.4, 0.2, 0x35d0ff);
addBox(10, 0.8, 10, 0, 0.2, 34, 0x4d356f);
addRampVisual("right", 62, 8, 24, 1.6, 0.2, 0xff58d2);
addBox(14, 0.8, 12, 0, 0.2, 96, 0x9cff7a);

for (let z = -20; z <= 96; z += 10) {
  addBox(0.24, 0.45, 4, -8, 0.22, z, 0x9578e7);
  addBox(0.24, 0.45, 4, 8, 0.22, z, 0x9578e7);
}

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
player.position.set(-2.6, 7.0, -28);
scene.add(player);

const trail = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.16, 3.2, 12),
  new THREE.MeshBasicMaterial({ color: 0xffd95a, transparent: true, opacity: 0.28 })
);
trail.rotation.x = Math.PI / 2;
scene.add(trail);

const clock = new THREE.Clock();
let bobTime = 0;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.033);
  bobTime += delta;

  player.position.y = 7.0 + Math.sin(bobTime * 2) * 0.15;
  player.rotation.x += delta * 1.5;
  player.rotation.y += delta * 1.2;

  trail.position.copy(player.position);
  trail.position.z -= 1.8;
  trail.position.y += 0.1;

  camera.position.lerp(new THREE.Vector3(0, 9, -40), 2.5 * delta);
  camera.lookAt(0, 1.5, 24);

  hud.innerHTML = `Baseline restored<br>Black screen fixed<br>Rebuilding gameplay next`;

  renderer.render(scene, camera);
}

animate();
