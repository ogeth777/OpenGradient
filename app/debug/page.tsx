"use client";

import { useState } from 'react';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${msg}`]);

  const testSimpleEndpoint = async () => {
    setLoading(true);
    addLog("Testing POST /api/terminal...");
    try {
      const res = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Hello from Debugger" })
      });
      const data = await res.json();
      addLog(`Status: ${res.status}`);
      addLog(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      addLog(`ERROR: ${e.message}`);
    }
    setLoading(false);
  };

  const testStreamEndpoint = async () => {
    setLoading(true);
    addLog("Testing POST /api/terminal/runs/stream...");
    try {
      const res = await fetch('/api/terminal/runs/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            input: { messages: [{ role: "user", content: "Debug Stream" }] },
            assistant_id: "terminal-ai",
            thread_id: "debug-thread"
        })
      });
      
      addLog(`Status: ${res.status}`);
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        addLog("No reader available");
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        addLog(`Received Chunk: ${chunk}`);
      }
      addLog("Stream finished.");
    } catch (e: any) {
      addLog(`ERROR: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-black text-green-400 font-mono min-h-screen">
      <h1 className="text-2xl mb-4 border-b border-green-800 pb-2">TERMINAL AI DEBUGGER</h1>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={testSimpleEndpoint} 
          disabled={loading}
          className="px-4 py-2 bg-green-900 hover:bg-green-800 disabled:opacity-50"
        >
          Test Simple API
        </button>
        <button 
          onClick={testStreamEndpoint} 
          disabled={loading}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-blue-100"
        >
          Test Stream API
        </button>
      </div>

      <div className="bg-gray-900 p-4 rounded border border-green-800 h-[600px] overflow-auto whitespace-pre-wrap">
        {logs.length === 0 ? "Ready to test. Click a button above." : logs.join('\n')}
      </div>
    </div>
  );
}
