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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[STREAM_DEBUG] Request Body:", JSON.stringify(body, null, 2));

    // Extract input
    const inputPayload = body.input || body;
    const messages = inputPayload.messages || [];
    
    // Determine user prompt
    let userPrompt = "Hello";
    if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        userPrompt = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);
    } else if (typeof inputPayload === 'string') {
        userPrompt = inputPayload;
    }
    
    console.log("[STREAM_DEBUG] User Prompt:", userPrompt);

    // Get Agent Response
    let agentResponse;
    try {
        agentResponse = await processAgentRequest(userPrompt);
    } catch (agentError: any) {
        console.error("[STREAM_DEBUG] Agent Error:", agentError);
        agentResponse = `Error: ${agentError.message || "Unknown error"}`;
    }

    console.log("[STREAM_DEBUG] Agent Response:", agentResponse);

    // Create a stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const runId = crypto.randomUUID();
        const threadId = body.thread_id || crypto.randomUUID();

        // Send MULTIPLE event types to satisfy different parsers

        // 1. Metadata
        const metadata = { run_id: runId, thread_id: threadId };
        controller.enqueue(encoder.encode(`event: metadata\ndata: ${JSON.stringify(metadata)}\n\n`));

        // 2. Values (LangGraph Standard)
        const valuesEvent = {
            messages: [
                ...messages,
                {
                    role: "assistant",
                    content: agentResponse,
                    id: crypto.randomUUID(),
                    type: "ai",
                    response_metadata: { finish_reason: "stop" }
                }
            ]
        };
        controller.enqueue(encoder.encode(`event: values\ndata: ${JSON.stringify(valuesEvent)}\n\n`));

        // 3. Messages/Complete (Another common pattern)
        const completeEvent = [
            {
                role: "assistant",
                content: agentResponse,
                type: "ai"
            }
        ];
        controller.enqueue(encoder.encode(`event: messages/complete\ndata: ${JSON.stringify(completeEvent)}\n\n`));

        // 4. End
        controller.enqueue(encoder.encode(`event: end\ndata: {}\n\n`));
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no', // Disable buffering for Nginx/Vercel
      },
    });

  } catch (error: any) {
    console.error('[STREAM_DEBUG] API Fatal Error:', error);
    const res = NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    return setCorsHeaders(res);
  }
}
