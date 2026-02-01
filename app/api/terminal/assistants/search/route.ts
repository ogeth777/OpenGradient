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
    // Some clients use POST for search
    return GET();
}

export async function GET() {
  const assistants = [
    {
      assistant_id: "terminal-ai",
      graph_id: "terminal-ai",
      description: "Terminal AI Agent for Base Network",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      config: {},
      metadata: {}
    }
  ];
  
  const res = NextResponse.json(assistants);
  return setCorsHeaders(res);
}
