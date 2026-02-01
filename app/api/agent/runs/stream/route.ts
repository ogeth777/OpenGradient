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
    console.log("Received /api/agent/runs/stream request:", JSON.stringify(body, null, 2));

    // SECURITY CHECK
    const envKey = process.env.WARDEN_API_KEY;
    if (envKey) {
        const headerKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
        if (headerKey !== envKey) {
             console.log("Blocked unauthorized request to /api/agent/runs/stream");
             const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
             return setCorsHeaders(res);
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
        agentResponse = `**SYSTEM ERROR**\n\n${agentError.message || "Unknown error occurred."}`;
    }

    // Create a stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // LangGraph stream format usually involves specific event types
        // Standard SSE format: data: ... \n\n
        
        // Event: metadata
        const metadataEvent = {
            event: "metadata",
            data: { run_id: crypto.randomUUID() }
        };
        controller.enqueue(encoder.encode(`event: metadata\ndata: ${JSON.stringify(metadataEvent)}\n\n`));

        // Event: messages/complete (simulated)
        // Or just 'data' events. Warden likely expects 'updates' or 'values'.
        // Let's mimic a simple output.
        
        // We'll send the final output as a 'values' event which is common in LangGraph
        const valuesEvent = {
            event: "values",
            data: {
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
        controller.enqueue(encoder.encode(`event: values\ndata: ${JSON.stringify(valuesEvent.data)}\n\n`));

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
    const res = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    return setCorsHeaders(res);
  }
}
