import "./LoadingPage.css"

const LoadingSpinner = ({ message = "Loading..." }) => {
    return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>{message}</p>
        </div>
    );
};

export default LoadingSpinner;



export const TradeLoadingState = ({ size = 40, color = "#0EA5E9" }) => {
    return (
        <div className="trade-loading-spinner" style={{ 
            width: `${size}px`, 
            height: `${size}px`,
            borderTopColor: color 
        }}></div>
    );
};
