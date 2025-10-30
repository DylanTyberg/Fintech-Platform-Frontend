import "../Sectors/sectors.css"
import StockChartCard from "../../Components/StockChartCard/StockChartCard";

const Sectors = () => {
    return (
            <div className="indices-list">
                <StockChartCard symbol={"XLK"} title={"Technology"} delay={0}/>
                <StockChartCard symbol={"XLE"} title={"Energy"} delay={0}/>
                <StockChartCard symbol={"XLF"} title={"Financials"} delay={0}/>
                <StockChartCard symbol={"XLV"} title={"Healthcare"} delay={1000}/>
                <StockChartCard symbol={"XLI"} title={"Industrials"} delay={1000}/>
                <StockChartCard symbol={"XLB"} title={"Materials"} delay={1000}/>
                <StockChartCard symbol={"XLU"} title={"Utilities"} delay={2000}/>
                <StockChartCard symbol={"XLRE"} title={"Real Estate"} delay={2000}/>
                <StockChartCard symbol={"XLC"} title={"Communication Services"} delay={2000}/>
                <StockChartCard symbol={"XLY"} title={"Consumer Discretionary"} delay={3000}/>
                <StockChartCard symbol={"XLP"} title={"Consumer Services"} delay={3000}/>
            </div>
    )
}
export default Sectors;