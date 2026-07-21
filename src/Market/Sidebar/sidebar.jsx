import "../Sidebar/sidebar.css";
import { Link, Outlet, useLocation } from "react-router-dom";

const icons = {
  overview: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  indices: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="3" y="8" width="2.4" height="5" fill="currentColor"/>
      <rect x="6.8" y="4.5" width="2.4" height="8.5" fill="currentColor"/>
      <rect x="10.6" y="6.5" width="2.4" height="6.5" fill="currentColor"/>
    </svg>
  ),
  search: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  sectors: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 2V8L12.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  movers: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 12L6 7L9 10L14 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 4H14V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  watchlist: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L10 5.8L14.7 6.4L11.3 9.6L12.2 14.2L8 12L3.8 14.2L4.7 9.6L1.3 6.4L6 5.8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  ),
  tradeSimulator: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 5V8L10.3 9.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  analytics: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="9" width="3" height="5.5" rx="0.6" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="6.5" y="4.5" width="3" height="10" rx="0.6" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="11.5" y="7" width="3" height="7.5" rx="0.6" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ),
  stockDetails: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <line x1="8" y1="1.5" x2="8" y2="4" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="5.5" y="4" width="5" height="6" rx="0.8" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="8" y1="10" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
};

const marketLinks = [
  { to: "/", label: "Overview", icon: icons.overview },
  { to: "/indices", label: "Indices", icon: icons.indices },
  { to: "/search-stocks", label: "Search Stocks", icon: icons.search },
  { to: "/sectors", label: "Sectors", icon: icons.sectors },
  { to: "/movers", label: "Movers", icon: icons.movers },
  { to: "/stock-details/SPY", label: "Stock Details", icon: icons.stockDetails },
];

const portfolioLinks = [
  { to: "/portfolio", label: "Watchlist", icon: icons.watchlist },
  { to: "/portfolio/trade-simulator", label: "Trade Simulator", icon: icons.tradeSimulator },
  { to: "/portfolio/portfolio-analytics", label: "Portfolio Analytics", icon: icons.analytics },
];

const SidebarGroup = ({ title, links, pathname }) => (
  <div className="side-group">
    <div className="side-title">{title}</div>
    <div className="sidebar-items">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={pathname === link.to ? "sidebar-item active" : "sidebar-item"}
        >
          {link.icon}
          <span>{link.label}</span>
        </Link>
      ))}
    </div>
  </div>
);

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="layout">
      <aside className="sidebar">
        <SidebarGroup title="Market" links={marketLinks} pathname={location.pathname} />
        <SidebarGroup title="Portfolio" links={portfolioLinks} pathname={location.pathname} />
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;