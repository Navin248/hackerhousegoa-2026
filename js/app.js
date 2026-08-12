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

// Crop State
let cropState = { scale: 1, x: 0, y: 0 };
let isDragging = false;
let startX = 0, startY = 0;
let initialPinchDistance = null;
let initialScale = 1;

// DOM Elements
const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const uploadPreview = document.getElementById('upload-preview');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const canvas = document.getElementById('output-canvas');
const ctx = canvas.getContext('2d');
const previewPlaceholder = document.getElementById('preview-placeholder');

// Steps & UI
const step01Title = document.getElementById('step-01-title');
const step02 = document.getElementById('step-02');
const step03 = document.getElementById('step-03');
const frameSelectorContainer = document.getElementById('frame-selector-container');
const actionStatus = document.getElementById('action-status');
const canvasWrap = document.querySelector('.canvas-wrap');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Adjust UI
const adjustFrameUi = document.getElementById('adjust-frame-ui');
const cropViewport = document.getElementById('crop-viewport');
const cropImage = document.getElementById('crop-image');
const zoomSlider = document.getElementById('zoom-slider');
const resetCropBtn = document.getElementById('reset-crop-btn');
const usePhotoBtn = document.getElementById('use-photo-btn');
const adjustPhotoBtn = document.getElementById('adjust-photo-btn');

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
  if (statusMsg) statusMsg.textContent = msg;
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
  ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y);
  ctx.stroke();
}

// ---- Core Drawing Logic with Crop State ----

function drawCoverImageCustom(ctx, img, boxX, boxY, boxW, boxH) {
  // First calculate base auto-crop (cover)
  const imgRatio = img.width / img.height;
  const boxRatio = boxW / boxH;
  
  let baseSw, baseSh;
  if (imgRatio > boxRatio) {
    baseSh = img.height;
    baseSw = baseSh * boxRatio;
  } else {
    baseSw = img.width;
    baseSh = baseSw / boxRatio;
  }
  
  const scaledSw = baseSw / cropState.scale;
  const scaledSh = baseSh / cropState.scale;
  
  const centerSx = img.width / 2;
  const centerSy = img.height / 2;
  
  // Use stored viewport dimensions, fallback to box dimensions if somehow 0
  const vpW = cropState.vpW || boxW;
  const vpH = cropState.vpH || boxH;
  
  const scaleRatioX = baseSw / vpW;
  const scaleRatioY = baseSh / vpH;
  
  const srcOffsetX = cropState.x * scaleRatioX;
  const srcOffsetY = cropState.y * scaleRatioY;
  
  const finalSx = centerSx - (scaledSw / 2) - srcOffsetX;
  const finalSy = centerSy - (scaledSh / 2) - srcOffsetY;
  
  ctx.drawImage(img, finalSx, finalSy, scaledSw, scaledSh, boxX, boxY, boxW, boxH);
}

// ---- Variants Rendering (PFP) ----

function drawFramePFP(img, variant) {
  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  
  if (variant === '1') {
    const frameWidth = 90;
    const inner = size - frameWidth * 2;
    ctx.fillStyle = BRAND.primary;
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    drawRoundedRect(ctx, frameWidth, frameWidth, inner, inner, 24);
    ctx.clip();
    drawCoverImageCustom(ctx, img, frameWidth, frameWidth, inner, inner);
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
    const frameWidth = 60;
    const inner = size - frameWidth * 2;
    ctx.fillStyle = BRAND.black;
    ctx.fillRect(0, 0, size, size);
    
    drawStripePattern(ctx, 0, 0, size, size, 'rgba(255, 0, 128, 0.1)', 24, 1);

    ctx.save();
    drawCoverImageCustom(ctx, img, frameWidth, frameWidth, inner, inner);
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
    
    drawCropMarks(ctx, 10, 10, 30, BRAND.white);
    ctx.save(); ctx.translate(size, 0); ctx.rotate(Math.PI/2); drawCropMarks(ctx, 10, -10, 30, BRAND.white); ctx.restore();

  } else {
    const frameWidth = 40;
    const inner = size - frameWidth * 2;
    ctx.fillStyle = BRAND.offwhite;
    ctx.fillRect(0, 0, size, size);
    
    ctx.save();
    drawCoverImageCustom(ctx, img, frameWidth, frameWidth, inner, inner);
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
    drawCoverImageCustom(ctx, img, photoX + 12, photoY + 12, photoSize - 24, photoSize - 24);
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
    ctx.fillStyle = BRAND.black;
    ctx.fillRect(0, 0, w, h);
    drawStripePattern(ctx, 0, 0, w, h, 'rgba(255, 0, 128, 0.05)', 40, 2);

    ctx.strokeStyle = BRAND.pink;
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, w - 80, h - 80);
    
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
    drawCoverImageCustom(ctx, img, photoX, photoY, photoSize, photoSize);
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
    ctx.fillStyle = BRAND.offwhite;
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = BRAND.primary;
    ctx.lineWidth = 1;
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
    drawCoverImageCustom(ctx, img, photoX, photoY, photoW, photoH);
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

// ---- Crop Editor Logic ----

function updateCropImageTransform() {
  cropImage.style.transform = `translate(calc(-50% + ${cropState.x}px), calc(-50% + ${cropState.y}px)) scale(${cropState.scale})`;
  const rect = cropViewport.getBoundingClientRect();
  if (rect.width > 0) {
    cropState.vpW = rect.width;
    cropState.vpH = rect.height;
  }
}

function setupCropEvents() {
  // Drag to pan
  cropViewport.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX - cropState.x;
    startY = e.clientY - cropState.y;
    cropViewport.setPointerCapture(e.pointerId);
  });
  cropViewport.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    cropState.x = e.clientX - startX;
    cropState.y = e.clientY - startY;
    updateCropImageTransform();
  });
  cropViewport.addEventListener('pointerup', (e) => {
    isDragging = false;
    cropViewport.releasePointerCapture(e.pointerId);
  });

  // Zoom slider
  zoomSlider.addEventListener('input', (e) => {
    cropState.scale = parseFloat(e.target.value);
    updateCropImageTransform();
  });

  // Pinch to zoom (touch)
  cropViewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      initialPinchDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialScale = cropState.scale;
    }
  }, {passive: false});

  cropViewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const zoom = initialScale * (dist / initialPinchDistance);
      cropState.scale = Math.min(Math.max(zoom, 1), 3);
      zoomSlider.value = cropState.scale;
      updateCropImageTransform();
    }
  }, {passive: false});

  // Reset
  resetCropBtn.addEventListener('click', () => {
    cropState = { scale: 1, x: 0, y: 0 };
    zoomSlider.value = 1;
    updateCropImageTransform();
  });

  // Use Photo (Confirm crop)
  usePhotoBtn.addEventListener('click', () => {
    adjustFrameUi.classList.add('hidden');
    uploadZone.classList.remove('hidden');
    step01Title.textContent = 'BUILD YOUR SIGNAL';
    startMicroAnimation();
  });

  // Adjust Photo (From Step 3)
  adjustPhotoBtn.addEventListener('click', () => {
    step02.classList.add('hidden-step');
    step03.classList.add('hidden-step');
    uploadZone.classList.add('hidden');
    adjustFrameUi.classList.remove('hidden');
    step01Title.textContent = 'ADJUST YOUR FRAME';
  });
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

    // Initial Cover object-fit for crop UI
    cropImage.src = previewObjectUrl;
    cropImage.onload = () => {
      // Base aspect ratio logic for UI
      const imgRatio = cropImage.naturalWidth / cropImage.naturalHeight;
      const vpRect = cropViewport.getBoundingClientRect();
      const vpRatio = vpRect.width / vpRect.height;
      if (imgRatio > vpRatio) {
        cropImage.style.height = '100%';
        cropImage.style.width = 'auto';
      } else {
        cropImage.style.width = '100%';
        cropImage.style.height = 'auto';
      }
    };

    // Reset crop state
    cropState = { scale: 1, x: 0, y: 0 };
    zoomSlider.value = 1;
    updateCropImageTransform();

    // Show Adjust UI
    uploadZone.classList.add('hidden');
    adjustFrameUi.classList.remove('hidden');
    step01Title.textContent = 'ADJUST YOUR FRAME';
    
    // Reset steps
    step02.classList.add('hidden-step');
    step03.classList.add('hidden-step');
    
    // Tiny thumbnail for upload zone
    uploadPreview.src = previewObjectUrl;
    uploadPreview.style.display = 'block';
    uploadPlaceholder.style.display = 'none';
    uploadZone.classList.add('has-photo');

  } catch (err) {
    setStatus('Could not load that photo. Try JPG or PNG.');
    console.error(err);
  }
}

function startMicroAnimation() {
  step02.classList.remove('hidden-step');
  step03.classList.remove('hidden-step');
  previewPlaceholder.classList.add('hidden');
  frameSelectorContainer.classList.remove('hidden');
  
  canvas.style.display = 'block';
  loadingOverlay.classList.remove('hidden');
  actionStatus.classList.add('hidden');
  adjustPhotoBtn.classList.add('hidden');
  downloadBtn.disabled = true;
  shareBtn.disabled = true;

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
    adjustPhotoBtn.classList.remove('hidden');
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
      
      // Update viewports and ratios
      if (currentFormat === 'idcard') {
        canvasWrap.classList.add('is-idcard');
        cropViewport.classList.add('is-idcard');
        document.querySelector('.builder-title-field').classList.remove('hidden');
      } else {
        canvasWrap.classList.remove('is-idcard');
        cropViewport.classList.remove('is-idcard');
        document.querySelector('.builder-title-field').classList.add('hidden');
      }
      
      // trigger image load again for crop viewport sizing
      if(cropImage.src) {
        cropImage.onload();
      }

      if(uploadedImage && !adjustFrameUi.classList.contains('hidden')) {
         // Re-center on format change
         cropState = { scale: 1, x: 0, y: 0 };
         zoomSlider.value = 1;
         updateCropImageTransform();
      }
      if(uploadedImage && !step03.classList.contains('hidden-step')) {
         render();
      }
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
  document.querySelector('.builder-title-field').classList.add('hidden');

  rerollBtn.addEventListener('click', () => {
    builderTitle = randomTitle();
    builderTitleEl.textContent = builderTitle;
    if(uploadedImage) render();
  });

  nameInput.addEventListener('input', () => { if(uploadedImage) render(); });
  stackInput.addEventListener('change', () => { if(uploadedImage) render(); });

  downloadBtn.addEventListener('click', downloadImage);
  shareBtn.addEventListener('click', shareToX);

  setupCropEvents();
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
