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

export async function GET(req: Request, { params }: { params: { assistant_id: string } }) {
  const { assistant_id } = params;
  
  const assistant = {
      assistant_id: assistant_id || "terminal-ai",
      graph_id: "terminal-ai",
      description: "Terminal AI Agent for Base Network",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      config: {},
      metadata: {}
  };

  const res = NextResponse.json(assistant);
  return setCorsHeaders(res);
}
