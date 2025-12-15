import "../Stock-details/stock-details.css"
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import IntradayChart from "../Components/intraday-chart/indraday-chart";
import AIChat from "../Components/AIChat/AIChat";

const StockDetails = () => {
    const {symbol} = useParams();
    const [stockData, setStockData] = useState([])
    const [chartDataDaily, setChartDataDaily] = useState([])
    const [chartDataIntraday, setChartDataIntraday] = useState([])
    const [chartData, setChartData] = useState([])
    
    const [activeChart, setActiveChart] = useState([true, false, false, false]);

    const getDaily = async () => {
        try {
            const response = await fetch(`https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/daily?symbol=${encodeURIComponent(symbol)}`,
               { 
                method: "POST",

               }
            )
            if (response.ok){
                console.log(response);
                try {
                    const result = await fetch(`https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/daily/list`,
                        { 
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ symbols: [symbol] })
                        }
                    )
                    if (result.ok){
                        const data = await result.json();
                        console.log(data.results[0].data)
                        setStockData(data.results[0].data);

                        const sortedData = data.results[0].data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                        
                        const seen = new Set();

                        const newChartData = sortedData.map(({timestamp, close}) => {
                            const date = new Date(timestamp);
                            const day = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                            if (seen.has(day)) return null; // skip duplicates
                            seen.add(day);
                            return { time: day, value: close };
                        }).filter(Boolean);

                        setChartDataDaily(newChartData);
                    }
                
                } catch (error) {

                }
            }
        }
        catch (error){
            //
        }
    }

    const getIntraday = async () => {
           try {
            const response = await fetch(`https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/intraday/request?symbol=${encodeURIComponent(symbol)}`,
               { 
                method: "POST",

               }
            )
            if (response.ok){
                console.log(response);
                try {
                    const result = await fetch(`https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/intraday?symbol=${encodeURIComponent(symbol)}`,
                        { 
                            method: "GET",

                        }
                    )
                    if (result.ok){
                        const data = await result.json();
                        console.log(data);
                        setStockData(data);
                        const newChartData = data.map(({timestamp, close}) => ({
                            time: Math.floor(new Date(timestamp).getTime() / 1000),
                            value: close,
                        }))

                        setChartDataIntraday(newChartData);
                        setChartData(newChartData);
                    }
                
                } catch (error) {

                }
            }
        }
        catch (error){
            //
        }
    }

    

    useEffect(() => {
        getDaily();
        getIntraday();
    }, [])

    const handleChartSwitch = (index) => {
        if (index === 0){
            setChartData(chartDataIntraday)
            setActiveChart([true, false, false, false])
        }
        if (index === 1){
            
            const newChartData = chartDataDaily.slice(-30)
            console.log(newChartData)
            setChartData(newChartData)
            setActiveChart([false, true, false, false])
        } 
        if (index === 2) {
            const newChartData = chartDataDaily.slice(-90)
            setChartData(newChartData)
            setActiveChart([false, false, true, false])
        }
        if (index === 3) {
            const newChartData = chartDataDaily.slice(-250)
            setChartData(newChartData)
            setActiveChart([false, false, false, true])
        }

    }
    return (
        <div className="stock-details-page">
            
            <div className="details-component">
                <div className="details-title-div">
                    <h1>{symbol}</h1>
                    <div className="window-buttons">
                        
                        <button className={activeChart[0] ? "window-toggle-active" : "window-toggle"} onClick={() => handleChartSwitch(0)}>1 Day</button>
                        <button className={activeChart[1] ? "window-toggle-active" : "window-toggle"} onClick={() => handleChartSwitch(1)}>30 Days</button>
                        <button className={activeChart[2] ? "window-toggle-active" : "window-toggle"} onClick={() => handleChartSwitch(2)}>90 Days</button>
                        <button className={activeChart[3] ? "window-toggle-active" : "window-toggle"} onClick={() => handleChartSwitch(3)}>1 Year</button>
                    </div>
                    <div className="placeholder"></div>
                </div>
                <IntradayChart data={chartData} width={800} height={350}/>
                
           </div>
           <div className="ai-agent-div">
                <AIChat pageContext={`(The User is on the stock details page for ${symbol}, Includes charts showing 1 day, 30 day, 90, 1 year)`}/>
            </div>
        </div>
    )
}
export default StockDetails;
