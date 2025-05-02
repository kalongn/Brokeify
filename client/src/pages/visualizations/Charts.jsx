import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Axios from "axios";

import Layout from "../../components/Layout";
import styles from "./Charts.module.css";
import Accordion from "../../components/Accordion";
import ShadedLineChart from "../../components/ShadedLineChart";
import StackedBarChart from "../../components/StackedBarChart";
import LineChart from "../../components/LineChart";

import ModalAddChart from "../../components/ModalAddChart";

const Charts = () => {

  const { simulationId } = useParams();

  const [scenarioName, setScenarioName] = useState("Unknown Scenario");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/charts/${simulationId}`).then((response) => {
      const data = response.data;
      setScenarioName(data.scenarioName);
    }).catch((error) => {
      if (error.response?.status === 403 || error.response?.status === 401) {
        alert("You do not have permission to view this scenario.");
      } else {
        alert("Error fetching scenario name. Please try again.");
      }
      setScenarioName("Unknown Scenario");
      console.error('Error fetching scenario name:', error);
    });

  }, [simulationId]);


  const [charts, setCharts] = useState([]);


  const handleGenerateCharts = async () => {
    try {
      const response = await Axios.post(`/charts/${simulationId}`, charts);
      const generatedCharts = response.data;
      setCharts(generatedCharts);
      setShowCharts(true);
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        alert("You do not have permission to view this scenario.");
        setScenarioName("Unknown Scenario");
      } else {
        alert("Error fetching Graph Result. Please try again.");
      }
      setShowCharts(false);
    }
  };
 
  return (
    <Layout>
      <div className={styles.content}>
        <div className={styles.leftSide}>
          <h2>{scenarioName} Result</h2>
          <div className={styles.buttonGroup}>
            <button className={styles.addChart} onClick={() => setShowAddModal(true)}>
              Add Charts
            </button>
            <button onClick={handleGenerateCharts}>Generate Charts</button>
          </div>
          <ModalAddChart isOpen={showAddModal} setIsOpen={setShowAddModal} setCharts={setCharts} hasParameterValue={false}/>

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

export default Charts;
