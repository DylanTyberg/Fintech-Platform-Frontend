import { useEffect, useMemo, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useUser } from '../../Contexts/UserContext';
import "../PortfolioAnalytics/PortfolioAnalytics.css"
import PerformanceComparisonChart from '../../Components/PerformanceComparisonChart/PerformanceComparisonChart';
import AIChat from '../../Components/AIChat/AIChat';
import { buildSnapshotSeries } from '../../Utils/marketHolidays';

// Base URL for the Django analytics service — separate from the main
// backend (REACT_APP_API_URL), so it needs its own env var. Add
// REACT_APP_ANALYTICS_API_URL=https://analytics.htytun.com/api/v1 to your
// env config. The Django app also needs CORS configured to allow requests
// from this frontend's origin — that's not something settable from here.
const ANALYTICS_BASE_URL = process.env.REACT_APP_ANALYTICS_API_URL;

const MODES = ["risk", "behavior"];
const CHART_TIMEFRAMES = { "1M": 30, "3M": 90, "1Y": 365, "All": Infinity };

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const pctFmt = (v, digits = 2) => (v == null ? "—" : `${(v * 100).toFixed(digits)}%`);
const signedPctFmt = (v, digits = 2) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(digits)}%`);
const numFmt = (v, digits = 2) => (v == null ? "—" : v.toFixed(digits));

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
    if (beta > 1.1) return "More volatile than benchmark";
    if (beta < 0.9) return "Less volatile than benchmark";
    return "Similar volatility to benchmark";
};

// Deliberately NOT using --pos/--neg here — correlation isn't a gain/loss
// signal (high correlation isn't "good" or "bad"), so it gets its own
// neutral scale: accent blue for positive, violet for negative, matching
// the categorical (non-directional) palette already used for the sector
// allocation donut elsewhere in this app.
const CORR_POS_RGB = "41, 98, 255";
const CORR_NEG_RGB = "139, 92, 246";
const correlationColor = (value, isDiagonal) => {
    if (isDiagonal) return "var(--surface-2)";
    const intensity = Math.min(Math.abs(value), 1);
    const alpha = 0.10 + intensity * 0.55;
    return `rgba(${value >= 0 ? CORR_POS_RGB : CORR_NEG_RGB}, ${alpha.toFixed(2)})`;
};

// ---------------------------------------------------------------------------
// Chart data — client-side, independent of the Django service. Same
// align/rebase/slice logic the old Lambda used to do server-side, ported
// here since it only ever needed data this app already has (snapshots +
// SPY daily history), not anything analytics-specific.
// ---------------------------------------------------------------------------
const pad2 = (n) => String(n).padStart(2, "0");
const formatDay = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const getSpyDailySeries = async () => {
    try {
        const triggerResponse = await fetch(`${process.env.REACT_APP_API_URL}/daily?symbol=SPY`, { method: "POST" });
        if (!triggerResponse.ok) return [];

        const listResponse = await fetch(`${process.env.REACT_APP_API_URL}/daily/list`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols: ["SPY"] }),
        });
        if (!listResponse.ok) return [];

        const payload = await listResponse.json();
        const bars = payload.results?.[0]?.data ?? [];
        const seen = new Set();
        return bars
            .map((bar) => ({ time: formatDay(new Date(bar.timestamp)), value: bar.close }))
            .filter((point) => {
                if (seen.has(point.time)) return false;
                seen.add(point.time);
                return true;
            })
            .sort((a, b) => a.time.localeCompare(b.time));
    } catch (error) {
        return [];
    }
};

const alignSeries = (seriesA, seriesB) => {
    const mapB = new Map(seriesB.map((p) => [p.time, p.value]));
    const alignedA = [], alignedB = [];
    for (const point of seriesA) {
        if (mapB.has(point.time)) {
            alignedA.push(point);
            alignedB.push({ time: point.time, value: mapB.get(point.time) });
        }
    }
    return [alignedA, alignedB];
};

const sliceToPeriod = (series, days) => {
    if (days === Infinity) return series;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = formatDay(cutoff);
    return series.filter((p) => p.time >= cutoffStr);
};

const rebaseToPercent = (series) => {
    if (series.length === 0) return [];
    const base = series[0].value;
    if (base <= 0) return series.map((p) => ({ time: p.time, value: 0 }));
    return series.map((p) => ({ time: p.time, value: ((p.value - base) / base) * 100 }));
};

// ---------------------------------------------------------------------------
// Small presentational sub-components
// ---------------------------------------------------------------------------
const StatCard = ({ label, value, sub, subTone, valueTone }) => (
    <div className="analytics-stat-card">
        <div className="analytics-stat-label">{label}</div>
        <div className={`analytics-stat-value ${valueTone || ""}`}>{value}</div>
        {sub && <div className={`analytics-stat-sub ${subTone || ""}`}>{sub}</div>}
    </div>
);

const RiskContributions = ({ data }) => {
    if (!data || Object.keys(data).length === 0) {
        return <p className="analytics-empty-inline">No data.</p>;
    }
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(([, v]) => v), 0.0001);
    return (
        <div className="analytics-contrib-list">
            {entries.map(([symbol, value]) => (
                <div className="analytics-contrib-row" key={symbol}>
                    <span className="analytics-contrib-symbol mono">{symbol}</span>
                    <div className="analytics-contrib-track">
                        <div className="analytics-contrib-fill" style={{ width: `${(value / max) * 100}%` }} />
                    </div>
                    <span className="analytics-contrib-pct num">{(value * 100).toFixed(1)}%</span>
                </div>
            ))}
        </div>
    );
};

const CorrelationMatrix = ({ data }) => {
    if (!data?.symbols?.length) {
        return <p className="analytics-empty-inline">No data.</p>;
    }
    const { symbols, matrix } = data;
    return (
        <div className="analytics-corr-wrapper">
            <table className="analytics-corr-table">
                <thead>
                    <tr>
                        <th></th>
                        {symbols.map((s) => <th key={s} className="mono">{s}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {matrix.map((row, i) => (
                        <tr key={symbols[i]}>
                            <th className="mono">{symbols[i]}</th>
                            {row.map((value, j) => (
                                <td key={j} className="num" style={{ backgroundColor: correlationColor(value, i === j) }}>
                                    {value.toFixed(2)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const DistributionBars = ({ data }) => {
    if (!data || Object.keys(data).length === 0) {
        return <p className="analytics-empty-inline">No data.</p>;
    }
    const entries = Object.entries(data);
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return (
        <div className="analytics-dist-chart">
            {entries.map(([label, value]) => (
                <div className="analytics-dist-bar-col" key={label}>
                    <div className="analytics-dist-bar-track">
                        <div className="analytics-dist-bar-fill" style={{ height: `${(value / max) * 100}%` }} />
                    </div>
                    <div className="analytics-dist-bar-value num">{value}</div>
                    <div className="analytics-dist-bar-label">{label}</div>
                </div>
            ))}
        </div>
    );
};

const ChartSkeleton = () => (
    <div className="analytics-performance-panel">
        <div className="skeleton-line" style={{ width: "30%", height: 16 }} />
        <div className="skeleton-block" style={{ height: 260, marginTop: 16 }} />
    </div>
);

const SectionSkeleton = () => (
    <>
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const PortfolioAnalytics = () => {
    const { state } = useUser();

    const [mode, setMode] = useState("risk");
    const [chartTimeframe, setChartTimeframe] = useState("3M");

    const [risk, setRisk] = useState(null);
    const [behavior, setBehavior] = useState(null);
    const [sectionLoading, setSectionLoading] = useState(true);
    const [sectionError, setSectionError] = useState(null);

    const [spySeries, setSpySeries] = useState([]);
    const [chartLoading, setChartLoading] = useState(true);

    const fetchRun = async (runType, token) => {
        const response = await fetch(`${ANALYTICS_BASE_URL}/analytics/${runType}`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    };

    const getAnalytics = async () => {
        try {
            setSectionLoading(true);
            setSectionError(null);
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const [riskResult, behaviorResult] = await Promise.all([
                fetchRun("risk", token),
                fetchRun("behavior", token),
            ]);
            setRisk(riskResult);
            setBehavior(behaviorResult);
        } catch (fetchError) {
            console.error(fetchError);
            setSectionError("Couldn't load analytics from the risk/behavior service.");
        } finally {
            setSectionLoading(false);
        }
    };

    useEffect(() => {
        getAnalytics();
        (async () => {
            setChartLoading(true);
            const data = await getSpyDailySeries();
            setSpySeries(data);
            setChartLoading(false);
        })();
    }, []);

    const portfolioSnapshotSeries = useMemo(
        () => buildSnapshotSeries(state.snapshots),
        [state.snapshots]
    );

    const chartData = useMemo(() => {
        const days = CHART_TIMEFRAMES[chartTimeframe];
        const portfolioSlice = sliceToPeriod(portfolioSnapshotSeries, days);
        const spySlice = sliceToPeriod(spySeries, days);
        const [alignedPortfolio, alignedSpy] = alignSeries(portfolioSlice, spySlice);

        if (alignedPortfolio.length < 2) return null;

        const portfolioReturnPct =
            ((alignedPortfolio[alignedPortfolio.length - 1].value - alignedPortfolio[0].value) /
                alignedPortfolio[0].value) * 100;
        const spyReturnPct =
            ((alignedSpy[alignedSpy.length - 1].value - alignedSpy[0].value) /
                alignedSpy[0].value) * 100;

        return {
            portfolio: rebaseToPercent(alignedPortfolio),
            spy: rebaseToPercent(alignedSpy),
            portfolioReturnPct,
            spyReturnPct,
        };
    }, [portfolioSnapshotSeries, spySeries, chartTimeframe]);

    // -------------------------------------------------------------------
    // Risk section
    // -------------------------------------------------------------------
    const renderRisk = () => {
        if (risk?.status === "failed") {
            return <div className="analytics-empty">{risk.error_message || "Risk analysis isn't available yet."}</div>;
        }
        const m = risk?.metrics;
        if (!m) {
            return <div className="analytics-empty">No risk data available.</div>;
        }

        const sharpe = toNum(m.sharpe_ratio);
        const beta = toNum(m.beta);
        const maxDD = toNum(m.max_drawdown);
        const annReturn = toNum(m.annualised_return);
        const portfolioVol = toNum(m.portfolio_vol);
        const benchmarkVol = toNum(m.benchmark_vol);
        const var95 = toNum(m.var_95);
        const es95 = toNum(m.expected_shortfall_95);
        const avgCorr = toNum(m.avg_correlation);
        const hhi = toNum(m.hhi);
        const effHoldings = toNum(m.effective_holdings);
        const excluded = Object.entries(risk.securities_excluded ?? {});

        return (
            <>
                <div className="analytics-meta-row">
                    <span>As of {formatShortDate(risk.as_of)}</span>
                    <span>·</span>
                    <span>{risk.lookback_days}-day lookback</span>
                    <span>·</span>
                    <span>{risk.securities_included?.length ?? 0} securities</span>
                </div>

                {excluded.length > 0 && (
                    <div className="analytics-excluded-note">
                        Excluded: {excluded.map(([sym, reason]) => `${sym} (${reason})`).join(", ")}
                    </div>
                )}

                <div className="analytics-stats-row">
                    <StatCard
                        label="Sharpe Ratio"
                        value={numFmt(sharpe)}
                        sub={sharpeLabel(sharpe)}
                        subTone={sharpeTone(sharpe)}
                    />
                    <StatCard
                        label="Max Drawdown"
                        value={pctFmt(maxDD)}
                        valueTone="negative"
                        sub={`${formatShortDate(m.max_drawdown_start)} – ${formatShortDate(m.max_drawdown_end)}`}
                    />
                    <StatCard
                        label="Beta (vs benchmark)"
                        value={numFmt(beta)}
                        sub={betaLabel(beta)}
                    />
                    <StatCard
                        label="Annualized Return"
                        value={signedPctFmt(annReturn)}
                        valueTone={annReturn >= 0 ? "positive" : "negative"}
                    />
                </div>

                <div className="analytics-stats-row">
                    <StatCard label="Volatility (Ann.)" value={pctFmt(portfolioVol)} sub={`Benchmark: ${pctFmt(benchmarkVol)}`} />
                    <StatCard label="Value at Risk (95%)" value={pctFmt(var95)} valueTone="negative" sub="Worst expected daily loss" />
                    <StatCard label="Expected Shortfall (95%)" value={pctFmt(es95)} valueTone="negative" sub="Avg. loss, worst 5% of days" />
                    <StatCard label="Avg. Correlation" value={numFmt(avgCorr)} sub="Across all holdings" />
                </div>

                <div className="analytics-bottom-row">
                    <div className="analytics-panel">
                        <h3>Concentration</h3>
                        <div className="analytics-concentration-row">
                            <div>
                                <div className="analytics-stat-label">Effective Holdings</div>
                                <div className="analytics-stat-value">{numFmt(effHoldings, 1)}</div>
                                <div className="analytics-stat-sub">of {risk.securities_included?.length ?? 0} actual positions</div>
                            </div>
                            <div>
                                <div className="analytics-stat-label">HHI</div>
                                <div className="analytics-stat-value">{numFmt(hhi, 3)}</div>
                                <div className="analytics-stat-sub">Higher = more concentrated</div>
                            </div>
                        </div>
                    </div>
                    <div className="analytics-panel">
                        <h3>Risk Contributions</h3>
                        <RiskContributions data={m.risk_contributions} />
                    </div>
                </div>

                <div className="analytics-panel">
                    <h3>Correlation Matrix</h3>
                    <CorrelationMatrix data={m.correlation_matrix} />
                </div>
            </>
        );
    };

    // -------------------------------------------------------------------
    // Behavior section
    // -------------------------------------------------------------------
    const renderBehavior = () => {
        if (behavior?.status === "failed") {
            return <div className="analytics-empty">{behavior.error_message || "Behavior analysis isn't available yet."}</div>;
        }
        const m = behavior?.metrics;
        if (!m) {
            return <div className="analytics-empty">No behavior data available.</div>;
        }

        const winRate = toNum(m.win_rate);
        const payoff = toNum(m.payoff_ratio);
        const disposition = toNum(m.disposition_ratio);
        const tradesPerMonth = toNum(m.trades_per_month);
        const avgHoldWinners = toNum(m.avg_hold_days_winners);
        const avgHoldLosers = toNum(m.avg_hold_days_losers);
        const turnover = toNum(m.turnover_ratio);
        const realizedReturn = toNum(m.realized_return);
        const buyHoldReturn = toNum(m.buy_hold_return);
        const vsBuyHold = toNum(m.vs_buy_hold);
        const avgWin = toNum(m.avg_win_pct);
        const avgLoss = toNum(m.avg_loss_pct);

        return (
            <>
                <div className="analytics-meta-row">
                    <span>As of {formatShortDate(behavior.as_of)}</span>
                    <span>·</span>
                    <span>{m.total_closed_lots} closed lots</span>
                    <span>·</span>
                    <span>{m.total_fills} fills</span>
                </div>

                <div className="analytics-stats-row">
                    <StatCard label="Win Rate" value={pctFmt(winRate, 1)} sub={`${m.winning_lots} of ${m.total_closed_lots} lots`} />
                    <StatCard
                        label="Payoff Ratio"
                        value={numFmt(payoff)}
                        sub={`Avg win ${signedPctFmt(avgWin)} / avg loss ${signedPctFmt(avgLoss)}`}
                    />
                    <StatCard
                        label="Disposition Ratio"
                        value={numFmt(disposition)}
                        sub={disposition > 1 ? "Holding losers longer than winners" : "Holding winners longer than losers"}
                    />
                    <StatCard label="Trades / Month" value={numFmt(tradesPerMonth, 1)} sub={`Turnover: ${numFmt(turnover)}x`} />
                </div>

                <div className="analytics-stats-row">
                    <StatCard label="Avg Hold — Winners" value={`${numFmt(avgHoldWinners, 1)}d`} />
                    <StatCard label="Avg Hold — Losers" value={`${numFmt(avgHoldLosers, 1)}d`} />
                    <StatCard
                        label="Realized Return"
                        value={signedPctFmt(realizedReturn)}
                        valueTone={realizedReturn >= 0 ? "positive" : "negative"}
                    />
                    <StatCard
                        label="vs. Buy & Hold"
                        value={signedPctFmt(vsBuyHold)}
                        valueTone={vsBuyHold >= 0 ? "positive" : "negative"}
                        sub={`Buy & hold: ${signedPctFmt(buyHoldReturn)}`}
                    />
                </div>

                <div className="analytics-bottom-row">
                    <div className="analytics-panel">
                        <h3>Hold Period Distribution</h3>
                        <DistributionBars data={m.distributions?.hold_period_buckets} />
                    </div>
                    <div className="analytics-panel">
                        <h3>Monthly Trade Activity</h3>
                        <DistributionBars data={m.distributions?.monthly_trade_counts} />
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="analytics-page">
            <div className="analytics-header">
                <div>
                    <h1 className="analytics-title">Portfolio Analytics</h1>
                    <p className="analytics-subtitle">Risk and trading behavior</p>
                </div>
                <div className="analytics-mode-toggle">
                    {MODES.map((m) => (
                        <button
                            key={m}
                            type="button"
                            className={mode === m ? "active" : ""}
                            onClick={() => setMode(m)}
                        >
                            {m === "risk" ? "Risk" : "Behavior"}
                        </button>
                    ))}
                </div>
            </div>

            {chartLoading ? (
                <ChartSkeleton />
            ) : (
                <div className="analytics-performance-panel">
                    <div className="analytics-performance-head">
                        <h3>Performance vs. S&P 500</h3>
                        <div className="analytics-timeframe-toggle">
                            {Object.keys(CHART_TIMEFRAMES).map((tf) => (
                                <button
                                    key={tf}
                                    type="button"
                                    className={chartTimeframe === tf ? "active" : ""}
                                    onClick={() => setChartTimeframe(tf)}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>
                    {!chartData ? (
                        <p className="analytics-empty-inline">Not enough trading history yet for {chartTimeframe}.</p>
                    ) : (
                        <>
                            <div className="analytics-legend">
                                <span className={`analytics-legend-item ${chartData.portfolioReturnPct >= 0 ? "positive" : "negative"}`}>
                                    <span className="analytics-legend-swatch solid" />
                                    Your Portfolio {chartData.portfolioReturnPct >= 0 ? "+" : ""}{chartData.portfolioReturnPct.toFixed(1)}%
                                </span>
                                <span className="analytics-legend-item muted">
                                    <span className="analytics-legend-swatch dashed" />
                                    SPY (S&P 500) {chartData.spyReturnPct >= 0 ? "+" : ""}{chartData.spyReturnPct.toFixed(1)}%
                                </span>
                            </div>
                            <PerformanceComparisonChart
                                portfolioSeries={chartData.portfolio}
                                spySeries={chartData.spy}
                            />
                        </>
                    )}
                </div>
            )}

            {sectionLoading ? (
                <SectionSkeleton />
            ) : sectionError ? (
                <div className="analytics-error">{sectionError}</div>
            ) : (
                mode === "risk" ? renderRisk() : renderBehavior()
            )}

            <AIChat pageContext={`(The user is on the portfolio analytics page, ${mode} view, powered by the analytics service, plus a performance chart vs SPY)`} />
        </div>
    )
}
export default PortfolioAnalytics;