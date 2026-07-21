import { Sparklines, SparklinesLine } from "react-sparklines";
import "./MiniStockCard.css";

const formatPrice = (value) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Small clickable card: name, symbol, price, change, and a cheap sparkline
const MiniStockCard = ({ symbol, name, chartData = [], onClick }) => {
    const values = chartData.map((d) => d.value);
    const price = values.length ? values[values.length - 1] : null;
    const change = values.length > 1
        ? ((values[values.length - 1] - values[0]) / values[0]) * 100
        : null;
    const isPositive = change != null && change >= 0;

    return (
        <button type="button" className="mini-stock-card" onClick={onClick}>
            <div className="mini-stock-head">
                <div>
                    <div className="mini-stock-name">{name ?? symbol}</div>
                    <div className="mini-stock-symbol mono">{symbol}</div>
                </div>
                {change != null && (
                    <div className={`mini-stock-change num ${isPositive ? "positive" : "negative"}`}>
                        {isPositive ? "+" : ""}{change.toFixed(2)}%
                    </div>
                )}
            </div>
            <div className="mini-stock-bottom">
                {price != null && <div className="mini-stock-price num">${formatPrice(price)}</div>}
                {values.length > 1 && (
                    <div className="mini-stock-spark">
                        <Sparklines data={values} width={90} height={28}>
                            <SparklinesLine
                                color={isPositive ? "var(--pos)" : "var(--neg)"}
                                style={{ strokeWidth: 1.5, fill: "none" }}
                            />
                        </Sparklines>
                    </div>
                )}
            </div>
        </button>
    );
};

export default MiniStockCard;