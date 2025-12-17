
import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const PortfolioSidebar = () => {
    const location = useLocation();


    return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-items">
          
          <Link className={location.pathname === "/portfolio" ? "sidebar-link-active" : "sidebar-link"} to="/portfolio">Watchlist</Link>
          <Link className={location.pathname === "/portfolio/trade-simulator" ? "sidebar-link-active" : "sidebar-link"} to="/portfolio/trade-simulator">Trade Simulator</Link>
          <Link className={location.pathname === "/portfolio/portfolio-analytics" ? "sidebar-link-active" : "sidebar-link"} to="/portfolio/portfolio-analytics">Portfolio Analytics</Link>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default PortfolioSidebar;