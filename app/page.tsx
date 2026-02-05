"use client";

import { useState } from "react";
import NetworkBackground from "./components/NetworkBackground";
import MouseGlow from "./components/MouseGlow";
import VideoModal from "./components/VideoModal";
import { ArrowRight, Play, ExternalLink, Zap, Brain, Users } from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const openVideo = (src: string) => {
    setVideoSrc(src);
    setIsModalOpen(true);
  };

  const scrollToProjects = () => {
    const element = document.getElementById('projects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-[#0f0f1a] text-white selection:bg-cyan-500/30">
      <NetworkBackground />
      <MouseGlow />
      
      {/* Hero Section */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        
        <div className="mb-8">
            <img src="/logo.png" alt="OpenGradient Logo" className="h-24 w-24 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)]" />
        </div>

        <h1 className="mb-6 max-w-4xl text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
          <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
            OpenGradient
          </span>
        </h1>

        <p className="mb-2 max-w-2xl text-xl text-gray-400 md:text-2xl font-light">
          The Future of AI on Blockchain, Simplified
        </p>

        <p className="mb-10 max-w-2xl text-md text-gray-500">
          Learn what MemSync, BitQuant, and Twin.fun are in 5 minutes.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
           <button 
             onClick={scrollToProjects}
             className="group relative overflow-hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 px-10 py-3 font-semibold text-cyan-400 transition-all hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:border-cyan-500/60"
           >
            <span className="relative z-10 flex items-center gap-2">
              Explore Ecosystem <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>

      {/* Projects Section */}
      <div id="projects" className="relative z-10 flex flex-col items-center py-20 px-4 space-y-24 max-w-7xl mx-auto">
        
        {/* MemSync */}
        <div className="flex flex-col lg:flex-row items-center gap-12 w-full">
            <div className="flex-1 space-y-6 text-left">
                <div className="flex items-center gap-3 text-cyan-400">
                    <Brain className="h-6 w-6" />
                    <span className="text-lg font-mono">MemSync AI</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white">Your AI's Second Brain</h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                    MemSync connects your AI agents to a decentralized knowledge base. It allows them to remember past interactions, learn from new data, and share insights across different applications securely on-chain.
                </p>
                <button 
                    onClick={() => openVideo("/MemSync.mp4")}
                    className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all border border-white/10 hover:border-cyan-500/50"
                >
                    <Play className="h-5 w-5 fill-current" /> Watch Demo
                </button>
            </div>
            <div className="flex-1 w-full relative group cursor-pointer" onClick={() => openVideo("/MemSync.mp4")}>
                <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 aspect-video flex items-center justify-center group-hover:border-cyan-500/50 transition-all">
                     <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-white fill-white ml-1" />
                     </div>
                     <p className="absolute bottom-4 text-sm text-gray-400">Click to watch MemSync Demo</p>
                </div>
            </div>
        </div>

        {/* BitQuant */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 w-full">
            <div className="flex-1 space-y-6 text-left lg:text-right">
                <div className="flex items-center gap-3 text-cyan-400 lg:justify-end">
                    <Zap className="h-6 w-6" />
                    <span className="text-lg font-mono">BitQuant</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white">Institutional-Grade Analytics</h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                    Real-time forensics, risk analysis, and market intelligence for the Base network. BitQuant provides the data you need to trade smarter, safer, and faster than the competition.
                </p>
                <div className="flex lg:justify-end">
                    <button 
                        onClick={() => openVideo("/BITQUAN.mp4")}
                        className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all border border-white/10 hover:border-cyan-500/50"
                    >
                        <Play className="h-5 w-5 fill-current" /> Watch Demo
                    </button>
                </div>
            </div>
            <div className="flex-1 w-full relative group cursor-pointer" onClick={() => openVideo("/BITQUAN.mp4")}>
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 aspect-video flex items-center justify-center group-hover:border-purple-500/50 transition-all">
                     <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-white fill-white ml-1" />
                     </div>
                     <p className="absolute bottom-4 text-sm text-gray-400">Click to watch BitQuant Demo</p>
                </div>
            </div>
        </div>

        {/* Twin.fun */}
        <div className="flex flex-col lg:flex-row items-center gap-12 w-full pb-20">
            <div className="flex-1 space-y-6 text-left">
                <div className="flex items-center gap-3 text-cyan-400">
                    <Users className="h-6 w-6" />
                    <span className="text-lg font-mono">Twin.fun</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white">Social AI Agents</h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                    Create, customize, and deploy social AI twins that can interact, learn, and grow with your community. Twin.fun makes AI social, accessible, and fun for everyone.
                </p>
                <a 
                    href="http://Twin.fun" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-lg hover:underline"
                >
                    Visit Twin.fun <ExternalLink className="h-4 w-4" />
                </a>
            </div>
            <div className="flex-1 w-full relative group">
                <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 aspect-video flex items-center justify-center group-hover:border-pink-500/50 transition-all">
                     <img src="/Twin.fun.PNG" alt="Twin.fun Interface" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </div>

        <div className="text-center text-gray-600 text-sm pb-10">
            <p>Powered by OpenGradient • Built on Base</p>
        </div>

      </div>

      <VideoModal 
        isOpen={isModalOpen} 
        videoSrc={videoSrc} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  );
}
