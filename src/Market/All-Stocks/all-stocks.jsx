import data from "../../s&p500stocks.json"
import "../All-Stocks/all-stocks.css"
import { useState } from "react";
import { useEffect } from "react";

const AllStocks = () => {
    const stocks = data;
    const [filterString, setFilterString] = useState("");
    const [filteredStocks, setFilteredStocks] = useState(stocks);
    
    useEffect(() => {
        const newFilteredStocks = stocks.filter(stock => stock.Security.toLowerCase().includes(filterString.toLowerCase()));
        setFilteredStocks(newFilteredStocks);
    }, [filterString])

    return (
        <div>
            <input type="text" onChange={(e) => {setFilterString(e.target.value)}}/>
            <div className="stocks-list">
                {
                    filteredStocks.map((stock) => (
                        <div className="stock-card">
                            <h1 className="stock-name">{stock.Security}</h1>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}
export default AllStocks;