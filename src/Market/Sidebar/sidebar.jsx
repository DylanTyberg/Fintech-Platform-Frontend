import "../Sidebar/sidebar.css";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const Sidebar = () => {
    const location = useLocation();


    return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-items">
          
          <Link className={location.pathname === "/" ? "sidebar-link-active" : "sidebar-link"} to="/">Indices</Link>
          <Link className={location.pathname === "/all-stocks" ? "sidebar-link-active" : "sidebar-link"} to="/all-stocks">All Stocks</Link>
          <Link className={location.pathname === "/movers" ? "sidebar-link-active" : "sidebar-link"} to="/movers">Movers</Link>
          <Link className={location.pathname === "/sectors" ? "sidebar-link-active" : "sidebar-link"} to="/sectors">Sectors</Link>
          <Link className={location.pathname === "/overview" ? "sidebar-link-active" : "sidebar-link"} to="/overview">Overview</Link>
        </div>
      </aside>

      <main className="main-content">
        <Outlet /> {/* renders Indices or Movers */}
      </main>
    </div>
  );
};

export default Sidebar;
