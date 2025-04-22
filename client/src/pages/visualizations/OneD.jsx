import { useState} from "react";
import { useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import styles from "./Charts.module.css";
import Accordion from "../../components/Accordion";
import ShadedLineChart from "../../components/ShadedLineChart";
import StackedBarChart from "../../components/StackedBarChart";
import LineChart from "../../components/LineChart";

import ModalAddChart from "../../components/ModalAddChart";

const OneD = () => {

  const { simulationId } = useParams();

  const [scenarioName, setScenarioName] = useState("Unknown Scenario");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  const [charts, setCharts] = useState([]);


  const handleGenerateCharts = async () => {
    try {
      const generatedCharts =[
        {
          id: 1,
          type: "Shaded Line Chart",
          label: "Shaded Line Chart",
          data: [/* Your data here */]
        },
        {
          id: 2,
          type: "Line Chart",
          label: "Line Chart",
          data: [/* Your data here */]
        },
        {
          id: 3,
          type: "Stacked Bar Chart",
          label: "Stacked Bar Chart",
          data: [/* Your data here */]
        }
      ];
      setCharts(generatedCharts);
      setShowCharts(true);
    } catch (error) {
      setShowCharts(false);
    }
  };
 
  return (
    <Layout>
      <div className={styles.content}>
        <div className={styles.leftSide}>
          <h2> Result</h2>
          <div className={styles.buttonGroup}>
            <button className={styles.addChart} onClick={() => setShowAddModal(true)}>
              Add Charts
            </button>
            <button onClick={handleGenerateCharts}>Generate Charts</button>
          </div>
          <ModalAddChart isOpen={showAddModal} setIsOpen={setShowAddModal} setCharts={setCharts} />

          <h3>Added Charts</h3>
          <div className={styles.chartList}>
            {charts.map((chart) => (
              <div key={chart.id} className={styles.chartItem}>
                <Accordion key={chart.id} title={chart.type} content={chart.label} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.rightSide}>
          {/* If showCharts is true but no charts exist, show the message */}
          {!showCharts && (
            <div className={styles.chartCount}>
              No Charts Generated Yet...
            </div>
          )}

          {/* If showCharts is true and there are no charts, show the 'Please add charts' message */}
          {showCharts && charts.length === 0 && (
            <div className={styles.noChartsMessage}>
              Please add a selection of charts, and then generate.
            </div>
          )}

          {/*After user taps on "Generate Charts", charts will show*/}
          {showCharts && charts.length > 0 && charts.map((chart) => (
            <div key={chart.id} className={styles.chart}>
              <h3>{chart.type}</h3>
              {/* Charts will show depending on type */}
              {chart.type === "Shaded Line Chart" && chart.data && <ShadedLineChart data={chart.data} />}
              {chart.type === "Line Chart" && chart.data && <LineChart data={chart.data} />}
              {chart.type === "Stacked Bar Chart" && chart.data && <StackedBarChart data={chart.data} />}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default OneD;
