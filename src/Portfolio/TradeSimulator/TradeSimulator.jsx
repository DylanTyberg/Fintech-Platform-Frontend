import { useUser } from "../../Contexts/UserContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TradeSimulator = () => {
    const {state, dispatch} = useUser();
    
    const navigate = useNavigate();

    

    return (
        <div>
            <div>
                <h1>Total Value</h1>
                <h1>Cash Balance</h1>
            </div>
            <div>
                <button onClick={() => navigate("buy")}>Buy</button>
                <button onClick={() => navigate("Sell")}> Sell</button>
            </div>
            <div>
                <table>
                    <th>
                        <td>Symbol</td>
                        <td>Quantity</td>
                        <td>Value</td>
                        <td>Change</td>
                        <td>Gain</td>
                    </th>
                </table>
            </div>
            <div>

            </div>
            
        </div>
    )
}
export default TradeSimulator;