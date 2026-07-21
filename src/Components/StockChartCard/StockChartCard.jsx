import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import IntradayChart from "../intraday-chart/indraday-chart";
import StockChange from "../stock-change/stock-change";

const formatPrice = (value) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// variant="hero" for the one featured chart, "secondary" (default) for
// the smaller ones below it.
const StockChartCard = ({ symbol, title, chartData, variant = "secondary" }) => {
    const [change, setChange] = useState(0);
    const navigate = useNavigate();

    const isHero = variant === "hero";
    const chartHeight = isHero ? 340 : 200;
    const price = chartData.length ? chartData[chartData.length - 1].value : null;

    useEffect(() => {
        if (chartData[0]) {
            const firstValue = chartData[0].value;
            const lastValue = chartData[chartData.length - 1].value;
            setChange(((lastValue - firstValue) / firstValue) * 100);
        }
    }, [chartData]);

    return (
        <div
            className={`indices-stock-chart${isHero ? " indices-stock-chart--hero" : ""}`}
            onClick={() => navigate(`/stock-details/${symbol}`)}
        >
            <div className="chart-card-head">
                <div>
                    <h1 className={`chart-title${isHero ? " chart-title--hero" : ""}`}>{title}</h1>
                    <span className="chart-symbol mono">{symbol}</span>
                </div>
                <StockChange percentChange={change} />
            </div>
            {price != null && (
                <div className={`num chart-price${isHero ? " chart-price--hero" : ""}`}>
                    ${formatPrice(price)}
                </div>
            )}
            <div className="chart" style={{ height: chartHeight }}>
                <IntradayChart data={chartData} height={chartHeight} />
            </div>
        </div>
    );
};

export default StockChartCard;