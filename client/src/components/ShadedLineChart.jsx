import React from 'react';
import Plot from 'react-plotly.js';
{/*Note: I used ChatGPT to generate this code.
    Prompt: Using Plotly.js and React.js. create a shaded line chart component that plots the  median value of a selected quantity over 
    time (i.e., year by year), with shaded regions depicting probability ranges---specifically 10%-90%, 20%-80%, 30%-70%, and 40%-60%---for
     the value of that quantity.
    */}
const ShadedLineChart = ({ data }) => {
    return (
        <Plot
            data={[
                // Shaded region 40%-60%
                {
                    x: data.labels,
                    y: data.upper40,
                    fill: 'tonexty', // Fills the area between the upper and lower lines
                    fillcolor: 'rgba(255, 0, 0, 0.2)', // Transparent red
                    type: 'scatter',
                    mode: 'lines',
                    name: '40%-60%',
                    line: { color: 'transparent' }, // Hide the line itself
                },
                {
                    x: data.labels,
                    y: data.lower40,
                    fill: 'tonexty',
                    fillcolor: 'rgba(255, 0, 0, 0.2)',
                    type: 'scatter',
                    mode: 'lines',
                    name: '40%-60%',
                    line: { color: 'transparent' },
                },
                // Shaded region 30%-70%
                {
                    x: data.labels,
                    y: data.upper30,
                    fill: 'tonexty',
                    fillcolor: 'rgba(0, 255, 0, 0.2)', // Transparent green
                    type: 'scatter',
                    mode: 'lines',
                    name: '30%-70%',
                    line: { color: 'transparent' },
                },
                {
                    x: data.labels,
                    y: data.lower30,
                    fill: 'tonexty',
                    fillcolor: 'rgba(0, 255, 0, 0.2)',
                    type: 'scatter',
                    mode: 'lines',
                    name: '30%-70%',
                    line: { color: 'transparent' },
                },
                // Shaded region 20%-80%
                {
                    x: data.labels,
                    y: data.upper20,
                    fill: 'tonexty',
                    fillcolor: 'rgba(0, 0, 255, 0.2)', // Transparent blue
                    type: 'scatter',
                    mode: 'lines',
                    name: '20%-80%',
                    line: { color: 'transparent' },
                },
                {
                    x: data.labels,
                    y: data.lower20,
                    fill: 'tonexty',
                    fillcolor: 'rgba(0, 0, 255, 0.2)',
                    type: 'scatter',
                    mode: 'lines',
                    name: '20%-80%',
                    line: { color: 'transparent' },
                },
                // Shaded region 10%-90%
                {
                    x: data.labels,
                    y: data.upper10,
                    fill: 'tonexty',
                    fillcolor: 'rgba(255, 255, 0, 0.2)', // Transparent yellow
                    type: 'scatter',
                    mode: 'lines',
                    name: '10%-90%',
                    line: { color: 'transparent' },
                },
                {
                    x: data.labels,
                    y: data.lower10,
                    fill: 'tonexty',
                    fillcolor: 'rgba(255, 255, 0, 0.2)',
                    type: 'scatter',
                    mode: 'lines',
                    name: '10%-90%',
                    line: { color: 'transparent' },
                },
                // Median line
                {
                    x: data.labels,
                    y: data.median,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Median',
                    line: { color: 'black' },
                    marker: { color: 'black' },
                },
            ]}
            layout={{
                title: 'Shaded Line Chart of Probability Ranges',
                xaxis: { title: 'Year' },
                yaxis: { title: 'Value' },
                showlegend: true,
            }}
        />
    );
};

export default ShadedLineChart;
