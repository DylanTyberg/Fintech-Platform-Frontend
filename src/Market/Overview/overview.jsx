import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparklines, SparklinesLine} from 'react-sparklines';
import "../Overview/overview.css"
import StockChange from "../../Components/stock-change/stock-change";
import { useUser } from "../../Contexts/UserContext";
import HoldingsTable from "../../Components/HoldingsTable/HoldingsTable";
import AIChat from "../../Components/AIChat/AIChat";
import { useHoldingsPrices } from "../../Hooks/useHoldingsPrices";

const namesMap = {
    "SPY" : "S&P500",
    "DIA" : "Dow",
    "QQQ" : "Nasdaq",
    "IWM" : "Russell 2000",
    "XLK": "Technology",
    "XLE": "Energy",
    "XLF": "Financials",
    "XLV": "Healthcare",
    "XLI": "Industrials",
    "XLB": "Materials",
    "XLU": "Utilities",
    "XLRE": "Real Estate",
    "XLC": "Communication Services",
    "XLY": "Consumer Discretionary",
    "XLP": "Consumer Services",
}

// 8 of the ~11 sector ETFs — enough for a clean 2-row heatmap 

const HEATMAP_SYMBOLS = ["XLK", "XLE", "XLF", "XLV", "XLI", "XLB", "XLU", "XLY"];

const formatPrice = (value) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });


const HEAT_POS_RGB = "8, 153, 129";
const HEAT_NEG_RGB = "242, 54, 69";
const heatmapBackground = (pct) => {
    const intensity = Math.min(Math.abs(pct) / 2.5, 1); // ±2.5% = fully saturated
    const alpha = 0.16 + intensity * 0.5;
    return `rgba(${pct >= 0 ? HEAT_POS_RGB : HEAT_NEG_RGB}, ${alpha.toFixed(2)})`;
};

// Card used for the Indices grid — one place to change the card layout later.
const StockCard = ({ stock, onClick }) => {
    const prices = stock.prices ?? [];
    const price = prices.length ? prices[prices.length - 1] : null;
    const isPositive = stock.percentChange >= 0;

    return (
        <div
            className="stock-overview-card"
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className="card-header">
                <h3 className="card-title">{namesMap[stock.symbol] ?? stock.symbol}</h3>
                <span className="card-symbol mono">{stock.symbol}</span>
            </div>
            {typeof price === "number" && (
                <div className="card-price num">${formatPrice(price)}</div>
            )}
            <div className="sparkline">
                <Sparklines data={prices} width={240} height={56}>
                    <SparklinesLine
                        color={isPositive ? "var(--pos)" : "var(--neg)"}
                        style={{ strokeWidth: 1.75 }}
                    />
                </Sparklines>
            </div>
            <StockChange percentChange={stock.percentChange} />
        </div>
    );
};

const SkeletonCard = () => (
    <div className="stock-overview-card skeleton-card">
        <div className="card-header">
            <div className="skeleton-line" style={{ width: "55%" }} />
            <div className="skeleton-line" style={{ width: "18%" }} />
        </div>
        <div className="skeleton-line" style={{ width: "40%", height: 20, margin: "2px 0" }} />
        <div className="sparkline loading" />
        <div className="skeleton-line" style={{ width: "28%", height: 20 }} />
    </div>
);

const Overview = () => {
    const [indexData, setIndexData] = useState([]);
    const [sectorData, setSectorData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toggle, setToggle] = useState(1);
    const [newsList, setNewsList] = useState([]);
    const [movers, setMovers] = useState({ gainers: [], losers: [] });
    const [moversLoading, setMoversLoading] = useState(true);

    const navigate = useNavigate();
    const { state } = useUser();
    const { priceInfo, isLoading: holdingsLoading } = useHoldingsPrices(state.holdings, state.cash);

    const getSparklineData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/intraday/sparkline-market`,
                {
                    method: "GET",
                }
            )
            const result = await response.json();
            setIndexData(result.slice(0, 4));
            setSectorData(result.slice(4, 16));
        } catch (error)
        {
            //console.log(error)
        }finally {
            setIsLoading(false); 
        }
    }

    const fetchMoversList = async () => {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/movers`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

   
    const getMovers = async () => {
        try {
            setMoversLoading(true);
            let data = await fetchMoversList();

            if (data.length === 0) {
                const postResponse = await fetch(`${process.env.REACT_APP_API_URL}/movers`, {
                    method: "POST",
                });
                if (postResponse.ok) {
                    data = await fetchMoversList();
                }
            }

            setMovers({
                gainers: data.filter((s) => s.direction === "gainers").slice(0, 2),
                losers: data.filter((s) => s.direction === "losers").slice(0, 2),
            });
        } catch (error) {
            //console.log(error)
        } finally {
            setMoversLoading(false);
        }
    }

    const TYPE_OPTIONS = [
        { value: 'recent',   label: 'Most Recent' },
        { value: 'positive', label: 'Positive' },
        { value: 'negative', label: 'Negative' },
        { value: 'neutral',  label: 'Neutral' },
    ];

    const formatTimestamp = (iso) => {
        const date = new Date(iso);
        const now = new Date();
        const diffMins = Math.floor((now - date) / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 60)  return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7)   return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };


    const [newsLoading, setNewsLoading] = useState(false);
    const [newsError, setNewsError] = useState(null);
    const [symbolInput, setSymbolInput] = useState('SPY,DIA,QQQ');
    const [newsType, setNewsType] = useState('recent');

    const getNews = async (symbols, type) => {
    setNewsLoading(true);
    setNewsError(null);
    try {
        const response = await fetch(
        `${process.env.REACT_APP_API_URL}/news?symbols=${symbols}&type=${type}`,
        { method: 'GET' }
        );
        const result = await response.json();
        setNewsList(result.data ?? []);
    } catch (err) {
        console.error(err);
        setNewsError('Failed to load news.');
    } finally {
        setNewsLoading(false);
    }
    };

    const handleNewsSearch = () => {
        const cleaned = symbolInput.trim().toUpperCase();
        if (!cleaned) return;
        getNews(cleaned, newsType);
    };

    useEffect(() => {
        getSparklineData();
        getNews("SPY,DIA,QQQ", "recent")
        getMovers();
    }, [])

    return (
    <div className="overview-page">
        <div className="overview-page-header">
        <button
            className={`overview-header-button ${toggle === 1 ? 'active' : ''}`}
            onClick={() => setToggle(1)}
        >
            Market Overview
        </button>
        <button
            className={`overview-header-button ${toggle === 2 ? 'active' : ''}`}
            onClick={() => setToggle(2)}
        >
            News
        </button>
        </div>

        {toggle === 1 && (
        <div className="overview-tab-content">
            <div className="index-overview">
            <div className="overview-divider">
                <Link to="/indices" className="view-all-link">View All →</Link>
            </div>
            {isLoading ? (
                <div className="overview-cards">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="overview-cards">
                    {indexData.map((stock) => (
                        <StockCard
                            key={stock.symbol}
                            stock={stock}
                            onClick={() => navigate(`/stock-details/${stock.symbol}`)}
                        />
                    ))}
                </div>
            )}
            </div>

            <div className="overview-portfolio-row">
                <HoldingsTable
                    title="Your Portfolio"
                    holdings={state.holdings}
                    priceInfo={priceInfo}
                    cashAvailable={state.cash}
                    isLoading={holdingsLoading}
                    isSignedIn={!!state.user}
                    compact
                    maxRows={3}
                />
                <div className="overview-side-column">
                    <div className="mini-card">
                        <div className="mini-card-head">
                            <h3>Top Movers</h3>
                            <Link to="/movers" className="mini-card-link">View all →</Link>
                        </div>
                        {moversLoading ? (
                            <div className="mini-movers-list">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="skeleton-line" style={{ height: 16 }} />
                                ))}
                            </div>
                        ) : movers.gainers.length === 0 && movers.losers.length === 0 ? (
                            <p className="mini-card-empty">No movers data available right now.</p>
                        ) : (
                            <div className="mini-movers-list">
                                {movers.gainers.map((s) => (
                                    <Link to={`/stock-details/${s.symbol}`} className="mini-mover-row" key={s.symbol}>
                                        <span className="mini-mover-symbol mono">{s.symbol}</span>
                                        <span className="num positive">+{s.percentChange.toFixed(2)}%</span>
                                    </Link>
                                ))}
                                {movers.gainers.length > 0 && movers.losers.length > 0 && (
                                    <div className="mini-mover-divider" />
                                )}
                                {movers.losers.map((s) => (
                                    <Link to={`/stock-details/${s.symbol}`} className="mini-mover-row" key={s.symbol}>
                                        <span className="mini-mover-symbol mono">{s.symbol}</span>
                                        <span className="num negative">{s.percentChange.toFixed(2)}%</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mini-card">
                        <div className="mini-card-head">
                            <h3>Market News</h3>
                            <button className="mini-card-link" onClick={() => setToggle(2)}>View all →</button>
                        </div>
                        <div className="mini-news-list">
                            {newsList.slice(0, 2).map((article) => (
                                <div key={article.uuid} className="mini-news-item">
                                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="mini-news-title">
                                        {article.title}
                                    </a>
                                    <div className="mini-news-meta">{article.source} · {formatTimestamp(article.published_at)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="index-overview">
            <div className="overview-divider">
                <Link to="/sectors" className="view-all-link">View All →</Link>
            </div>
            {isLoading ? (
                <div className="sector-heatmap-grid">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="skeleton-block" style={{ height: 76 }} />
                    ))}
                </div>
            ) : (
                <div className="sector-heatmap-grid">
                    {HEATMAP_SYMBOLS
                        .map((symbol) => sectorData.find((s) => s.symbol === symbol))
                        .filter(Boolean)
                        .map((stock) => (
                        <button
                            key={stock.symbol}
                            type="button"
                            className="heatmap-tile"
                            style={{ backgroundColor: heatmapBackground(stock.percentChange) }}
                            onClick={() => navigate(`/stock-details/${stock.symbol}`)}
                        >
                            <div className="heatmap-tile-name">{namesMap[stock.symbol] ?? stock.symbol}</div>
                            <div className="heatmap-tile-pct num">
                                {stock.percentChange >= 0 ? "+" : ""}{stock.percentChange.toFixed(2)}%
                            </div>
                        </button>
                    ))}
                </div>
            )}
            </div>

            <div className="overview-ai-section">
                <AIChat pageContext="(The user is currently on the Overview / landing page)" />
            </div>
        </div>
        )}

        {toggle === 2 && (
        <div className="news-section">
            <div className="news-search-bar">
            <div className="news-input-wrapper">
                <span className="news-input-icon">$</span>
                <input
                className="news-input"
                type="text"
                value={symbolInput}
                onChange={e => setSymbolInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNewsSearch()}
                placeholder="AAPL, MSFT, SPY..."
                />
            </div>
            <select
                className="news-select"
                value={newsType}
                onChange={e => setNewsType(e.target.value)}
            >
                {TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <button className="news-search-btn" onClick={handleNewsSearch}>
                Search
            </button>
            </div>

            {newsLoading && (
            <div className="news-list">
                {[...Array(4)].map((_, i) => (
                <div key={i} className="news-card news-card-skeleton">
                    <div className="skeleton-image" />
                    <div className="news-card-body">
                    <div className="skeleton-line short" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line medium" />
                    <div className="skeleton-line short" />
                    </div>
                </div>
                ))}
            </div>
            )}

            {newsError && <p className="news-error">{newsError}</p>}

            {!newsLoading && !newsError && newsList.length === 0 && (
            <p className="news-empty">No news found for these symbols.</p>
            )}

            {!newsLoading && !newsError && newsList.length > 0 && (
            <div className="news-list">
                {newsList.map(article => {
                const symbols = [...new Set((article.entities ?? []).map(e => e.symbol))].slice(0, 5);
                return (
                    <a
                    key={article.uuid}
                    className="news-card"
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    >
                    {article.image_url && (
                        <div className="news-card-image">
                        <img
                            src={article.image_url}
                            alt=""
                            onError={e => e.target.parentElement.style.display = 'none'}
                        />
                        </div>
                    )}
                    <div className="news-card-body">
                        <div className="news-card-meta">
                        <span className="news-source">{article.source}</span>
                        <span className="news-dot">·</span>
                        <span className="news-time">{formatTimestamp(article.published_at)}</span>
                        </div>
                        <h3 className="news-title">{article.title}</h3>
                        <p className="news-description">{article.description}</p>
                        {symbols.length > 0 && (
                        <div className="news-tags">
                            {symbols.map(sym => (
                            <span key={sym} className="news-tag">{sym}</span>
                            ))}
                        </div>
                        )}
                    </div>
                    </a>
                );
                })}
            </div>
            )}
        </div>
        )}
    </div>
);

}
export default Overview;