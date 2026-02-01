"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Send, 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  Activity,
  Globe,
  Zap,
  RefreshCw,
  ExternalLink,
  Wallet
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { SwapHandler } from "../components/SwapHandler";

export default function Home() {
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; content: string }[]>([
    { role: 'agent', content: "Hi! I'm your Base Swap Agent. Tell me what to swap, e.g. 'Swap 10 USDC for ETH' or 'Buy 1000 BRETT with USDC' 🚀" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [marketData, setMarketData] = useState<{ trending: any[], yields: any[] }>({ trending: [], yields: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Wallet Hooks
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Hardcoded API URL for display
  const AGENT_API_URL = "https://terminalai-omega.vercel.app/api/terminal";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(7).toUpperCase());
    
    // Fetch Market Data
    fetch('/api/market-data')
      .then(res => res.json())
      .then(data => {
        if (data.trending && data.yields) {
          setMarketData(data);
        }
      })
      .catch(err => console.error("Failed to load market data", err));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent, manualPrompt?: string) => {
    e.preventDefault();
    const promptToSend = manualPrompt || input;
    if (!promptToSend.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: promptToSend }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend, address: address || undefined }),
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'agent', content: data.response || "ERROR: CONNECTION LOST." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'agent', content: "CRITICAL ERROR: FAILED TO REACH CORE." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent, prompt);
  };

  const handleReset = () => {
    setMessages([
      { role: 'agent', content: "Hi! I'm your Base Swap Agent. Tell me what to swap, e.g. 'Swap 10 USDC for ETH' or 'Buy 1000 BRETT with USDC' 🚀" }
    ]);
    setInput("");
    setSessionId(Math.random().toString(36).substring(7).toUpperCase());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Optional: could show a toast here, but for now just console log or rely on UI feedback
  };

  const formatPrice = (price: number) => {
    if (!price) return "$0.00";
    if (price < 0.000001) return `$${price.toExponential(4)}`;
    if (price < 0.001) return `$${price.toFixed(8)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderMessageContent = (content: string) => {
    // Check for <TOKEN_CARDS> tag
    const tokenCardsMatch = content.match(/<TOKEN_CARDS>([\s\S]*?)<\/TOKEN_CARDS>/);
    let cardsData = null;
    let cleanContent = content;

    if (tokenCardsMatch) {
      try {
        cardsData = JSON.parse(tokenCardsMatch[1]);
        cleanContent = content.replace(tokenCardsMatch[0], "").trim();
      } catch (e) {
        console.error("Failed to parse token cards", e);
      }
    }

    // Robust SWAP_TX Extraction
    // 1. Cleanup: Remove markdown code blocks wrapping the tag to prevent regex failure
    if (cleanContent.includes("<SWAP_TX") && cleanContent.includes("```")) {
         cleanContent = cleanContent.replace(/```[a-z]*\s*(<SWAP_TX[\s\S]*?>)\s*```/gi, '$1');
    }

    // 2. Extraction: Capture the tag and attributes string
    const swapTxMatch = cleanContent.match(/<SWAP_TX([\s\S]*?)\/?>/i);
    let swapTxData = null;

    if (swapTxMatch) {
        // ALWAYS remove the tag from the displayed text so it doesn't duplicate or show raw code
        cleanContent = cleanContent.replace(swapTxMatch[0], "").trim();

        const attrs = swapTxMatch[1];
        
        // Helper to extract attribute values (supports " and ', and spaces)
        const getAttr = (name: string) => {
            const match = attrs.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i')) || 
                          attrs.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, 'i'));
            return match ? match[1] : null;
        };

        const tokenIn = getAttr('tokenIn');
        const tokenOut = getAttr('tokenOut');
        const amount = getAttr('amount');
        const tokenInAddr = getAttr('tokenInAddr');
        const tokenOutAddr = getAttr('tokenOutAddr');
        const amountAtomic = getAttr('amountAtomic');
        const chain = getAttr('chain');

        // Verify we have minimal required data
        if (tokenIn && tokenOut && amount && tokenInAddr && tokenOutAddr) {
            swapTxData = {
                tokenIn,
                tokenOut,
                amount,
                tokenInAddr,
                tokenOutAddr,
                amountAtomic: amountAtomic || "0",
                chain: chain || "base"
            };
        }
    }

    // Check for <SWAP_WIDGET> tag (Legacy/External Link)
    const swapWidgetMatch = cleanContent.match(/<SWAP_WIDGET\s+tokenIn="([^"]+)"\s+tokenOut="([^"]+)"\s+amount="([^"]+)"\s+chain="([^"]+)"\s+link="([^"]+)"\s*\/>/);
    let swapData = null;

    if (swapWidgetMatch) {
        swapData = {
            tokenIn: swapWidgetMatch[1],
            tokenOut: swapWidgetMatch[2],
            amount: swapWidgetMatch[3],
            chain: swapWidgetMatch[4],
            link: swapWidgetMatch[5]
        };
        cleanContent = cleanContent.replace(swapWidgetMatch[0], "").trim();
    }

    return (
      <div className="leading-relaxed text-sm md:text-base">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({node, ...props}) => (
              <a {...props} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline underline-offset-4 decoration-green-500/50 hover:decoration-green-400 transition-all cursor-pointer font-bold" />
            ),
            p: ({node, ...props}) => {
                return <p {...props} className="mb-2 last:mb-0 whitespace-pre-wrap" />
            },
            ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside mb-2" />,
            code: ({node, className, children, ...props}) => {
                const text = String(children).replace(/\n$/, '');
                const isAddress = /^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(text);
                
                if (isAddress) {
                    return (
                        <code 
                            {...props} 
                            onClick={() => copyToClipboard(text)}
                            className="bg-green-900/30 px-1 rounded text-green-300 font-mono text-sm cursor-pointer hover:bg-green-500/20 hover:text-green-200 transition-colors border-b border-dashed border-green-500/50"
                            title="Click to Copy Address"
                        >
                            {children}
                        </code>
                    );
                }
                return <code {...props} className="bg-green-900/30 px-1 rounded text-green-300 font-mono text-sm">{children}</code>
            },
          }}
        >
          {cleanContent.replace(/(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})/g, '`$1`')}
        </ReactMarkdown>

        {swapTxData && (
            <SwapHandler {...swapTxData} />
        )}

        {cardsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {cardsData.map((token: any, i: number) => (
              <div key={i} className="bg-black/40 border border-green-900/50 p-4 rounded-sm hover:border-green-500/30 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {token.image ? (
                       <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/5">
                         <Image 
                           src={token.image} 
                           alt={token.symbol} 
                           fill
                           sizes="32px"
                           className="object-cover"
                         />
                       </div>
                    ) : (
                       <div className="w-8 h-8 rounded-full bg-green-900/20 flex items-center justify-center text-xs font-bold">{token.symbol[0]}</div>
                    )}
                    <div>
                      <div className="font-bold text-green-100">{token.symbol}</div>
                      <div className="text-xs text-green-600 truncate max-w-[100px]">{token.name}</div>
                    </div>
                  </div>
                  <div className={`text-right ${token.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     <div className="font-mono font-bold">{formatPrice(token.current_price)}</div>
                     <div className="text-xs flex items-center justify-end gap-1">
                        {token.price_change_percentage_24h >= 0 ? '▲' : '▼'}
                        {Math.abs(token.price_change_percentage_24h).toFixed(2)}%
                     </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                    <a 
                      href={token.trade_url || token.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 hover:border-green-400 py-2 rounded text-xs uppercase tracking-widest text-green-400 font-bold transition-all"
                    >
                      {token.trade_url ? "SWAP" : "VIEW"} <Zap className="w-3 h-3" />
                    </a>
                    {token.security_url && (
                        <a 
                          href={token.security_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-3 bg-red-900/10 hover:bg-red-500/20 border border-red-900/50 hover:border-red-400 py-2 rounded text-xs uppercase tracking-widest text-red-400 transition-all"
                          title="Security Scan"
                        >
                          <ShieldCheck className="w-3 h-3" />
                        </a>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };


  return (
    <main className="min-h-screen bg-[#050505] text-green-500 font-mono overflow-hidden flex flex-col">
      {/* Matrix-like Background */}
      <div className="absolute inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}>
      </div>

      {/* Header */}
      <header className="border-b border-green-900/50 p-4 flex justify-between items-center bg-[#0a0a0a]/90 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-green-500/50 rounded flex items-center justify-center bg-green-500/10 relative overflow-hidden">
             <Image src="/avatar.png" alt="Logo" fill className="object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-white">TERMINAL AI</h1>
            <p className="text-xs text-green-600">v2.4.0 // CONNECTED</p>
          </div>
        </div>

        {/* API Endpoint Display */}
        <div className="hidden md:flex items-center gap-2 bg-green-900/20 px-3 py-1 rounded border border-green-800/50">
          <span className="text-xs text-green-600 font-mono">AGENT API:</span>
          <code className="text-xs text-green-400 font-mono select-all">{AGENT_API_URL}</code>
          <button 
              onClick={() => copyToClipboard(AGENT_API_URL)}
              className="ml-2 text-green-600 hover:text-green-300 transition-colors"
              title="Copy API URL"
          >
              <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="flex gap-4 text-xs uppercase tracking-widest items-center">
            {/* Wallet Connect Button */}
            {!isConnected ? (
                <button 
                    onClick={() => connect({ connector: injected() })}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-black font-bold px-4 py-2 rounded transition-all"
                >
                    <Wallet className="w-3 h-3" /> Connect Wallet
                </button>
            ) : (
                <button 
                    onClick={() => disconnect()}
                    className="flex items-center gap-2 border border-green-500/50 text-green-400 hover:bg-green-500/10 px-4 py-2 rounded transition-all"
                    title={address}
                >
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                </button>
            )}

          <div className="w-px h-6 bg-green-900/50 mx-2" />
          
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 bg-red-950/10 px-3 py-1 rounded transition-all group"
            title="Reset Session"
          >
            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
            NEW CHAT
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Chat Interface */}
        <section className="flex-1 flex flex-col relative">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-transparent">
            {messages.length <= 1 && (
                <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto my-12 px-4">
                    {[
                        "What can the Terminal AI Agent do?",
                        "Swap 10 USDC for DAI on Base",
                        "Swap ETH for USDC",
                        "Trending tokens on Base",
                        "Analyze risk of a token"
                    ].map((prompt, i) => (
                        <button 
                            key={i}
                            onClick={() => handleSuggestionClick(prompt)}
                            className="px-6 py-3 rounded-full border border-green-500/30 bg-green-900/10 hover:bg-green-500/20 hover:border-green-400 text-green-400 text-sm font-medium transition-all hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] backdrop-blur-sm"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-sm border ${
                  msg.role === 'user' 
                    ? 'bg-green-900/10 border-green-500/30 text-green-100' 
                    : 'bg-black/60 border-green-900/50 text-green-400'
                }`}>
                  <div className="text-[10px] uppercase tracking-widest mb-1 opacity-50 flex items-center gap-2">
                    {msg.role === 'user' ? (
                      <>USER <span className="w-1 h-1 bg-green-500 rounded-full" /></>
                    ) : (
                      <><Cpu className="w-3 h-3" /> TERMINAL AI</>
                    )}
                  </div>
                  {renderMessageContent(msg.content)}
                </div>
              </motion.div>
            ))}
            {isLoading && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                 <div className="bg-black/60 border border-green-900/50 p-4 rounded-sm flex items-center gap-2 text-green-500">
                   <span className="w-2 h-2 bg-green-500 animate-ping rounded-full" />
                   PROCESSING DATA STREAM...
                 </div>
               </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-green-900/30 bg-black/80 backdrop-blur">
            {/* Quick Suggestions */}
            <div className="flex gap-2 mb-3 max-w-4xl mx-auto overflow-x-auto pb-1 scrollbar-none">
              {[
                { label: "Trending Tokens", cmd: "What are the trending tokens on Base?" },
                { label: "Yield Farming", cmd: "Find best yield opportunities on Base" },
                { label: "Risk Analysis", cmd: "START_RISK_ANALYSIS" },
                { label: "Top Gainers", cmd: "Show me top gainers on Base" },
                { label: "Portfolio", cmd: "Analyze my portfolio with DeBank" },
                { label: "Menu", cmd: "Menu" }
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(chip.cmd)}
                  className="whitespace-nowrap px-3 py-1.5 bg-green-900/10 border border-green-800/50 hover:border-green-400 hover:bg-green-500/10 text-green-500 hover:text-green-300 rounded-sm text-[10px] md:text-xs uppercase tracking-wider transition-all"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-4 max-w-4xl mx-auto">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="ENTER COMMAND OR QUERY..."
                  className="w-full bg-black/50 border border-green-700/50 rounded p-4 pl-6 text-green-100 placeholder-green-800 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/20 font-mono transition-all"
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-green-700">{">"}</div>
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="bg-green-900/20 border border-green-500/50 text-green-400 px-8 rounded hover:bg-green-500/10 hover:border-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                EXECUTE <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
