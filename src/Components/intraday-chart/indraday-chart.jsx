import React, { useEffect, useRef, useState } from 'react';
import { AreaSeries, createChart, LineSeries } from 'lightweight-charts';
import {DateTime} from "luxon"

const IntradayChart = ({ data, height, width }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const lineSeriesRef = useRef();
  const [percentChange, setPercentChange] = useState(0);
  const [positive, setPositive] = useState(true);

  //console.log("line-data", data);

  // Create chart only once
  useEffect(() => {
    if (!chartContainerRef.current) return;



    const chart = createChart(chartContainerRef.current, {
        width:  width,
        height: height,
        layout: {
          background: {color: "#2f2f2f"},
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
            .toFormat('hh:mm a'); // Example: 09:30 AM
        }

        // Daily/aggregated data → object like { year, month, day }
          if (typeof time === 'string') {
            return DateTime
              .fromISO(time, { zone: 'utc' })
              .setZone('America/New_York')
              .toFormat('LLL dd'); // e.g. Oct 28
          }
        },
      },
    });
    chartRef.current = chart;

    const lineSeries = chart.addSeries(AreaSeries)
    lineSeriesRef.current = lineSeries;


    return () => {
      chart.remove();
    };
  }, []);

  // Update data when `data` changes
useEffect(() => {
  if (lineSeriesRef.current && data && data.length > 0) {
    lineSeriesRef.current.setData(data);
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }

    // Correctly calculate the percent change
    const firstValue = data[0].value;
    console.log(firstValue)
    const lastValue = data[data.length - 1].value;
    console.log(lastValue)
    const calculatedPercentChange = ((lastValue - firstValue) / firstValue) * 100;
    
    const isPositive = calculatedPercentChange >= 0;
    // Set percent change and whether it's positive or negative
    setPercentChange(calculatedPercentChange.toFixed(2));
    setPositive(isPositive);

    if (!isPositive) {
      lineSeriesRef.current.applyOptions({
        lineColor: '#FF4B4B', // new line color
        topColor: 'rgba(255, 75, 75, 0.4)', // new gradient top
        bottomColor: 'rgba(255, 75, 75, 0.0)', // new gradient bottom
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




  return <div ref={chartContainerRef} />;
};

export default IntradayChart;
