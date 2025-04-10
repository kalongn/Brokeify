import Layout from "../../components/Layout";
import styles from "./Charts.module.css";
import { useState } from "react";
import Accordion from "../../components/Accordion";
import ShadedLineChart from "../../components/ShadedLineChart";
import StackedBarChart from "../../components/StackedBarChart";
import LineChart from "../../components/LineChart";

import ModalAddChart from "../../components/ModalAddChart";

const Charts = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const[showCharts, setShowChart] = useState(false);
  const ShadedLineData = {
    labels: ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019'],
    median: [0.5, 0.6, 0.55, 0.7, 0.65, 0.6, 0.75, 0.8, 0.85, 0.9],
    lower10: [0.4, 0.5, 0.45, 0.6, 0.55, 0.5, 0.65, 0.7, 0.75, 0.8],
    upper10: [0.6, 0.7, 0.65, 0.8, 0.75, 0.7, 0.85, 0.9, 0.95, 1.0],
    lower20: [0.35, 0.45, 0.4, 0.55, 0.5, 0.45, 0.6, 0.65, 0.7, 0.75],
    upper20: [0.65, 0.75, 0.7, 0.85, 0.8, 0.75, 0.9, 0.95, 1.0, 1.05],
    lower30: [0.3, 0.4, 0.35, 0.5, 0.45, 0.4, 0.55, 0.6, 0.65, 0.7],
    upper30: [0.7, 0.8, 0.75, 0.9, 0.85, 0.8, 0.95, 1.0, 1.05, 1.1],
    lower40: [0.25, 0.35, 0.3, 0.45, 0.4, 0.35, 0.5, 0.55, 0.6, 0.65],
    upper40: [0.75, 0.85, 0.8, 0.95, 0.9, 0.85, 1.0, 1.05, 1.1, 1.15],
  };


  const [charts, setCharts] = useState([
    {
      id: 1, type: "Line Chart", label: "Probability of Success over Time", data: {
        labels: ['January', 'February', 'March', 'April', 'May'],
        values: [0.2, 0.3, 0.5, 0.6, 0.7],
      },
    },
    {
      id: 2, type: "Stacked Bar Chart", label: "Total Investments (Median)", data: {
        labels: ['January', 'February', 'March', 'April', 'May'],
        investments1: [100, 200, 300, 400, 500],
        investments2: [50, 100, 150, 200, 250],
        investments3: [150, 200, 250, 300, 350],
      },
    },
    { id: 3, type: "Shaded Line Data", label: "Investments", data: ShadedLineData },
  ]);


    const addChart = (newChart) => {
        setCharts((prevCharts) => [
            ...prevCharts,
            { ...newChart, id: prevCharts.length + 1 }, // Adding the new chart with a unique ID
        ]);
    };

    const handleGenerateCharts = () => {
      setShowCharts(true);  // Set showCharts to true when "Generate Charts" is clicked
    };

  return (
    <Layout>
      <div className={styles.content}>
        <div className={styles.leftSide}>
          <h2>Ideal Plan!!</h2>
          <div className={styles.buttonGroup}>
            <button className ={styles.addCharts}onClick={() => setShowAddModal(true)}>
              Add Charts
            </button>
            <button onClick={handleGenerateCharts}>Generate Charts</button>
          </div>
          <ModalAddChart isOpen={showAddModal} setIsOpen={setShowAddModal} setCharts={setCharts} />

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
          {showCharts && charts.length === 0 && (
              <div className={styles.noChartsMessage}>
                Please add a selection of charts, and then generate.
              </div>
            )}

            {/* Conditionally render charts only after clicking "Generate Charts" */}
            {showCharts && charts.length > 0 && charts.map((chart) => (
              <div key={chart.id} className={styles.chart}>
                <h3>{chart.label}</h3>
                {/* Conditionally render chart components based on type */}
                {chart.type === "Shaded Line Chart" && <ShadedLineChart data={chart.data} />}
                {chart.type === "Line Chart" && <LineChart data={chart.data} />}
                {chart.type === "Stacked Bar Chart" && <StackedBarChart data={chart.data} />}
              </div>
            ))}
            {!showCharts && (
              <div className={styles.chartCount}>
                No Charts Generated Yet...
              </div>
            )}
            
            
          </div>
        </div>

      </div>
    </Layout>
  );
}

export default Charts;
