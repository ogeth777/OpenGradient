"use client";

import { useState, useRef, useEffect } from "react";

export default function TerminalPage() {
  const [history, setHistory] = useState<string[]>([
    "Initializing Terminal AI...",
    "Connected to Warden Protocol.",
    "System Online.",
    "Type 'help' for available commands."
  ]);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    const newHistory = [...history, `> ${cmd}`];
    setHistory(newHistory);
    setInput("");
    setProcessing(true);

    if (cmd.toLowerCase() === "clear") {
      setHistory([]);
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cmd })
      });
      
      const data = await res.json();
      // The backend returns { output: "..." }
      if (data.output) {
        // Handle multiline output by splitting
        const lines = data.output.split('\n');
        setHistory(prev => [...prev, ...lines]);
      } else if (data.error) {
         setHistory(prev => [...prev, `Error: ${data.error}`]);
      } else {
        setHistory(prev => [...prev, JSON.stringify(data)]);
      }
    } catch (e) {
      setHistory(prev => [...prev, "Error: Failed to connect to terminal backend."]);
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !processing) {
      handleCommand(input);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 overflow-y-auto text-lg">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 whitespace-pre-wrap break-words">
          {history.map((line, i) => (
            <div key={i} className="mb-1 leading-relaxed">{line}</div>
          ))}
          <div ref={scrollRef} />
        </div>
        
        <div className="flex items-center border-t border-green-900/30 pt-4 sticky bottom-0 bg-black pb-4">
          <span className="mr-2 text-green-400">{">"}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent outline-none flex-1 text-green-400 placeholder-green-800"
            placeholder={processing ? "Processing..." : "Enter command..."}
            disabled={processing}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
