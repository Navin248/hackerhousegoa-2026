import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const id = `hh26-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const filename = `${id}.png`;

    // 1. ImgBB (Free Alternative)
    if (process.env.IMGBB_API_KEY) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      
      const imgbbForm = new FormData();
      imgbbForm.append('key', process.env.IMGBB_API_KEY);
      imgbbForm.append('image', base64);
      imgbbForm.append('name', filename);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: imgbbForm
      });

      const data = await response.json();
      if (data.success) {
        return NextResponse.json({ id, url: data.data.url });
      } else {
        throw new Error('ImgBB upload failed');
      }
    }

    // 2. Vercel Blob (If configured)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`shares/${filename}`, file, {
        access: 'public',
        addRandomSuffix: false
      });
      return NextResponse.json({ id, url: blob.url });
    } 
    
    // 3. Fallback: Local File System (Local Development)
    const buffer = Buffer.from(await file.arrayBuffer());
    const sharesDir = path.join(process.cwd(), 'public', 'shares');
    try {
      await mkdir(sharesDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    const filePath = path.join(sharesDir, filename);
    await writeFile(filePath, buffer);

    return NextResponse.json({ id, url: `/shares/${filename}` });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
