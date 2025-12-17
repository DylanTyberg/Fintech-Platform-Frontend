import data from "../../s&p500stocks.json"
import "../All-Stocks/all-stocks.css"
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AllStocks = () => {
    const stocks = data;
    const [filterString, setFilterString] = useState("");
    const [searchSymbol, setSearchSymbol] = useState("");
    const [filteredStocks, setFilteredStocks] = useState(stocks);
    const navigate = useNavigate(); 

    useEffect(() => {
        const newFilteredStocks = stocks.filter(stock => stock.Security.toLowerCase().includes(filterString.toLowerCase()));
        setFilteredStocks(newFilteredStocks);
    }, [filterString])

    return (
        <div className="all-stocks-page">
            <div className="input-fields">
                <input className="filter-stocks" type="text" placeholder="Filter Popular Stocks or enter symbol and submit" onChange={(e) => {setFilterString(e.target.value)}}/>
                
                <button type="submit" className="search-symbol-submit" onClick={(e) => {e.preventDefault(); navigate(`/stock-details/${filterString}`)}} >Submit</button>
            </div>
            <div className="stocks-list">
                {
                    filteredStocks.map((stock) => (
                        <div className="stock-card" onClick={() => {navigate(`/stock-details/${stock.Symbol}`); console.log(stock.Symbol)}}>
                            <h1 className="stock-symbol">{stock.Symbol}</h1>
                            <h1 className="stock-name">{stock.Security}</h1>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}
export default AllStocks;