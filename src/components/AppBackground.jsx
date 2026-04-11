export default function AppBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-slate-900" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1.6px)",
          backgroundSize: "28px 28px",
          backgroundPosition: "center center",
          maskImage:
            "radial-gradient(circle at center, black 0%, black 62%, transparent 100%)",
        }}
      />
      <div
        className="hero-bg-animated absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.14) 0%, transparent 60%)",
          animation: "hero-glow-pulse 8s ease-in-out infinite",
        }}
      />
      <div
        className="hero-bg-animated absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[130px]"
        style={{ animation: "hero-orb-1 20s ease-in-out infinite" }}
      />
      <div
        className="hero-bg-animated absolute -right-24 bottom-1/3 h-80 w-80 rounded-full bg-violet-500/10 blur-[100px]"
        style={{ animation: "hero-orb-2 25s ease-in-out infinite" }}
      />
      <div
        className="hero-bg-animated absolute left-1/3 top-2/3 h-72 w-72 rounded-full bg-cyan-500/[0.08] blur-[80px]"
        style={{ animation: "hero-orb-3 18s ease-in-out infinite" }}
      />
    </div>
  );
}
