import { NextResponse } from 'next/server';
import { processAgentRequest } from '@/warden-bot/agent';

// For /api/chat/runs/wait, CORS is handled by next.config.ts
// So we don't need manual CORS headers here to avoid duplication errors.

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received /runs/wait request (fallback):", JSON.stringify(body, null, 2));

    // SECURITY CHECK
    // If WARDEN_API_KEY is set in environment, we require it in headers
    const envKey = process.env.WARDEN_API_KEY;
    if (envKey) {
        const headerKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
        if (headerKey !== envKey) {
             console.log("Blocked unauthorized request to /runs/wait (fallback)");
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    // Extract the last user message from the input
    // LangGraph input structure: { input: { messages: [ ... ] } }
    const messages = body.input?.messages || [];
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    
    let userPrompt = "";
    if (lastMessage && lastMessage.content) {
        userPrompt = typeof lastMessage.content === 'string' 
            ? lastMessage.content 
            : JSON.stringify(lastMessage.content);
    } else {
        // Fallback or error
        userPrompt = "Hello";
    }

    console.log("Extracted prompt:", userPrompt);

    // Call the agent
    const agentResponse = await processAgentRequest(userPrompt);

    // Construct a LangGraph-compatible response
    // Usually expects the final state or outputs
    const responseBody = {
      outputs: {
        messages: [
          ...messages,
          {
            role: "assistant",
            content: agentResponse,
            id: crypto.randomUUID(), // Mock ID
            type: "ai"
          }
        ]
      }
    };

    return NextResponse.json(responseBody);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
