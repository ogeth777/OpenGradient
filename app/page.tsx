"use client";

import { motion } from "framer-motion";
import { Brain, BarChart3, Users, ExternalLink, ChevronDown, MessageCircle } from "lucide-react";
import MouseGlow from "./components/MouseGlow";
import NetworkBackground from "./components/NetworkBackground";
import VideoModal from "./components/VideoModal";
import { useState } from "react";

export default function Home() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const scrollToProjects = () => {
    const element = document.getElementById("projects");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white overflow-x-hidden selection:bg-purple-500/30">
      <NetworkBackground />
      <MouseGlow />
      
      <VideoModal 
        isOpen={!!selectedVideo} 
        videoSrc={selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        
        {/* Floating Background Logos */}
        <motion.div 
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 0.05, x: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute left-[-10%] md:left-[5%] top-1/4 w-64 h-64 md:w-96 md:h-96 pointer-events-none"
        >
           <motion.img 
             src="/opengradient.png" 
             alt="Background Logo Left" 
             className="w-full h-full object-contain"
             animate={{ 
               y: [0, -20, 0],
               rotate: [0, 5, 0]
             }}
             transition={{ 
               duration: 6, 
               repeat: Infinity, 
               ease: "easeInOut" 
             }}
           />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 0.05, x: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute right-[-10%] md:right-[5%] bottom-1/4 w-64 h-64 md:w-96 md:h-96 pointer-events-none"
        >
           <motion.img 
             src="/opengradient.png" 
             alt="Background Logo Right" 
             className="w-full h-full object-contain"
             animate={{ 
               y: [0, 20, 0],
               rotate: [0, -5, 0]
             }}
             transition={{ 
               duration: 7, 
               repeat: Infinity, 
               ease: "easeInOut",
               delay: 1
             }}
           />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10 max-w-5xl mx-auto"
        >
          <div className="mb-10 flex justify-center">
            <div className="relative group cursor-default">
              {/* Outer Glow Effect */}
              <div className="absolute -inset-4 bg-cyan-500/30 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition duration-500 animate-pulse" />
              
              {/* Icon Container */}
              <div className="relative w-32 h-32 bg-black rounded-[2rem] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden ring-1 ring-white/5">
                 {/* Inner subtle gradient for depth */}
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent z-10 pointer-events-none" />
                 
                 {/* Logo Image - fitting perfectly */}
                 <img 
                   src="/logo.png" 
                   alt="OpenGradient Logo" 
                   className="w-full h-full object-cover" 
                 />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-bold mb-8 tracking-tight">
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.3)]">
              OpenGradient
            </span>
            <span className="block text-2xl md:text-4xl mt-6 text-gray-300 font-normal leading-relaxed">
              The Future of AI on Blockchain, Simplified
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-10 font-light">
            Learn what MemSync, BitQuant, and Twin.fun are in 5 minutes
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToProjects}
            className="cursor-pointer group relative px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-lg font-medium transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
          >
            Get Started
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
          </motion.button>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-0 flex flex-col items-center pointer-events-none"
        >
          <div className="animate-bounce text-cyan-400/80 mb-4 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            <ChevronDown size={32} />
          </div>
          {/* Connecting Line with Gradient */}
          <div className="w-[1px] h-24 bg-gradient-to-b from-cyan-400 to-transparent opacity-50 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
        </motion.div>
      </section>

      {/* What is OpenGradient */}
      <section className="py-20 px-4 relative z-10 bg-[#0f0f1a]/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-white">What is OpenGradient?</h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              OpenGradient is the leading decentralized network for verifiable AI computing. It builds the infrastructure for &quot;User Owned AI&quot; secure, open, and auditable. Unlike traditional black box models, OpenGradient ensures every inference is proven on chain, making intelligence transparent, tamper proof, and truly yours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* MemSync */}
          <ProjectCard 
            icon={<Brain className="w-12 h-12 text-purple-400" />}
            title="MemSync"
            subtitle="Your Eternal Memory for Any AI"
            videoSrc="/MemSync.mp4"
            description="Imagine if ChatGPT, Claude, or any other AI remembered EVERYTHING about you: what you like, past conversations. MemSync is like a memory cloud that travels with you across different AIs. Everything is encrypted and yours alone."
            link="https://app.memsync.ai/"
            gradient="from-purple-500/20 to-blue-500/5"
            borderColor="border-purple-500/30"
            onVideoClick={() => setSelectedVideo("/MemSync.mp4")}
          />

          {/* Twin.fun */}
          <ProjectCard 
            icon={<Users className="w-12 h-12 text-pink-400" />}
            title="Twin.fun"
            subtitle="Trade Digital Minds"
            imageSrc="/Twin.fun.PNG"
            description="Trade onchain keys for AI digital twins modeled after real people's ideas. Key value grows with demand via a transparent bonding curve. Unlock chat, debate, and pitch access to these AI minds. Collaborate, learn, and earn from specialized intelligence."
            link="https://www.twin.fun"
            gradient="from-pink-500/20 to-rose-500/5"
            borderColor="border-pink-500/30"
          />

          {/* BitQuant */}
          <ProjectCard 
            icon={<BarChart3 className="w-12 h-12 text-blue-400" />}
            title="BitQuant"
            subtitle="Your Personal AI Quant"
            videoSrc="/BITQUAN.mp4"
            description="Your personal AI Quant for DeFi. BitQuant leverages advanced machine learning and real time on chain data to democratize quantitative analysis. Simply ask in plain English 'Analyze token risk' or 'Optimize my portfolio' to get institutional grade insights, charts, and data driven strategies instantly."
            link="https://www.bitquant.io/"
            gradient="from-blue-500/20 to-cyan-500/5"
            borderColor="border-blue-500/30"
            onVideoClick={() => setSelectedVideo("/BITQUAN.mp4")}
          />

        </div>
      </section>

      {/* Why Important */}
      <section className="py-20 px-4 relative z-10 bg-gradient-to-b from-transparent to-black/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">Why is this important for beginners?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FeatureItem text="Free tools to start in Web3 and AI" />
            <FeatureItem text="The future belongs to users, not corporations" />
            <FeatureItem text="Control your attention, memory, and trading" />
            <FeatureItem text="Everything is open, transparent, and secure thanks to blockchain" />
          </div>
        </div>
      </section>

      {/* Community / Help */}
      <section className="py-10 px-4 relative z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block p-8 rounded-3xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-white/10 backdrop-blur-md max-w-2xl mx-auto"
        >
          <h3 className="text-2xl font-bold mb-4 text-white">Still have questions?</h3>
          <p className="text-gray-300 mb-8 text-lg leading-relaxed">
            If something isn&apos;t clear or you want to learn more, join the official community! 
            Ask questions, get help, and meet other beginners.
          </p>
          <a 
            href="https://discord.com/invite/2t5sx5BCpB" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-indigo-500/20 group"
          >
            <MessageCircle className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
            Join OpenGradient Discord
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/10 text-center text-gray-400 text-sm relative z-10 bg-[#0a0a12]">
        <div className="flex justify-center items-center gap-2 mb-4">
           <img src="/logo.png" alt="OpenGradient Logo" className="w-6 h-6 object-contain" />
           <span className="text-white font-bold text-lg">OpenGradient</span>
        </div>
        <div className="flex justify-center gap-6 mb-6">
          <FooterLink href="https://opengradient.ai" text="Website" />
          <FooterLink href="https://twitter.com/OpenGradient" text="Twitter / X" />
          <FooterLink href="https://github.com/OpenGradient" text="GitHub" />
        </div>
        <p className="mb-2 text-gray-500 text-base">
          Made by <a href="https://x.com/OG_Cryptooo" target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors">@OG_Cryptooo</a> | Built on <a href="https://x.com/OpenGradient" target="_blank" rel="noopener noreferrer" className="text-purple-400 font-medium hover:text-purple-300 transition-colors">@OpenGradient</a> 🚀
        </p>
      </footer>
    </main>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProjectCard({ icon, title, subtitle, description, link, gradient, borderColor, videoSrc, imageSrc, onVideoClick }: any) {
  return (
    <motion.div 
      whileHover={{ y: -10, scale: 1.02 }}
      className={`relative p-8 rounded-3xl bg-gradient-to-br ${gradient} border ${borderColor} backdrop-blur-xl shadow-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300 flex flex-col`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-white/5 rounded-2xl w-fit border border-white/10">{icon}</div>
      </div>
      
      <h3 className="text-2xl font-bold mb-2 text-white">{title}</h3>
      <h4 className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">{subtitle}</h4>
      
      {videoSrc && (
        <div 
          className="mb-6 rounded-xl overflow-hidden border border-white/10 shadow-lg cursor-pointer group/video relative"
          onClick={onVideoClick}
        >
          <div className="absolute inset-0 bg-black/0 group-hover/video:bg-black/20 transition-colors z-10 flex items-center justify-center">
            <div className="opacity-0 group-hover/video:opacity-100 transition-opacity transform scale-90 group-hover/video:scale-100 bg-white/20 backdrop-blur-sm rounded-full p-3">
              <ExternalLink className="text-white w-6 h-6" />
            </div>
          </div>
          <video 
            src={videoSrc} 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {imageSrc && !videoSrc && (
        <div className="mb-6 rounded-xl overflow-hidden border border-white/10 shadow-lg">
           <img 
            src={imageSrc} 
            alt={title}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      <p className="text-gray-300 mb-8 flex-grow leading-relaxed">{description}</p>
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center w-full py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-medium transition-colors group"
      >
        Try It
        <ExternalLink size={16} className="ml-2 group-hover:rotate-45 transition-transform" />
      </a>
    </motion.div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className="flex items-center p-4 bg-white/5 rounded-xl border border-white/5"
    >
      <div className="w-2 h-2 rounded-full bg-green-400 mr-4 shadow-[0_0_10px_#4ade80]" />
      <span className="text-gray-200">{text}</span>
    </motion.div>
  );
}

function FooterLink({ href, text }: { href: string, text: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
      {text}
    </a>
  );
}
