// ===== RAD PIXEL RACER SETUP =====
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 640;
canvas.height = 400;
const ctx = canvas.getContext('2d');

let speed = 0;
const maxSpeed = 8;
let curve = 0;
let curveDelta = 0;
let futureCurve = 0;
let playerX = 0;
let roadOffset = 0;

const keyState = {};
window.addEventListener('keydown', e => keyState[e.key] = true);
window.addEventListener('keyup', e => keyState[e.key] = false);

const aiCars = [];
for (let i = 0; i < 5; i++) {
  aiCars.push({
    z: Math.random() * 800 + 200,
    x: (Math.random() - 0.5) * 2,
    speed: 2 + Math.random() * 3,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`
  });
}

const bgMusic = new Audio('assets/bg-music.mp3');
bgMusic.setAttribute('preload', 'auto');
bgMusic.setAttribute('playsinline', '');
bgMusic.loop = true;
bgMusic.volume = 0.5;

window.addEventListener('click', () => {
  bgMusic.volume = 0;
  bgMusic.play().then(() => {
    let fadeIn = setInterval(() => {
      if (bgMusic.volume < 0.5) {
        bgMusic.volume = Math.min(0.5, bgMusic.volume + 0.01);
      } else {
        clearInterval(fadeIn);
      }
    }, 100);
  }).catch(err => console.warn('🔇 Music play failed:', err));
}, { once: true });

const cityLights = [];
for (let i = 0; i < 50; i++) {
  cityLights.push([8, 24, 40].map(offsetY => {
    return {
      offsetY,
      color: Math.random() < 0.15 ? '#ffcc00' : '#333'
    };
  }));
}

const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: Math.random() * canvas.width, y: Math.random() * (canvas.height / 2), size: Math.random() * 2 });
}

const billboardText = ['NEON', '8BIT', 'TOKYO', 'RUSH'];
let cloudOffset = 0;

function drawStars() {
  ctx.fillStyle = '#fff';
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawCityscape() {
  for (let i = 0; i < 50; i++) {
    const x = i * 13;
    const height = 20 + (i % 5) * 10;
    const y = canvas.height / 2 - height;
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, 10, height);

    if (i % 10 === 0) {
      ctx.fillStyle = '#ff00ff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(billboardText[(i / 10) % billboardText.length], x - 2, y - 5);
    }

    cityLights[i].forEach(win => {
      ctx.fillStyle = win.color;
      ctx.fillRect(x + 2, y + win.offsetY, 6, 4);
    });
  }
}

function drawRoad() {
  const horizon = canvas.height / 2;
  const roadBottomWidth = 400;
  const roadTopWidth = 40;
  const roadHeight = canvas.height / 2;

  for (let i = 0; i < roadHeight; i++) {
    const scale = i / roadHeight;
    const y = horizon + i;
    const roadWidth = roadTopWidth + (roadBottomWidth - roadTopWidth) * scale;
    const perspective = Math.pow(1 - scale, 2);
    const dx = futureCurve * perspective;
    const centerX = canvas.width / 2 + dx;
    const left = centerX - roadWidth / 2;

    ctx.fillStyle = '#020';
    ctx.fillRect(0, y, canvas.width, 1);

    ctx.fillStyle = '#111';
    ctx.fillRect(left, y, roadWidth, 1);

    const markerSpacing = 20;
    const markerPosition = (roadOffset * scale * 0.5) % markerSpacing;
    if ((i + markerPosition) % markerSpacing < 2) {
      ctx.fillStyle = '#f0f';
      ctx.fillRect(centerX - 5, y, 10, 2);
    }
  }
}

function drawAICars() {
  const horizon = canvas.height / 2;
  const roadBottomWidth = 400;
  const roadTopWidth = 40;
  const roadHeight = canvas.height / 2;

  aiCars.forEach(car => {
    car.z -= speed - car.speed;
    if (car.z < 50 || car.z > 1000) {
      car.z = 1000 + Math.random() * 500;
      car.x = (Math.random() - 0.5) * 2;
      car.speed = 2 + Math.random() * 3;
      car.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
    }

    const scale = 300 / car.z;
    const y = horizon + roadHeight * scale;
    const roadWidth = roadTopWidth + (roadBottomWidth - roadTopWidth) * scale;
    const dx = futureCurve * Math.pow(1 - scale, 2);
    const centerX = canvas.width / 2 + dx + car.x * roadWidth * 0.5;
    const width = 30 * scale;
    const height = 15 * scale;

    if (y < canvas.height && y > horizon) {
      ctx.fillStyle = car.color;
      ctx.fillRect(centerX - width / 2, y - height, width, height);
    }

    const playerZ = 100;
    const playerScale = 300 / playerZ;
    const playerWidth = 30 * playerScale;
    const playerCenterX = canvas.width / 2 + playerX * roadBottomWidth * 0.25;
    if (Math.abs(car.z - playerZ) < 30 && Math.abs(centerX - playerCenterX) < (playerWidth / 2 + width / 2)) {
      const direction = car.x > playerX ? 1 : -1;
      car.x += direction * 0.1;
      playerX -= direction * 0.05;
      speed = Math.max(speed - 0.1, 0);
    }
  });
}

function drawCar() {
  const roadWidth = 400;
  const centerX = canvas.width / 2 + playerX * roadWidth * 0.25;
  ctx.fillStyle = '#F00';
  ctx.fillRect(centerX - 15, canvas.height - 60, 30, 20);
  ctx.fillStyle = '#000';
  ctx.fillRect(centerX - 10, canvas.height - 55, 20, 10);
}

function drawDashboard() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

  ctx.fillStyle = '#0f0';
  ctx.font = '16px monospace';
  ctx.fillText(`Speed: ${speed.toFixed(1)}`, 10, canvas.height - 15);
  ctx.fillText(`Curve: ${Math.floor(curve)}`, 200, canvas.height - 15);
}

let curveTimer = Math.floor(60 * 20 + Math.random() * 60 * 25);
let curveTarget = 0;

function update() {
  if (keyState['ArrowUp']) speed = Math.min(speed + 0.1, maxSpeed);
  if (keyState['ArrowDown']) speed = Math.max(speed - 0.1, 0);
  if (keyState['ArrowLeft']) playerX = Math.max(-1, playerX - 0.05);
  if (keyState['ArrowRight']) playerX = Math.min(1, playerX + 0.05);

  curveTimer--;
  if (curveTimer <= 0) {
    const bend = (Math.random() > 0.5 ? 1 : -1) * 1.5;
    curveTarget = bend;
    curveTimer = Math.floor(60 * 20 + Math.random() * 60 * 25);
  } else {
    curveTarget *= 0.98;
    if (Math.abs(curveTarget) < 0.1) curveTarget = 0;
  }
  curveDelta += (curveTarget - curveDelta) * 0.05;
  curve += curveDelta;
  futureCurve += (curve - futureCurve) * 0.1;

  roadOffset += speed * 2;
}

function drawClouds() {
  cloudOffset += 0.2;
  ctx.fillStyle = '#444';
  for (let i = 0; i < 3; i++) {
    const x = (i * 250 - cloudOffset % 250);
    const y = 30 + 10 * Math.sin((cloudOffset + i * 50) * 0.01);
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 15, y + 5, 15, 0, Math.PI * 2);
    ctx.arc(x + 30, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function render() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
  gradient.addColorStop(0, '#000022');
  gradient.addColorStop(1, '#110033');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

  drawStars();
  drawClouds();
  drawCityscape();
  drawRoad();
  drawAICars();
  drawCar();
  drawDashboard();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

loop();
