/* HH Goa 2026 Frame / ID Card Generator — client-side only */

const BRAND = {
  primary: '#0B6839',
  accent: '#FEE101',
  accentAlt: '#EDD723',
  pink: '#FF0080',
  offwhite: '#FFFBE8',
  white: '#FFFFFF',
  black: '#000000',
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

let currentFormat = 'frame';
let uploadedImage = null;
let previewObjectUrl = null;
let builderTitle = randomTitle();
let logoImg = null;
let decoImg = null;

const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const uploadPreview = document.getElementById('upload-preview');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const canvas = document.getElementById('output-canvas');
const ctx = canvas.getContext('2d');
const previewPlaceholder = document.getElementById('preview-placeholder');
const fieldsPanel = document.getElementById('id-fields');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const statusMsg = document.getElementById('status-msg');
const builderTitleEl = document.getElementById('builder-title');
const rerollBtn = document.getElementById('reroll-title');

function randomTitle() {
  return BUILDER_TITLES[Math.floor(Math.random() * BUILDER_TITLES.length)];
}

function setStatus(msg, type = '') {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg' + (type ? ` ${type}` : '');
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

function drawStripePattern(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (let i = -h; i < w + h; i += 12) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + h, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFramePFP(img) {
  const size = 1080;
  canvas.width = size;
  canvas.height = size;

  const frameWidth = 90;
  const inner = size - frameWidth * 2;
  const innerX = frameWidth;
  const innerY = frameWidth;

  ctx.fillStyle = BRAND.primary;
  ctx.fillRect(0, 0, size, size);

  drawCoverImage(ctx, img, innerX, innerY, inner, inner);

  ctx.save();
  drawRoundedRect(ctx, innerX, innerY, inner, inner, 24);
  ctx.clip();
  drawCoverImage(ctx, img, innerX, innerY, inner, inner);
  ctx.restore();

  ctx.strokeStyle = BRAND.accent;
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, innerX - 4, innerY - 4, inner + 8, inner + 8, 28);
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

  if (logoImg) {
    ctx.drawImage(logoImg, size / 2 - 40, size - frameWidth + 8, 80, 50);
  }

  ctx.font = '700 22px "Victor Mono", monospace';
  ctx.fillStyle = BRAND.pink;
  ctx.fillText('#FrameInGoa', size / 2, frameWidth / 2 + 4);

  if (decoImg) {
    ctx.globalAlpha = 0.85;
    ctx.drawImage(decoImg, 12, 12, 70, 62);
    ctx.drawImage(decoImg, size - 82, 12, 70, 62);
    ctx.globalAlpha = 1;
  }
}

function drawBuilderID(img, name, stack) {
  const w = 1080;
  const h = 1920;
  canvas.width = w;
  canvas.height = h;

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
  ctx.fillText('GOA, INDIA · 28 – 31 OCT 2026', w / 2, 220);

  if (logoImg) {
    ctx.drawImage(logoImg, w - 130, 30, 100, 62);
  }

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

  const pad = 12;
  ctx.save();
  drawRoundedRect(ctx, photoX + pad, photoY + pad, photoSize - pad * 2, photoSize - pad * 2, 24);
  ctx.clip();
  drawCoverImage(ctx, img, photoX + pad, photoY + pad, photoSize - pad * 2, photoSize - pad * 2);
  ctx.restore();

  ctx.strokeStyle = BRAND.pink;
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, photoX - 4, photoY - 4, photoSize + 8, photoSize + 8, 36);
  ctx.stroke();

  const infoY = photoY + photoSize + 70;

  ctx.font = '700 80px Imbue, serif';
  ctx.fillStyle = BRAND.primary;
  ctx.textAlign = 'center';
  const displayName = (name || 'Builder').toUpperCase();
  ctx.fillText(displayName, w / 2, infoY);

  ctx.font = '600 32px "Victor Mono", monospace';
  ctx.fillStyle = '#333';
  ctx.fillText((stack || 'Full Stack').toUpperCase(), w / 2, infoY + 100);

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
  ctx.fillText('BUILDER ID · HH GOA 2026', w / 2, badgeY + badgeH + 50);

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

  if (decoImg) {
    ctx.globalAlpha = 0.7;
    ctx.drawImage(decoImg, 40, footerY + 30, 90, 78);
    ctx.drawImage(decoImg, w - 130, footerY + 30, 90, 78);
    ctx.globalAlpha = 1;
  }
}

function render() {
  if (!uploadedImage) {
    previewPlaceholder.classList.remove('hidden');
    canvas.style.display = 'none';
    downloadBtn.disabled = true;
    shareBtn.disabled = true;
    return;
  }

  previewPlaceholder.classList.add('hidden');
  canvas.style.display = 'block';

  if (currentFormat === 'frame') {
    drawFramePFP(uploadedImage);
  } else {
    const name = document.getElementById('name-input').value.trim();
    const stack = document.getElementById('stack-input').value;
    drawBuilderID(uploadedImage, name, stack);
  }

  downloadBtn.disabled = false;
  shareBtn.disabled = false;
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

  setStatus('Processing photo…');

  try {
    let blob = file;
    if (isHeic && typeof heic2any !== 'undefined') {
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
      blob = Array.isArray(converted) ? converted[0] : converted;
    }

    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = URL.createObjectURL(blob);
    uploadedImage = await loadImage(previewObjectUrl);

    uploadPreview.src = previewObjectUrl;
    uploadPreview.style.display = 'block';
    uploadPlaceholder.style.display = 'none';
    uploadZone.classList.add('has-photo');

    render();
    setStatus('Ready! Download or share your graphic.', 'success');
  } catch (err) {
    setStatus('Could not load that photo. Try JPG or PNG.');
    console.error(err);
  }
}

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
  setStatus('Downloaded!', 'success');
}

function getShareText() {
  const base = currentFormat === 'frame'
    ? 'Just got my HH Goa 2026 profile frame! 🌴'
    : 'Just got my HH Goa 2026 Builder ID! 🌴';
  return `${base}\n\nBuild yours in seconds — no login needed.\n\n#FrameInGoa @hhgoa`;
}

async function shareToX() {
  const text = getShareText();
  const siteUrl = 'https://hhgoa.com'; // Add site link

  if (navigator.share && navigator.canShare) {
    try {
      const blob = await canvasToBlob();
      const file = new File([blob], getFilename(), { type: 'image/png' });
      // Use files + text. On mobile, this attaches the image directly to the Tweet!
      const shareData = { 
        title: 'HH Goa 2026',
        text: text + '\n' + siteUrl,
        files: [file] 
      };
      
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setStatus('Shared!', 'success');
        return;
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Share failed:', err);
    }
  }

  // Fallback for desktop: download image and open tweet intent
  await downloadImage();
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(siteUrl);
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  setStatus('Image downloaded! Please attach it to your tweet.', 'success');
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFormat = btn.dataset.format;
      fieldsPanel.classList.toggle('hidden', currentFormat === 'frame');
      render();
    });
  });
}

function setupUpload() {
  uploadZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
}

function setupFields() {
  const stackSelect = document.getElementById('stack-input');
  STACKS.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    stackSelect.appendChild(opt);
  });
  stackSelect.value = 'Full Stack';

  builderTitleEl.textContent = builderTitle;

  rerollBtn.addEventListener('click', () => {
    builderTitle = randomTitle();
    builderTitleEl.textContent = builderTitle;
    render();
  });

  document.getElementById('name-input').addEventListener('input', render);
  stackSelect.addEventListener('change', render);
}

function populateStacks() {
  setupFields();
}

downloadBtn.addEventListener('click', downloadImage);
shareBtn.addEventListener('click', shareToX);

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

initAssets().then(() => {
  setupTabs();
  setupUpload();
  populateStacks();
  initCountdown();
});
