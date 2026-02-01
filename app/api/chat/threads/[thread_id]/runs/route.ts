import { NextResponse } from 'next/server';
import { processAgentRequest } from '@/warden-bot/agent';

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

export async function POST(req: Request, { params }: { params: Promise<{ thread_id: string }> }) {
  try {
    const { thread_id } = await params;
    const body = await req.json();
    
    // SECURITY CHECK (SOFT)
    const envKey = process.env.WARDEN_API_KEY;
    if (envKey) {
        const headerKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
        if (headerKey !== envKey) {
             console.warn("WARNING: Request missing correct API Key. Proceeding anyway for compatibility.");
        }
    }

    const messages = body.input?.messages || [];
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    
    let userPrompt = "Hello";
    if (lastMessage && lastMessage.content) {
        userPrompt = typeof lastMessage.content === 'string' 
            ? lastMessage.content 
            : JSON.stringify(lastMessage.content);
    }

    let agentResponse;
    try {
        agentResponse = await processAgentRequest(userPrompt);
    } catch (agentError: any) {
        console.error("Agent Error:", agentError);
        agentResponse = `**SYSTEM ERROR**\n\n${agentError.message || "Unknown error."}`;
    }

    const runId = crypto.randomUUID();
    const now = new Date().toISOString();

    const responseBody = {
      run_id: runId,
      thread_id: thread_id,
      assistant_id: body.assistant_id || "terminal-ai",
      status: "success",
      metadata: {},
      created_at: now,
      updated_at: now,
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
    const res = NextResponse.json(
      { 
          status: "error",
          outputs: {
              messages: [
                  { role: "assistant", content: "**API GATEWAY ERROR**\n\nInternal processing failed.", type: "ai" }
              ]
          }
      },
      { status: 200 } // Keep 200 to prevent client crash
    );
    return setCorsHeaders(res);
  }
}
