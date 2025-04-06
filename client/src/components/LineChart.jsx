import React from 'react';
import Plot from 'react-plotly.js';

const LineChart = ({ data }) => {
    return (
        <Plot
            data={[
                {
                    x: data.labels, // X-axis values
                    y: data.values, // Y-axis values
                    type: 'scatter',
                    mode: 'lines+markers',
                    marker: { color: 'blue' },
                },
            ]}
            layout={{
                title: 'Probability of Success over Time',
                xaxis: { title: 'Time' },
                yaxis: { title: 'Probability of Success' },
            }}
        />
    );
};

export default LineChart;
