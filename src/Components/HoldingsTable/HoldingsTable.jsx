import { Link } from "react-router-dom";
import "./HoldingsTable.css";

const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const HoldingsTable = ({
    holdings,
    priceInfo = [],
    cashAvailable,
    compact = false,
    maxRows = 5,
    isLoading = false,
    isSignedIn = true,
    title = "Holdings",
    onBuy,   //  (symbol) => void — pass to enable per-row Buy + empty-state CTA opening a modal
    onSell,  //  (symbol) => void — pass to enable per-row Sell
}) => {
    const showActions = Boolean(onBuy && onSell);

    if (isLoading) {
        return (
            <div className="holdings-panel">
                <div className="holdings-panel-head">
                    <div className="skeleton-line" style={{ width: 70, height: 14 }} />
                    <div className="skeleton-line" style={{ width: 120, height: 12 }} />
                </div>
                <div className="holdings-skeleton-rows">
                    {[...Array(4)].map((_, i) => (
                        <div className="skeleton-line" key={i} style={{ height: 32 }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="holdings-empty">
                <p>Sign in to see your live holdings.</p>
                <Link to="/sign-in" className="holdings-empty-cta">
                    Sign In →
                </Link>
            </div>
        );
    }

    if (!holdings || holdings.length === 0) {
        return (
            <div className="holdings-empty">
                <p>No positions yet.</p>
                {onBuy ? (
                    <button className="holdings-empty-cta" onClick={() => onBuy("")}>
                        Buy your first stock →
                    </button>
                ) : (
                    <Link to="/portfolio/trade-simulator" className="holdings-empty-cta">
                        Go buy your first stock →
                    </Link>
                )}
            </div>
        );
    }

    const visibleHoldings = compact ? holdings.slice(0, maxRows) : holdings;
    const hasMore = compact && holdings.length > maxRows;

    return (
        <div className="holdings-panel">
            <div className="holdings-panel-head">
                <h3>{title}</h3>
                {typeof cashAvailable === "number" && (
                    <span className="holdings-cash">
                        Cash available: <span className="num">${formatMoney(cashAvailable)}</span>
                    </span>
                )}
            </div>
            <div className="holdings-table-scroll">
                <table className="holdings-table">
                    <thead>
                        <tr className="holdings-header">
                            <th className="holdings-data">Symbol</th>
                            <th className="holdings-data">Qty</th>
                            <th className="holdings-data">Price</th>
                            <th className="holdings-data">Today</th>
                            <th className="holdings-data">Value</th>
                            {showActions && <th className="holdings-data"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleHoldings.map((holding) => {
                            const info = priceInfo.find((item) => item.symbol === holding.symbol);
                            const price = info?.lastPrice?.close ?? null;
                            const change = info?.change ?? null;
                            const value = price != null ? holding.quantity * price : null;

                            return (
                                <tr className="holdings-row" key={holding.symbol}>
                                    <td className="holdings-data holdings-symbol">
                                        <Link to={`/stock-details/${holding.symbol}`} className="mono">
                                            {holding.symbol}
                                        </Link>
                                    </td>
                                    <td className="holdings-data num">{holding.quantity}</td>
                                    <td className="holdings-data num">
                                        {price != null ? `$${formatMoney(price)}` : "—"}
                                    </td>
                                    <td
                                        className={`holdings-data num ${
                                            change == null ? "" : change >= 0 ? "positive" : "negative"
                                        }`}
                                    >
                                        {change != null ? `${change >= 0 ? "+" : ""}${change}%` : "—"}
                                    </td>
                                    <td className="holdings-data num">
                                        {value != null ? `$${formatMoney(value)}` : "—"}
                                    </td>
                                    {showActions && (
                                        <td className="holdings-data holdings-actions">
                                            <button
                                                className="holdings-action-buy"
                                                onClick={() => onBuy(holding.symbol)}
                                            >
                                                Buy
                                            </button>
                                            <button
                                                className="holdings-action-sell"
                                                onClick={() => onSell(holding.symbol)}
                                            >
                                                Sell
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {hasMore && (
                <div className="holdings-more">
                    <Link to="/portfolio/trade-simulator">View all {holdings.length} positions →</Link>
                </div>
            )}
        </div>
    );
};

export default HoldingsTable;