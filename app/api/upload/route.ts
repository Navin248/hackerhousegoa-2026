import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique ID
    const id = `hh26-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Ensure the public/shares directory exists
    const sharesDir = path.join(process.cwd(), 'public', 'shares');
    try {
      await mkdir(sharesDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    // Save the file
    const filePath = path.join(sharesDir, `${id}.png`);
    await writeFile(filePath, buffer);

    return NextResponse.json({ id });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
