import { NextResponse } from 'next/server';
import { processAgentRequest } from '@/warden-bot/agent';

// Helper to set CORS headers
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
    let prompt = body.prompt || body.input || body.message;

    // Handle LangGraph structure: { input: { messages: [...] } }
    if (typeof prompt === 'object' && prompt !== null && !Array.isArray(prompt)) {
        if (prompt.messages && Array.isArray(prompt.messages)) {
            // It looks like a LangGraph/Warden request
            // We do NOT block /api/chat even if key is missing, because the frontend uses it.
            // But we can log if it's external.
            
            const lastMsg = prompt.messages[prompt.messages.length - 1];
            prompt = lastMsg?.content || JSON.stringify(prompt);
        } else {
            prompt = JSON.stringify(prompt);
        }
    } else if (typeof prompt !== 'string') {
        prompt = JSON.stringify(body);
    }
    
    console.log("Received prompt:", prompt);
    
    if (!prompt) {
      const res = NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
      return setCorsHeaders(res);
    }

    const response = await processAgentRequest(prompt);
    
    const res = NextResponse.json({ response });
    return setCorsHeaders(res);
  } catch (error) {
    console.error('API Error:', error);
    const res = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    return setCorsHeaders(res);
  }
}

export async function GET() {
  const res = NextResponse.json({ status: "TERMINAL AI ONLINE", version: "1.0.0" });
  return setCorsHeaders(res);
}
