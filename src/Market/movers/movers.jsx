import "../movers/movers.css";
import { useEffect, useState } from "react";
import StockChange from "../../Components/stock-change/stock-change";
import LoadingSpinner from "../../Components/LoadingPage/LoadingPage";
import { useNavigate } from "react-router-dom";

const Movers = () => {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [active, setActive] = useState([]);
  const [isGainers, setIsGainers] = useState(true);

  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

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
      setActive(data.filter(stock => stock.direction === "gainers"));
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

  if (isLoading) {
    return <LoadingSpinner message="Loading movers data..." />
  }

  return (
    <div className="movers-page">
        <div className="movers-buttons">
            <button className={isGainers ? "movers-toggle-active" : "movers-toggle"} onClick={() => {setActive(gainers); setIsGainers(true)}}>Gainers</button>
            <button className={!isGainers ? "movers-toggle-active" : "movers-toggle"} onClick={() => {setActive(losers); setIsGainers(false)}}>Losers</button>
        </div>
        <div className="movers-list">
            {active.map((stock) => (
                <div className="stock-card" onClick={() => navigate(`/stock-details/${stock.symbol}`)}  key={stock.symbol}>
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
