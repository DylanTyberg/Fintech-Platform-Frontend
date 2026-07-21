import { useUser } from "../../../Contexts/UserContext";
import { useState, useEffect } from "react";
import "../BuyStock/BuyStock.css"
import { TradeLoadingState } from "../../../Components/LoadingPage/LoadingPage";
import { fetchAuthSession } from "@aws-amplify/core";


const SellStock = ({ initialSymbol = "", onClose }) => {
    const {state, dispatch} = useUser();

    const [symbol, setSymbol] = useState(initialSymbol);
    const [shares, setShares] = useState("");
    
    const [orderType, setOrderType] = useState("market");

    const [selectedStock, setSelectedStock] = useState(null);
    const [error, setError] = useState("");

    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleStockSearch = async (targetSymbol) => {
        const target = (targetSymbol ?? symbol).trim().toUpperCase();
        if (!target) return;
        try {
            setIsLoading(true)
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
        } finally{
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialSymbol) {
            setSymbol(initialSymbol);
            handleStockSearch(initialSymbol);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSymbol]);

    // Computed once here instead of inline three separate times (disabled
    // check, warning message, summary row) — those three call sites used to
    // each re-derive this slightly differently, including one that crashed.
    const heldQuantity = selectedStock
        ? state.holdings.find(item => item.symbol === selectedStock.symbol)?.quantity ?? 0
        : 0;

    const handleSell = async () => {
        if (!selectedStock || !shares) {
            setError("Please select a stock and enter number of shares");
            return;
        }


        if (parseFloat(shares) > heldQuantity) {
            setError("Insufficient shares");
            return;
        }

        
        const existingHolding = state.holdings.find(holding => holding.symbol === selectedStock.symbol);

        const params = {
            user: state.user.userId,
            type: "holding",
            details: selectedStock.symbol,
            quantity: (existingHolding?.quantity || 0) - parseFloat(shares),
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
            //console.log(result);

        } catch (error)
        {
            //console.log(error);
        }

        const cash_params = {
            user: state.user.userId,
            type: "cash",
            details: "",
            amount: state.cash + (selectedStock.close * shares),
            
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
                body: JSON.stringify(cash_params), 
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            //console.log(result);

        } catch (error)
        {
            //console.log(error);
        }


        dispatch({
            type: "SUBTRACT_FROM_HOLDINGS",
            payload: {
                symbol: selectedStock.symbol,
                quantity: parseFloat(shares),
            }
        });
        dispatch({
            type: "SET_CASH",
            payload: state.cash + (selectedStock.close * shares)
        })

        onClose();
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
                    <h1>Sell Stock</h1>
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
                            <span>Available Shares:</span>
                            <span>{heldQuantity}</span>
                        </div>
                        <div className="summary-row">
                            <span>Price per share:</span>
                            {isLoading ? <TradeLoadingState size={10}/> : <span>${selectedStock?.close?.toFixed(2) || '0.00'}</span>}
                        </div>
                        <div className="summary-row total">
                            <span>Total Value:</span>
                            <span>${((shares || 0) * (selectedStock?.close || 0)).toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Cash After Trade:</span>
                            <span className="positive">
                                ${(state.cash + ((shares || 0) * (selectedStock?.close || 0))).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {selectedStock && parseFloat(shares || 0) > heldQuantity && (
                        <div className="warning-message">Insufficient shares</div>
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
                            onClick={handleSell}
                            disabled={!selectedStock || !shares || parseFloat(shares) > heldQuantity}
                        >
                            Sell {shares || 0} Shares
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default SellStock;