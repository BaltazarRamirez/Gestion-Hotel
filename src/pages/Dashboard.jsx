import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getReservations } from "../services/reservations.service";
import { getRooms } from "../services/rooms.service";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/Spinner";
import { RESERVATION_STATUS, ROOM_STATUS, isActiveReservationStatus } from "../constants/statuses";
import { isoTodayLocal } from "../utils/date";

export default function Dashboard() {
  const { isSupabaseEnabled, session } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canFetch = !isSupabaseEnabled || Boolean(session);

  useEffect(() => {
    if (!canFetch) return;
    setError(null);
    Promise.all([getReservations(), getRooms()])
      .then(([res, rms]) => {
        setReservations(res);
        setRooms(rms);
      })
      .catch((err) => {
        setError(err?.message ?? "Error al cargar datos");
      })
      .finally(() => setLoading(false));
  }, [canFetch]);

  // Usamos fecha local para que "hoy" no dependa de UTC.
  const today = isoTodayLocal();
  const thisMonth = today.slice(0, 7); // YYYY-MM

  const stats = useMemo(() => {
    const totalRooms = rooms.length || 1;
    const occupiedRooms = rooms.filter((r) => r.status === ROOM_STATUS.Ocupada).length;
    const cleaningRooms = rooms.filter((r) => r.status === ROOM_STATUS.Limpieza).length;
    const availableRooms = rooms.filter((r) => r.status === ROOM_STATUS.Disponible).length;
    const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

    const checkInDate = (r) => (r.checkIn || "").slice(0, 10);
    const checkOutDateForDep = (r) => (r.checkOut || "").slice(0, 10);
    const arrivals = reservations.filter(
      (r) => checkInDate(r) === today && r.status === RESERVATION_STATUS.Confirmed
    ).length;
    const departures = reservations.filter(
      (r) =>
        checkOutDateForDep(r) === today &&
        (r.status === RESERVATION_STATUS.CheckedIn || r.status === RESERVATION_STATUS.CheckedOut)
    ).length;

    const inHouse = reservations.filter(
      (r) => r.status === RESERVATION_STATUS.CheckedIn
    ).length;

    // Ingresos por habitación (alojamiento) y por otros (cargos: bebidas, etc.)
    function roomRevenue(r) {
      const room = rooms.find((room) => room.id === r.roomId);
      if (!room) return 0;
      const nights =
        (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
        (1000 * 60 * 60 * 24);
      return (Number(room.price) || 0) * (nights > 0 ? Math.ceil(nights) : 1);
    }
    function chargesRevenue(r) {
      return (r.charges ?? []).reduce(
        (sum, c) => sum + (Number(c.amount) || 0),
        0
      );
    }

    const checkOutDate = (r) => (r.checkOut || "").slice(0, 10);
    const checkedOutToday = reservations.filter(
      (r) =>
        r.status === RESERVATION_STATUS.CheckedOut &&
        checkOutDate(r) === today
    );
    const checkedOutThisMonth = reservations.filter(
      (r) =>
        r.status === RESERVATION_STATUS.CheckedOut &&
        checkOutDate(r).startsWith(thisMonth)
    );

    // Ingresos por check-out (día/mes) + por check-in pagado en ese día/mes
    const paidCheckInToday = reservations.filter(
      (r) =>
        r.paidAtCheckIn &&
        checkInDate(r) === today &&
        (r.status === RESERVATION_STATUS.CheckedIn || r.status === RESERVATION_STATUS.CheckedOut)
    );
    const paidCheckInThisMonth = reservations.filter(
      (r) =>
        r.paidAtCheckIn &&
        (r.checkIn || "").slice(0, 7) === thisMonth &&
        (r.status === RESERVATION_STATUS.CheckedIn || r.status === RESERVATION_STATUS.CheckedOut)
    );

    const todayRoomRevenue =
      checkedOutToday.reduce((acc, r) => acc + roomRevenue(r), 0) +
      paidCheckInToday.reduce((acc, r) => acc + roomRevenue(r), 0);
    const todayChargesRevenue =
      checkedOutToday.reduce((acc, r) => acc + chargesRevenue(r), 0) +
      paidCheckInToday.reduce((acc, r) => acc + chargesRevenue(r), 0);
    const monthRoomRevenue =
      checkedOutThisMonth.reduce((acc, r) => acc + roomRevenue(r), 0) +
      paidCheckInThisMonth.reduce((acc, r) => acc + roomRevenue(r), 0);
    const monthChargesRevenue =
      checkedOutThisMonth.reduce((acc, r) => acc + chargesRevenue(r), 0) +
      paidCheckInThisMonth.reduce((acc, r) => acc + chargesRevenue(r), 0);

    return {
      occupiedRooms,
      cleaningRooms,
      availableRooms,
      arrivals,
      departures,
      inHouse,
      occupancyRate,
      todayRoomRevenue,
      todayChargesRevenue,
      monthRoomRevenue,
      monthChargesRevenue,
    };
  }, [rooms, reservations, today, thisMonth]);

  const chartOccupancyLast7 = useMemo(() => {
    const totalRooms = rooms.length || 1;
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const occupied = reservations.filter((r) => {
        if (!isActiveReservationStatus(r.status)) return false;
        return r.checkIn <= iso && iso < r.checkOut;
      }).length;
      result.push({
        fecha: d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
        ocupación: totalRooms ? Math.round((occupied / totalRooms) * 100) : 0,
      });
    }
    return result;
  }, [rooms.length, reservations]);

  const chartRevenueLast7 = useMemo(() => {
    function roomRev(r) {
      const room = rooms.find((room) => room.id === r.roomId);
      if (!room) return 0;
      const nights =
        (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
        (1000 * 60 * 60 * 24);
      return (Number(room.price) || 0) * (nights > 0 ? Math.ceil(nights) : 1);
    }
    function chargesRev(r) {
      return (r.charges ?? []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    }
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const checkOutThatDay = reservations.filter(
        (r) =>
          r.status === RESERVATION_STATUS.CheckedOut &&
          (r.checkOut || "").slice(0, 10) === iso
      );
      const paidCheckInThatDay = reservations.filter(
        (r) =>
          r.paidAtCheckIn &&
          (r.checkIn || "").slice(0, 10) === iso &&
          (r.status === RESERVATION_STATUS.CheckedIn || r.status === RESERVATION_STATUS.CheckedOut)
      );
      const dayReservations = [...checkOutThatDay, ...paidCheckInThatDay];
      const habitaciones = dayReservations.reduce((acc, r) => acc + roomRev(r), 0);
      const otros = dayReservations.reduce((acc, r) => acc + chargesRev(r), 0);
      result.push({
        fecha: d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
        habitaciones,
        otros,
        total: habitaciones + otros,
      });
    }
    return result;
  }, [rooms, reservations]);

  if (loading) return <PageLoader />;
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-300">
        <p className="font-medium">Error al cargar los datos</p>
        <p className="mt-1 text-sm">{error}</p>
        <p className="mt-2 text-xs text-slate-400">
          Si acabás de activar el login, ejecutá en Supabase (SQL Editor) el archivo{" "}
          <code className="rounded bg-slate-700 px-1">supabase/migrations/002_rls_authenticated.sql</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 md:text-2xl">Dashboard</h1>
        <p className="text-xs text-slate-400 md:text-sm">
          Resumen rápido de ocupación, movimiento e ingresos de hoy ({today})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card
          title="Ocupación actual"
          value={`${stats.occupancyRate}%`}
          accent
        />
        <Card title="Habitaciones ocupadas" value={stats.occupiedRooms} />
        <Card title="Habitaciones disponibles" value={stats.availableRooms} />
        <Card title="En limpieza" value={stats.cleaningRooms} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Llegadas de hoy" value={stats.arrivals} />
        <Card title="Salidas de hoy" value={stats.departures} />
        <Card title="Huéspedes alojados" value={stats.inHouse} />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Ingresos (check-outs realizados)
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Hoy · Habitaciones"
            value={formatCurrency(stats.todayRoomRevenue)}
            accent
          />
          <Card
            title="Hoy · Otros (cargos)"
            value={formatCurrency(stats.todayChargesRevenue)}
          />
          <Card
            title="Mes · Habitaciones"
            value={formatCurrency(stats.monthRoomRevenue)}
            accent
          />
          <Card
            title="Mes · Otros (cargos)"
            value={formatCurrency(stats.monthChargesRevenue)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">
            Ocupación últimos 7 días (%)
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartOccupancyLast7}>
                <defs>
                  <linearGradient id="ocupacionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="fecha" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "12px" }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(value) => [`${value}%`, "Ocupación"]}
                />
                <Area
                  type="monotone"
                  dataKey="ocupación"
                  stroke="#3b82f6"
                  fill="url(#ocupacionGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">
            Ingresos últimos 7 días (habitaciones vs otros)
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRevenueLast7} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="fecha" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "12px" }}
                  formatter={(value) => [formatCurrency(value), ""]}
                  labelFormatter={(label) => `Día: ${label}`}
                />
                <Bar dataKey="habitaciones" name="Habitaciones" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="otros" name="Otros (cargos)" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function Card({ title, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-4 shadow-lg backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          accent ? "text-blue-400" : "text-slate-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

