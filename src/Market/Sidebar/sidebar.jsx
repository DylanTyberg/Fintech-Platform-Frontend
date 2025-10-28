import "../Sidebar/sidebar.css";
import { Outlet, Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-items">
          <Link to="/">Indices</Link>
          <Link to="/all-stocks">All Stocks</Link>
          <Link to="/movers">Movers</Link>
          <Link to="/sectors">Sectors</Link>
          <Link to="/news">News</Link>
        </div>
      </aside>

      <main className="main-content">
        <Outlet /> {/* renders Indices or Movers */}
      </main>
    </div>
  );
};

export default Sidebar;
