# HH Goa 2026 — Frame / ID Card Generator

A client-side web tool for the HH Goa 2026 shortlisting task. Upload a photo and instantly get a branded **PFP frame** or **Builder ID card**, ready to download and share on X with `#FrameInGoa`.

## Features

- **Format A — PFP Frame**: Branded square overlay for X profile pictures (1080×1080)
- **Format B — Builder ID Card**: Event badge with photo, name, stack, and auto-generated builder title (1080×1920)
- **On-brand**: Uses HH Goa colors, fonts (Imbue + Victor Mono), and logo assets from [hhgoa.com](https://hhgoa.com/)
- **Fast**: All processing happens in-browser via Canvas — no server, no login
- **Mobile-friendly**: Responsive layout, HEIC support (iPhone photos), Web Share API on supported devices
- **Download + Share**: PNG download and pre-filled X/Twitter share with `#FrameInGoa`

## Run locally

Since this project uses Next.js for dynamic Open Graph (OG) image generation:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open `http://localhost:3000`
