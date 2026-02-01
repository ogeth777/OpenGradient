import { NextResponse } from 'next/server';

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

export async function GET(req: Request, { params }: { params: Promise<{ assistant_id: string }> }) {
  const { assistant_id } = await params;

  const schema = {
    graph_id: "terminal-ai",
    input_schema: {
      type: "object",
      properties: {
        messages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              content: { type: "string" }
            }
          }
        }
      },
      required: ["messages"]
    },
    output_schema: {
      type: "object",
      properties: {
        messages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              content: { type: "string" }
            }
          }
        }
      }
    },
    config_schema: {
      type: "object",
      properties: {}
    }
  };

  const res = NextResponse.json(schema);
  return setCorsHeaders(res);
}
