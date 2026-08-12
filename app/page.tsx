"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

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

function randomTitle() {
  return BUILDER_TITLES[Math.floor(Math.random() * BUILDER_TITLES.length)];
}

export default function Home() {
  // State
  const [currentFormat, setCurrentFormat] = useState('frame');
  const [currentVariant, setCurrentVariant] = useState('1');
  const [name, setName] = useState('');
  const [stack, setStack] = useState('Full Stack');
  const [builderTitle, setBuilderTitle] = useState(randomTitle());
  
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  
  // Steps & UI State
  const [step, setStep] = useState(1); // 1=Upload/Adjust, 2=Identity, 3=Artifact (Step 2 and 3 can be combined visually in the studio)
  const [showAdjust, setShowAdjust] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [isReady, setIsReady] = useState(false);
  
  // Crop State
  const [cropState, setCropState] = useState({ scale: 1, x: 0, y: 0, vpW: 0, vpH: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropViewportRef = useRef<HTMLDivElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });
  const pinch = useRef({ dist: 0, scale: 1 });
  
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const decoImgRef = useRef<HTMLImageElement | null>(null);

  // Time
  const [countdown, setCountdown] = useState('00:00:00:00');

  useEffect(() => {
    const targetDate = new Date('2026-10-28T00:00:00').getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        setCountdown("00:00:00:00");
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setCountdown(`${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  useEffect(() => {
    Promise.all([
      loadImage('/assets/2-47.svg'),
      loadImage('/assets/036-vector-54-3934.svg'),
    ]).then(([l, d]) => {
      logoImgRef.current = l;
      decoImgRef.current = d;
    }).catch(e => console.log('Asset load error', e));
  }, []);

  // --- Rendering Logic ---

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
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
  };

  const drawStripePattern = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, spacing = 12, lw = 3) => {
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
  };

  const drawCropMarks = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y);
    ctx.stroke();
  };

  const drawCoverImageCustom = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, boxX: number, boxY: number, boxW: number, boxH: number, state: any) => {
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
    
    const scaledSw = baseSw / state.scale;
    const scaledSh = baseSh / state.scale;
    const centerSx = img.width / 2;
    const centerSy = img.height / 2;
    
    const vpW = state.vpW || boxW;
    const vpH = state.vpH || boxH;
    
    const scaleRatioX = baseSw / vpW;
    const scaleRatioY = baseSh / vpH;
    
    const srcOffsetX = state.x * scaleRatioX;
    const srcOffsetY = state.y * scaleRatioY;
    
    const finalSx = centerSx - (scaledSw / 2) - srcOffsetX;
    const finalSy = centerSy - (scaledSh / 2) - srcOffsetY;
    
    ctx.drawImage(img, finalSx, finalSy, scaledSw, scaledSh, boxX, boxY, boxW, boxH);
  };

  const renderCanvas = useCallback(() => {
    if (!uploadedImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentFormat === 'frame') {
      const size = 1080;
      canvas.width = size;
      canvas.height = size;
      
      if (currentVariant === '1') {
        const frameWidth = 90;
        const inner = size - frameWidth * 2;
        ctx.fillStyle = BRAND.primary;
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        drawRoundedRect(ctx, frameWidth, frameWidth, inner, inner, 24);
        ctx.clip();
        drawCoverImageCustom(ctx, uploadedImage, frameWidth, frameWidth, inner, inner, cropState);
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

      } else if (currentVariant === '2') {
        const frameWidth = 60;
        const inner = size - frameWidth * 2;
        ctx.fillStyle = BRAND.black;
        ctx.fillRect(0, 0, size, size);
        drawStripePattern(ctx, 0, 0, size, size, 'rgba(255, 0, 128, 0.1)', 24, 1);
        ctx.save();
        drawCoverImageCustom(ctx, uploadedImage, frameWidth, frameWidth, inner, inner, cropState);
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
        drawCoverImageCustom(ctx, uploadedImage, frameWidth, frameWidth, inner, inner, cropState);
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
    } else {
      const w = 1080;
      const h = 1920;
      canvas.width = w;
      canvas.height = h;

      const displayName = (name || 'Builder').toUpperCase();
      const displayStack = (stack || 'Full Stack').toUpperCase();
      const dateStr = '28–31 OCT 2026';
      const idNumber = 'HH26 / ' + Math.floor(10000 + Math.random() * 90000);

      if (currentVariant === '1') {
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
        drawCoverImageCustom(ctx, uploadedImage, photoX + 12, photoY + 12, photoSize - 24, photoSize - 24, cropState);
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

      } else if (currentVariant === '2') {
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
        drawCoverImageCustom(ctx, uploadedImage, photoX, photoY, photoSize, photoSize, cropState);
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
        drawCoverImageCustom(ctx, uploadedImage, photoX, photoY, photoW, photoH, cropState);
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
  }, [uploadedImage, currentFormat, currentVariant, cropState, name, stack, builderTitle]);

  useEffect(() => {
    if (isReady && uploadedImage) {
      renderCanvas();
    }
  }, [renderCanvas, isReady, uploadedImage]);

  // --- Handlers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let blob: Blob | File = file;
      if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        // dynamic import of heic2any
        const heic2any = (await import('heic2any')).default;
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
        blob = Array.isArray(converted) ? converted[0] : converted;
      }
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      const url = URL.createObjectURL(blob);
      setPreviewObjectUrl(url);
      const img = await loadImage(url);
      setUploadedImage(img);
      setShowAdjust(true);
      setStep(1);
      setIsReady(false);
      
      // Init crop state
      if (cropImageRef.current && cropViewportRef.current) {
        const vpRect = cropViewportRef.current.getBoundingClientRect();
        setCropState({ scale: 1, x: 0, y: 0, vpW: vpRect.width, vpH: vpRect.height });
      }
    } catch (e) {
      console.error(e);
      alert('Could not load photo');
    }
  };

  const handleUsePhoto = () => {
    // Record final vp
    if (cropViewportRef.current) {
      const rect = cropViewportRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setCropState(prev => ({ ...prev, vpW: rect.width, vpH: rect.height }));
      }
    }
    setShowAdjust(false);
    startAnimation();
  };

  const startAnimation = () => {
    setStep(2);
    setIsBuilding(true);
    setIsReady(false);
    const sequence = [
      { text: 'BUILDING SIGNAL...', delay: 0 },
      { text: `FRAME / 0${currentVariant}`, delay: 300 },
      { text: 'IDENTITY / OK', delay: 600 },
      { text: 'SIGNAL / LOCKED', delay: 800 }
    ];
    sequence.forEach(step => {
      setTimeout(() => setLoadingText(step.text), step.delay);
    });
    setTimeout(() => {
      setIsBuilding(false);
      setIsReady(true);
    }, 950);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png', 1);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFormat === 'frame' ? `hh-goa-frame-${Date.now()}.png` : `hh-goa-id-${Date.now()}.png`;
    a.click();
  };

  const shareToX = async () => {
    if (!canvasRef.current) return;
    
    // Set a loading state visually for the button if possible, but keep it simple
    const originalText = document.getElementById('share-btn')?.innerText;
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.innerText = 'PREPARING...';

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => canvasRef.current!.toBlob((b) => resolve(b as Blob), 'image/png', 1));
      
      const text = currentFormat === 'frame'
        ? 'Just got my HH Goa 2026 profile frame! 🌴\n\nBuild yours in seconds — no login needed.\n\n#FrameInGoa @hhgoa'
        : 'Just got my HH Goa 2026 Builder ID! 🌴\n\nBuild yours in seconds — no login needed.\n\n#FrameInGoa @hhgoa';

      // 1. Try Native Mobile Sharing (Attaches the actual image to the Twitter App!)
      const file = new File([blob], currentFormat === 'frame' ? 'hh-goa-frame.png' : 'hh-goa-id.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            text: text,
            files: [file]
          });
          if (shareBtn && originalText) shareBtn.innerText = originalText;
          return; // Successfully shared natively!
        } catch (err) {
          console.log("Native share cancelled or failed, falling back to Web Intent", err);
        }
      }

      // 2. Fallback for Desktop: Upload to server and use Web Intent with OG tags
      const formData = new FormData();
      formData.append('image', blob);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.id && data.url) {
        const baseUrl = window.location.origin;
        // Pass the image URL via query parameter so the share page knows exactly where it is (local or Vercel Blob)
        const shareUrl = `${baseUrl}/share/${data.id}?img=${encodeURIComponent(data.url)}`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(tweetUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('Upload failed');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate share link. Please download instead.');
    } finally {
      if (shareBtn && originalText) shareBtn.innerText = originalText;
    }
  };

  // Crop Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startDrag.current = { x: e.clientX - cropState.x, y: e.clientY - cropState.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setCropState(prev => ({
      ...prev,
      x: e.clientX - startDrag.current.x,
      y: e.clientY - startDrag.current.y
    }));
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (cropViewportRef.current) {
      const rect = cropViewportRef.current.getBoundingClientRect();
      if(rect.width > 0) setCropState(p => ({...p, vpW: rect.width, vpH: rect.height}));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinch.current.dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      pinch.current.scale = cropState.scale;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const newScale = Math.min(Math.max(pinch.current.scale * (dist / pinch.current.dist), 1), 3);
      setCropState(prev => ({ ...prev, scale: newScale }));
    }
  };

  return (
    <div className="container animated-entrance">
      <header className="custom-header">
        <div className="header-main-title">
          <div className="logo-lockup">
            <span className="word">HACKER</span>
            <img src="/assets/goa_hindi.svg" alt="Goa" className="goa-hindi-animated" />
            <span className="word">HOUSE</span>
          </div>
        </div>
        <div className="header-bottom">
          <div className="event-details">GOA / INDIA · 28—31 OCT 2026</div>
        </div>
        <div className="header-ambient">
          <span className="ambient-item">GOA CALLING... <span id="countdown-timer">{countdown}</span></span>
          <span className="ambient-item">2:47 PM STUDIO</span>
        </div>
      </header>

      <div className="format-toggle-container">
        <span className="format-label">FORMAT</span>
        <div className="format-pill">
          <button className={`pill-btn ${currentFormat === 'frame' ? 'active' : ''}`} onClick={() => setCurrentFormat('frame')} type="button">PFP <span className="helper">for X</span></button>
          <button className={`pill-btn ${currentFormat === 'idcard' ? 'active' : ''}`} onClick={() => setCurrentFormat('idcard')} type="button">BUILDER <span className="helper">for post</span></button>
        </div>
      </div>

      <div className="studio-workspace">
        {/* Left Column */}
        <div className="studio-controls">
          <section className="step-card">
            <div className="step-header">01 / PHOTO</div>
            <h2 className="step-title">{showAdjust ? 'ADJUST YOUR FRAME' : 'BUILD YOUR SIGNAL'}</h2>
            
            <div className={`upload-zone ${showAdjust ? 'hidden' : ''}`} onClick={() => fileInputRef.current?.click()}>
              {!previewObjectUrl ? (
                <div id="upload-placeholder">
                  <div className="upload-icon">📸</div>
                  <strong>DROP YOUR PHOTO</strong>
                  <p>JPG · PNG · HEIC</p>
                  <p>OR TAP TO SELECT</p>
                </div>
              ) : (
                <img src={previewObjectUrl} className="upload-preview" alt="Upload" style={{ display: 'block' }} />
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" style={{ display: 'none' }} />

            <div className={`adjust-frame-ui ${!showAdjust ? 'hidden' : ''}`}>
              <div className="crop-viewport-wrapper">
                <div 
                  className={`crop-viewport ${currentFormat === 'idcard' ? 'is-idcard' : ''}`} 
                  ref={cropViewportRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                >
                  {previewObjectUrl && (
                    <img 
                      id="crop-image" 
                      src={previewObjectUrl} 
                      ref={cropImageRef}
                      alt="Crop" 
                      draggable="false"
                      style={{
                        transform: `translate(calc(-50% + ${cropState.x}px), calc(-50% + ${cropState.y}px)) scale(${cropState.scale})`,
                        width: '100%',
                        height: 'auto'
                      }}
                    />
                  )}
                  <div className="crop-overlay"></div>
                </div>
              </div>
              <div className="adjust-controls">
                <div className="zoom-control">
                  <span>−</span>
                  <input type="range" min="1" max="3" step="0.01" value={cropState.scale} onChange={(e) => setCropState(p => ({ ...p, scale: parseFloat(e.target.value) }))} />
                  <span>+</span>
                </div>
                <div className="adjust-actions">
                  <button type="button" className="btn-text" onClick={() => setCropState(p => ({...p, scale: 1, x: 0, y: 0}))}>↺ RESET</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleUsePhoto}>USE PHOTO →</button>
                </div>
              </div>
            </div>
          </section>

          <section className={`step-card ${step < 2 ? 'hidden-step' : ''}`}>
            <div className="step-header">02 / IDENTITY</div>
            <div className="fields">
              <div className="field">
                <label>YOUR NAME</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Naveen Kumar" maxLength={40} />
              </div>
              <div className="field">
                <label>STACK</label>
                <select value={stack} onChange={e => setStack(e.target.value)}>
                  {STACKS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={`field ${currentFormat === 'frame' ? 'hidden' : ''}`}>
                <label>BUILDER TITLE</label>
                <div className="builder-title-display">{builderTitle}</div>
                <button type="button" className="reroll-btn" onClick={() => setBuilderTitle(randomTitle())}>↻ ROLL ANOTHER</button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="studio-preview">
          <section className={`step-card ${step < 2 ? 'hidden-step' : ''}`}>
            <div className="step-header">03 / ARTIFACT</div>
            <h2 className="step-title">YOUR SIGNAL</h2>
            
            <div className="frame-selector">
              <span className="frame-label">FRAME</span>
              <div className="frame-options">
                <button className={`frame-opt ${currentVariant === '1' ? 'active' : ''}`} onClick={() => setCurrentVariant('1')}>01</button>
                <button className={`frame-opt ${currentVariant === '2' ? 'active' : ''}`} onClick={() => setCurrentVariant('2')}>02</button>
                <button className={`frame-opt ${currentVariant === '3' ? 'active' : ''}`} onClick={() => setCurrentVariant('3')}>03</button>
              </div>
            </div>

            <div className={`canvas-wrap ${currentFormat === 'idcard' ? 'is-idcard' : ''}`}>
              {!uploadedImage && <p className="preview-placeholder">Upload a photo to build</p>}
              
              {isBuilding && (
                <div className="loading-overlay">
                  <div className="loading-text">{loadingText}</div>
                </div>
              )}
              
              <canvas 
                ref={canvasRef} 
                style={{ display: isReady ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div className="actions">
              {isReady && <div className="action-status">YOUR SIGNAL IS READY.</div>}
              {isReady && (
                <button className="btn btn-outline" type="button" onClick={() => { setShowAdjust(true); setIsReady(false); setStep(1); }}>
                  ↗ ADJUST PHOTO
                </button>
              )}
              <button className="btn btn-primary" type="button" disabled={!isReady} onClick={downloadImage}>
                ↓ DOWNLOAD
              </button>
              <button className="btn btn-secondary" type="button" disabled={!isReady} onClick={shareToX}>
                𝕏 SHARE TO X
              </button>
              <div className="hashtag">#FrameInGoa</div>
            </div>
          </section>
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-compact">
          <p className="footer-brand">HH GOA 2026</p>
          <p className="footer-tagline">4 DAYS. ONE RHYTHM. EVERYTHING INTENTIONAL.</p>
          <p className="creator-credit">BUILT WITH 🧡 BY <a href="https://x.com/adamantine077" target="_blank" rel="noopener">@adamantine077</a></p>
        </div>
      </footer>
    </div>
  );
}
