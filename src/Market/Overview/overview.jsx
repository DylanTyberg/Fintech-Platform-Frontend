import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparklines, SparklinesLine} from 'react-sparklines';
import "../Overview/overview.css"
import StockChange from "../../Components/stock-change/stock-change";
import LoadingSpinner from "../../Components/LoadingPage/LoadingPage";

const Overview = () => {
    const [indexData, setIndexData] = useState([]);
    const [sectorData, setSectorData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toggle, setToggle] = useState(1);
    const [newsList, setNewsList] = useState([]);

    const navigate = useNavigate();

    const namesMap = {
        "SPY" : "S&P500",
        "DIA" : "Dow",
        "QQQ" : "Nasdaq",
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

    const getSparklineData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/intraday/sparkline-market`,
                {
                    method: "GET",
                }
            )
            const result = await response.json();
            console.log(result);
            setIndexData(result.slice(0, 3));
            setSectorData(result.slice(3, 15));
        } catch (error)
        {
            console.log(error)
        }finally {
            setIsLoading(false); 
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
    }, [])

    if (isLoading) {
        return <LoadingSpinner message="Loading market data..." />;
    }

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
        <div>
            <div className="index-overview">
            <h1 className="overview-header">
                Indices
                <Link to="/indices" className="view-all-link">View All →</Link>
            </h1>
            <div className="overview-cards">
                {indexData.map((stock) => (
                <div className="stock-overview-card" onClick={() => navigate(`/stock-details/${stock.symbol}`)}>
                    <div className="card-header">
                    <h1 className="card-title">{namesMap[stock.symbol]}</h1>
                    <span className="card-symbol">{stock.symbol}</span>
                    </div>
                    <div className="sparkline">
                    <Sparklines data={stock.prices} width={300} height={90}>
                        <SparklinesLine color={stock.percentChange >= 0 ? "#10B981" : "#EF4444"} />
                    </Sparklines>
                    </div>
                    <StockChange percentChange={stock.percentChange} />
                </div>
                ))}
            </div>
            </div>

            <div className="index-overview">
            <h1 className="overview-header">
                Sectors
                <Link to="/indices" className="view-all-link">View All →</Link>
            </h1>
            <div className="sector-overview-cards">
                {sectorData.map((stock) => (
                <div className="stock-overview-card" onClick={() => navigate(`/stock-details/${stock.symbol}`)}>
                    <div className="card-header">
                    <h1 className="card-title">{namesMap[stock.symbol]}</h1>
                    <span className="card-symbol">{stock.symbol}</span>
                    </div>
                    <div className="sparkline">
                    <Sparklines data={stock.prices} width={300} height={90}>
                        <SparklinesLine color={stock.percentChange >= 0 ? "#10B981" : "#EF4444"} />
                    </Sparklines>
                    </div>
                    <StockChange percentChange={stock.percentChange} />
                </div>
                ))}
            </div>
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