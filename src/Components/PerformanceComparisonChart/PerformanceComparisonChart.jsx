import { useEffect, useRef } from 'react';
import { createChart, LineSeries, LineStyle } from 'lightweight-charts';

// Same palette as indraday-chart.jsx
const COLORS = {
  background: "#131722",
  text: "#d1d4dc",
  grid: "#1b1f2b",
  border: "#232734",
  positive: "#089981",
  negative: "#f23645",
  benchmark: "#787b86",
};


const PerformanceComparisonChart = ({ portfolioSeries = [], spySeries = [], height = 300 }) => {
  const containerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: COLORS.background },
        textColor: COLORS.text,
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
      },
      rightPriceScale: {
        borderColor: COLORS.border,
      },
      timeScale: {
        borderColor: COLORS.border,
        timeVisible: false,
      },
      localization: {
        priceFormatter: (price) => `${price >= 0 ? '+' : ''}${price.toFixed(1)}%`,
      },
      crosshair: {
        vertLine: { color: COLORS.border },
        horzLine: { color: COLORS.border },
      },
    });
    chartRef.current = chart;

    const isPositive =
      portfolioSeries.length > 0 &&
      portfolioSeries[portfolioSeries.length - 1].value >= 0;

    const portfolioLine = chart.addSeries(LineSeries, {
      color: isPositive ? COLORS.positive : COLORS.negative,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    portfolioLine.setData(portfolioSeries);

    const spyLine = chart.addSeries(LineSeries, {
      color: COLORS.benchmark,
      lineWidth: 1.5,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    spyLine.setData(spySeries);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [portfolioSeries, spySeries, height]);

  return <div ref={containerRef} style={{ width: '100%' }} />;
};

export default PerformanceComparisonChart;