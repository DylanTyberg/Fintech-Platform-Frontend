import React from 'react';
import './stock-change.css'; 

const StockChange = ({className, percentChange }) => {
  
  const changeClass =
    percentChange > 0 ? 'up' :
    percentChange < 0 ? 'down' : 'neutral';

  return (
    <div className={className}>
        <div className={`stock-change-container ${changeClass}`}>
        <span className={`stock-caret ${changeClass}`}></span>
        <span className={`stock-change ${changeClass}`}>
            {percentChange.toFixed(2)}%
        </span>
        </div>
    </div>
    
  );
};

export default StockChange;

