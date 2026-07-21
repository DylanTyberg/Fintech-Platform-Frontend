import { useUser } from "../../Contexts/UserContext";
import { useEffect, useState } from "react";
import popularStocks from "../../s&p500stocks.json"
import StockChartCard from "../../Components/StockChartCard/StockChartCard";
import MiniStockCard from "../../Components/MiniStockCard/MiniStockCard";
import "../Watchlist/watchlist.css"
import AIChat from "../../Components/AIChat/AIChat";
import { fetchAuthSession } from "@aws-amplify/core";


const nameBySymbol = popularStocks.reduce((map, stock) => {
    map[stock.Symbol] = stock.Security;
    return map;
}, {});
const nameForSymbol = (symbol) => nameBySymbol[symbol] ?? symbol;

const Watchlist = () => {
    const {state, dispatch} = useUser();

    const [addToWatchlist, setAddToWatchlist] = useState(false);
    const [removeWatchlistDisplay, setRemoveWatchlistDisplay] = useState(false);

    const [stocksToAdd, setStocksToAdd] = useState([]);
    const [filterValue, setFilterValue] = useState("");
    const [filteredStocks, setFilteredStocks] = useState([]);


    const [chartDataMap, setChartDataMap] = useState({});
    const [heroSymbol, setHeroSymbol] = useState(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const newFilteredStocks = popularStocks.filter(stock => stock.Security.toLowerCase().includes(filterValue.toLowerCase()));
        setFilteredStocks(newFilteredStocks);
    }, [filterValue])

    useEffect(() => {
        getData(state.watchlist)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    useEffect(() => {
        if (state.watchlist.length === 0) {
            if (heroSymbol !== null) setHeroSymbol(null);
            return;
        }
        if (!heroSymbol || !state.watchlist.includes(heroSymbol)) {
            setHeroSymbol(state.watchlist[0]);
        }
    }, [state.watchlist, heroSymbol]);

    const getData = async (stocks) => {
        if (!stocks || stocks.length === 0) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/intraday/list`,
                {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify( {stocks} ), 
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            const newEntries = {};
            stocks.forEach((symbol, i) => {
                const rows = result[i] || [];
                newEntries[symbol] = rows.map(({ timestamp, close }) => ({
                    time: Math.floor(new Date(timestamp).getTime() / 1000),
                    value: close,
                }));
            });

            setChartDataMap((prev) => ({ ...prev, ...newEntries }));

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const intradayPut = async (stock) => {
        await fetch(`${process.env.REACT_APP_API_URL}/intraday/request?symbol=${encodeURIComponent(stock)}`,
        { method: "POST" })
    }

    const handleClickStock = (stock) => {
        if (stocksToAdd.includes(stock.Symbol)) return;
        setStocksToAdd([...stocksToAdd, stock.Symbol]);
        intradayPut(stock.Symbol);
    }

    const handleClickStockAdd = async (stock) => {
        if (!stock || stocksToAdd.includes(stock)) return;
        setStocksToAdd([...stocksToAdd, stock]);
        intradayPut(stock);
    }

    const updateDynamo = async (stocks) => {
        for (const stock of stocks) {
            const params = {
                user: state.user.userId,
                type: "watchlist",
                details: stock
                
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
        }
    }

    const handleStocksAdd = (e) => {
        e.preventDefault();
        stocksToAdd.forEach((symbol) => {
            dispatch({ type: "ADD_TO_WATCHLIST", payload: symbol });
        });
        getData(stocksToAdd);
        updateDynamo(stocksToAdd);
        setStocksToAdd([]);
        setAddToWatchlist(false);
    }

    const handleRemoveStock = (remove) => {
        const newList = stocksToAdd.filter(stock => stock !== remove);
        setStocksToAdd(newList);
    }

    const deleteFromWatchlist = async (symbol) => {
        dispatch({type : "REMOVE_FROM_WATCHLIST", payload : symbol})

        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        await fetch(`${process.env.REACT_APP_API_URL}/user/watchlist`, {
            method: 'DELETE',
            headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            user: state.user.userId,
            type: 'watchlist',
            symbol: symbol
            })
        });
        // No reload — state.watchlist already updated via dispatch above,
        // and hero/secondary derive directly from it.
    }

    const secondarySymbols = state.watchlist.filter((symbol) => symbol !== heroSymbol);
    const heroChartData = heroSymbol ? chartDataMap[heroSymbol] : null;

    return (
        <div className="watchlist-page">
            <div className="watchlist-toolbar">
                <button className="watchlist-btn-primary" onClick={() => setAddToWatchlist(true)}>
                    + Add Stocks to Watchlist
                </button>
                <button className="watchlist-btn-secondary" onClick={() => setRemoveWatchlistDisplay(!removeWatchlistDisplay)}>
                    Remove from Watchlist
                </button>
            </div>

            {removeWatchlistDisplay &&
            <div className="delete-watchlist-list">
                {state.watchlist.map((stock) => (
                    <button key={stock} className="delete-watchlist-button" onClick={() => deleteFromWatchlist(stock)}>
                        Delete {stock}
                    </button>
                ))}
            </div>
            }

            {isLoading ? (
                <>
                    <div className="watchlist-skeleton-hero">
                        <div className="skeleton-line" style={{ width: "30%" }} />
                        <div className="skeleton-block" style={{ height: 300 }} />
                    </div>
                    <div className="watchlist-secondary">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="watchlist-skeleton-card">
                                <div className="skeleton-line" style={{ width: "55%" }} />
                                <div className="skeleton-line" style={{ width: "30%", marginTop: 6 }} />
                                <div className="skeleton-block" style={{ height: 28, marginTop: 10 }} />
                            </div>
                        ))}
                    </div>
                </>
            ) : state.watchlist.length === 0 ? (
                <div className="watchlist-empty">
                    <p>You have no saved stocks yet.</p>
                    <button className="watchlist-btn-primary" onClick={() => setAddToWatchlist(true)}>
                        Add your first stock
                    </button>
                </div>
            ) : (
                <>
                    {heroSymbol && heroChartData && (
                        <div className="watchlist-hero">
                            <StockChartCard
                                symbol={heroSymbol}
                                title={nameForSymbol(heroSymbol)}
                                chartData={heroChartData}
                                variant="hero"
                            />
                        </div>
                    )}
                    {secondarySymbols.length > 0 && (
                        <div className="watchlist-secondary">
                            {secondarySymbols.map((symbol) => (
                                <MiniStockCard
                                    key={symbol}
                                    symbol={symbol}
                                    name={nameForSymbol(symbol)}
                                    chartData={chartDataMap[symbol] ?? []}
                                    onClick={() => setHeroSymbol(symbol)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

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
                            placeholder="Search popular stocks or enter symbol and click add" 
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

            <AIChat pageContext="(The User is currently on the watchlist page)"/>
        </div>
    )
}
export default Watchlist;