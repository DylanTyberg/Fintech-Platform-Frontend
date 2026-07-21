import React, { useEffect, useRef } from 'react';
import { AreaSeries, createChart, LineStyle } from 'lightweight-charts';
import { DateTime } from "luxon";


const COLORS = {
  background: "#131722", // var(--surface)
  text: "#d1d4dc",       // var(--text)
  grid: "#1b1f2b",       // var(--border-soft)
  border: "#232734",     // var(--border)
  positive: "#089981",   // var(--pos)
  negative: "#f23645",   // var(--neg)
  accent: "#2962ff",     // var(--accent)
};

const IntradayChart = ({ data, height, width }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const lineSeriesRef = useRef();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: width || chartContainerRef.current.clientWidth,
      height: height || 250,
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
      crosshair: {
        vertLine: { color: COLORS.accent, labelBackgroundColor: COLORS.accent },
        horzLine: { color: COLORS.accent, labelBackgroundColor: COLORS.accent },
      },
      timeScale: {
        borderColor: COLORS.border,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          if (typeof time === 'number') {
            return DateTime
              .fromSeconds(time, { zone: 'utc' })
              .setZone('America/New_York')
              .toFormat('hh:mm a');
          }
          if (typeof time === 'string') {
            return DateTime
              .fromISO(time, { zone: 'utc' })
              .setZone('America/New_York')
              .toFormat('LLL dd');
          }
        },
      },
    });
    chartRef.current = chart;


    const lineSeries = chart.addSeries(AreaSeries, {
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineStyle: LineStyle.Dashed,
      priceLineWidth: 1,
    });
    lineSeriesRef.current = lineSeries;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height, width]);

  useEffect(() => {
    if (lineSeriesRef.current && data && data.length > 0) {
      lineSeriesRef.current.setData(data);
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }

      const firstValue = data[0].value;
      const lastValue = data[data.length - 1].value;
      const isPositive = lastValue >= firstValue;
      const color = isPositive ? COLORS.positive : COLORS.negative;

      lineSeriesRef.current.applyOptions({
        lineColor: color,
        topColor: isPositive ? "rgba(8, 153, 129, 0.28)" : "rgba(242, 54, 69, 0.28)",
        bottomColor: isPositive ? "rgba(8, 153, 129, 0.0)" : "rgba(242, 54, 69, 0.0)",
        priceLineColor: color,
      });
    }
  }, [data]);

  return <div ref={chartContainerRef} style={{ width: '100%' }} />;
};

export default IntradayChart;