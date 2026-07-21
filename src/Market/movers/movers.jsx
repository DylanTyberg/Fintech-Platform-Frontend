import "../movers/movers.css";
import { useEffect, useState } from "react";
import StockChange from "../../Components/stock-change/stock-change";
import { useNavigate } from "react-router-dom";

const Movers = () => {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const isMarketOpen = () => {
    const now = new Date();
    const options = { timeZone: "America/New_York", hour12: false };
    const timeString = now.toLocaleTimeString("en-US", options);
    const [hour, minute] = timeString.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;

    const open = 9 * 60 + 30;   // 9:30 AM ET
    const afterHours = 20 * 60; // 8:00 PM ET

    return totalMinutes >= open && totalMinutes <= afterHours;
  };

  const getMovers = async () => {
    try {
      setIsLoading(true);
      if (isMarketOpen()) {
        const postResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/movers`,
          { method: "POST" }
        );

        if (!postResponse.ok) {
          console.error("POST failed:", postResponse.status, postResponse.statusText);
          return;
        }
      }

      const getResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/movers`
      );

      if (!getResponse.ok) {
        console.error("GET failed:", getResponse.status, getResponse.statusText);
        return;
      }

      const data = await getResponse.json();

      setGainers(data.filter(stock => stock.direction === "gainers"));
      setLosers(data.filter(stock => stock.direction === "losers"));

    } catch (error) {
      console.error("Error fetching movers:", error);
    } finally{
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getMovers();
  }, []);

 
  const maxMagnitude = (list) =>
    list.reduce((max, stock) => Math.max(max, Math.abs(stock.percentChange)), 0) || 1;

  const renderColumn = (title, list, tone) => {
    const max = maxMagnitude(list);
    return (
      <div className="movers-panel">
        <div className="movers-panel-head">
          <h3>{title}</h3>
          <span className="movers-count">{list.length}</span>
        </div>
        <div className="movers-list-scroll">
          <table className="movers-table">
            <tbody>
              {list.map((stock, i) => (
                <tr
                  key={stock.symbol}
                  className="movers-row"
                  onClick={() => navigate(`/stock-details/${stock.symbol}`)}
                >
                  <td className="movers-rank num">{i + 1}</td>
                  <td className="movers-symbol mono">{stock.symbol}</td>
                  <td className="movers-name">{stock.name}</td>
                  <td className="movers-bar-cell">
                    <div className="movers-bar-track">
                      <div
                        className={`movers-bar-fill ${tone}`}
                        style={{ width: `${(Math.abs(stock.percentChange) / max) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="movers-change">
                    <StockChange percentChange={stock.percentChange} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="movers-page">
      {isLoading ? (
        <div className="movers-columns">
          {[0, 1].map((col) => (
            <div className="movers-panel" key={col}>
              <div className="movers-panel-head">
                <div className="skeleton-line" style={{ width: 70, height: 14 }} />
              </div>
              <div className="movers-skeleton-rows">
                {[...Array(7)].map((_, i) => (
                  <div className="skeleton-line" key={i} style={{ height: 18 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="movers-columns">
          {renderColumn("Gainers", gainers, "positive")}
          {renderColumn("Losers", losers, "negative")}
        </div>
      )}
    </div>
  );
};

export default Movers;