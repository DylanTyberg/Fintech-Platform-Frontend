import "../Sectors/sectors.css"
import StockChartCard from "../../Components/StockChartCard/StockChartCard";
import { useState, useEffect } from "react";
import LoadingSpinner from "../../Components/LoadingPage/LoadingPage";
import AIChat from "../../Components/AIChat/AIChat";

const Sectors = () => {
    const stocks = ["XLK", "XLE", "XLF", "XLV", "XLI", "XLB", "XLU", "XLRE", "XLC", "XLY", "XLP"];
    const [chartData, setChartData] = useState([]);

    const [isLoading, setIsLoading] = useState(true);

    const getData = async () => {
        try {
            setIsLoading(true)
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            


            const allChartData = stocks.map((sym, i) => {
                const data = result[i] || [];
                return data.map(({ timestamp, close }) => ({
                    time: Math.floor(new Date(timestamp).getTime() / 1000),
                    value: close,
                }));
            });

            setChartData(allChartData);


            

            
        } catch (error) {
            console.log(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        getData();
    }, [])

    if (isLoading){
        return <LoadingSpinner message="Loading sector data..."/>
    }
    
    return (
        <div>
            <div className="indices-list">
                {chartData.length > 0 && <StockChartCard symbol={"XLK"} title={"Technology"} chartData={chartData[0]} delay={0}/>}
                {chartData.length > 0 && <StockChartCard symbol={"XLE"} title={"Energy"} chartData={chartData[1]} delay={0}/>}
                {chartData.length > 0 && <StockChartCard symbol={"XLF"} title={"Financials"} chartData={chartData[2]} delay={0}/>}
                {chartData.length > 0 && <StockChartCard symbol={"XLV"} title={"Healthcare" } chartData={chartData[3]} delay={1000}/>}
                {chartData.length > 0 && <StockChartCard symbol={"XLI"} title={"Industrials"} chartData={chartData[4]} delay={1000}/>}
                {chartData.length > 0 && <StockChartCard symbol={"XLB"} title={"Materials"} chartData={chartData[5]} delay={1000}/>}
                {chartData.length > 0 && <StockChartCard symbol={"XLU"} title={"Utilities"} chartData={chartData[6]} delay={2000}/>}
                {chartData.length > 0 && <StockChartCard symbol={"XLRE"} title={"Real Estate"} chartData={chartData[7]} delay={2000}/>}
                {chartData.length > 0 && <StockChartCard symbol={"XLC"} title={"Communication Services"} chartData={chartData[8]} delay={2000}/>}
                {chartData.length > 0 && <StockChartCard symbol={"XLY"} title={"Consumer Discretionary"} chartData={chartData[9]} delay={3000}/>}
                {chartData.length > 0 && <StockChartCard symbol={"XLP"} title={"Consumer Services"} chartData={chartData[10]} delay={3000}/>}
            </div>
            <AIChat pageContext="(The User is currently on sectors page showing all sector etfs)"/>
        </div>
    )
}
export default Sectors;