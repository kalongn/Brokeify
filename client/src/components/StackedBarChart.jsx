import React from 'react';
import Plot from 'react-plotly.js';

const StackedBarChart = ({ data }) => {
    // Get all keys except 'labels'
    const investmentKeys = Object.keys(data).filter(key => key !== 'labels');

    const plotData = investmentKeys.map((key) => ({
        x: data.labels,
        y: data[key],
        type: 'bar',
        name: key, // Use the key directly as the name
    }));

    return (
        <Plot
            data={plotData}
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
