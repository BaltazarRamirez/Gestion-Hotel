import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Reservations from "./pages/Reservations";
import Guests from "./pages/Guests";

export default function App() {
  return (
    <Routes>

      <Route element={<AppLayout />}>

        <Route path="/" element={<Navigate to="/dashboard" />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/rooms" element={<Rooms />} />

        <Route path="/reservations" element={<Reservations />} />

        <Route path="/guests" element={<Guests />} />

      </Route>

    </Routes>
  );
}
