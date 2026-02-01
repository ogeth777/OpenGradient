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
            
            // SECURITY CHECK for Warden requests (SOFT)
            const envKey = process.env.WARDEN_API_KEY;
            if (envKey) {
                const headerKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
                if (headerKey !== envKey) {
                     console.log("Warning: Unauthorized request to /api/terminal (allowed for compatibility)");
                }
            }

            const lastMsg = prompt.messages[prompt.messages.length - 1];
            prompt = lastMsg?.content || JSON.stringify(prompt);
        } else {
            prompt = JSON.stringify(prompt);
        }
    } else if (typeof prompt !== 'string') {
        prompt = JSON.stringify(body);
    }
    
    console.log("Received prompt (terminal endpoint):", prompt);
    
    if (!prompt) {
      const res = NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
      return setCorsHeaders(res);
    }

    let response;
    try {
        response = await processAgentRequest(prompt);
    } catch (agentError: any) {
        console.error("Uncaught Agent Error:", agentError);
        response = `**FATAL ERROR**\n\n${agentError.message || "Unknown system failure."}`;
    }
    
    const res = NextResponse.json({ response });
    return setCorsHeaders(res);
  } catch (error) {
    console.error('API Error:', error);
    // Return 200 with error message to prevent "Remote agent configuration" error in frontend
    const res = NextResponse.json(
      { response: "**API GATEWAY ERROR**\n\nRequest processing failed. Please check server logs." },
      { status: 200 }
    );
    return setCorsHeaders(res);
  }
}

export async function GET() {
  const res = NextResponse.json({ 
    status: "TERMINAL AI AGENT ONLINE", 
    version: "2.4.0",
    name: "TERMINAL AI",
    description: "Advanced Base Trading Terminal. Features: Trending Tokens, Yield Farming, Risk Analysis, Portfolio Tracking, and Top Gainers.",
    capabilities: [
        "Fetch trending tokens on Base network",
        "Analyze token security and risk (GoPlus Security)",
        "Find high-yield farming opportunities",
        "Track portfolio balance and history (DeBank)",
        "Monitor top gaining tokens"
    ],
    examples: [
        "What are the trending tokens on Base?",
        "Risk analysis for BRETT",
        "Find best yield farming pools",
        "Show me top gainers",
        "Analyze my portfolio"
    ],
    url: "https://terminalai-omega.vercel.app/api/terminal"
  });
  return setCorsHeaders(res);
}
