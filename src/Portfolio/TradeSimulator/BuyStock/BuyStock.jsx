import { useUser } from "../../../Contexts/UserContext";
import { useState, useEffect } from "react";
import "../BuyStock/BuyStock.css"
import { TradeLoadingState } from "../../../Components/LoadingPage/LoadingPage";
import { fetchAuthSession } from "@aws-amplify/core";


const BuyStock = ({ initialSymbol = "", onClose }) => {
    const {state, dispatch} = useUser();

    const [symbol, setSymbol] = useState(initialSymbol);
    const [shares, setShares] = useState("");
    const [orderType, setOrderType] = useState("market");
    const [selectedStock, setSelectedStock] = useState(null);
    const [error, setError] = useState("");

    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const handleStockSearch = async (targetSymbol) => {
        const target = (targetSymbol ?? symbol).trim().toUpperCase();
        if (!target) return;
        try {
            setIsLoading(true);
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/intraday/latest?symbol=${target}`,
                {
                method: "GET",
                }
            )

            const result = await response.json();
            setSelectedStock(result);
        } catch (error) {
            //console.log(error)
        } finally {
            setIsLoading(false);
        }
    };

    // Pre-fill + fetch immediately when opened from a holdings row.
    useEffect(() => {
        if (initialSymbol) {
            setSymbol(initialSymbol);
            handleStockSearch(initialSymbol);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSymbol]);

    const handleBuy = async (side="BUY") => {
        if (!selectedStock || !shares) {
            setError("Please select a stock and enter number of shares");
            return;
        }

        const qty = parseFloat(shares);
        if (!Number.isFinite(qty) || qty <= 0) {
            setError("Enter a valid quantity");
            return;
        }

        // Client-side check for fast feedback only. The server re-validates
        // against its own price and balance -- this is a UX nicety, not a
        // control, since the fill price will differ from what's displayed.
        if (side === "BUY" && qty * selectedStock.close > state.cash) {
            setError("Insufficient funds");
            return;
        }
        if (side === "SELL") {
            const held = state.holdings.find(h => h.symbol === selectedStock.symbol);
            if (!held || held.quantity < qty) {
                setError("Insufficient shares");
                return;
            }
        }

        setSubmitting(true);
        setError(null);

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/trades`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    symbol: selectedStock.symbol,
                    side,
                    quantity: qty,
                    // Lets a retried request return the original result
                    // instead of executing the trade twice.
                    idempotencyKey: crypto.randomUUID(),
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Surface the server's reason -- insufficient funds, no price
                // available, concurrent update -- instead of failing silently.
                setError(result?.message ?? `Trade failed (${response.status})`);
                return;
            }

            // Use the server's authoritative values, not locally computed ones.
            // The fill price can differ from the quote the user saw.
            dispatch({
                type: "TRADE_EXECUTED",
                payload: {
                    trade: result.trade,
                    position: result.position,
                    cash: result.cash,
                },
            });

            onClose();

        } catch (error) {
            setError("Network error, please try again");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="trade-modal-backdrop"
            onClick={(e) => {
                if (e.target.className === 'trade-modal-backdrop') {
                    onClose();
                }
            }}
        >
            <div className="buy-container" onClick={(e) => e.stopPropagation()}>
                <div className="buy-header">
                    <h1>Buy Stock</h1>
                    <button className="close-button" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="stock-search-section">
                    <label>{!isFocused ? "Search Stock" : "Click away to fetch price"}</label>
                    <input
                        type="text"
                        className="stock-search-input"
                        placeholder="Enter symbol (e.g., AAPL)"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        onFocus={() => setIsFocused(true)}  
                        onBlur={() => {
                            setIsFocused(false);  
                            handleStockSearch(); 
                        }}
                    />
                </div>

                <div className="order-form">
                    <div className="form-group">
                        <label>Shares</label>
                        <input
                            type="number"
                            min="1"
                            value={shares}
                            onChange={(e) => setShares(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>Order Type</label>
                        <div className="order-type-buttons">
                            <button
                                type="button"
                                className={orderType === 'market' ? 'active' : ''}
                                onClick={() => setOrderType('market')}
                            >
                                Market
                            </button>
                            <button type="button" className="coming-soon" disabled title="Limit orders coming soon">
                                Limit <span className="order-type-soon-badge">Soon</span>
                            </button>
                        </div>
                    </div>

                    <div className="order-summary">
                        <div className="summary-row">
                            <span>Shares:</span>
                            <span>{shares || 0}</span>
                        </div>
                        <div className="summary-row">
                            <span>Price per share:</span>
                            {isLoading ? <TradeLoadingState size={10}/> : <span>${selectedStock?.close?.toFixed(2) || '0.00'}</span>}
                        </div>
                        <div className="summary-row total">
                            <span>Total Cost:</span>
                            <span>${((shares || 0) * (selectedStock?.close || 0)).toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Available Cash:</span>
                            <span className={state.cash >= (shares * (selectedStock?.close || 0)) ? 'positive' : 'negative'}>
                                ${state.cash?.toFixed(2) || '0.00'}
                            </span>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {state.cash < (shares * selectedStock?.close) && (
                        <div className="warning-message">Insufficient funds</div>
                    )}

                    <div className="form-actions">
                        <button
                            className="cancel-button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            className="buy-button"
                            onClick={() => handleBuy("BUY")}
                            disabled={!selectedStock || !shares || state.cash < (shares * selectedStock?.close)}
                        >
                            {submitting ? "Executing…" : `Buy ${shares || 0} Shares`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default BuyStock;