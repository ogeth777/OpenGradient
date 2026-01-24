export default function BackgroundLogo({ className }: { className?: string }) {
  // A single petal shape
  const Petal = ({ rotation }: { rotation: number }) => (
    <g transform={`rotate(${rotation})`}>
      <path
        d="M 0 -25 L 25 -50 C 35 -60 35 -75 25 -85 L 0 -110 L -25 -85 C -35 -75 -35 -60 -25 -50 Z"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );

  return (
    <svg 
      viewBox="-150 -150 300 300" 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Main Group with 3D offset effect */}
      <g className="opacity-100">
        {/* Back Layer (Depth) */}
        <g transform="translate(4, 4)" className="opacity-50">
           <circle cx="0" cy="0" r="15" />
           <Petal rotation={0} />
           <Petal rotation={90} />
           <Petal rotation={180} />
           <Petal rotation={270} />
        </g>

        {/* Front Layer */}
        <g filter="url(#glow)">
           <circle cx="0" cy="0" r="15" />
           <Petal rotation={0} />
           <Petal rotation={90} />
           <Petal rotation={180} />
           <Petal rotation={270} />
           
           {/* Inner geometric details from reference */}
           <path d="M -15 -15 L -25 -25" />
           <path d="M 15 -15 L 25 -25" />
           <path d="M 15 15 L 25 25" />
           <path d="M -15 15 L -25 25" />
        </g>
      </g>
    </svg>
  );
}
