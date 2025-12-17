import { useUser } from "../../Contexts/UserContext";
import { useEffect, useState } from "react";
import popularStocks from "../../s&p500stocks.json"
import StockChartCard from "../../Components/StockChartCard/StockChartCard";
import "../Watchlist/watchlist.css"
import LoadingSpinner from "../../Components/LoadingPage/LoadingPage";
import AIChat from "../../Components/AIChat/AIChat";

const Watchlist = () => {
    const {state, dispatch} = useUser();

    const [addToWatchlist, setAddToWatchlist] = useState(false);
    const [removeWathclistDisplay, setRemoveWathlistDisplay] = useState(false);

    const [stocksToAdd, setStocksToAdd] = useState([]);
    const [filterValue, setFilterValue] = useState("");
    const [filteredStocks, setFilteredStocks] = useState([]);

    const [chartData, setChartData] = useState([]);

    const [isLoading, setIsLoading] = useState(true);

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
            setIsLoading(true);
            const response = await fetch(
                "https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/intraday/list",
                {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify( {stocks} ), 
                }
            );

            if (!response.ok) {
                
                 
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
        } finally {
            setIsLoading(false);
        }
    }

    const handleClickStock = (stock) => {
        const newList = stocksToAdd;
        setStocksToAdd([...newList, stock.Symbol]);
    }
    const handleClickStockAdd = async (stock) => {
        const newList = stocksToAdd;
        setStocksToAdd([...newList, stock]);
        intradayPut(stock);
        
        
    }
    const intradayPut = async (stock) => {
        const response = await fetch(`https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/intraday/request?symbol=${encodeURIComponent(stock)}`,
        { 
            method: "POST",

        })
    }

    const updateDynamo = async (stocks) => {
        for (const stock of stocks) {
            const params = {
                user: state.user.userId,
                type: "watchlist",
                details: stock
                
            }
            //console.log("symbol", stock);

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
        }
    }

    const handleStocksAdd =  (e) => {
        e.preventDefault();
        getData(stocksToAdd);
        updateDynamo(stocksToAdd);
        setAddToWatchlist(false);

    }
    

    const handleRemoveStock = (remove) => {
        const newList = stocksToAdd.filter(stock => stock !== remove);
        setStocksToAdd(newList);
    }

    const deleteFromWatchlist = async (symbol) => {
        dispatch({type : "REMOVE_FROM_WATCHLIST", payload : symbol})
        console.log("dispatch ran")

        const response = await fetch('https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/user/watchlist', {
            method: 'DELETE',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            user: state.user.userId,
            type: 'watchlist',
            symbol: symbol
            })
        });
        console.log(response.json())
        window.location.reload();
        
        
    }

    if (isLoading) {
        return <LoadingSpinner message="Loading watchlisted stocks..." />
    }

    return (
        <div>
        <div className="watchlist-container">
            {state.watchlist.length === 0 && (
                <h1>You have no saved stocks</h1>
            )}
            <div className="watchlist-buttons">
                <button className="add-to-watchlist-button" onClick={() => setAddToWatchlist(true)}>Add Stocks to Watchlist</button>
                <button className="add-to-watchlist-button" onClick={() => {setRemoveWathlistDisplay(!removeWathclistDisplay)}}>Remove From Watchlist</button>

            </div>
            {removeWathclistDisplay && 
            <div className="delete-watchlist-list">
                {state.watchlist.map((stock) => (
                    <button className="delete-watchlist-button" onClick={() => deleteFromWatchlist(stock)}>Delete {stock}</button>
                ))}
            </div>
            }
            <div className="indices-list">
                {chartData.map((data, i) => (
                    <StockChartCard 
                        key={state.watchlist[i]} 
                        symbol={state.watchlist[i]} 
                        title={state.watchlist[i]} 
                        chartData={data}
                    />
                ))}
            </div>
            
         
            
            {addToWatchlist && (
                <div className="form-backdrop" onClick={(e) => {
                    if (e.target.className === 'form-backdrop') {
                        setAddToWatchlist(false);
                    }
                }}>
                    <form className="add-stocks-form" onSubmit={handleStocksAdd} onClick={(e) => e.stopPropagation()}>
                        <h1 className="add-stocks-button">Add Stocks</h1>
                        <div className="stocks-to-add">
                            {stocksToAdd.map((stock) => (
                                <div key={stock} className="stock-form-card">
                                    <h1>{stock}</h1>
                                    <button 
                                        type="button"
                                        className="remove-stock-btn"
                                        onClick={() => handleRemoveStock(stock)}
                                        aria-label={`Remove ${stock}`}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input 
                            className="search-add-stocks" 
                            placeholder="Search Popular stocks or enter symbol and submit" 
                            onChange={(e) => setFilterValue(e.target.value)}
                        />
                        <button className="add-button" type="button" onClick={() => handleClickStockAdd(filterValue.toUpperCase())}>Add</button>
                        <div className="filtered-stocks-list">
                            {filterValue.length > 1 && filteredStocks.map((stock) => (
                                <div 
                                    key={stock.Security} 
                                    className="stock-form-card" 
                                    onClick={() => handleClickStock(stock)}
                                >
                                    <h1>{stock.Security}</h1>
                                </div>
                            ))}
                        </div>
                        <button className="form-save-button" type="submit">Save</button>
                    </form>
                </div>
             )}
             
        </div>
            <div className="ai-chat-div">
                <AIChat pageContext="(The User is currently on the watchlist page)"/>
            </div>
        </div>
            )
}
export default Watchlist;