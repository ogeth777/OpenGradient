"use client";

import { useState } from "react";
import NetworkBackground from "./components/NetworkBackground";
import MouseGlow from "./components/MouseGlow";
import VideoModal from "./components/VideoModal";
import { ExternalLink, Zap, Brain, Users, BarChart3, ChevronDown } from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const openVideo = (src: string) => {
    setVideoSrc(src);
    setIsModalOpen(true);
  };

  return (
    <main className="relative min-h-screen w-full bg-[#0b0b15] text-white selection:bg-cyan-500/30 font-sans">
      <NetworkBackground />
      <MouseGlow />

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header / Intro Section */}
        <div className="flex flex-col items-center text-center mt-10 mb-20">
            <div className="mb-6 animate-bounce text-cyan-400">
                <ChevronDown className="h-8 w-8" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                What is OpenGradient?
            </h1>
            
            <p className="max-w-3xl text-lg md:text-xl text-gray-400 leading-relaxed">
                OpenGradient is the leading decentralized network for verifiable AI computing. It builds the infrastructure for "User Owned AI" secure, open, and auditable. Unlike traditional black box models, OpenGradient ensures every inference is proven on chain, making intelligence transparent, tamper proof, and truly yours.
            </p>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            
            {/* MemSync Card */}
            <div className="group relative flex flex-col rounded-3xl border border-white/10 bg-[#12121f] p-6 hover:border-purple-500/50 transition-all duration-300">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                    <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">MemSync</h3>
                <p className="text-xs font-bold tracking-wider text-purple-400 uppercase mb-4">YOUR ETERNAL MEMORY FOR ANY AI</p>
                
                <div 
                    onClick={() => openVideo("/MemSync.mp4")}
                    className="mb-6 overflow-hidden rounded-lg border border-white/10 bg-black/50 aspect-video relative group-hover:border-purple-500/50 transition-all cursor-pointer"
                >
                     <video src="/MemSync.mp4" className="w-full h-full object-cover opacity-80" autoPlay muted loop playsInline />
                </div>

                <p className="text-sm text-gray-400 mb-6 leading-relaxed flex-grow">
                    Imagine if ChatGPT, Claude, or any other AI remembered EVERYTHING about you: what you like, past conversations. MemSync is like a memory cloud that travels with you across different AIs. Everything is encrypted and yours alone.
                </p>

                <a 
                    href="https://www.opengradient.ai/memsync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2"
                >
                    Try It <ExternalLink className="h-4 w-4" />
                </a>
            </div>

            {/* Twin.fun Card */}
            <div className="group relative flex flex-col rounded-3xl border border-white/10 bg-[#12121f] p-6 hover:border-pink-500/50 transition-all duration-300">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400">
                    <Users className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Twin.fun</h3>
                <p className="text-xs font-bold tracking-wider text-pink-400 uppercase mb-4">TRADE DIGITAL MINDS</p>
                
                <div 
                    onClick={() => setVideoSrc(null)} // No video for Twin.fun, maybe open image? Or do nothing? Actually user said "videos must be clickable". Twin.fun has an image.
                    className="mb-6 overflow-hidden rounded-lg border border-white/10 bg-black/50 aspect-video relative group-hover:border-pink-500/50 transition-all"
                >
                     <img src="/Twin.fun.PNG" alt="Twin.fun" className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500" />
                </div>

                <p className="text-sm text-gray-400 mb-6 leading-relaxed flex-grow">
                    Trade onchain keys for AI digital twins modeled after real people's ideas. Key value grows with demand via a transparent bonding curve. Unlock chat, debate, and pitch access to these AI minds. Collaborate, learn, and earn from specialized intelligence.
                </p>

                <a 
                    href="http://Twin.fun"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 hover:border-pink-500/50 transition-all flex items-center justify-center gap-2"
                >
                    Try It <ExternalLink className="h-4 w-4" />
                </a>
            </div>

            {/* BitQuant Card */}
            <div className="group relative flex flex-col rounded-3xl border border-white/10 bg-[#12121f] p-6 hover:border-cyan-500/50 transition-all duration-300">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                    <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">BitQuant</h3>
                <p className="text-xs font-bold tracking-wider text-cyan-400 uppercase mb-4">YOUR PERSONAL AI QUANT</p>
                
                <div 
                    onClick={() => openVideo("/BITQUAN.mp4")}
                    className="mb-6 overflow-hidden rounded-lg border border-white/10 bg-black/50 aspect-video relative group-hover:border-cyan-500/50 transition-all cursor-pointer"
                >
                     <video src="/BITQUAN.mp4" className="w-full h-full object-cover opacity-80" autoPlay muted loop playsInline />
                </div>

                <p className="text-sm text-gray-400 mb-6 leading-relaxed flex-grow">
                    Your personal AI Quant for DeFi. BitQuant leverages advanced machine learning and real time on chain data to democratize quantitative analysis. Simply ask in plain English 'Analyze token risk' or 'Optimize my portfolio' to get institutional grade insights, charts, and data driven strategies instantly.
                </p>

                <a 
                    href="https://github.com/OpenGradient/BitQuant"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2"
                >
                    Try It <ExternalLink className="h-4 w-4" />
                </a>
            </div>

        </div>

        {/* Why is this important Section */}
        <div className="mb-24">
            <h2 className="text-3xl font-bold text-center text-white mb-12">Why is this important for beginners?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 rounded-2xl bg-[#161626] p-6 border border-white/5 hover:border-green-500/30 transition-colors">
                    <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0"></div>
                    <span className="text-gray-300 font-medium">Free tools to start in Web3 and AI</span>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-[#161626] p-6 border border-white/5 hover:border-green-500/30 transition-colors">
                    <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0"></div>
                    <span className="text-gray-300 font-medium">Your personal AI Quant for DeFi with institutional-grade insights</span>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-[#161626] p-6 border border-white/5 hover:border-green-500/30 transition-colors">
                    <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0"></div>
                    <span className="text-gray-300 font-medium">Control your attention and memory</span>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-[#161626] p-6 border border-white/5 hover:border-green-500/30 transition-colors">
                    <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0"></div>
                    <span className="text-gray-300 font-medium">Everything is open, transparent, and secure thanks to blockchain</span>
                </div>
            </div>
        </div>

        {/* Still have questions Section */}
        <div className="relative mb-24 overflow-hidden rounded-3xl bg-gradient-to-r from-[#1a1a2e] to-[#161626] p-10 border border-white/10 text-center">
            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-4">Still have questions?</h2>
                <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                    If something isn't clear or you want to learn more, join the official community! Ask questions, get help, and meet other beginners.
                </p>
                <a 
                    href="https://discord.gg/opengradient" 
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-8 py-3 font-semibold text-white transition-all hover:bg-[#4752c4] hover:shadow-lg hover:shadow-[#5865F2]/30"
                >
                     Join OpenGradient Discord
                </a>
            </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 pt-12 pb-8 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="OpenGradient" className="h-8 w-8" />
                <span className="text-lg font-bold text-white">OpenGradient</span>
            </div>
            
            <div className="flex gap-8 text-sm text-gray-500 mb-8">
                <a href="https://www.opengradient.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Website</a>
                <a href="https://twitter.com/OpenGradient" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Twitter / X</a>
                <a href="https://github.com/ogeth777/OpenGradient" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">GitHub</a>
            </div>
            
            <p className="text-xs text-gray-600">
                Made by <a href="https://twitter.com/OG_Cryptooo" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">@OG_Cryptooo</a> | Built on <a href="https://twitter.com/OpenGradient" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">@OpenGradient</a> 🚀 (v1.1)
            </p>
        </footer>

      </div>

      <VideoModal 
        isOpen={isModalOpen} 
        videoSrc={videoSrc} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  );
}