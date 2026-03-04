export function Spinner({ className = "" }) {
  return (
    <div
      className={`inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500 ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
      <Spinner className="h-10 w-10" />
      <p className="text-sm text-slate-400">Cargando...</p>
    </div>
  );
}
