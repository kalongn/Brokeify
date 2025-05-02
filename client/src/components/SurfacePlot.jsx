import Plot from 'react-plotly.js';
import PropTypes from 'prop-types';

/*
    Expected data format:
    {
        x: array of numbers (parameter 1 values),
        y: array of numbers (parameter 2 values),
        z: 2D array of numbers (selected quantity values)

        #Note: z[i][j] = value at y[i], x[j]
        Ex:
           x   x    x   x
        y  z   z    z    z
        y  z   z    z    z
        y  z   z    z    z

        const exampleData = {
    x: [55, 58, 61, 64, 67, 70], // Retirement ages
    y: [0.10, 0.15, 0.20, 0.25, 0.30], // Savings rates
    z: [
        [0.60, 0.65, 0.70, 0.72, 0.75, 0.78], // Savings rate = 10%
        [0.63, 0.68, 0.73, 0.75, 0.78, 0.81], // Savings rate = 15%
        [0.67, 0.72, 0.77, 0.79, 0.82, 0.85], // Savings rate = 20%
        [0.70, 0.75, 0.80, 0.83, 0.86, 0.88], // Savings rate = 25%
        [0.73, 0.78, 0.83, 0.86, 0.89, 0.91], // Savings rate = 30%
    ],
};

    }
*/

const SurfacePlot = ({ data }) => {
    return (
        <Plot
            data={[
                {
                    type: 'surface',
                    x: data.x,
                    y: data.y,
                    z: data.z,
                    colorscale: 'Viridis',
                },
            ]}
            layout={{
                title: 'Surface Plot',
                scene: {
                    xaxis: { title: 'Parameter 1' },
                    yaxis: { title: 'Parameter 2' },
                    zaxis: { title: 'Selected Quantity' },
                },
            }}
        />
    );
};

SurfacePlot.propTypes = {
    data: PropTypes.shape({
        x: PropTypes.arrayOf(PropTypes.number).isRequired,
        y: PropTypes.arrayOf(PropTypes.number).isRequired,
        z: PropTypes.arrayOf(
            PropTypes.arrayOf(PropTypes.number)
        ).isRequired,
    }).isRequired,
};

export default SurfacePlot;
