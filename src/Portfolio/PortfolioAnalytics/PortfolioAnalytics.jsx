import { useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import "../PortfolioAnalytics/PortfolioAnalytics.css"
import PerformanceComparisonChart from '../../Components/PerformanceComparisonChart/PerformanceComparisonChart';
import AIChat from '../../Components/AIChat/AIChat';

const TIMEFRAMES = ["1M", "3M", "1Y", "All"];
const SECTOR_COLORS = ["#2962ff", "#5b8def", "#8b5cf6", "#06b6d4", "#64748b", "#f59e0b", "#10b981"];

const formatShortDate = (ymdString) => {
    if (!ymdString) return "";
    const [y, m, d] = ymdString.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const sharpeLabel = (sharpe) => {
    if (sharpe == null) return "";
    if (sharpe >= 2) return "Excellent";
    if (sharpe >= 1) return "Good";
    if (sharpe >= 0) return "Fair";
    return "Poor";
};

const sharpeTone = (sharpe) => {
    if (sharpe == null) return "";
    if (sharpe >= 1) return "positive";
    if (sharpe >= 0) return "";
    return "negative";
};

const betaLabel = (beta) => {
    if (beta == null) return "";
    if (beta > 1.1) return "More volatile than SPY";
    if (beta < 0.9) return "Less volatile than SPY";
    return "Similar volatility to SPY";
};


const buildDonutSegments = (allocation) => {
    const circumference = 2 * Math.PI * 50;
    let cumulative = 0;
    return allocation.map((item, i) => {
        const length = (item.pct / 100) * circumference;
        const segment = {
            ...item,
            color: SECTOR_COLORS[i % SECTOR_COLORS.length],
            dasharray: `${length.toFixed(2)} ${(circumference - length).toFixed(2)}`,
            dashoffset: -cumulative,
        };
        cumulative += length;
        return segment;
    });
};

const AnalyticsSkeleton = () => (
    <>
        <div className="analytics-performance-panel">
            <div className="skeleton-line" style={{ width: "30%", height: 16 }} />
            <div className="skeleton-block" style={{ height: 260, marginTop: 16 }} />
        </div>
        <div className="analytics-stats-row">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="analytics-stat-card">
                    <div className="skeleton-line" style={{ width: "60%", height: 11 }} />
                    <div className="skeleton-line" style={{ width: "40%", height: 24, marginTop: 8 }} />
                </div>
            ))}
        </div>
        <div className="analytics-bottom-row">
            <div className="analytics-panel">
                <div className="skeleton-line" style={{ width: "40%", height: 14 }} />
                <div className="skeleton-block" style={{ height: 140, marginTop: 16 }} />
            </div>
            <div className="analytics-panel">
                <div className="skeleton-line" style={{ width: "50%", height: 14 }} />
                <div className="skeleton-block" style={{ height: 140, marginTop: 16 }} />
            </div>
        </div>
    </>
);

const PortfolioAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [timeframe, setTimeframe] = useState("3M");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const getAnalytics = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/portfolio-analytics`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}`,"Content-Type": "application/json", },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setAnalytics(result);
        } catch (fetchError) {
            console.error(fetchError);
            setError("Couldn't load portfolio analytics.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getAnalytics();
    }, []);

    const current = analytics?.periods?.[timeframe];
    const donutSegments = analytics?.sectorAllocation?.length
        ? buildDonutSegments(analytics.sectorAllocation)
        : [];

    return (
        <div className="analytics-page">
            <div className="analytics-header">
                <div>
                    <h1 className="analytics-title">Portfolio Analytics</h1>
                    <p className="analytics-subtitle">Performance and risk, benchmarked against SPY</p>
                </div>
                <div className="analytics-timeframe-toggle">
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf}
                            type="button"
                            className={timeframe === tf ? "active" : ""}
                            onClick={() => setTimeframe(tf)}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <AnalyticsSkeleton />
            ) : error ? (
                <div className="analytics-error">{error}</div>
            ) : !current ? (
                <div className="analytics-empty">
                    Not enough trading history yet for {timeframe}. Try a shorter window, or check back once you've been trading a bit longer.
                </div>
            ) : (
                <>
                    <div className="analytics-performance-panel">
                        <h3>Performance vs. S&P 500</h3>
                        <div className="analytics-legend">
                            <span className={`analytics-legend-item ${current.portfolioReturnPct >= 0 ? "positive" : "negative"}`}>
                                <span className="analytics-legend-swatch solid" />
                                Your Portfolio {current.portfolioReturnPct >= 0 ? "+" : ""}{current.portfolioReturnPct.toFixed(1)}%
                            </span>
                            <span className="analytics-legend-item muted">
                                <span className="analytics-legend-swatch dashed" />
                                SPY (S&P 500) {current.spyReturnPct >= 0 ? "+" : ""}{current.spyReturnPct.toFixed(1)}%
                            </span>
                        </div>
                        <PerformanceComparisonChart
                            portfolioSeries={current.chartSeries.portfolio}
                            spySeries={current.chartSeries.spy}
                        />
                    </div>

                    <div className="analytics-stats-row">
                        <div className="analytics-stat-card">
                            <div className="analytics-stat-label">Sharpe Ratio</div>
                            <div className="analytics-stat-value">
                                {current.sharpeRatio != null ? current.sharpeRatio.toFixed(2) : "—"}
                            </div>
                            {current.sharpeRatio != null && (
                                <div className={`analytics-stat-sub ${sharpeTone(current.sharpeRatio)}`}>
                                    {sharpeLabel(current.sharpeRatio)}
                                    {current.spySharpeRatio != null ? ` (SPY: ${current.spySharpeRatio.toFixed(2)})` : ""}
                                </div>
                            )}
                        </div>
                        <div className="analytics-stat-card">
                            <div className="analytics-stat-label">Max Drawdown</div>
                            <div className="analytics-stat-value negative">{current.maxDrawdown.pct.toFixed(1)}%</div>
                            <div className="analytics-stat-sub">
                                {formatShortDate(current.maxDrawdown.start)} – {formatShortDate(current.maxDrawdown.end)}
                            </div>
                        </div>
                        <div className="analytics-stat-card">
                            <div className="analytics-stat-label">Beta (vs SPY)</div>
                            <div className="analytics-stat-value">
                                {current.beta != null ? current.beta.toFixed(2) : "—"}
                            </div>
                            <div className="analytics-stat-sub">{betaLabel(current.beta)}</div>
                        </div>
                        <div className="analytics-stat-card">
                            <div className="analytics-stat-label">Volatility (Ann.)</div>
                            <div className="analytics-stat-value">{current.volatilityPct.toFixed(1)}%</div>
                            <div className="analytics-stat-sub">
                                {current.spyVolatilityPct != null ? `SPY: ${current.spyVolatilityPct.toFixed(1)}%` : ""}
                            </div>
                        </div>
                    </div>

                    <div className="analytics-bottom-row">
                        <div className="analytics-panel">
                            <h3>Sector Allocation</h3>
                            {donutSegments.length === 0 ? (
                                <p className="analytics-empty-inline">No holdings yet.</p>
                            ) : (
                                <div className="analytics-donut-row">
                                    <svg width="120" height="120" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-2)" strokeWidth="16" />
                                        {donutSegments.map((seg) => (
                                            <circle
                                                key={seg.sector}
                                                cx="60" cy="60" r="50" fill="none"
                                                stroke={seg.color} strokeWidth="16"
                                                strokeDasharray={seg.dasharray}
                                                strokeDashoffset={seg.dashoffset}
                                                transform="rotate(-90 60 60)"
                                            />
                                        ))}
                                    </svg>
                                    <div className="analytics-legend-list">
                                        {donutSegments.map((seg) => (
                                            <div key={seg.sector} className="analytics-legend-list-item">
                                                <span className="analytics-legend-dot" style={{ background: seg.color }} />
                                                <span className="analytics-legend-list-name">{seg.sector}</span>
                                                <span className="analytics-legend-list-pct num">{seg.pct.toFixed(0)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="analytics-panel">
                            <h3>Performance Leaders ({timeframe})</h3>
                            {current.performanceLeaders.length === 0 ? (
                                <p className="analytics-empty-inline">No holdings yet.</p>
                            ) : (
                                <div className="analytics-leaders-list">
                                    {current.performanceLeaders.map((leader, i) => {
                                        const prevPositive = i > 0 && current.performanceLeaders[i - 1].pctChange >= 0;
                                        const isFirstNegative = leader.pctChange < 0 && (i === 0 || prevPositive);
                                        return (
                                            <div key={leader.symbol}>
                                                {isFirstNegative && <div className="analytics-leaders-divider" />}
                                                <div className="analytics-leaders-row">
                                                    <span className="analytics-leaders-symbol mono">{leader.symbol}</span>
                                                    <span className={`num ${leader.pctChange >= 0 ? "positive" : "negative"}`}>
                                                        {leader.pctChange >= 0 ? "+" : ""}{leader.pctChange.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <AIChat pageContext={`(The user is on the portfolio analytics page, ${timeframe} timeframe, showing performance vs SPY, Sharpe ratio, max drawdown, beta, volatility, sector allocation, and performance leaders)`} />
        </div>
    )
}
export default PortfolioAnalytics;