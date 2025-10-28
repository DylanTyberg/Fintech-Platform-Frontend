import { useState, useEffect } from "react";
import IntradayChart from "../../Components/intraday-chart/indraday-chart";
import "./indices.css"
import { Outlet } from "react-router-dom";

const Indices = () => {
    
    const [spIntraday, setSpIntraday] = useState([])
    const [dowIntraday, setDowIntraday] = useState([])
    const [nasdqaIntraday, setNasdaqIntraday] = useState([])

    const [spChartData, setSpChartData] = useState([])
    const [dowChartData, setDowChartData] = useState([])
    const [nasdaqChartData, setNasdaqChartData] = useState([])

    const [date, setDate] = useState(new Date());

    const getIntraday = async (symbol) => {

        try {
            const response = await fetch(`https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/intraday?symbol=${encodeURIComponent(symbol)}`,
               { 
                method: "GET",
               }
            )
            if (!response.ok){
                 throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
           // console.log("API result:", result);
            
            return result;
            
        } catch (error) {
            console.log(error.message)
        }
    }

    useEffect(() => {
        const fetchSPY = async () => {
            const data = await getIntraday("SPY");
            if (data) {
                setSpIntraday(data);
                const chartData = data.map(({timestamp, close}) => ({
                    time: Math.floor(new Date(timestamp).getTime() / 1000),
                    value: close,
                }))
                setSpChartData(chartData);
                setDate(new Date(data[0].timestamp));
            }
        };

        const fetchDOW = async () => {
            const data = await getIntraday("DIA");
            if (data) {
                setDowIntraday(data);
                const chartData = data.map(({timestamp, close}) => ({
                    time: Math.floor(new Date(timestamp).getTime() / 1000),
                    value: close,
                }))
                setDowChartData(chartData);
            }
        };

        const fetchNasdaq = async () => {
            const data = await getIntraday("QQQ");
            if (data) {
                setNasdaqIntraday(data);
                const chartData = data.map(({timestamp, close}) => ({
                    time: Math.floor(new Date(timestamp).getTime() / 1000),
                    value: close,
                }))
                setNasdaqChartData(chartData);
            }
        };

        fetchSPY();
        fetchDOW();
        fetchNasdaq();

        
    }, []);

    
    return (
        <div>
            <h1 className="chart-date">{date.toLocaleDateString("en-US", { month: "long", day: "numeric", weekday: "long"})}</h1>
            <div className="indices-list">
                <div className="indices-stock-chart">
                    <div className="title-date">
                        <h1 className="chart-title">S&P500</h1>
                       
                    </div>
                    <div className="chart">
                        <IntradayChart className="chart" data={spChartData}/>
                    </div>
                </div>
                <div className="indices-stock-chart">
                    <div className="title-date">
                        <h1 className="chart-title">DOW</h1>
                       
                    </div>
                    <div className="chart">
                        <IntradayChart className="chart" data={dowChartData}/>
                    </div>
                </div>
                <div className="indices-stock-chart">
                    <div className="title-date">
                        <h1 className="chart-title">NASDAQ</h1>
                      
                    </div>
                    <div className="chart">
                        <IntradayChart  data={nasdaqChartData}/>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Indices;