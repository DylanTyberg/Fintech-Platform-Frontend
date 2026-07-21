import data from "../../s&p500stocks.json"
import "../All-Stocks/all-stocks.css"
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Shown when the search box is empty/short — a handful of widely
// recognized names instead of all 500 constituents at once.
const NOTABLE_SYMBOLS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
    "JPM", "V", "MA", "WMT", "HD", "DIS", "NFLX", "KO",
];
const MIN_SEARCH_LENGTH = 3;
const MAX_RESULTS = 24;

const SearchStocks = () => {
    const stocks = data;
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    const notableStocks = useMemo(
        () => NOTABLE_SYMBOLS.map((symbol) => stocks.find((s) => s.Symbol === symbol)).filter(Boolean),
        [stocks]
    );

    const trimmedQuery = query.trim();
    const isSearching = trimmedQuery.length >= MIN_SEARCH_LENGTH;

    const matches = useMemo(() => {
        if (!isSearching) return [];
        const q = trimmedQuery.toLowerCase();
        return stocks.filter(
            (stock) =>
                stock.Symbol.toLowerCase().includes(q) ||
                stock.Security.toLowerCase().includes(q)
        );
    }, [stocks, trimmedQuery, isSearching]);

    const visibleResults = isSearching ? matches.slice(0, MAX_RESULTS) : notableStocks;


    const handleDirectSearch = (e) => {
        e.preventDefault();
        const symbol = trimmedQuery.toUpperCase();
        if (symbol) {
            navigate(`/stock-details/${symbol}`);
        }
    };

    return (
        <div className="search-stocks-page">
            <form className="search-bar" onSubmit={handleDirectSearch}>
                <input
                    className="search-input"
                    type="text"
                    placeholder="Search by symbol or company name..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
                <button type="submit" className="search-submit">Go</button>
            </form>

            <div className="search-stocks-meta">
                {isSearching ? (
                    matches.length > 0 ? (
                        <span>
                            {matches.length} match{matches.length === 1 ? "" : "es"} for "{trimmedQuery}"
                            {matches.length > MAX_RESULTS ? ` — showing first ${MAX_RESULTS}` : ""}
                        </span>
                    ) : (
                        <span>
                            No matches for "{trimmedQuery}". Press Enter to look up {trimmedQuery.toUpperCase()} directly.
                        </span>
                    )
                ) : (
                    <span>Popular stocks — type at least {MIN_SEARCH_LENGTH} characters to search all 500</span>
                )}
            </div>

            <div className="stocks-list">
                {visibleResults.map((stock) => (
                    <button
                        key={stock.Symbol}
                        type="button"
                        className="stock-card"
                        onClick={() => navigate(`/stock-details/${stock.Symbol}`)}
                    >
                        <div className="stock-card-head">
                            <span className="stock-symbol mono">{stock.Symbol}</span>
                        </div>
                        <h3 className="stock-name">{stock.Security}</h3>
                    </button>
                ))}
            </div>
        </div>
    )
}
export default SearchStocks;