"use client";

export function HeartbeatLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 120" className={className} fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="hb-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="15%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="85%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,60 L120,60 L150,20 L180,100 L210,40 L240,60 L340,60 L370,10 L400,110 L430,60 L560,60 L590,30 L620,90 L650,60 L800,60"
        stroke="url(#hb-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1000}
        style={{
          strokeDasharray: 1000,
          strokeDashoffset: 1000,
          animation: "heartbeat-line 2.6s ease-out forwards",
        }}
      />
    </svg>
  );
}
