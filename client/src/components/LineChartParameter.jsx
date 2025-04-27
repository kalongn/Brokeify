import Plot from 'react-plotly.js';
import PropTypes from 'prop-types';

/*
Expected data format:
[
  { parameterValue: 60, finalValue: 140000 },
  { parameterValue: 65, finalValue: 130000 },
  { parameterValue: 70, finalValue: 125000 }
]
*/

const LineChartParameter = ({ data }) => {
    const xValues = data.map(item => item.parameterValue);
    const yValues = data.map(item => item.finalValue);

    return (
        <Plot
            data={[
                {
                    x: xValues,
                    y: yValues,
                    type: 'scatter',
                    mode: 'lines+markers',
                    line: { shape: 'linear' },
                    name: 'Final Value',
                }
            ]}
            layout={{
                title: 'Final Value vs Parameter',
                xaxis: { title: 'Parameter Value' },
                yaxis: { title: 'Final Value of Quantity' },
                hovermode: 'closest'
            }}
        />
    );
};

LineChartParameter.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
};
export default LineChartParameter;
