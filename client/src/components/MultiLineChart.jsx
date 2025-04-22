import Plot from 'react-plotly.js';
import PropTypes from 'prop-types';

/*
Expected data format:
data = [
{
    parameterValue: 60,
    values: [100000, 120000, 140000]
  },
  {
    parameterValue: 65,
    values: [95000, 110000, 130000]
  },
  {
    parameterValue: 70,
    values: [90000, 105000, 125000]
  }
]
  Note: I can change this to be inside the data values if that's better.
  I just thought this would be easier
  labels = ["2025", "2026", "2027"]

*/

const MultiLineChart = ({ data, labels }) => {
  if (!data || data.length === 0 || !labels || labels.length === 0) return null;

  const dataPoints = data.map((series) => ({
    x: labels,
    y: series.values,
    type: 'scatter',
    mode: 'lines+markers',
    name: `Param: ${series.parameterValue}`,
  }));

  return (
    <Plot
      data={dataPoints}
      layout={{
        title: 'Selected Quantity Over Time by Parameter Value',
        xaxis: { title: 'Time', type: 'category'},
        yaxis: { title: 'Value' },
        legend: { title: { text: 'Parameter Value' } },
        margin: { t: 40, r: 20, b: 50, l: 60 },
      }}
     
    />
  );
};

MultiLineChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    labels: PropTypes.array.isRequired,
};

export default MultiLineChart;
