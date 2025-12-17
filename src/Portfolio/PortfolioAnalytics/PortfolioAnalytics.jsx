import {PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import { useUser } from '../../Contexts/UserContext';
import { useEffect, useState } from 'react';
import "../PortfolioAnalytics/PortfolioAnalytics.css"
import IntradayChart from '../../Components/intraday-chart/indraday-chart';
import AIChat from '../../Components/AIChat/AIChat';

const PortfolioAnalytics = () => {
    const {state, dispatch} = useUser();
    const [chartData, setChartData] = useState([])

    console.log(state)

    useEffect(() => {
        if (!state.snapshots){
            return
        }
        setChartData(
            state.snapshots.map((snapshot) => {
                
                const [month, day, year] = snapshot.date.split('-');
                
                const formattedDate = `${year}-${month}-${day}`;

                return {
                    time: formattedDate,
                    value: snapshot.portfolioValue,
                };
            })
        );
    }, [state.snapshots])

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0"];
    
    return (
        <div className='analytics-page'>
            <div className='history-chart-container'>
                <h1 className='analytics-section-title'>Portfolio History</h1>
                <div className="history-chart">
                    <IntradayChart data={chartData} width={200} height={300}/>
                </div>
                
            </div>
            <div className='pie-chart-section'>
                <h1 className='analytics-section-title'>Holdings Distribution</h1>
                <div className='pie-chart'>
                    <ResponsiveContainer>
                        <PieChart >
                            <Pie 
                            data={state.holdings}
                            dataKey="quantity"
                            nameKey="symbol"
                            cx="50%"
                            cy="50%"
                            label
                            outerRadius={120}
                            >
                                {state.holdings.map((holding, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]}/>
                                ))}

                            </Pie>
                            <Tooltip/>
                            <Legend/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                
            </div>
            <AIChat pageContext='(The user is currently on the portfolio analytics page showing total portfolio price history and holdings distribution pie chart)'/>
        </div>
    )
}   
export default PortfolioAnalytics; 