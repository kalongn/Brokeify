import Layout from "../../components/Layout";
import styles from "./Charts.module.css";
import { useState } from "react";
import Accordion from "../../components/Accordion";

import { Link } from "react-router-dom";
const Charts = () => {

    const [charts, setCharts] = useState([
        { id: 1, type: "Line Chart", label: "Probability of Success over Time" },
        { id: 2, type: "Stacked Bar Chart", label: "Total Investments (Median)" },
        { id: 3, type: "Stacked Bar Chart", label: "Other Investments" },
      ]);
    
    return (
        <Layout>
            <div className={styles.content}>
                <div className={styles.leftSide}>
                    <h2>Ideal Plan!!</h2>
                    <div className={styles.buttonGroup}>
                         <Link to="/Visualizations/AddChart" > Add Charts</Link>
                        <button>Generate Charts</button>
                    </div>
                    <h3>Added Charts</h3>
                    {/* List of  Charts */}
                    <div className={styles.chartList}>
                        List of Charts Accordion Format

                        {charts.map((chart) => (
                        <div key={chart.id} className={styles.chartItem}>
                             <Accordion key={chart.id} title={chart.type} content={chart.label} />
                        </div>
                        ))}
                    </div>
                </div>
                <div className={styles.rightSide}>
                    {/* Display Charts */}
                    <div className={styles.chartsDisplay}>
                        <div className={styles.chart}>
                            <h3>Probability of Success over Time</h3>

                        </div>
                        <div className={styles.chart}>
                            <h3>Stacked Bar Chart: Median Values</h3>

                        </div>
                    </div>
                </div>
             
            </div>
        </Layout>
    );
}

export default Charts;
