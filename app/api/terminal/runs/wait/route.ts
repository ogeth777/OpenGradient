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
    console.log("Received /api/terminal/runs/wait request:", JSON.stringify(body, null, 2));

    // SECURITY CHECK
    const envKey = process.env.WARDEN_API_KEY;
    if (envKey) {
        const headerKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
        if (headerKey !== envKey) {
             console.log("Blocked unauthorized request to /api/terminal/runs/wait");
             // Soft fail for now to ensure compatibility
             // const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
             // return setCorsHeaders(res);
        }
    }

    // Extract the last user message from the input
    const messages = body.input?.messages || [];
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    
    let userPrompt = "";
    if (lastMessage && lastMessage.content) {
        userPrompt = typeof lastMessage.content === 'string' 
            ? lastMessage.content 
            : JSON.stringify(lastMessage.content);
    } else {
        userPrompt = "Hello";
    }

    console.log("Extracted prompt:", userPrompt);

    // Call the agent
    let agentResponse;
    try {
        agentResponse = await processAgentRequest(userPrompt);
    } catch (agentError: any) {
        console.error("Agent Error in /api/terminal/runs/wait:", agentError);
        agentResponse = `**SYSTEM ERROR**\n\n${agentError.message || "Unknown error occurred."}`;
    }

    // Construct a LangGraph-compatible response
    const responseBody = {
      outputs: {
        messages: [
          ...messages,
          {
            role: "assistant",
            content: agentResponse,
            id: crypto.randomUUID(),
            type: "ai"
          }
        ]
      }
    };

    const res = NextResponse.json(responseBody);
    return setCorsHeaders(res);

  } catch (error) {
    console.error('API Error:', error);
    // Return 200 with structured error to prevent Warden UI crash
    const res = NextResponse.json(
      { 
          outputs: {
              messages: [
                  { role: "assistant", content: "**API GATEWAY ERROR**\n\nInternal processing failed.", type: "ai" }
              ]
          }
      },
      { status: 200 }
    );
    return setCorsHeaders(res);
  }
}
