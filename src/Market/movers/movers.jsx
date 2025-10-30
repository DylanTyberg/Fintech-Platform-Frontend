import "../movers/movers.css";
import { useEffect, useState } from "react";
import StockChange from "../../Components/stock-change/stock-change";

const Movers = () => {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [active, setActive] = useState([]);
  const [isGainers, setIsGainers] = useState(true);

  const isMarketOpen = () => {
    const now = new Date();
    const options = { timeZone: "America/New_York", hour12: false };
    const timeString = now.toLocaleTimeString("en-US", options);
    const [hour, minute] = timeString.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;

    const open = 9 * 60 + 30;  // 9:30 AM ET
    const close = 16 * 60;     // 4:00 PM ET
    const afterHours = 20 * 60; // 8:00 PM ET

    return totalMinutes >= open && totalMinutes <= afterHours;
  };

  const getMovers = async () => {
    try {
      if (isMarketOpen()) {
        // Trigger backend to refresh movers
        const postResponse = await fetch(
          "https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/movers",
          { method: "POST" }
        );

        if (!postResponse.ok) {
          console.error("POST failed:", postResponse.status, postResponse.statusText);
          return;
        }
      }

      // Fetch movers
      const getResponse = await fetch(
        "https://as9ppqd9d8.execute-api.us-east-1.amazonaws.com/dev/movers"
      );

      if (!getResponse.ok) {
        console.error("GET failed:", getResponse.status, getResponse.statusText);
        return;
      }

      const data = await getResponse.json();

      // Separate gainers and losers
      setGainers(data.filter(stock => stock.direction === "gainers"));
      setActive(data.filter(stock => stock.direction === "gainers"));
      setLosers(data.filter(stock => stock.direction === "losers"));

      // Fetch all names in batch

    } catch (error) {
      console.error("Error fetching movers:", error);
    }
  };

  
  useEffect(() => {
    getMovers();
  }, []);

  return (
    <div className="movers-page">
        <div className="movers-buttons">
            <button className={isGainers ? "movers-toggle-active" : "movers-toggle"} onClick={() => {setActive(gainers); setIsGainers(true)}}>Gainers</button>
            <button className={!isGainers ? "movers-toggle-active" : "movers-toggle"} onClick={() => {setActive(losers); setIsGainers(false)}}>Losers</button>
        </div>
        <div className="movers-list">
            {active.map((stock) => (
                <div className="stock-card"  key={stock.symbol}>
                <h1 className= "stock-name">{stock.name}</h1>
                <StockChange className="card-percent-change"  percentChange={stock.percentChange}/>
                <h1 className="stock-symbol">{stock.symbol}</h1>
                </div>
            ))}
        </div>
    </div>
  );
};

export default Movers;
