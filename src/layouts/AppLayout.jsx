import { Outlet, NavLink } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  return (
    <div style={styles.container}>
      
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>Hotel Totem</h2>

        <nav style={styles.nav}>
          <NavLink to="/dashboard" style={styles.link}>
            Dashboard
          </NavLink>

          <NavLink to="/rooms" style={styles.link}>
            Rooms
          </NavLink>

          <NavLink to="/reservations" style={styles.link}>
            Reservations
          </NavLink>

          <NavLink to="/guests" style={styles.link}>
            Guests
          </NavLink>
        </nav>
      </aside>

      {/* CONTENT */}
      <div style={styles.content}>
        
        <header style={styles.header}>
          <Header />
        </header>

        <main style={styles.main}>
          <Outlet />
        </main>

      </div>

    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    minHeight: "100vh",
  },

  sidebar: {
    borderRight: "1px solid #eee",
    padding: "20px",
  },

  logo: {
    marginBottom: "30px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  link: {
    textDecoration: "none",
    color: "#333",
  },

  content: {
    display: "flex",
    flexDirection: "column",
  },

  header: {
    borderBottom: "1px solid #eee",
    padding: "16px",
  },

  main: {
    padding: "24px",
  },
};
