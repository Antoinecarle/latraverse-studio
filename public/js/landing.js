// ===== PARTICLE SYSTEM =====
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.3 + 0.05;
    this.isCopper = Math.random() > 0.7;
  }

  update() {
    // Subtle mouse influence
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 200) {
      const force = (200 - dist) / 200 * 0.02;
      this.speedX += dx * force * 0.01;
      this.speedY += dy * force * 0.01;
    }

    // Damping
    this.speedX *= 0.99;
    this.speedY *= 0.99;

    this.x += this.speedX;
    this.y += this.speedY;

    // Wrap around
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    if (this.isCopper) {
      ctx.fillStyle = `rgba(196, 98, 42, ${this.opacity})`;
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.5})`;
    }
    ctx.fill();
  }
}

// Init particles
const particleCount = Math.min(80, Math.floor(window.innerWidth * window.innerHeight / 15000));
for (let i = 0; i < particleCount; i++) {
  particles.push(new Particle());
}

// Draw connections
function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 120) {
        const opacity = (1 - dist / 120) * 0.06;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        if (particles[i].isCopper || particles[j].isCopper) {
          ctx.strokeStyle = `rgba(196, 98, 42, ${opacity})`;
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
        }
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawConnections();
  requestAnimationFrame(animate);
}
animate();

// ===== CURSOR =====
const cursorGlow = document.getElementById('cursorGlow');
const cursorDot = document.getElementById('cursorDot');

document.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top = e.clientY + 'px';
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top = e.clientY + 'px';
});

// Hover effect on interactive elements
document.querySelectorAll('a, button, [data-hover]').forEach(el => {
  el.addEventListener('mouseenter', () => cursorDot.classList.add('hovering'));
  el.addEventListener('mouseleave', () => cursorDot.classList.remove('hovering'));
});

// ===== PAGE TRANSITION =====
const enterBtn = document.getElementById('enterBtn');
const scene = document.getElementById('scene');

enterBtn.addEventListener('click', (e) => {
  e.preventDefault();
  scene.classList.add('leaving');
  setTimeout(() => {
    window.location.href = '/studio';
  }, 700);
});

// ===== KEYBOARD SHORTCUT =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    enterBtn.click();
  }
});
