/* HH Goa 2026 Frame / ID Card Generator — Studio Edition */

const BRAND = {
  primary: '#0B6839',
  accent: '#FEE101',
  accentAlt: '#EDD723',
  pink: '#FF0080',
  offwhite: '#FFFBE8',
  white: '#FFFFFF',
  black: '#111111',
};

const BUILDER_TITLES = [
  'Terminal Titan', 'Ship Captain', 'Beach Coder', 'Stack Surfer',
  'Midnight Merger', 'Goa Glitch', 'Chain Architect', 'Prompt Pirate',
  'Deploy Druid', 'Merge Maestro', 'Crypto Cartographer', 'AI Alchemist',
  'Bug Whisperer', 'Protocol Paladin', 'Full-Stack Nomad', 'Demo Day Demon',
  'Fiber Philosopher', 'On-Chain Oracle', 'Build Station Boss', 'NGMI Never',
];

const STACKS = [
  'Frontend', 'Backend', 'Full Stack', 'Smart Contracts', 'AI/ML',
  'DevOps', 'Design', 'Product', 'Mobile', 'Data', 'Security', 'Other',
];

let currentFormat = 'frame'; // 'frame' or 'idcard'
let currentVariant = '1'; // '1', '2', '3'
let uploadedImage = null;
let previewObjectUrl = null;
let builderTitle = randomTitle();
let logoImg = null;
let decoImg = null;
let barcodeImg = null;

const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const uploadPreview = document.getElementById('upload-preview');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const canvas = document.getElementById('output-canvas');
const ctx = canvas.getContext('2d');
const previewPlaceholder = document.getElementById('preview-placeholder');

// Steps
const step02 = document.getElementById('step-02');
const step03 = document.getElementById('step-03');
const frameSelectorContainer = document.getElementById('frame-selector-container');
const actionStatus = document.getElementById('action-status');
const canvasWrap = document.querySelector('.canvas-wrap');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Controls
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const statusMsg = document.getElementById('status-msg');
const builderTitleEl = document.getElementById('builder-title');
const rerollBtn = document.getElementById('reroll-title');
const nameInput = document.getElementById('name-input');
const stackInput = document.getElementById('stack-input');

function randomTitle() {
  return BUILDER_TITLES[Math.floor(Math.random() * BUILDER_TITLES.length)];
}

function setStatus(msg) {
  if(statusMsg) statusMsg.textContent = msg;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function initAssets() {
  try {
    [logoImg, decoImg] = await Promise.all([
      loadImage('assets/2-47.svg'),
      loadImage('assets/036-vector-54-3934.svg'),
    ]);
  } catch {
    logoImg = null;
    decoImg = null;
  }
}

// ---- Canvas Helpers ----

function drawCoverImage(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStripePattern(ctx, x, y, w, h, color, spacing = 12, lw = 3) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  for (let i = -h; i < w + h; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + h, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCropMarks(ctx, x, y, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Top Left
  ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y);
  ctx.stroke();
}

// ---- Variants Rendering (PFP) ----

function drawFramePFP(img, variant) {
  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  
  if (variant === '1') {
    // 01: Clean HH Composition (Green/Yellow/Pink)
    const frameWidth = 90;
    const inner = size - frameWidth * 2;
    ctx.fillStyle = BRAND.primary;
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    drawRoundedRect(ctx, frameWidth, frameWidth, inner, inner, 24);
    ctx.clip();
    drawCoverImage(ctx, img, frameWidth, frameWidth, inner, inner);
    ctx.restore();

    ctx.strokeStyle = BRAND.accent;
    ctx.lineWidth = 8;
    drawRoundedRect(ctx, frameWidth - 4, frameWidth - 4, inner + 8, inner + 8, 28);
    ctx.stroke();

    ctx.strokeStyle = BRAND.pink;
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, frameWidth / 2, frameWidth / 2, size - frameWidth, size - frameWidth, 36);
    ctx.stroke();

    drawStripePattern(ctx, 0, 0, size, frameWidth, BRAND.accent);
    drawStripePattern(ctx, 0, size - frameWidth, size, frameWidth, BRAND.accent);
    drawStripePattern(ctx, 0, 0, frameWidth, size, BRAND.accentAlt);
    drawStripePattern(ctx, size - frameWidth, 0, frameWidth, size, BRAND.accentAlt);

    ctx.fillStyle = BRAND.primary;
    ctx.fillRect(frameWidth, 0, size - frameWidth * 2, 28);
    ctx.fillRect(frameWidth, size - 28, size - frameWidth * 2, 28);

    ctx.font = '700 28px Imbue, serif';
    ctx.fillStyle = BRAND.accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HACKER HOUSE GOA 2026', size / 2, 14);
    ctx.fillText('GOA · 28–31 OCT', size / 2, size - 14);

    ctx.font = '700 22px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.pink;
    ctx.fillText('#FrameInGoa', size / 2, frameWidth / 2 + 4);

  } else if (variant === '2') {
    // 02: Experimental (Black, Pink, Technical)
    const frameWidth = 60;
    const inner = size - frameWidth * 2;
    ctx.fillStyle = BRAND.black;
    ctx.fillRect(0, 0, size, size);
    
    // Diagonal background pattern
    drawStripePattern(ctx, 0, 0, size, size, 'rgba(255, 0, 128, 0.1)', 24, 1);

    ctx.save();
    drawCoverImage(ctx, img, frameWidth, frameWidth, inner, inner);
    ctx.restore();
    
    ctx.strokeStyle = BRAND.pink;
    ctx.lineWidth = 12;
    ctx.strokeRect(frameWidth, frameWidth, inner, inner);
    
    ctx.font = '900 48px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.pink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('HHGOA', 20, 20);
    
    ctx.textAlign = 'right';
    ctx.fillText('2026', size - 20, 20);
    
    ctx.font = '400 20px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.white;
    ctx.fillText('VAR/02 :: EXP', size - 20, size - 40);
    ctx.textAlign = 'left';
    ctx.fillText('#FrameInGoa', 20, size - 40);
    
    // Crop marks
    drawCropMarks(ctx, 10, 10, 30, BRAND.white);
    ctx.save(); ctx.translate(size, 0); ctx.rotate(Math.PI/2); drawCropMarks(ctx, 10, -10, 30, BRAND.white); ctx.restore();

  } else {
    // 03: Minimal (Offwhite, Green)
    const frameWidth = 40;
    const inner = size - frameWidth * 2;
    ctx.fillStyle = BRAND.offwhite;
    ctx.fillRect(0, 0, size, size);
    
    ctx.save();
    drawCoverImage(ctx, img, frameWidth, frameWidth, inner, inner);
    ctx.restore();
    
    ctx.strokeStyle = BRAND.primary;
    ctx.lineWidth = 2;
    ctx.strokeRect(frameWidth - 10, frameWidth - 10, inner + 20, inner + 20);
    
    ctx.font = '700 32px Imbue, serif';
    ctx.fillStyle = BRAND.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('HACKER HOUSE GOA', size / 2, size - 10);
    
    ctx.font = '600 16px "Victor Mono", monospace';
    ctx.fillText('#FrameInGoa', size / 2, 25);
  }
}

// ---- Variants Rendering (Builder ID) ----

function drawBuilderID(img, name, stack, variant) {
  const w = 1080;
  const h = 1920;
  canvas.width = w;
  canvas.height = h;

  const displayName = (name || 'Builder').toUpperCase();
  const displayStack = (stack || 'Full Stack').toUpperCase();
  const dateStr = '28–31 OCT 2026';
  const idNumber = 'HH26 / ' + Math.floor(10000 + Math.random() * 90000);

  if (variant === '1') {
    // 01: Clean HH (Brand Colors)
    ctx.fillStyle = BRAND.offwhite;
    ctx.fillRect(0, 0, w, h);

    const headerH = 280;
    ctx.fillStyle = BRAND.primary;
    ctx.fillRect(0, 0, w, headerH);
    drawStripePattern(ctx, 0, headerH - 18, w, 18, BRAND.accent);

    ctx.font = '700 72px Imbue, serif';
    ctx.fillStyle = BRAND.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('HACKER HOUSE', w / 2, 48);
    ctx.fillText('GOA 2026', w / 2, 130);

    ctx.font = '600 24px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.accent;
    ctx.fillText('GOA, INDIA · ' + dateStr, w / 2, 220);

    const photoSize = 680;
    const photoX = (w - photoSize) / 2;
    const photoY = headerH + 60;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    drawRoundedRect(ctx, photoX, photoY, photoSize, photoSize, 32);
    ctx.fillStyle = BRAND.white;
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawRoundedRect(ctx, photoX + 12, photoY + 12, photoSize - 24, photoSize - 24, 24);
    ctx.clip();
    drawCoverImage(ctx, img, photoX + 12, photoY + 12, photoSize - 24, photoSize - 24);
    ctx.restore();

    ctx.strokeStyle = BRAND.pink;
    ctx.lineWidth = 6;
    drawRoundedRect(ctx, photoX - 4, photoY - 4, photoSize + 8, photoSize + 8, 36);
    ctx.stroke();

    const infoY = photoY + photoSize + 70;
    ctx.font = '700 80px Imbue, serif';
    ctx.fillStyle = BRAND.primary;
    ctx.textAlign = 'center';
    ctx.fillText(displayName, w / 2, infoY);

    ctx.font = '600 32px "Victor Mono", monospace';
    ctx.fillStyle = '#333';
    ctx.fillText(displayStack, w / 2, infoY + 100);

    // Title badge
    const badgeW = Math.min(w - 120, ctx.measureText(builderTitle).width + 80);
    const badgeH = 72;
    const badgeX = (w - badgeW) / 2;
    const badgeY = infoY + 170;
    ctx.fillStyle = BRAND.accent;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fill();

    ctx.font = '700 28px Imbue, serif';
    ctx.fillStyle = BRAND.primary;
    ctx.fillText(builderTitle.toUpperCase(), w / 2, badgeY + 22);

    ctx.font = '600 22px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.pink;
    ctx.fillText('BUILDER ID · ' + idNumber, w / 2, badgeY + badgeH + 50);
    ctx.fillText('STATUS: ACTIVE', w / 2, badgeY + badgeH + 90);

    const footerY = h - 160;
    ctx.fillStyle = BRAND.primary;
    ctx.fillRect(0, footerY, w, 160);
    drawStripePattern(ctx, 0, footerY, w, 14, BRAND.accentAlt);

    ctx.font = '700 36px Imbue, serif';
    ctx.fillStyle = BRAND.accent;
    ctx.fillText('4 DAYS. ONE RHYTHM.', w / 2, footerY + 40);
    ctx.font = '600 20px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.white;
    ctx.fillText('#FrameInGoa · hhgoa.com', w / 2, footerY + 100);

  } else if (variant === '2') {
    // 02: Experimental (Black bg, pink/yellow accents, technical layout)
    ctx.fillStyle = BRAND.black;
    ctx.fillRect(0, 0, w, h);
    drawStripePattern(ctx, 0, 0, w, h, 'rgba(255, 0, 128, 0.05)', 40, 2);

    ctx.strokeStyle = BRAND.pink;
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, w - 80, h - 80);
    
    // Top markings
    ctx.font = '600 24px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.accent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ID: ' + idNumber, 60, 60);
    ctx.textAlign = 'right';
    ctx.fillText('DATE: 28.10.26', w - 60, 60);

    const photoSize = 700;
    const photoX = (w - photoSize) / 2;
    const photoY = 200;
    
    ctx.save();
    drawCoverImage(ctx, img, photoX, photoY, photoSize, photoSize);
    // Overlay scanline effect on photo
    for(let i=0; i<photoSize; i+=10) {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(photoX, photoY+i, photoSize, 2);
    }
    ctx.restore();
    
    ctx.strokeStyle = BRAND.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX - 15, photoY - 15, photoSize + 30, photoSize + 30);
    
    const infoY = photoY + photoSize + 80;
    ctx.font = '900 110px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.pink;
    ctx.textAlign = 'left';
    ctx.fillText(displayName.substring(0, 15), 60, infoY);
    
    ctx.font = '600 40px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.white;
    ctx.fillText(displayStack + ' // ' + builderTitle.toUpperCase(), 60, infoY + 140);
    
    ctx.fillStyle = BRAND.accent;
    ctx.fillRect(60, infoY + 220, 200, 10);
    
    ctx.font = '700 80px Imbue, serif';
    ctx.fillStyle = BRAND.white;
    ctx.fillText('HACKER HOUSE GOA', 60, h - 220);
    ctx.font = '400 30px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.pink;
    ctx.fillText('#FrameInGoa', 60, h - 120);

  } else {
    // 03: Minimal (Cream & Green, very structured)
    ctx.fillStyle = BRAND.offwhite;
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = BRAND.primary;
    ctx.lineWidth = 1;
    // Grid lines
    ctx.beginPath();
    ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
    ctx.moveTo(0, 200); ctx.lineTo(w, 200);
    ctx.moveTo(0, h - 200); ctx.lineTo(w, h - 200);
    ctx.stroke();

    ctx.font = '700 48px Imbue, serif';
    ctx.fillStyle = BRAND.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HACKER HOUSE GOA 2026', w / 2, 100);

    const photoW = 600;
    const photoH = 750;
    const photoX = (w - photoW) / 2;
    const photoY = 280;
    
    ctx.save();
    drawCoverImage(ctx, img, photoX, photoY, photoW, photoH);
    ctx.restore();
    ctx.strokeRect(photoX, photoY, photoW, photoH);
    
    const infoY = photoY + photoH + 100;
    ctx.font = '600 24px "Victor Mono", monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('NAME', w / 2, infoY);
    ctx.font = '700 64px Imbue, serif';
    ctx.fillStyle = BRAND.primary;
    ctx.fillText(displayName, w / 2, infoY + 40);
    
    ctx.font = '600 24px "Victor Mono", monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('ROLE', w / 2, infoY + 140);
    ctx.font = '700 42px Imbue, serif';
    ctx.fillStyle = BRAND.primary;
    ctx.fillText(displayStack + ' — ' + builderTitle.toUpperCase(), w / 2, infoY + 180);
    
    ctx.font = '600 20px "Victor Mono", monospace';
    ctx.fillStyle = BRAND.primary;
    ctx.fillText('#FrameInGoa', w / 2, h - 100);
    ctx.textAlign = 'left';
    ctx.fillText(idNumber, 40, h - 100);
    ctx.textAlign = 'right';
    ctx.fillText('ACTIVE', w - 40, h - 100);
  }
}

// ---- Core Logic ----

function render() {
  if (!uploadedImage) return;
  
  if (currentFormat === 'frame') {
    drawFramePFP(uploadedImage, currentVariant);
  } else {
    const name = nameInput.value.trim();
    const stack = stackInput.value;
    drawBuilderID(uploadedImage, name, stack, currentVariant);
  }
}

async function handleFile(file) {
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

  if (!validTypes.includes(file.type) && !isHeic && !file.type.startsWith('image/')) {
    setStatus('Please upload a JPG, PNG, or HEIC photo.');
    return;
  }

  try {
    let blob = file;
    if (isHeic && typeof heic2any !== 'undefined') {
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
      blob = Array.isArray(converted) ? converted[0] : converted;
    }

    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = URL.createObjectURL(blob);
    uploadedImage = await loadImage(previewObjectUrl);

    // Update Step 1 UI
    uploadPreview.src = previewObjectUrl;
    uploadPreview.style.display = 'block';
    uploadPlaceholder.style.display = 'none';
    uploadZone.classList.add('has-photo');

    // Trigger Progressive Disclosure sequence
    startMicroAnimation();

  } catch (err) {
    setStatus('Could not load that photo. Try JPG or PNG.');
    console.error(err);
  }
}

function startMicroAnimation() {
  // Show steps, hide placeholder
  step02.classList.remove('hidden-step');
  step03.classList.remove('hidden-step');
  previewPlaceholder.classList.add('hidden');
  frameSelectorContainer.classList.remove('hidden');
  
  canvas.style.display = 'block';
  loadingOverlay.classList.remove('hidden');
  actionStatus.classList.add('hidden');
  downloadBtn.disabled = true;
  shareBtn.disabled = true;

  // Animation Sequence
  const sequence = [
    { text: 'BUILDING SIGNAL...', delay: 0 },
    { text: 'FRAME / 0' + currentVariant, delay: 300 },
    { text: 'IDENTITY / OK', delay: 600 },
    { text: 'SIGNAL / LOCKED', delay: 800 }
  ];

  sequence.forEach(step => {
    setTimeout(() => { loadingText.textContent = step.text; }, step.delay);
  });

  setTimeout(() => {
    render();
    loadingOverlay.classList.add('hidden');
    actionStatus.classList.remove('hidden');
    downloadBtn.disabled = false;
    shareBtn.disabled = false;
  }, 950);
}

// ---- Export & Share ----

function getFilename() {
  const prefix = currentFormat === 'frame' ? 'hh-goa-frame' : 'hh-goa-builder-id';
  return `${prefix}-${Date.now()}.png`;
}

function canvasToBlob() {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
}

async function downloadImage() {
  const blob = await canvasToBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = getFilename();
  a.click();
  URL.revokeObjectURL(url);
}

async function shareToX() {
  const text = currentFormat === 'frame'
    ? 'Just got my HH Goa 2026 profile frame! 🌴\n\nBuild yours in seconds — no login needed.\n\n#FrameInGoa @hhgoa\nhttps://hhgoa.com'
    : 'Just got my HH Goa 2026 Builder ID! 🌴\n\nBuild yours in seconds — no login needed.\n\n#FrameInGoa @hhgoa\nhttps://hhgoa.com';
  
  if (navigator.share && navigator.canShare) {
    try {
      const blob = await canvasToBlob();
      const file = new File([blob], getFilename(), { type: 'image/png' });
      const shareData = { title: 'HH Goa 2026', text: text, files: [file] };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err);
    }
  }

  // Fallback
  await downloadImage();
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(tweetUrl, '_blank', 'noopener,noreferrer');
}

// ---- Setup & Events ----

function setupUI() {
  // Format Pills
  document.querySelectorAll('.pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFormat = btn.dataset.format;
      
      // Update canvas ratio class
      if (currentFormat === 'idcard') {
        canvasWrap.classList.add('is-idcard');
        document.querySelector('.builder-title-field').classList.remove('hidden');
      } else {
        canvasWrap.classList.remove('is-idcard');
        document.querySelector('.builder-title-field').classList.add('hidden');
      }
      
      if(uploadedImage) render();
    });
  });

  // Variants
  document.querySelectorAll('.frame-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.frame-opt').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentVariant = btn.dataset.variant;
      if(uploadedImage) render();
    });
  });

  // Upload
  uploadZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });
  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault(); uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  // Fields
  STACKS.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    stackInput.appendChild(opt);
  });
  stackInput.value = 'Full Stack';
  builderTitleEl.textContent = builderTitle;
  document.querySelector('.builder-title-field').classList.add('hidden'); // Hide title by default for PFP

  rerollBtn.addEventListener('click', () => {
    builderTitle = randomTitle();
    builderTitleEl.textContent = builderTitle;
    if(uploadedImage) render();
  });

  // Live Preview on Input
  nameInput.addEventListener('input', () => { if(uploadedImage) render(); });
  stackInput.addEventListener('change', () => { if(uploadedImage) render(); });

  downloadBtn.addEventListener('click', downloadImage);
  shareBtn.addEventListener('click', shareToX);
}

function initCountdown() {
  const targetDate = new Date('2026-10-28T00:00:00').getTime();
  const timerEl = document.getElementById('countdown-timer');
  if (!timerEl) return;

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;
    if (distance < 0) {
      timerEl.textContent = "00:00:00:00";
      return;
    }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    const pad = (n) => n.toString().padStart(2, '0');
    timerEl.textContent = `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  update();
  setInterval(update, 1000);
}

// Init
initAssets().then(() => {
  setupUI();
  initCountdown();
});
