import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import IntradayChart from "../intraday-chart/indraday-chart";
import StockChange from "../stock-change/stock-change";

const StockChartCard = ({className = "chart-card", symbol, title, delay = 0, chartData}) => {
    const [change, setChange] = useState(0)
    const [date, setDate] = useState([])

    const navigate = useNavigate();


    useEffect(() => {

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
                    <IntradayChart  data={chartData} />
                </div>
            </div>
    )

}
export default StockChartCard;