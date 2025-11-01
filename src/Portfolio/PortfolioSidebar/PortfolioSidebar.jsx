
import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const PortfolioSidebar = () => {
    const location = useLocation();


    return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-items">
          
          <Link className={location.pathname === "/portfolio" ? "sidebar-link-active" : "sidebar-link"} to="/portfolio">Watchlist</Link>
          <Link className={location.pathname === "/portfolio/portfolio value" ? "sidebar-link-active" : "sidebar-link"} to="/portfolio/portfolio-value">Portfolio Value</Link>

        </div>
      </aside>

      <main className="main-content">
        <Outlet /> {/* renders Indices or Movers */}
      </main>
    </div>
  );
};

export default PortfolioSidebar;