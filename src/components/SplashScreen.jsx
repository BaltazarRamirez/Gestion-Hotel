export function SplashScreen({ visible }) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-slate-900 transition-opacity duration-500 ease-out"
      role="status"
      aria-label="Cargando Hotelus"
    >
      <div className="flex flex-col items-center gap-6">
        <img
          src="/hotelus-logo.png"
          alt="Hotelus"
          className="h-16 w-auto object-contain md:h-20 scale-300"
          width={200}
          height={80}
        />
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-slate-400">Cargando...</p>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full animate-loading-bar rounded-full bg-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
