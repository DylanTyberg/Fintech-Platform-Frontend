import { useUser } from "../../Contexts/UserContext";
import { useEffect, useState } from "react";
import popularStocks from "../../s&p500stocks.json"
import StockChartCard from "../../Components/StockChartCard/StockChartCard";

const Watchlist = () => {
    const {state, dispatch} = useUser();

    const [addToWatchlist, setAddToWatchlist] = useState(false);
    const [stocksToAdd, setStocksToAdd] = useState([]);
    const [filterValue, setFilterValue] = useState("");
    const [filteredStocks, setFilteredStocks] = useState([]);

    const [chartData, setChartData] = useState([]);

    const [watchlistData, setWatchlistData] = useState([]);

    useEffect(() => {
        const newFilteredStocks = popularStocks.filter(stock => stock.Security.toLowerCase().includes(filterValue.toLowerCase()));
        setFilteredStocks(newFilteredStocks);
    }, [filterValue])

    useEffect(() => {
        getData(state.watchlist)
    }, [])

    const getData = async (stocks) => {
        console.log("stocks", stocks)
        console.log(state.watchlist)
        try {
            const response = await fetch(
                "https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/intraday/list",
                {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify( {stocks} ), // wraps it in { stocks: [...] }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(result);
            const allChartData = stocks.map((sym, i) => {
                dispatch({type : "ADD_TO_WATCHLIST", payload : sym})
                const data = result[i] || [];
                return data.map(({ timestamp, close }) => ({
                    time: Math.floor(new Date(timestamp).getTime() / 1000),
                    value: close,
                }));
            });
            console.log([...chartData, ...allChartData])
            setChartData([...chartData, ...allChartData]);

        } catch (error) {
            console.error(error);
        }
    }

    const handleClickStock = (stock) => {
        const newList = stocksToAdd;
        setStocksToAdd([...newList, stock.Symbol]);
    }

    const handleStocksAdd =  (e) => {
        e.preventDefault();
        getData(stocksToAdd);

    }

    return (
        <div>
            {state.watchlist.length === 0 &&
            <h1>You have no saved stocks</h1>}
            <div className="indices-list">
                {chartData.map((data, i) => (
                    <StockChartCard symbol={state.watchlist[i]} title={state.watchlist[i]} chartData={data}/>
                ))}
            </div>
            <button onClick={() => setAddToWatchlist(true)}>Add Stocks to Watchlist</button>
            <div>
                {addToWatchlist && 
                <form onSubmit={handleStocksAdd}>
                    <h1>Add Stocks</h1>
                    {stocksToAdd.map((stock) => (
                        <div>
                            <h1>{stock}</h1>
                        </div>
                    ))}
                    <input placeholder="Search Populer stocks or enter symbol and submit" onChange={(e) => setFilterValue(e.target.value)}/>
                    <button >Add</button>
                    {filterValue.length > 1 && filteredStocks.map((stock) => (
                        <div onClick={() => handleClickStock(stock)}>
                            <h1>{stock.Security}</h1>
                        </div>
                    ))}
                    <button type="submit">Save</button>
                </form>
                }
            </div>
        </div>
    )
}
export default Watchlist;