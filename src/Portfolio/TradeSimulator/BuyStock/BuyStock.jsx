import { useUser } from "../../../Contexts/UserContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../BuyStock/BuyStock.css"
import { TradeLoadingState } from "../../../Components/LoadingPage/LoadingPage";
import BackButton from "../../../Components/BackButton/BackButton";

const BuyStock = () => {
    const {state, dispatch} = useUser();
    const navigate = useNavigate();

    const [symbol, setSymbol] = useState("");
    const [shares, setShares] = useState("");
   
    const [orderType, setOrderType] = useState("market");
    const [limitPrice, setLimitPrice] = useState("");
    const [selectedStock, setSelectedStock] = useState(null);
    const [error, setError] = useState("");

    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleStockSearch = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/intraday/latest?symbol=${symbol}`,
                {
                method: "GET",

                }
            )

            const result = await response.json();
            console.log(result);
            setSelectedStock(result);
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false);
        }
       
    };

    const handleBuy = async () => {
        if (!selectedStock || !shares) {
            setError("Please select a stock and enter number of shares");
            return;
        }

        const totalCost = shares * selectedStock.price;
        
        if (totalCost > state.cash) {
            setError("Insufficient funds");
            return;
        }

        
        const existingHolding = state.holdings.find(holding => holding.symbol === selectedStock.symbol);

        const params = {
            user: state.user.userId,
            type: "holding",
            details: selectedStock.symbol,
            quantity: (existingHolding?.quantity || 0) + parseFloat(shares),
        }
        

        try {
            const response = await fetch(
                "https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/user",
                {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(params), 
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log(result);

        } catch (error)
        {
            console.log(error);
        }

        const cash_params = {
            user: state.user.userId,
            type: "cash",
            details: "",
            amount: state.cash - (selectedStock.close * shares),
            
        }
        

        try {
            const response = await fetch(
                "https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/user",
                {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(cash_params), 
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log(result);

        } catch (error)
        {
            console.log(error);
        }


        dispatch({
            type: "ADD_TO_HOLDINGS",
            payload: {
                symbol: selectedStock.symbol,
                quantity: parseFloat(shares),
            }
        });
        dispatch({
            type: "SET_CASH",
            payload: state.cash - (selectedStock.close * shares)
        })

        navigate("/portfolio/trade-simulator");
    };

    return (
        <div>
        <BackButton/>
        <div className="buy-page">
            
            <div className="buy-container">
                <div className="buy-header">
                    <h1>Buy Stock</h1>
                    <button className="close-button" onClick={() => navigate("/portfolio/trade-simulator")}>
                        ✕
                    </button>
                </div>

                <div className="stock-search-section">
                    <label>{!isFocused ? "Search Stock" : "Click Outside Text Box to fetch price"}</label>
                    <input
                        type="text"
                        className="stock-search-input"
                        placeholder="Enter symbol (e.g., AAPL)"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        onFocus={() => setIsFocused(true)}  
                        onBlur={(e) => {
                            setIsFocused(false);  
                            handleStockSearch(e); 
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
                                className={orderType === 'market' ? 'active' : ''}
                                onClick={() => setOrderType('market')}
                            >
                                Market
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
                            onClick={() => navigate("/portfolio/trade-simulator")}
                        >
                            Cancel
                        </button>
                        <button
                            className="buy-button"
                            onClick={handleBuy}
                            disabled={!selectedStock || !shares || state.cash < (shares * selectedStock?.close)}
                        >
                            Buy {shares || 0} Shares
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </div>
    )
}
export default BuyStock;