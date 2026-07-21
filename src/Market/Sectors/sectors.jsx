import "../Sectors/sectors.css"
import StockChartCard from "../../Components/StockChartCard/StockChartCard";
import MiniStockCard from "../../Components/MiniStockCard/MiniStockCard";
import { useState, useEffect } from "react";
import AIChat from "../../Components/AIChat/AIChat";

const SECTORS = [
    { symbol: "XLK", name: "Technology" },
    { symbol: "XLE", name: "Energy" },
    { symbol: "XLF", name: "Financials" },
    { symbol: "XLV", name: "Healthcare" },
    { symbol: "XLI", name: "Industrials" },
    { symbol: "XLB", name: "Materials" },
    { symbol: "XLU", name: "Utilities" },
    { symbol: "XLRE", name: "Real Estate" },
    { symbol: "XLC", name: "Communication Services" },
    { symbol: "XLY", name: "Consumer Discretionary" },
    { symbol: "XLP", name: "Consumer Services" },
];

const nameForSymbol = (symbol) => SECTORS.find((s) => s.symbol === symbol)?.name ?? symbol;

const Sectors = () => {
    const [chartDataMap, setChartDataMap] = useState({});
    const [heroSymbol, setHeroSymbol] = useState(SECTORS[0].symbol);
    const [isLoading, setIsLoading] = useState(true);

    const getData = async () => {
        try {
            setIsLoading(true)
            const symbols = SECTORS.map((s) => s.symbol);
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/intraday/list`,
                {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify( {stocks: symbols} ), 
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            const newEntries = {};
            symbols.forEach((symbol, i) => {
                const rows = result[i] || [];
                newEntries[symbol] = rows.map(({ timestamp, close }) => ({
                    time: Math.floor(new Date(timestamp).getTime() / 1000),
                    value: close,
                }));
            });

            setChartDataMap(newEntries);

        } catch (error) {
            //console.log(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        getData();
    }, [])

    const heroChartData = chartDataMap[heroSymbol];
    const secondarySectors = SECTORS.filter((s) => s.symbol !== heroSymbol);

    return (
        <div className="sectors-page">
            {isLoading ? (
                <>
                    <div className="sectors-skeleton-hero">
                        <div className="skeleton-line" style={{ width: "30%" }} />
                        <div className="skeleton-block" style={{ height: 340 }} />
                    </div>
                    <div className="sectors-secondary">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="sectors-skeleton-card">
                                <div className="skeleton-line" style={{ width: "55%" }} />
                                <div className="skeleton-line" style={{ width: "30%", marginTop: 6 }} />
                                <div className="skeleton-block" style={{ height: 28, marginTop: 10 }} />
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {heroChartData && (
                        <div className="sectors-hero">
                            <StockChartCard
                                symbol={heroSymbol}
                                title={nameForSymbol(heroSymbol)}
                                chartData={heroChartData}
                                variant="hero"
                            />
                        </div>
                    )}
                    <div className="sectors-secondary">
                        {secondarySectors.map((sector) => (
                            <MiniStockCard
                                key={sector.symbol}
                                symbol={sector.symbol}
                                name={sector.name}
                                chartData={chartDataMap[sector.symbol] ?? []}
                                onClick={() => setHeroSymbol(sector.symbol)}
                            />
                        ))}
                    </div>
                </>
            )}
            <AIChat pageContext="(The user is currently on the sectors page showing all sector ETFs)"/>
        </div>
    )
}
export default Sectors;