import { useUser } from "../../Contexts/UserContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../TradeSimulator/TradeSimulator.css"

const TradeSimulator = () => {
    const {state, dispatch} = useUser();
    
    const navigate = useNavigate();

    const [introForm, setIntroForm] = useState(state.cash === 0);
    const [cashValue, setCashValue] = useState("");


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
                <h1 className="simulator-total-value">{/*temporary*/}{state.cash}</h1>
                <h1 className="simulator-cash-value">Cash: {state.cash}</h1>
            </div>
            <div className="trade-buttons">
                <button onClick={() => navigate("buy")}>Buy</button>
                <button onClick={() => navigate("Sell")}> Sell</button>
            </div>
            <div>
                <table className="holdings-table">
                    <thead>
                        <tr className="holdings-header">
                            <th className="holdings-data">Symbol</th>
                            <th className="holdings-data">Quantity</th>
                            <th className="holdings-data">Value</th>
                            <th className="holdings-data">Change</th>
                            <th className="holdings-data">Gain</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="holdings-row">
                            <td className="holdings-data">AAPL</td>
                            <td className="holdings-data">10</td>
                            <td className="holdings-data">$1,500</td>
                            <td className="holdings-data">+2.5%</td>
                            <td className="holdings-data positive">+$50</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div>

            </div>
            
        </div>
    )
}
export default TradeSimulator;