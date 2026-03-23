import * as THREE from "three";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x24103a);
scene.fog = new THREE.Fog(0x24103a, 20, 60);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Player sphere
const sphereRadius = 1;
const geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
const material = new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.3, roughness: 0.4 });
const player = new THREE.Mesh(geometry, material);
player.position.set(0, sphereRadius, 0);
scene.add(player);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 200),
  new THREE.MeshStandardMaterial({ color: 0x3a2450, roughness: 0.9, metalness: 0.05 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.z = 70;
scene.add(ground);

// Track guides
const guideMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4ca3, emissive: 0x221133, roughness: 0.6 });
for (let i = 0; i < 10; i++) {
  const guide = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 6), guideMaterial);
  guide.position.set(-4, 0.15, i * 12);
  scene.add(guide);

  const guide2 = guide.clone();
  guide2.position.x = 4;
  scene.add(guide2);
}

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 4);
scene.add(directionalLight);

const rimLight = new THREE.PointLight(0xaa66ff, 15, 40);
rimLight.position.set(0, 6, -6);
scene.add(rimLight);

// State
const clock = new THREE.Clock();
let forwardSpeed = 8;

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function updatePlayer(delta) {
  player.position.z += forwardSpeed * delta;
  player.rotation.x -= (forwardSpeed / sphereRadius) * delta;
}

function updateCamera(delta) {
  const targetPosition = new THREE.Vector3(
    player.position.x,
    player.position.y + 3.2,
    player.position.z - 7
  );

  camera.position.lerp(targetPosition, 4 * delta);
  camera.lookAt(player.position.x, player.position.y + 0.8, player.position.z + 8);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  updatePlayer(delta);
  updateCamera(delta);

  renderer.render(scene, camera);
}

animate();
