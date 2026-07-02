/* ═══════════════════════════════════════════
   CAN Protocol Explorer — Main JavaScript
   ═══════════════════════════════════════════ */

// ── PARTICLE BG CANVAS ──
(function() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.25;
      this.speedY = (Math.random() - 0.5) * 0.25;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.color = ['#6EE7F7','#A78BFA','#34D399','#FB923C','#F472B6'][Math.floor(Math.random()*5)];
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // init
  for (let i = 0; i < 120; i++) particles.push(new Particle());

  // draw connections
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          ctx.save();
          ctx.globalAlpha = (1 - dist/100) * 0.08;
          ctx.strokeStyle = '#6EE7F7';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(loop);
  }
  loop();
})();

// ── SCROLL REVEAL ──
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });
revealEls.forEach(el => revealObs.observe(el));

// ── NAV HIGHLIGHT ON SCROLL ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.mem-link');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navLinks.forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === '#' + current) a.classList.add('active');
  });
});

// ── CHAOS WIRES (Before CAN) ──
function buildChaosWires() {
  const container = document.getElementById('chaosWires');
  if (!container) return;
  const colors = ['#F87171','#FB923C','#FBBF24','#A78BFA','#6EE7F7','#34D399','#F472B6'];
  for (let i = 0; i < 14; i++) {
    const line = document.createElement('div');
    line.className = 'chaos-wire-line';
    Object.assign(line.style, {
      width: (40 + Math.random() * 60) + '%',
      top: (Math.random() * 90) + '%',
      left: (Math.random() * 20) + '%',
      background: colors[i % colors.length],
      opacity: '0.5',
      transform: `rotate(${(Math.random()-0.5)*30}deg)`,
      animationDelay: (Math.random() * 2) + 's',
      animationDuration: (1.5 + Math.random()) + 's'
    });
    container.appendChild(line);
  }
}
buildChaosWires();

// ── BITSTREAM SIMULATION ──
function buildBitStream() {
  const track = document.getElementById('bsTrack');
  if (!track) return;
  // A realistic CAN frame bit pattern
  const frameBits = [
    0, // SOF
    0,0,1,0,0,0,0,0,0,0,0, // ID: 0x100
    0, // RTR
    0,0,0,0,1,0, // CTRL (DLC=2)
    0,0,0,0,1,0,1,1,1,0,1,1,1,0,0,0, // DATA 2 bytes
    1,0,1,0,0,0,1,1,0,1,0,0,1,1,1, // CRC
    1,0, // CRC delimiter + ACK
    1,1,1,1,1,1,1  // EOF
  ];

  let idx = 0;
  function addBit() {
    if (idx >= frameBits.length) {
      idx = 0;
      track.innerHTML = '';
    }
    const bit = frameBits[idx++];
    const el = document.createElement('div');
    el.className = 'bs-bit ' + (bit === 0 ? 'bit-zero' : 'bit-one');
    el.textContent = bit;
    track.appendChild(el);
    // keep max 50 bits visible
    while (track.children.length > 50) track.removeChild(track.firstChild);
  }

  setInterval(addBit, 150);
}
buildBitStream();

// ── FRAME FIELD HOVER TOOLTIP ──
(function() {
  const ffs = document.querySelectorAll('.ff');
  const tooltip = document.getElementById('ffTooltip');
  if (!tooltip) return;
  ffs.forEach(ff => {
    ff.addEventListener('mouseenter', () => {
      tooltip.textContent = ff.getAttribute('data-tip');
      tooltip.classList.add('active');
    });
    ff.addEventListener('mouseleave', () => {
      tooltip.textContent = '👆 Hover a field to learn what it does';
      tooltip.classList.remove('active');
    });
  });
})();

// ── INTERACTIVE MESSAGE DEMO ──
const logicMap = {
  engine: {
    dash:   { status: '🖥️ Speed shown: 80 km/h', relevant: true },
    gear:   { status: '⚙️ Gear adjusted for RPM', relevant: true },
    ab:     { status: '⬛ Ignore (not relevant)', relevant: false },
    engine: { status: '⬛ Own msg (not received)', relevant: false }
  },
  brake: {
    dash:   { status: '🖥️ Brake indicator lit', relevant: true },
    gear:   { status: '⬛ Ignore', relevant: false },
    ab:     { status: '🛡️ Brake data logged', relevant: true },
    engine: { status: '⚙️ Reduce throttle', relevant: true }
  },
  airbag: {
    dash:   { status: '🔴 CRASH ALERT shown!', relevant: true },
    gear:   { status: '⬛ Ignore', relevant: false },
    ab:     { status: '💥 Airbag deploying!', relevant: true },
    engine: { status: '⚙️ Emergency cutoff!', relevant: true }
  }
};

function sendMsg(sender, id, data, color) {
  const log = document.getElementById('msgLog');
  const packet = document.getElementById('demoPacket');
  if (!log || !packet) return;

  // animate packet
  packet.style.display = 'block';
  packet.style.background = color;
  packet.style.boxShadow = '0 0 12px ' + color;
  packet.style.animation = 'none';
  void packet.offsetWidth;
  packet.style.animation = 'demoTravel 0.8s ease-in-out forwards';

  // log
  const line = document.createElement('div');
  line.className = 'log-line';
  line.textContent = `[${new Date().toLocaleTimeString()}] ${sender.toUpperCase()} → ID:${id} DATA:${data}`;
  if (log.firstChild && log.firstChild.classList && log.firstChild.classList.contains('log-placeholder')) {
    log.innerHTML = '';
  }
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;

  // update receivers
  const map = logicMap[sender] || {};
  const ids = ['dash','gear','ab','engine'];
  const names = { dash:'rd-status', gear:'rg-status', ab:'ra-status', engine:'re-status' };
  const recvIds = { dash:'recv-dash', gear:'recv-gear', ab:'recv-ab', engine:'recv-engine' };

  ids.forEach(id => {
    const info = map[id] || { status: '⬛ Ignore', relevant: false };
    const statusEl = document.getElementById(names[id]);
    const recvEl   = document.getElementById(recvIds[id]);
    if (statusEl) statusEl.textContent = info.status;
    if (recvEl) {
      recvEl.classList.toggle('lit', info.relevant);
      setTimeout(() => recvEl.classList.remove('lit'), 2500);
    }
  });

  setTimeout(() => { packet.style.display = 'none'; }, 900);
}
window.sendMsg = sendMsg;

// ── ARBITRATION DEMO ──
const airbagId = [0,0,0,0,1,0,1,0,0,0,0]; // 0x050
const radioId  = [1,1,1,1,1,1,1,1,1,1,1]; // 0x3FF

window.runArbitration = function() {
  const aRow = document.getElementById('airbagBits');
  const rRow = document.getElementById('radioBits');
  const bRow = document.getElementById('busBits');
  const aRes = document.getElementById('airbagResult');
  const rRes = document.getElementById('radioResult');
  const btn  = document.getElementById('arbBtn');
  if (!aRow) return;

  aRow.innerHTML = '';
  rRow.innerHTML = '';
  bRow.innerHTML = '';
  aRes.textContent = 'Transmitting…';
  rRes.textContent = 'Transmitting…';
  btn.disabled = true;
  btn.textContent = '⏳ Running…';

  let i = 0;
  let airbagLost = false;

  function stepBit() {
    if (i >= airbagId.length) {
      // Result
      aRes.textContent = '🏆 WON — lower ID wins arbitration!';
      aRes.style.color = '#34D399';
      rRes.textContent = '🚫 LOST — backs off, will retry later';
      rRes.style.color = '#F87171';
      btn.disabled = false;
      btn.textContent = '↺ Run Again';
      return;
    }

    const ab = airbagId[i];
    const rb = radioId[i];
    // Wired-AND: if either is dominant (0), bus = 0
    const bus = (ab === 0 || rb === 0) ? 0 : 1;

    const makeChip = (val, winner) => {
      const el = document.createElement('div');
      el.className = 'ab ' + (val === 0 ? 'ab-d' : 'ab-r');
      el.textContent = val;
      if (winner) el.classList.add('ab-win');
      return el;
    };

    aRow.appendChild(makeChip(ab, !airbagLost && ab === 0));
    rRow.appendChild(makeChip(rb, false));
    bRow.appendChild(makeChip(bus, false));

    // Radio loses when it sends 1 but bus is 0
    if (!airbagLost && rb === 1 && bus === 0 && ab === 0) {
      airbagLost = true; // from radio perspective
      rRes.textContent = '🚫 Bit mismatch! Backing off…';
      rRes.style.color = '#F87171';
    }

    i++;
    setTimeout(stepBit, 400);
  }
  stepBit();
};

// ── FILE UPLOAD HANDLER ──
function handleFileChosen(input) {
  const name = document.getElementById('chosenName');
  const btn  = document.getElementById('uploadBtn');
  if (!name || !btn) return;
  if (input.files.length > 0) {
    name.textContent = '📄 ' + input.files[0].name;
    btn.style.display = 'inline-block';
  }
}
window.handleFileChosen = handleFileChosen;

// Drag and drop
const uploadZone = document.getElementById('uploadZone');
if (uploadZone) {
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const fi = document.getElementById('fileInput');
    if (fi && e.dataTransfer.files.length) {
      // create DataTransfer to assign files
      const dt = new DataTransfer();
      dt.items.add(e.dataTransfer.files[0]);
      fi.files = dt.files;
      handleFileChosen(fi);
    }
  });
}

// ── SMOOTH NAV SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── STAT COUNTER (hero) ──
function countUp(el, target, suffix) {
  let current = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) {
      el.textContent = target + suffix;
      clearInterval(timer);
    }
  }, 20);
}
// Hero stats not present in this version, but wired up if added
