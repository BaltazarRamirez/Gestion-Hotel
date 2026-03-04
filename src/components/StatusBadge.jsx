import {
  RESERVATION_STATUS_CONFIG,
  ROOM_STATUS_CONFIG,
} from "../constants/statuses";

export function StatusBadge({ status, variant }) {
  const map = variant === "room" ? ROOM_STATUS_CONFIG : RESERVATION_STATUS_CONFIG;
  const config = map[status] ?? {
    label: status,
    classes: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
