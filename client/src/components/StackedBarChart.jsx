import React from 'react';
import Plot from 'react-plotly.js';

const StackedBarChart = ({ data }) => {
    return (
        <Plot
            data={[
                {
                    x: data.labels,
                    y: data.investments,
                    type: 'bar',
                    name: 'Investments',
                },
                {
                    x: data.labels,
                    y: data.expenses,
                    type: 'bar',
                    name: 'Expenses',
                },
                {
                    x: data.labels,
                    y: data.income,
                    type: 'bar',
                    name: 'Income',
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
