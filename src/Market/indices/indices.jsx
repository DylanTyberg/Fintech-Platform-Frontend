import { useState, useEffect } from "react";
import IntradayChart from "../../Components/intraday-chart/indraday-chart";
import "../indices/indices.css"
import { Outlet, useNavigate } from "react-router-dom";
import StockChange from "../../Components/stock-change/stock-change";
import StockChartCard from "../../Components/StockChartCard/StockChartCard";
import LoadingSpinner from "../../Components/LoadingPage/LoadingPage";
import AIChat from "../../Components/AIChat/AIChat";

const Indices = () => {
    const date = new Date();

    const [dataSPY, setDataSPY] = useState([]);
    const [dataDIA, setDataDIA] = useState([]);
    const [dataQQQ, setDataQQQ] = useState([]);

    const [chartDataSPY, setChartDataSPY] = useState([]);
    const [chartDataDIA, setChartDataDIA] = useState([]);
    const [chartDataQQQ, setChartDataQQQ] = useState([]);

    const [isLoading, setIsLoading] = useState(true);

    const stocks = ["SPY", "DIA", "QQQ"]

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
            

            console.log("API result:", result);
            
            setDataSPY(result[0])
            setDataDIA(result[1])
            setDataQQQ(result[2])

            const chartSPY = result[0].map(({ timestamp, close }) => ({
                time: Math.floor(new Date(timestamp).getTime() / 1000),
                value: close,
            }));
            console.log(chartSPY[0])
            setChartDataSPY(chartSPY);

            const chartDIA = result[1].map(({ timestamp, close }) => ({
                time: Math.floor(new Date(timestamp).getTime() / 1000),
                value: close,
            }));
            setChartDataDIA(chartDIA);

            const chartQQQ = result[2].map(({ timestamp, close }) => ({
                time: Math.floor(new Date(timestamp).getTime() / 1000),
                value: close,
            }));
            setChartDataQQQ(chartQQQ);

            
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
        return <LoadingSpinner message="Loading index data..." />
    }
    
    return (
        <div >
           
            
            <div className="indices-list">
                <StockChartCard symbol={"SPY"} title={"S&P500"} chartData={chartDataSPY}/>
                <StockChartCard symbol={"DIA"} title={"DOW"} chartData={chartDataDIA}/>
                <StockChartCard symbol={"QQQ"} title={"NASDAQ"} chartData={chartDataQQQ}/>
            </div>
            <AIChat pageContext="(The user is currently on the indecis page showing SPY, DIA, QQQ"/>
        </div>
    )
}

export default Indices;