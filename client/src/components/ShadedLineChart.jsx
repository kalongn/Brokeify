import Plot from 'react-plotly.js';
import PropTypes from 'prop-types';
{/*Note: I used ChatGPT to generate this code.
    Prompt: Using Plotly.js and React.js. create a shaded line chart component that plots the  median value of a selected quantity over 
    time (i.e., year by year), with shaded regions depicting probability ranges---specifically 10%-90%, 20%-80%, 30%-70%, and 40%-60%---for
     the value of that quantity.
    */}


{/*
Note: this expects a data object in this format: 
data = {
  labels: ['2010', '2011', ..., '2019'], // Years
  median: [...],     // Central tendency (e.g., median) for each year
  lower10: [...],    // Lower bound of the 10%-90% range
  upper10: [...],    // Upper bound of the 10%-90% range
  lower20: [...],    // Lower bound of the 20%-80% range
  upper20: [...],    // Upper bound of the 20%-80% range
  ...
}
*/}

{/*
    From proj req: This type of line chart includes a line for the median value of a selected quantity 
    over time (i.e., year by year), with shaded regions depicting probability ranges---specifically 10%-90%, 20%-80%, 
    30%-70%, and 40%-60%---for the value of that quantity.
        
*/}

{/*
    data.content = {
        quantity: [can be one of the following 5:
            1. total investments (the chart should also include a horizontal line 
            representing the financial goal)
            2. total income
            3. total expenses, including taxes
            4. early withdrawal tax
            5. percentage of total discretionary expenses incurred (the percentage is
             based on the amounts,not the number, of the discretionary expenses in that year)
        ],
        dollarValue: Future or Today <-- note this only exists for those that show dollarvalues (not % for ex) 
      };
    */}
const ShadedLineChart = ({ data }) => {
    return (
        <Plot
            data={[
                // Shaded region 10%-90%
                {
                    x: data.labels,
                    y: data.upper10,
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
                // Shaded region 20%-80%
                {
                    x: data.labels,
                    y: data.upper20,
                    fillcolor: 'rgba(0, 0, 255, 0.4)', // Transparent blue
                    type: 'scatter',
                    mode: 'lines',
                    name: '20%-80%',
                    line: { color: 'transparent' },
                },
                {
                    x: data.labels,
                    y: data.lower20,
                    fill: 'tonexty',
                    fillcolor: 'rgba(0, 0, 255, 0.4)',
                    type: 'scatter',
                    mode: 'lines',
                    name: '20%-80%',
                    line: { color: 'transparent' },
                },
                // Shaded region 30%-70%
                {
                    x: data.labels,
                    y: data.upper30,
                    fillcolor: 'rgba(0, 255, 0, 0.6)', // Transparent green
                    type: 'scatter',
                    mode: 'lines',
                    name: '30%-70%',
                    line: { color: 'transparent' },
                },
                {
                    x: data.labels,
                    y: data.lower30,
                    fill: 'tonexty',
                    fillcolor: 'rgba(0, 255, 0, 0.6)',
                    type: 'scatter',
                    mode: 'lines',
                    name: '30%-70%',
                    line: { color: 'transparent' },
                },
                // Shaded region 40%-60%
                {
                    x: data.labels,
                    y: data.upper40,
                    fillcolor: 'rgba(255, 0, 0, 0.8)', // Transparent red
                    type: 'scatter',
                    mode: 'lines',
                    name: '40%-60%',
                    line: { color: 'transparent' }, // Hide the line itself
                },
                {
                    x: data.labels,
                    y: data.lower40,
                    fill: 'tonexty',
                    fillcolor: 'rgba(255, 0, 0, 0.8)',
                    type: 'scatter',
                    mode: 'lines',
                    name: '40%-60%',
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

ShadedLineChart.propTypes = {
    data: PropTypes.shape({
        labels: PropTypes.arrayOf(PropTypes.string),
        median: PropTypes.arrayOf(PropTypes.number),
        lower10: PropTypes.arrayOf(PropTypes.number),
        upper10: PropTypes.arrayOf(PropTypes.number),
        lower20: PropTypes.arrayOf(PropTypes.number),
        upper20: PropTypes.arrayOf(PropTypes.number),
        lower30: PropTypes.arrayOf(PropTypes.number),
        upper30: PropTypes.arrayOf(PropTypes.number),
        lower40: PropTypes.arrayOf(PropTypes.number),
        upper40: PropTypes.arrayOf(PropTypes.number),
    })
};
export default ShadedLineChart;
