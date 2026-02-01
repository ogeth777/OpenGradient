import { NextResponse } from 'next/server';
import { processAgentRequest } from '@/warden-bot/agent';

// Helper to set CORS headers
function setCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, openai-organization, openai-project');
  return res;
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  return setCorsHeaders(res);
}

// THIS IS A COPY OF THE LOGIC FROM /api/terminal/runs/stream
// But adapted for NON-STREAMING (Standard HTTP Response)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[RUNS_DEBUG] Request Body:", JSON.stringify(body, null, 2));

    const inputPayload = body.input || body;
    const messages = inputPayload.messages || [];
    
    let userPrompt = "Hello";
    if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        userPrompt = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);
    } else if (typeof inputPayload === 'string') {
        userPrompt = inputPayload;
    }
    
    console.log("[RUNS_DEBUG] User Prompt:", userPrompt);

    let agentResponse;
    try {
        agentResponse = await processAgentRequest(userPrompt);
    } catch (agentError: any) {
        agentResponse = `Error: ${agentError.message || "Unknown error"}`;
    }

    // Standard LangGraph Run Response (Not Streaming)
    const runId = crypto.randomUUID();
    const threadId = body.thread_id || crypto.randomUUID();
    
    const responseBody = {
        run_id: runId,
        thread_id: threadId,
        status: "success",
        metadata: {},
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

  } catch (error: any) {
    console.error('[RUNS_DEBUG] API Fatal Error:', error);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    return setCorsHeaders(res);
  }
}
