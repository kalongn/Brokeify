import Plot from 'react-plotly.js';
import PropTypes from 'prop-types';
{/*
    Note:
    Add data in format like this labels is the time frame. Then get each value for each investment/whatever the user selected. 
    chart.data: {
        labels: ['January', 'February', 'March', 'April', 'May'],
        investments1: [100, 200, 300, 400, 500],
        investments2: [50, 100, 150, 200, 250],
        investments3: [150, 200, 250, 300, 350],
        investments4: [200, 250, 300, 350],
      }


    To determine what type of data we need to pull from, you can access through:
    chart.content = {
        quantity: [one of three possible things - Total investments by investment (aka looks like example above), income by eventSeries, or expenses 
        by eventSeries and a segment for taxes],
        valueType: median or average,
        threshold: number [the purpose of threshold is that if va;ues are below that threshold in every year of the simulation, they're aggregated 
        as an "other" category],
        dollarValue: future or today
      };
    */}

const StackedBarChart = ({ data }) => {

    const investmentKeys = Object.keys(data).filter(key => key !== 'labels');
    const labels = data.labels ? data.labels : [];

    const barTraces = investmentKeys.map((key) => ({
        x: labels,
        y: data[key],
        type: 'bar',
        name: key,
        hoverinfo: 'x+y+name',
    }));

    const totals = labels.map((_, i) =>
        investmentKeys.reduce((sum, key) => sum + (data[key][i] || 0), 0)
    );

    const totalTextTrace = {
        x: labels,
        y: totals,
        mode: 'marker',
        type: 'scatter',
        showlegend: false,
        hoverinfo: 'x+y',
        marker: { color: 'rgba(0,0,0,0)' },
    };


    const plotData = [...barTraces, totalTextTrace];

    return (
        <Plot
            data={plotData}
            layout={{
                title: 'Stacked Bar Chart with Totals',
                barmode: 'stack',
                xaxis: { title: 'Time' },
                yaxis: { title: 'Amount' },
                showlegend: true,
                margin: { t: 50 },
            }}
            config={{ responsive: true }}
        />
    );
};


StackedBarChart.propTypes = {
    data: PropTypes.shape({
        labels: PropTypes.arrayOf(PropTypes.string),
    })
};

export default StackedBarChart;
