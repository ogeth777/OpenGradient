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
    console.log("Received /api/terminal/runs/stream request:", JSON.stringify(body, null, 2));

    // SECURITY CHECK (SOFT)
    const envKey = process.env.WARDEN_API_KEY;
    if (envKey) {
        const headerKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
        if (headerKey !== envKey) {
             console.log("Warning: Unauthorized request to /api/terminal/runs/stream (allowed for compatibility)");
        }
    }

    // Extract input
    const messages = body.input?.messages || [];
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    let userPrompt = "Hello";
    if (lastMessage && lastMessage.content) {
        userPrompt = typeof lastMessage.content === 'string' 
            ? lastMessage.content 
            : JSON.stringify(lastMessage.content);
    }

    // Since we don't support true streaming from the agent yet, we simulate it
    // by getting the full response and sending it as a single event or chunk.
    let agentResponse;
    try {
        agentResponse = await processAgentRequest(userPrompt);
    } catch (agentError: any) {
        console.error("Agent Error in stream:", agentError);
        agentResponse = `**SYSTEM ERROR**\n\n${agentError.message || "Unknown error occurred."}`;
    }

    // Create a stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Event: metadata
        const metadataEvent = {
            run_id: crypto.randomUUID()
        };
        controller.enqueue(encoder.encode(`event: metadata\ndata: ${JSON.stringify(metadataEvent)}\n\n`));

        // Event: values
        const valuesEvent = {
            messages: [
                ...messages,
                {
                    role: "assistant",
                    content: agentResponse,
                    id: crypto.randomUUID(),
                    type: "ai"
                }
            ]
        };
        controller.enqueue(encoder.encode(`event: values\ndata: ${JSON.stringify(valuesEvent)}\n\n`));

        // End
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    return setCorsHeaders(res);
  }
}
