import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import IntradayChart from "../intraday-chart/indraday-chart";
import StockChange from "../stock-change/stock-change";

const StockChartCard = ({symbol, title, delay = 0, chartData}) => {
    const [change, setChange] = useState(0)
    const [date, setDate] = useState([])

    const navigate = useNavigate();

    // const getIntraday = async (symbol) => {

    //     try {
    //         const response = await fetch(`https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/intraday?symbol=${encodeURIComponent(symbol)}`,
    //            { 
    //             method: "GET",
    //            }
    //         )
    //         if (!response.ok){
    //              throw new Error(`HTTP error! status: ${response.status}`);
    //         }
    //         const result = await response.json();
    //        // console.log("API result:", result);
            
    //         return result;
            
    //     } catch (error) {
    //         console.log(error.message)
    //     }
    // }

    useEffect(() => {
        // const timer = setTimeout(() => {
        //     const fetchSymbol = async () => {
        //         const data = await getIntraday(symbol);
        //         if (data) {
        //             setIntradayData(data);
        //             const chart = data.map(({ timestamp, close }) => ({
        //                 time: Math.floor(new Date(timestamp).getTime() / 1000),
        //                 value: close,
        //             }));
        //             setChartData(chart);
        //             setChange(((chart[chart.length - 1].value - chart[0].value) / chart[chart.length - 1].value) * 100);
        //             setDate(new Date(data[0].timestamp));
        //         }
        //     };
        //     fetchSymbol();
        // }, delay);

        // return () => clearTimeout(timer);
        console.log("chartdata", chartData[0]);
        if (chartData[0]) {
            setChange(((chartData[chartData.length - 1].value - chartData[0].value) / chartData[chartData.length - 1].value) * 100);
            setDate(new Date(chartData[0].timestamp));
        }
    }, [chartData]);

    return (
        <div className="indices-stock-chart" onClick={() => {navigate(`/stock-details/${symbol}`)}}>
            <div className="title-date">
                <h1 className="chart-title">{title}</h1>
                <StockChange 
                className="index-page-change"
                percentChange={change}
                />
            </div>
            <div className="chart">
                <IntradayChart  data={chartData} width={450} height={250}/>
            </div>
        </div>
    )

}
export default StockChartCard;