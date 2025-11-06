import "../Sectors/sectors.css"
import StockChartCard from "../../Components/StockChartCard/StockChartCard";
import { useState, useEffect } from "react";

const Sectors = () => {
    const stocks = ["XLK", "XLE", "XLF", "XLV", "XLI", "XLB", "XLU", "XLRE", "XLC", "XLY", "XLP"];
    const [chartData, setChartData] = useState([]);

    const getData = async () => {
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
            

            console.log("API result:", result);
            console.log(result[0][0])
            console.log(result[1][0])
            console.log(result[2][0])
            console.log(result[3][0])
            console.log(result[4][0])
            console.log(result[5][0])
            console.log(result[6][0])
            console.log(result[7][0])
            console.log(result[8][0])
            console.log(result[9][0])
            console.log(result[10][0])


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
        }
    }

    useEffect(() => {
        getData();
    }, [])
    
    return (
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
    )
}
export default Sectors;