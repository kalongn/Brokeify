import Plot from 'react-plotly.js';
import PropTypes from 'prop-types';
{/*
    Note format for this data is simple: 
    add labels as an array for the time periods, and values as an array of numbers of the probability of success.
    ex:
    data: {
        labels: ['January', 'February', 'March', 'April', 'May'],
        values: [0.2, 0.3, 0.5, 0.6, 0.7],
      }
    */}
const LineChart = ({ data }) => {
    return (
        <Plot
            data={[
                {
                    x: data.labels, // X-axis values - time periods
                    y: data.values, // Y-axis values - probability of success
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

LineChart.propTypes = {
    data: PropTypes.shape({
        labels: PropTypes.arrayOf(PropTypes.string),
        values: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
};
export default LineChart;
