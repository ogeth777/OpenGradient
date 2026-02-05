import NetworkBackground from "./components/NetworkBackground";
import MouseGlow from "./components/MouseGlow";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0f0f1a] text-white selection:bg-cyan-500/30">
      <NetworkBackground />
      <MouseGlow />
      
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
           <button className="group relative overflow-hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 px-10 py-3 font-semibold text-cyan-400 transition-all hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:border-cyan-500/60">
            <span className="relative z-10 flex items-center gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
