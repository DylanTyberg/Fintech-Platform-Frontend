import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparklines, SparklinesLine} from 'react-sparklines';
import "../Overview/overview.css"
import StockChange from "../../Components/stock-change/stock-change";

const Overview = () => {
    const [indexData, setIndexData] = useState([]);
    const [sectorData, setSectorData] = useState([]);

    const navigate = useNavigate();

    const namesMap = {
        "SPY" : "S&P500",
        "DIA" : "Dow",
        "QQQ" : "Nasdaq",
        "XLK": "Technology",
        "XLE": "Energy",
        "XLF": "Financials",
        "XLV": "Healthcare",
        "XLI": "Industrials",
        "XLB": "Materials",
        "XLU": "Utilities",
        "XLRE": "Real Estate",
        "XLC": "Communication Services",
        "XLY": "Consumer Discretionary",
        "XLP": "Consumer Services",
        
    }

    const getSparklineData = async () => {
        try {
            const response = await fetch(`https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/intraday/sparkline-market`,
                {
                    method: "GET",
                }
            )
            const result = await response.json();
            console.log(result);
            setIndexData(result.slice(0, 3));
            setSectorData(result.slice(3, 15));
        } catch (error)
        {
            console.log(error)
        }
    }

    useEffect(() => {
        getSparklineData();
    }, [])

    return (
        <div className="overview-page">
            <div className="index-overview">
                <h1 className="overview-header">
                    Indices
                    <Link to="/indices" className="view-all-link">
                        View All →
                    </Link>
                </h1>
                <div className="overview-cards">
                    {indexData.map((stock) => (
                        <div className="stock-overview-card" onClick={() => navigate(`/stock-details/${stock.symbol}`)}>
                            <div className="card-header">
                                <h1 className="card-title">{namesMap[stock.symbol]}</h1>
                                <span className="card-symbol">{stock.symbol}</span>
                            </div>
                            <div className="sparkline">
                                <Sparklines data={stock.prices} width={300} height={90} > 
                                    <SparklinesLine color={stock.percentChange >= 0 ? "#10B981" : "#EF4444"} />
                                </Sparklines>
                            </div>
                            <StockChange percentChange={stock.percentChange}/>
                        </div>
                    ))}
                </div>
            </div>
            <div className="index-overview">
                <h1 className="overview-header">
                    Sectors
                    <Link to="/indices" className="view-all-link">
                        View All →
                    </Link>
                </h1>
                <div className="sector-overview-cards">
                    {sectorData.map((stock) => (
                        <div className="stock-overview-card" onClick={() => navigate(`/stock-details/${stock.symbol}`)}>
                            <div className="card-header">
                                <h1 className="card-title">{namesMap[stock.symbol]}</h1>
                                <span className="card-symbol">{stock.symbol}</span>
                            </div>
                            
                            <div className="sparkline">
                                <Sparklines data={stock.prices} width={300} height={90}> 
                                    <SparklinesLine color={stock.percentChange >= 0 ? "#10B981" : "#EF4444"} />
                                </Sparklines>
                            </div>
                            <StockChange percentChange={stock.percentChange}/>
                        </div>
                    ))}
                </div>
            </div>
        </div>

    )

}
export default Overview;