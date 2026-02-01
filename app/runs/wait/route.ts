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
    console.log("Received /runs/wait request:", JSON.stringify(body, null, 2));

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

    const res = NextResponse.json(responseBody);
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
