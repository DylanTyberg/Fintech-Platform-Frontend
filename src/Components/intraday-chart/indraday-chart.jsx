import React, { useEffect, useRef, useState } from 'react';
import { AreaSeries, createChart, LineSeries } from 'lightweight-charts';
import {DateTime} from "luxon"

const IntradayChart = ({ data, height, width }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const lineSeriesRef = useRef();
  const [percentChange, setPercentChange] = useState(0);
  const [positive, setPositive] = useState(true);

  // Create chart only once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth, // CHANGED: Use container width instead of prop
        height: height || 250, // CHANGED: Use prop or default to 250
        layout: {
          background: {color: "#22262e"},
          textColor: '#E0E0E0',
        },
        timeScale: {
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

    const lineSeries = chart.addSeries(AreaSeries)
    lineSeriesRef.current = lineSeries;

    // NEW: Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    // NEW: Use ResizeObserver
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    // NEW: Fallback to window resize
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect(); // NEW: Cleanup ResizeObserver
      window.removeEventListener('resize', handleResize); // NEW: Cleanup event listener
      chart.remove();
    };
  }, [height]); // CHANGED: Added height to dependency array

  // Update data when `data` changes
  useEffect(() => {
    if (lineSeriesRef.current && data && data.length > 0) {
      lineSeriesRef.current.setData(data);
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }

      const firstValue = data[0].value;
      console.log(firstValue)
      const lastValue = data[data.length - 1].value;
      console.log(lastValue)
      const calculatedPercentChange = ((lastValue - firstValue) / firstValue) * 100;
      
      const isPositive = calculatedPercentChange >= 0;
      setPercentChange(calculatedPercentChange.toFixed(2));
      setPositive(isPositive);

      if (!isPositive) {
        lineSeriesRef.current.applyOptions({
          lineColor: '#FF4B4B',
          topColor: 'rgba(255, 75, 75, 0.4)',
          bottomColor: 'rgba(255, 75, 75, 0.0)',
        });
      }
      else {
        lineSeriesRef.current.applyOptions({
          lineColor: '#33D778',
          topColor: 'rgba(46, 220, 135, 0.4)',
          bottomColor: 'rgba(40, 221, 100, 0.0)',
        });
      }
    }
  }, [data]);

  // CHANGED: Added style to make container take full width
  return <div ref={chartContainerRef} style={{ width: '100%' }} />;
};

export default IntradayChart;