// scrollytelling.js — IntersectionObserver-based scroll trigger
// Dispatches 'section:entered' custom events and manages the spider-web hero canvas

/* ---- Section visibility (fade-in on scroll) ---- */
export function initScrollObserver() {
  const sections = document.querySelectorAll('.scroll-section');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.dispatchEvent(
            new CustomEvent('section:entered', { bubbles: true })
          );
          // Keep observing so re-entering re-fires (for up-scroll replay)
        } else {
          // Allow re-animation when scrolling back up
          entry.target.classList.remove('visible');
        }
      });
    },
    { threshold: 0.18 }
  );

  sections.forEach(s => observer.observe(s));
}

/* ---- Hero spider-web canvas animation ---- */
export function initWebCanvas() {
  const canvas = document.getElementById('web-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Web node positions — radiate from center
  const NODE_COUNT = 28;
  const RING_COUNT = 5;
  let nodes = [];
  let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

  function buildNodes() {
    nodes = [];
    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;
    const maxR = Math.min(canvas.width, canvas.height) * 0.52;

    for (let ring = 1; ring <= RING_COUNT; ring++) {
      const r = (ring / RING_COUNT) * maxR;
      const count = ring * 5 + 2;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        nodes.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          ring,
          angle,
          vx: 0, vy: 0,
          ox: cx + Math.cos(angle) * r,
          oy: cy + Math.sin(angle) * r,
        });
      }
    }
    // Center node
    nodes.push({ x: cx, y: cy, ring: 0, angle: 0, vx: 0, vy: 0, ox: cx, oy: cy });
  }
  buildNodes();

  window.addEventListener('resize', () => { resize(); buildNodes(); });
  window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  function drawWeb() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;

    // Gently attract nodes back to origin, repel from mouse
    nodes.forEach(n => {
      const dx = mouse.x - n.x;
      const dy = mouse.y - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) {
        n.vx -= (dx / dist) * 0.4;
        n.vy -= (dy / dist) * 0.4;
      }
      n.vx += (n.ox - n.x) * 0.04;
      n.vy += (n.oy - n.y) * 0.04;
      n.vx *= 0.88;
      n.vy *= 0.88;
      n.x += n.vx;
      n.y += n.vy;
    });

    // Draw radial lines from center
    const center = nodes[nodes.length - 1];
    nodes.slice(0, -1).forEach(n => {
      if (n.ring === 1) {
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    });

    // Draw ring connections between same-ring nodes with close angles
    for (let ring = 1; ring <= RING_COUNT; ring++) {
      const ringNodes = nodes.filter(n => n.ring === ring)
        .sort((a, b) => a.angle - b.angle);
      for (let i = 0; i < ringNodes.length; i++) {
        const a = ringNodes[i];
        const b = ringNodes[(i + 1) % ringNodes.length];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        const alpha = 0.12 + (ring / RING_COUNT) * 0.12;
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    // Draw extended radial spokes through all rings
    for (let ring = 2; ring <= RING_COUNT; ring++) {
      const prev = nodes.filter(n => n.ring === ring - 1);
      const curr = nodes.filter(n => n.ring === ring);
      curr.forEach(c => {
        // Connect to closest node in previous ring
        let closest = prev[0];
        let minD = Infinity;
        prev.forEach(p => {
          const d = Math.abs(p.angle - c.angle);
          if (d < minD) { minD = d; closest = p; }
        });
        ctx.beginPath();
        ctx.moveTo(closest.x, closest.y);
        ctx.lineTo(c.x, c.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
    }

    requestAnimationFrame(drawWeb);
  }

  drawWeb();
}
