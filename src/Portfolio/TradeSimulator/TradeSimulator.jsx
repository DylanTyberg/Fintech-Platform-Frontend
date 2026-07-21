import { useUser } from "../../Contexts/UserContext";
import { useState, useMemo } from "react";
import "../TradeSimulator/TradeSimulator.css"
import AIChat from "../../Components/AIChat/AIChat";
import HoldingsTable from "../../Components/HoldingsTable/HoldingsTable";
import BuyStock from "./BuyStock/BuyStock";
import SellStock from "./SellStock/SellStock";
import { useHoldingsPrices } from "../../Hooks/useHoldingsPrices";
import { buildSnapshotSeries } from "../../Utils/marketHolidays";
import {signOut} from 'aws-amplify/auth';
import { fetchAuthSession } from "aws-amplify/auth";

const TradeSimulator = () => {
    const {state, dispatch} = useUser();

    const [introForm, setIntroForm] = useState(state.cash === 0);
    const [cashValue, setCashValue] = useState("");

    // null = closed. "" or a symbol = open, pre-filled with that symbol.
    const [buySymbol, setBuySymbol] = useState(null);
    const [sellSymbol, setSellSymbol] = useState(null);

    const { priceInfo, portfolioValue, isLoading } = useHoldingsPrices(state.holdings, state.cash);

    // Daily portfolio-value history. Weekends and known market holidays are
    // excluded here — the snapshot job currently records cash-only (not the
    // real portfolio value) on days the market's closed, e.g. Jul 3 and
    // Jun 19 2026. See marketHolidays.js for the actual filtering logic.
    const sortedSnapshots = useMemo(
        () => buildSnapshotSeries(state.snapshots),
        [state.snapshots]
    );

    const lastSnapshotValue = sortedSnapshots.length
        ? sortedSnapshots[sortedSnapshots.length - 1].value
        : null;
    const firstSnapshotValue = sortedSnapshots.length ? sortedSnapshots[0].value : null;

    // "Today" = live value vs. the most recent recorded snapshot.
    const todayChange = lastSnapshotValue != null ? portfolioValue - lastSnapshotValue : null;
    const todayChangePct = lastSnapshotValue ? (todayChange / lastSnapshotValue) * 100 : null;

    // "Total" = live value vs. the earliest snapshot we have on file —
    // an approximation of all-time gain/loss, not a true cost basis.
    const totalGainLoss = firstSnapshotValue != null ? portfolioValue - firstSnapshotValue : null;
    const totalGainLossPct = firstSnapshotValue ? (totalGainLoss / firstSnapshotValue) * 100 : null;

    const invested = portfolioValue - Number(state.cash);

    const [timeframe, setTimeframe] = useState("month");
    const TIMEFRAME_DAYS = { week: 7, month: 30, year: 365 };

    // Snapshots within the selected window. Falls back to full history if
    // the window comes up too thin (e.g. a new account with only 3 days on
    // record) so the chart isn't left showing one point or nothing.
    const visibleSnapshots = useMemo(() => {
        if (sortedSnapshots.length === 0) return [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - TIMEFRAME_DAYS[timeframe]);
        const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
        const filtered = sortedSnapshots.filter((s) => s.time >= cutoffStr);
        return filtered.length >= 2 ? filtered : sortedSnapshots;
    }, [sortedSnapshots, timeframe]);

    const isSparkPositive =
        visibleSnapshots.length >= 2 &&
        visibleSnapshots[visibleSnapshots.length - 1].value >= visibleSnapshots[0].value;

    const sparkPoints = useMemo(() => {
        const values = visibleSnapshots.map((s) => s.value);
        if (values.length < 2) return "";
        const width = 600, height = 90, pad = 4;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const step = (width - pad * 2) / (values.length - 1);
        return values
            .map((v, i) => {
                const x = pad + i * step;
                const y = pad + (height - pad * 2) * (1 - (v - min) / range);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
    }, [visibleSnapshots]);

    const formatAxisDate = (ymdString, tf) => {
        const [y, m, d] = ymdString.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        return tf === "year"
            ? date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const TrendArrow = ({ positive }) => (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ transform: positive ? "none" : "scaleY(-1)" }}>
            <path d="M3 12L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const handleCashSubmit = async (e) => {
        e.preventDefault();

        dispatch({type : "SET_CASH", payload : Number(cashValue)})

        const params = {
            user: state.user.userId,
            type: "cash",
            details: "",
            amount: Number(cashValue),
                
        }
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/user`,
                {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(params), 
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setIntroForm(false);


        } catch (error) {
            //console.log(error);
        }
    }

    const resetPortfolio = async () => {
        const confirmed = window.confirm(
            '⚠️ Are you sure you want to reset your portfolio?\n\n' +
            'This will delete all your portfolio data including:\n' +
            '• Holdings\n' +
            '• Transactions\n' +
            '• Performance history\n\n' +
            'Your watchlist will be preserved.\n\n' +
            'This action cannot be undone and you will be signed out.'
        );
        
        if (!confirmed) {
            return; 
        }

        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/portfolio-reset`, {
            method: 'DELETE',
            headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            user: state.user.userId
            })
        });
        
        const result = await response.json();
        await signOut();
        dispatch({type: "LOGOUT"});
        window.location.href = '/sign-in';
        
    };

    return (
        <div className="simulator-page">
            {introForm && 
            <div className="form-backdrop" onClick={(e) => {
                    if (e.target.className === 'form-backdrop') {
                        setIntroForm(false);
                    }
                }}>
                <form className="add-stocks-form" onSubmit={handleCashSubmit}>
                    <h1 className="add-stocks-button">Enter Starting Cash Amount</h1>
                    <input 
                        className="search-add-stocks" 
                        placeholder="$0" 
                        onChange={(e) => setCashValue(e.target.value)}
                    />
                     <button className="form-save-button" type="submit">Save</button>
                </form>
            </div>
            }
            {isLoading ? (
                <div className="simulator-hero">
                    <div className="skeleton-line" style={{ width: "35%", height: 12 }} />
                    <div className="skeleton-line" style={{ width: "45%", height: 36, marginTop: 10 }} />
                    <div className="skeleton-line" style={{ width: "30%", height: 14, marginTop: 10 }} />
                    <div className="skeleton-block" style={{ height: 90, marginTop: 24 }} />
                    <div className="simulator-hero-stats">
                        {[...Array(4)].map((_, i) => (
                            <div key={i}>
                                <div className="skeleton-line" style={{ width: "60%", height: 11 }} />
                                <div className="skeleton-line" style={{ width: "80%", height: 18, marginTop: 6 }} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="simulator-hero">
                    <div className="simulator-hero-main">
                        <div className="simulator-hero-label">Total portfolio value</div>
                        <div className="simulator-hero-value num">
                            ${Number(portfolioValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {todayChange != null ? (
                            <div className={`simulator-hero-change ${todayChange >= 0 ? "positive" : "negative"}`}>
                                <TrendArrow positive={todayChange >= 0} />
                                <span className="num">
                                    {todayChange >= 0 ? "+" : "-"}${Math.abs(todayChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {" "}({todayChange >= 0 ? "+" : ""}{todayChangePct.toFixed(2)}%)
                                </span>
                                <span className="today-label">today</span>
                            </div>
                        ) : (
                            <div className="simulator-hero-change muted">No history yet</div>
                        )}
                    </div>

                    <div className="simulator-hero-chart-section">
                        <div className="simulator-hero-chart-head">
                            <div className="simulator-timeframe-toggle">
                                {["week", "month", "year"].map((tf) => (
                                    <button
                                        key={tf}
                                        type="button"
                                        className={timeframe === tf ? "active" : ""}
                                        onClick={() => setTimeframe(tf)}
                                    >
                                        {tf === "week" ? "Week" : tf === "month" ? "Month" : "Year"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {sparkPoints ? (
                            <>
                                <div className="simulator-hero-spark-wide">
                                    <svg viewBox="0 0 600 90" preserveAspectRatio="none">
                                        <polyline
                                            points={sparkPoints}
                                            fill="none"
                                            stroke={isSparkPositive ? "var(--pos)" : "var(--neg)"}
                                            strokeWidth="1.8"
                                        />
                                    </svg>
                                </div>
                                <div className="simulator-hero-axis">
                                    <span>{formatAxisDate(visibleSnapshots[0].time, timeframe)}</span>
                                    <span>{formatAxisDate(visibleSnapshots[visibleSnapshots.length - 1].time, timeframe)}</span>
                                </div>
                            </>
                        ) : (
                            <div className="simulator-hero-spark-empty">Not enough history yet</div>
                        )}
                    </div>

                    <div className="simulator-hero-stats">
                        <div>
                            <div className="simulator-stat-label">Cash available</div>
                            <div className="simulator-stat-value num">
                                ${Number(state.cash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div>
                            <div className="simulator-stat-label">Invested</div>
                            <div className="simulator-stat-value num">
                                ${invested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div>
                            <div className="simulator-stat-label">Total gain / loss</div>
                            {totalGainLoss != null ? (
                                <div className={`simulator-stat-value num ${totalGainLoss >= 0 ? "positive" : "negative"}`}>
                                    {totalGainLoss >= 0 ? "+" : "-"}${Math.abs(totalGainLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {" "}({totalGainLoss >= 0 ? "+" : ""}{totalGainLossPct.toFixed(2)}%)
                                </div>
                            ) : (
                                <div className="simulator-stat-value muted">—</div>
                            )}
                        </div>
                        <div>
                            <div className="simulator-stat-label">Holdings</div>
                            <div className="simulator-stat-value">
                                {state.holdings.length} position{state.holdings.length === 1 ? "" : "s"}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="trade-buttons">
                <button className="btn-buy-lg" onClick={() => setBuySymbol("")}>Buy</button>
                <button className="btn-sell-lg" onClick={() => setSellSymbol("")}>Sell</button>
            </div>

            <HoldingsTable
                holdings={state.holdings}
                priceInfo={priceInfo}
                cashAvailable={state.cash}
                isLoading={isLoading}
                onBuy={(symbol) => setBuySymbol(symbol)}
                onSell={(symbol) => setSellSymbol(symbol)}
            />

            <AIChat pageContext="(The User is currently on the trade simulator page)"/>

            <div className="danger-zone">
                <div className="danger-zone-text">
                    <strong>Reset portfolio</strong>
                    <p>Clears your holdings, transactions, and performance history, and signs you out. This can't be undone.</p>
                </div>
                <button className="reset-portfolio-button" onClick={resetPortfolio}>Reset Portfolio</button>
            </div>

            {buySymbol !== null && (
                <BuyStock initialSymbol={buySymbol} onClose={() => setBuySymbol(null)} />
            )}
            {sellSymbol !== null && (
                <SellStock initialSymbol={sellSymbol} onClose={() => setSellSymbol(null)} />
            )}
        </div>
    )
}
export default TradeSimulator;