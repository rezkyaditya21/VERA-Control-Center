import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// CORS response helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base64, fileName, contentType } = body;

    if (!base64) {
      return NextResponse.json(
        { error: 'Payload base64 gambar diperlukan.' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Determine MIME type
    const mime = (contentType || 'image/jpeg').toLowerCase();
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!ALLOWED_MIME.includes(mime)) {
      return NextResponse.json(
        { error: 'Format gambar tidak didukung. Harap gunakan format JPG, PNG, atau WEBP.' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Clean base64 string (strip data:image/...;base64, prefix if present)
    const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Max 10MB check
    const MAX_BYTES = 10 * 1024 * 1024;
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Ukuran foto melebihi batas maksimal 10MB.' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Determine extension
    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';

    const safeFileName = `proof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const supabaseAdmin = createAdminClient();

    // Upload to Supabase Storage 'proofs' bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('proofs')
      .upload(safeFileName, buffer, {
        contentType: mime,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Gagal mengunggah foto ke cloud storage: ${uploadError.message}` },
        { status: 500, headers: corsHeaders() }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('proofs')
      .getPublicUrl(safeFileName);

    return NextResponse.json(
      {
        success: true,
        publicUrl: publicUrlData.publicUrl,
        fileName: safeFileName,
        sizeBytes: buffer.length,
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error('API /api/proofs/upload exception:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan saat memproses unggahan foto.' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
