import { NextResponse } from 'next/server';

function setCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  return res;
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  return setCorsHeaders(res);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const threadId = crypto.randomUUID();
    
    const res = NextResponse.json({
        thread_id: threadId,
        created_at: new Date().toISOString(),
        metadata: body.metadata || {},
        status: "idle"
    });
    return setCorsHeaders(res);
  } catch (error) {
    const res = NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
    return setCorsHeaders(res);
  }
}
