import './stock-change.css';

// Small colored delta badge 
const StockChange = ({ percentChange, className = "" }) => {
  const value = Number(percentChange) || 0;
  const direction = value > 0 ? "positive" : value < 0 ? "negative" : "neutral";

  return (
    <span className={`stock-change ${direction}${className ? ` ${className}` : ""}`}>
      {direction !== "neutral" && (
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="stock-change-arrow">
          <path
            d={direction === "positive" ? "M5 1L9 9H1L5 1Z" : "M5 9L1 1H9L5 9Z"}
            fill="currentColor"
          />
        </svg>
      )}
      {value > 0 ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
};

export default StockChange;