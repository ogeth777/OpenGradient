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

    // Extract input
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
        agentResponse = `**SYSTEM ERROR**\n\n${agentError.message || "Unknown error occurred."}`;
    }

    // Create a stream using standard SSE format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        
        // 1. Send 'metadata' event
        const metadata = { run_id: crypto.randomUUID() };
        controller.enqueue(encoder.encode(`event: metadata\ndata: ${JSON.stringify(metadata)}\n\n`));

        // 2. Send 'values' event (This is what LangGraph UI renders)
        const values = {
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
        // CRITICAL: Double newline \n\n is required for SSE
        controller.enqueue(encoder.encode(`event: values\ndata: ${JSON.stringify(values)}\n\n`));

        // 3. Send 'end' event to close the connection properly
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
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    return setCorsHeaders(res);
  }
}
