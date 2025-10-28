import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import {DateTime} from "luxon"

const IntradayChart = ({ data }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const lineSeriesRef = useRef();

  //console.log("line-data", data);

  // Create chart only once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
        width: 450,
        height: 250,
        layout: {
          background: {color: "#2f2f2f"},
          textColor: '#E0E0E0',
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false, 
            timeFormatter: (time) => {
                return DateTime.fromSeconds(time, {zone: 'utc'})
                    .setZone('America/New_York')
                    .toFormat('hh:mm a');
            }
        },
    });
    chartRef.current = chart;

    const lineSeries = chart.addSeries(LineSeries)
    lineSeriesRef.current = lineSeries;


    return () => {
      chart.remove();
    };
  }, []);

  // Update data when `data` changes
  useEffect(() => {
    if (lineSeriesRef.current && data && data.length > 0) {
      lineSeriesRef.current.setData(data);
    }
  }, [data]);

  return <div ref={chartContainerRef} />;
};

export default IntradayChart;
