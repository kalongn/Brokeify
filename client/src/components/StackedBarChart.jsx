import React from 'react';
import Plot from 'react-plotly.js';

const StackedBarChart = ({ data }) => {
    return (
        <Plot
            data={[
                {
                    x: data.labels,
                    y: data.investments1,
                    type: 'bar',
                    name: 'Investment 1',
                },
                {
                    x: data.labels,
                    y: data.investments2,
                    type: 'bar',
                    name: 'Investment 2',
                },
                {
                    x: data.labels,
                    y: data.investments3,
                    type: 'bar',
                    name: 'Investment 3',
                },
            ]}
            layout={{
                title: 'Stacked Bar Chart',
                barmode: 'stack',
                xaxis: { title: 'Time' },
                yaxis: { title: 'Amount' },
            }}
        />
    );
};

export default StackedBarChart;
