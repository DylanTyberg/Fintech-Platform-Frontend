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
        <div>
            <div className="input-fields">
                <input className="filter-stocks" type="text" placeholder="Search Popular Stocks" onChange={(e) => {setFilterString(e.target.value)}}/>
                <form className="search-symbol-form" onSubmit={(e) => {e.preventDefault(); navigate(`/stock-details/${searchSymbol}`)}}>
                    <input className="search-symbol" placeholder="Enter Symbol" type="text" onChange={(e) => setSearchSymbol(e.target.value)}/>
                    <button type="submit" className="search-symbol-submit" >Submit</button>
                </form>
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