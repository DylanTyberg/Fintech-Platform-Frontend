import "../Stock-details/stock-details.css"
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../Contexts/UserContext";
import { fetchAuthSession } from "aws-amplify/auth";
import data from "../s&p500stocks.json";
import IntradayChart from "../Components/intraday-chart/indraday-chart";
import AIChat from "../Components/AIChat/AIChat";
import BuyStock from "../Portfolio/TradeSimulator/BuyStock/BuyStock";
import SellStock from "../Portfolio/TradeSimulator/SellStock/SellStock";


const nameBySymbol = {};
const sectorBySymbol = {};
data.forEach((stock) => {
    nameBySymbol[stock.Symbol] = stock.Security;
    sectorBySymbol[stock.Symbol] = stock["GICS Sector"];
});

const WHATIF_PERIODS = [
    { label: "1 month ago", days: 30 },
    { label: "3 months ago", days: 90 },
    { label: "6 months ago", days: 180 },
    { label: "1 year ago", days: 365 },
];

const formatMoney = (v) =>
    Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatVolume = (v) => {
    if (v == null) return "—";
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return String(v);
};

const formatDay = (timestamp) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};


const dedupeDailyByDay = (bars) => {
    const seen = new Set();
    const out = [];
    for (const bar of bars) {
        const day = formatDay(bar.timestamp);
        if (seen.has(day)) continue;
        seen.add(day);
        out.push({ ...bar, day });
    }
    return out;
};

const TIMEFRAMES = ["1D", "30D", "90D", "1Y"];

const StockDetails = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const { state, dispatch } = useUser();


    const [dailyBars, setDailyBars] = useState([]);
    const [intradayBars, setIntradayBars] = useState([]);
    const [dailyLoading, setDailyLoading] = useState(true);
    const [intradayLoading, setIntradayLoading] = useState(true);
    const [error, setError] = useState(null);

    const [timeframe, setTimeframe] = useState("1D");
    const [newsList, setNewsList] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);

    const [buyOpen, setBuyOpen] = useState(false);
    const [sellOpen, setSellOpen] = useState(false);
    const [watchlistBusy, setWatchlistBusy] = useState(false);

    const [investAmount, setInvestAmount] = useState("1000");
    const [investDays, setInvestDays] = useState(90);
    const [whatIfResult, setWhatIfResult] = useState(null);

    const [tickerInput, setTickerInput] = useState("");

    const handleTickerSwitch = (e) => {
        e.preventDefault();
        const target = tickerInput.trim().toUpperCase();
        if (target && target !== symbol) {
            navigate(`/stock-details/${target}`);
        }
        setTickerInput("");
    };

    const getDaily = async () => {
        try {
            setDailyLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/daily?symbol=${encodeURIComponent(symbol)}`, {
                method: "POST",
            });
            if (!response.ok) return;

            const result = await fetch(`${process.env.REACT_APP_API_URL}/daily/list`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ symbols: [symbol] }),
            });
            if (!result.ok) return;

            const payload = await result.json();
            const bars = payload.results?.[0]?.data ?? [];
            const sorted = [...bars].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setDailyBars(dedupeDailyByDay(sorted));
        } catch (err) {
            setError(err.message);
        } finally {
            setDailyLoading(false);
        }
    };

    const getIntraday = async () => {
        try {
            setIntradayLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/intraday/request?symbol=${encodeURIComponent(symbol)}`, {
                method: "POST",
            });
            if (!response.ok) return;

            const result = await fetch(`${process.env.REACT_APP_API_URL}/intraday/list`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stocks: [symbol] }),
            });
            if (!result.ok) return;

            const payload = await result.json();
            const bars = payload[0] ?? [];
            if (bars.length === 0) {
                setError(`No data available for ${symbol}`);
            }
            setIntradayBars(bars);
        } catch (err) {
            setError(err.message);
        } finally {
            setIntradayLoading(false);
        }
    };

    const getNews = async () => {
        try {
            setNewsLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/news?symbols=${symbol}&type=recent`);
            if (!response.ok) return;
            const result = await response.json();
            setNewsList((result.data ?? []).slice(0, 3));
        } catch (err) {
            // console.log(err)
        } finally {
            setNewsLoading(false);
        }
    };

    useEffect(() => {
        getDaily();
        getIntraday();
        getNews();
        setWhatIfResult(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol]);

    const intradaySeries = useMemo(
        () => intradayBars.map(({ timestamp, close }) => ({
            time: Math.floor(new Date(timestamp).getTime() / 1000),
            value: close,
        })),
        [intradayBars]
    );

    const dailySeries = useMemo(
        () => dailyBars.map((bar) => ({ time: bar.day, value: bar.close })),
        [dailyBars]
    );

    const chartData = useMemo(() => {
        if (timeframe === "1D") return intradaySeries;
        if (timeframe === "30D") return dailySeries.slice(-30);
        if (timeframe === "90D") return dailySeries.slice(-90);
        if (timeframe === "1Y") return dailySeries.slice(-250); // ~1 trading year
        return intradaySeries;
    }, [timeframe, intradaySeries, dailySeries]);

    // Latest known price — prefer today's intraday, fall back to the most
    // recent daily close (e.g. weekends, or before intraday data loads).
    const latestPrice = intradayBars.length > 0
        ? intradayBars[intradayBars.length - 1].close
        : dailyBars.length > 0
            ? dailyBars[dailyBars.length - 1].close
            : null;


    const todayChange = useMemo(() => {
        if (intradaySeries.length < 2) return null;
        const first = intradaySeries[0].value;
        const last = intradaySeries[intradaySeries.length - 1].value;
        return { dollar: last - first, pct: ((last - first) / first) * 100 };
    }, [intradaySeries]);

    const latestDailyBar = dailyBars.length > 0 ? dailyBars[dailyBars.length - 1] : null;

    const week52 = useMemo(() => {
        if (dailyBars.length === 0) return null;
        const highs = dailyBars.map((b) => b.high ?? b.close);
        const lows = dailyBars.map((b) => b.low ?? b.close);
        return { high: Math.max(...highs), low: Math.min(...lows) };
    }, [dailyBars]);

    const week52Position = week52 && latestPrice != null
        ? Math.min(100, Math.max(0, ((latestPrice - week52.low) / (week52.high - week52.low)) * 100))
        : null;

    const holding = state.holdings?.find((h) => h.symbol === symbol);
    const isWatchlisted = state.watchlist?.includes(symbol);

    const calculateWhatIf = () => {
        const amount = parseFloat(investAmount);
        if (!amount || dailyBars.length === 0 || latestPrice == null) {
            setWhatIfResult(null);
            return;
        }
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - investDays);
        const startBar = dailyBars.find((b) => new Date(b.timestamp) >= cutoff) ?? dailyBars[0];
        const startPrice = startBar.close;
        if (!startPrice) {
            setWhatIfResult(null);
            return;
        }
        const shares = amount / startPrice;
        const currentValue = shares * latestPrice;
        setWhatIfResult({
            value: currentValue,
            gainPct: ((currentValue - amount) / amount) * 100,
        });
    };

    const toggleWatchlist = async () => {
        if (!state.user || watchlistBusy) return;
        setWatchlistBusy(true);
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            if (isWatchlisted) {
                dispatch({ type: "REMOVE_FROM_WATCHLIST", payload: symbol });
                await fetch(`${process.env.REACT_APP_API_URL}/user/watchlist`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ user: state.user.userId, type: "watchlist", symbol }),
                });
            } else {
                dispatch({ type: "ADD_TO_WATCHLIST", payload: symbol });
                await fetch(`${process.env.REACT_APP_API_URL}/user`, {
                    method: "PUT",
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ user: state.user.userId, type: "watchlist", details: symbol }),
                });
            }
        } catch (err) {
            // console.log(err)
        } finally {
            setWatchlistBusy(false);
        }
    };

    return (
        <div className="stock-details-page">
            <form className="details-ticker-switch" onSubmit={handleTickerSwitch}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <input
                    type="text"
                    placeholder="Jump to another symbol (e.g. MSFT)"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                />
            </form>

            {error && <div className="stock-details-error-message">{error}</div>}

            {(dailyLoading || intradayLoading) ? (
                <div className="details-skeleton">
                    <div className="skeleton-line" style={{ width: 140, height: 30 }} />
                    <div className="skeleton-line" style={{ width: 200, height: 16, marginTop: 10 }} />
                    <div className="skeleton-block" style={{ height: 340, marginTop: 20 }} />
                    <div className="details-stats-grid" style={{ marginTop: 16 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="details-stat">
                                <div className="skeleton-line" style={{ width: "50%", height: 11 }} />
                                <div className="skeleton-line" style={{ width: "70%", height: 18, marginTop: 8 }} />
                            </div>
                        ))}
                    </div>
                    <div className="skeleton-block" style={{ height: 76, marginTop: 16 }} />
                    <div className="skeleton-block" style={{ height: 130, marginTop: 16 }} />
                </div>
            ) : (
                <>
            <div className="details-header">
                <div className="details-header-top">
                    <div className="details-header-left">
                        <h1>{symbol}</h1>
                        <span className="details-company-name">{nameBySymbol[symbol] ?? ""}</span>
                        {sectorBySymbol[symbol] && (
                            <span className="details-sector-badge">{sectorBySymbol[symbol]}</span>
                        )}
                    </div>
                    {state.user && (
                        <div className="details-header-actions">
                            <button className="btn-buy-lg" onClick={() => setBuyOpen(true)}>Buy</button>
                            <button className="btn-sell-lg" onClick={() => setSellOpen(true)}>Sell</button>
                            <button
                                className={`details-watchlist-btn${isWatchlisted ? " active" : ""}`}
                                onClick={toggleWatchlist}
                                disabled={watchlistBusy}
                                aria-label={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
                                title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill={isWatchlisted ? "currentColor" : "none"}>
                                    <path d="M8 1.5L10 5.8L14.7 6.4L11.3 9.6L12.2 14.2L8 12L3.8 14.2L4.7 9.6L1.3 6.4L6 5.8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {latestPrice != null && (
                    <div className="details-price-row">
                        <span className="details-price num">${formatMoney(latestPrice)}</span>
                        {todayChange && (
                            <span className={`details-change num ${todayChange.dollar >= 0 ? "positive" : "negative"}`}>
                                {todayChange.dollar >= 0 ? "+" : "-"}${formatMoney(Math.abs(todayChange.dollar))}
                                {" "}({todayChange.dollar >= 0 ? "+" : ""}{todayChange.pct.toFixed(2)}%) today
                            </span>
                        )}
                    </div>
                )}
            </div>

            {holding && (
                <div className="details-holding-bar">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M2 6h12v7a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" stroke="currentColor" strokeWidth="1.3"/><path d="M5 6V4a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3"/></svg>
                    <span>
                        You own <strong>{holding.quantity} shares</strong>
                        {latestPrice != null && <> · ${formatMoney(holding.quantity * latestPrice)} total value</>}
                    </span>
                    <span className="details-holding-note"></span>
                </div>
            )}

            <div className="details-chart-section">
                <div className="details-chart-head">
                    <div className="details-timeframe-toggle">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf}
                                type="button"
                                className={timeframe === tf ? "active" : ""}
                                onClick={() => setTimeframe(tf)}
                            >
                                {tf === "1D" ? "1 Day" : tf === "30D" ? "30 Days" : tf === "90D" ? "90 Days" : "1 Year"}
                            </button>
                        ))}
                    </div>
                </div>
                <IntradayChart data={chartData} height={340} />
            </div>

            <div className="details-stats-grid">
                <div className="details-stat">
                    <div className="details-stat-label">Open</div>
                    <div className="details-stat-value">{latestDailyBar ? `$${formatMoney(latestDailyBar.open)}` : "—"}</div>
                </div>
                <div className="details-stat">
                    <div className="details-stat-label">High</div>
                    <div className="details-stat-value">{latestDailyBar ? `$${formatMoney(latestDailyBar.high)}` : "—"}</div>
                </div>
                <div className="details-stat">
                    <div className="details-stat-label">Low</div>
                    <div className="details-stat-value">{latestDailyBar ? `$${formatMoney(latestDailyBar.low)}` : "—"}</div>
                </div>
                <div className="details-stat">
                    <div className="details-stat-label">Volume</div>
                    <div className="details-stat-value">{latestDailyBar ? formatVolume(latestDailyBar.volume) : "—"}</div>
                </div>
            </div>

            {week52 && (
                <div className="details-week52">
                    <div className="details-stat-label">52 week range</div>
                    <div className="details-week52-track">
                        <div
                            className="details-week52-marker"
                            style={{ left: `${week52Position}%` }}
                        />
                    </div>
                    <div className="details-week52-labels">
                        <span>${formatMoney(week52.low)}</span>
                        <span>${formatMoney(week52.high)}</span>
                    </div>
                </div>
            )}

            <div className="details-whatif">
                <h3>What if you had invested?</h3>
                <div className="details-whatif-row">
                    <span className="details-whatif-dollar">$</span>
                    <input
                        type="number"
                        min="0"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        className="details-whatif-input"
                    />
                    <span>on</span>
                    <select
                        className="details-whatif-select"
                        value={investDays}
                        onChange={(e) => setInvestDays(Number(e.target.value))}
                    >
                        {WHATIF_PERIODS.map((p) => (
                            <option key={p.days} value={p.days}>{p.label}</option>
                        ))}
                    </select>
                    <button className="details-whatif-btn" onClick={calculateWhatIf}>Calculate</button>
                </div>
                {whatIfResult && (
                    <div className="details-whatif-result">
                        Today it would be worth <strong className="num">${formatMoney(whatIfResult.value)}</strong>
                        <span className={`num ${whatIfResult.gainPct >= 0 ? "positive" : "negative"}`}>
                            {" "}{whatIfResult.gainPct >= 0 ? "+" : ""}{whatIfResult.gainPct.toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>
                </>
            )}

            <div className="details-news">
                <h3>News about {symbol}</h3>
                {newsLoading ? (
                    <div className="details-news-skeleton">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="skeleton-line" style={{ height: 16 }} />
                        ))}
                    </div>
                ) : newsList.length === 0 ? (
                    <p className="details-news-empty">No recent news for {symbol}.</p>
                ) : (
                    newsList.map((article) => (
                        <a
                            key={article.uuid}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="details-news-item"
                        >
                            <div className="details-news-title">{article.title}</div>
                            <div className="details-news-meta">{article.source} · {article.published_at ? new Date(article.published_at).toLocaleTimeString() : ""}</div>
                        </a>
                    ))
                )}
            </div>

            <div className="ai-agent-div">
                <AIChat pageContext={`(The user is on the stock details page for ${symbol}, viewing the ${timeframe} chart)`} />
            </div>

            {buyOpen && <BuyStock initialSymbol={symbol} onClose={() => setBuyOpen(false)} />}
            {sellOpen && <SellStock initialSymbol={symbol} onClose={() => setSellOpen(false)} />}
        </div>
    )
}
export default StockDetails;