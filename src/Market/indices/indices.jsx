import { useState, useEffect } from "react";
import IntradayChart from "../../Components/intraday-chart/indraday-chart";
import "./indices.css"
import { Outlet, useNavigate } from "react-router-dom";
import StockChange from "../../Components/stock-change/stock-change";
import StockChartCard from "../../Components/StockChartCard/StockChartCard";

const Indices = () => {
    const date = new Date();
    
    return (
        <div>
            <h1 className="chart-date">{date.toLocaleDateString("en-US", { month: "long", day: "numeric", weekday: "long"})}</h1>
            
            <div className="indices-list">
                <StockChartCard symbol={"SPY"} title={"S&P500"}/>
                <StockChartCard symbol={"DIA"} title={"DOW"}/>
                <StockChartCard symbol={"QQQ"} title={"NASDAQ"}/>
            </div>
        </div>
    )
}

export default Indices;