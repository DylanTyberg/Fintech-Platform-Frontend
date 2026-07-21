import { useState, useEffect } from "react";
import "../indices/indices.css"
import StockChartCard from "../../Components/StockChartCard/StockChartCard";
import AIChat from "../../Components/AIChat/AIChat";

const Indices = () => {
    const [chartDataSPY, setChartDataSPY] = useState([]);
    const [chartDataDIA, setChartDataDIA] = useState([]);
    const [chartDataQQQ, setChartDataQQQ] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const stocks = ["SPY", "DIA", "QQQ"];

    const toChartData = (rows) =>
        rows.map(({ timestamp, close }) => ({
            time: Math.floor(new Date(timestamp).getTime() / 1000),
            value: close,
        }));

    const getData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/intraday/list`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stocks }),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            setChartDataSPY(toChartData(result[0]));
            setChartDataDIA(toChartData(result[1]));
            setChartDataQQQ(toChartData(result[2]));
        } catch (error) {
            //console.log(error.message)
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    return (
        <div className="indices-page">
            {isLoading ? (
                <>
                    <div className="indices-skeleton-hero">
                        <div className="skeleton-line" style={{ width: "30%" }} />
                        <div className="skeleton-block" style={{ height: 340 }} />
                    </div>
                    <div className="indices-secondary">
                        {[...Array(2)].map((_, i) => (
                            <div className="indices-skeleton-card" key={i}>
                                <div className="skeleton-line" style={{ width: "40%" }} />
                                <div className="skeleton-block" style={{ height: 200 }} />
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="indices-hero">
                        <StockChartCard symbol="SPY" title="S&P 500" chartData={chartDataSPY} variant="hero" />
                    </div>
                    <div className="indices-secondary">
                        <StockChartCard symbol="DIA" title="Dow Jones" chartData={chartDataDIA} />
                        <StockChartCard symbol="QQQ" title="Nasdaq" chartData={chartDataQQQ} />
                    </div>
                </>
            )}
            <AIChat pageContext="(The user is currently on the indices page showing SPY, DIA, QQQ)" />
        </div>
    );
};

export default Indices;