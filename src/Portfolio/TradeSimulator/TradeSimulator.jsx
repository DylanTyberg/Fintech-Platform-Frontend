import { useUser } from "../../Contexts/UserContext";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../TradeSimulator/TradeSimulator.css"
import LoadingSpinner from "../../Components/LoadingPage/LoadingPage";
import ReactMarkdown from 'react-markdown'
import { useAI } from "../../Contexts/AIContext";
import AIChat from "../../Components/AIChat/AIChat";

const TradeSimulator = () => {
    const {state, dispatch} = useUser();
    const { askAI, conversationHistory, isAILoading } = useAI();

    
    const navigate = useNavigate();

    const [introForm, setIntroForm] = useState(state.cash === 0);
    const [cashValue, setCashValue] = useState("");

    const [priceInfo, setPriceInfo] = useState([]);
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [insightSummary, setInsightSummary] = useState("");

    const [isLoading, setIsLoading] = useState(true);

    const getPriceInfo = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(
                    "https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/intraday/holdings-prices",
                    {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ holdings: state.holdings }), 
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                console.log("price info", result);
                setPriceInfo(result);
                
                const holdingsValue = state.holdings.reduce((total, holding) => {
                    const info = result.find(item => item.symbol === holding.symbol);
                    const currentPrice = info?.lastPrice.close || 0;
                    console.log("current", currentPrice)
                    return total + (holding.quantity * currentPrice);
                }, 0);
                console.log("holdings val", holdingsValue)
                const totalPortfolioValue = holdingsValue + state.cash;
                setPortfolioValue(totalPortfolioValue.toFixed(2));

            } catch (error)
            {
                console.log(error);
            } finally {
                setIsLoading(false)
            }
    }

    const getPortfolioInsight = async () => {
        try {
            
            const response = await fetch(
                    `https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/ai-insight/portfolio-summary?userId=${state.user.userId}`,
                    {
                    method: "GET",
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                console.log(result.summary);
                return result.summary
        } catch (error) {
            console.log(error)
        }
    }
    

    useEffect(() => {
        getPriceInfo();
    }, [state.holdings, state.cash])

    const isfetchingRef = useRef(false);

    useEffect(() => {
        if (isfetchingRef.current) return; // Skip if already fetching
        
        isfetchingRef.current = true;
        
        const fetchInsight = async () => {
            try {
                const insight = await getPortfolioInsight();
                setInsightSummary(insight);
            } finally {
                isfetchingRef.current = false; // Reset when done
            }
        };
        
        fetchInsight();
    }, [state.holdings, state.cash])


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


        } catch (error) {
            console.log(error);
        }
    }

    if (isLoading) {
        return <LoadingSpinner message="Loading Portfolio Details..."/>
    }
    

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
            <div className="simulator-values">
                <h1 className="simulator-total-value">${Number(portfolioValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
                <h1 className="simulator-cash-value">Cash: ${Number(state.cash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
            </div>
            <div className="trade-buttons">
                <button onClick={() => navigate("buy")}>Buy</button>
                <button onClick={() => navigate("sell")}> Sell</button>
            </div>
            <div>
                <table className="holdings-table">
                <thead>
                    <tr className="holdings-header">
                        <th className="holdings-data">Symbol</th>
                        <th className="holdings-data">Quantity</th>
                        <th className="holdings-data">Share Value</th>
                        <th className="holdings-data">Today's Change</th>
                        <th className="holdings-data">Total Value</th>
                    </tr>
                </thead>
                <tbody>
                    {state.holdings.map((holding) => (
                        <tr className="holdings-row">
                            <td className="holdings-data">{holding.symbol}</td>
                            <td className="holdings-data">{holding.quantity}</td>
                            <td className="holdings-data">${priceInfo.length > 0 && priceInfo.find(info => info.symbol === holding.symbol).lastPrice.close.toFixed(2)}</td>
                            <td className={`holdings-data ${priceInfo.find(info => info.symbol === holding.symbol)?.change >= 0 ? 'positive' : 'negative'}`}>
                            {priceInfo.length > 0 && priceInfo.find(info => info.symbol === holding.symbol)?.change >= 0 && '+'}
                            {priceInfo.length > 0 && priceInfo.find(info => info.symbol === holding.symbol)?.change}%
                            </td>
                            <td className="holdings-data">${(holding.quantity * (priceInfo.length > 0 && priceInfo.find(info => info.symbol === holding.symbol).lastPrice.close.toFixed(2))).toFixed(2)}</td>
                        </tr>
                    ))}
                    
                </tbody>
            </table>
            </div>
            <div>

            </div>
            {/* <div className="ai-insights">
                <h1 className="ai-insights-header">AI Assistant</h1>
                <div className="insight-option-buttons">
                    <button className="insight-option-button">What Stocks Should I Buy</button>
                    <button className="insight-option-button">What Stocks Should I Sell</button>

                </div>
                
            </div>
            <div className="ai-insights">
                 <h1 className="ai-insights-header">AI Assistant</h1>
                <div className="insight-text">
                   
                    <ReactMarkdown>{insightSummary}</ReactMarkdown>
                </div>
            </div> */}
            <AIChat pageContext="(The User is currently on the trade simulator page)"/>
            
            
        </div>
    )
}
export default TradeSimulator;