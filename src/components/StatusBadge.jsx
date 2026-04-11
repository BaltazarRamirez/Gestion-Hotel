import {
  RESERVATION_STATUS_CONFIG,
  ROOM_STATUS_CONFIG,
} from "../constants/statuses";

export function StatusBadge({ status, variant }) {
  const map = variant === "room" ? ROOM_STATUS_CONFIG : RESERVATION_STATUS_CONFIG;
  const config = map[status] ?? {
    label: status,
    classes:
      "border-slate-400/20 bg-gradient-to-r from-slate-500/14 to-slate-400/8 text-slate-200 shadow-slate-950/20",
    dotClass: "bg-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.35)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm ${config.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
