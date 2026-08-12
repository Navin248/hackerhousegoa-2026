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

    // If Vercel Blob is configured, use it (Production)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`shares/${filename}`, file, {
        access: 'public',
        addRandomSuffix: false // keeps the URL predictable or exact to our filename
      });
      return NextResponse.json({ id, url: blob.url });
    } 
    
    // Fallback: Local File System (Local Development)
    const buffer = Buffer.from(await file.arrayBuffer());
    const sharesDir = path.join(process.cwd(), 'public', 'shares');
    try {
      await mkdir(sharesDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    const filePath = path.join(sharesDir, filename);
    await writeFile(filePath, buffer);

    // Return a relative URL for local testing
    return NextResponse.json({ id, url: `/shares/${filename}` });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
