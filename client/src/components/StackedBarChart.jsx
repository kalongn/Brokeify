import React from 'react';
import Plot from 'react-plotly.js';

const StackedBarChart = ({ data }) => {
    
    const investmentKeys = Object.keys(data).filter(key => key !== 'labels');

    const plotData = investmentKeys.map((key) => ({
        x: data.labels,
        y: data[key],
        type: 'bar',
        name: key,
    }));

    return (
        <Plot
            data={plotData}
            layout={{
                title: 'Stacked Bar Chart',
                barmode: 'stack',
                xaxis: { title: 'Time' },
                yasxis: { title: 'Amount' },
            }}
        />
    );
};

export default StackedBarChart;
