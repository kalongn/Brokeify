import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Axios from "axios";

import Layout from "../../components/Layout";
import styles from "./Charts.module.css";
import Accordion from "../../components/Accordion";
import LineChart from "../../components/LineChart";
import ShadedLineChart from "../../components/ShadedLineChart";
import StackedBarChart from "../../components/StackedBarChart";
import MultiLineChart from "../../components/MultiLineChart";
import LineChartParameter from "../../components/LineChartParameter";
import ModalOneD from "../../components/ModalOneD";
import ModalAddChart from "../../components/ModalAddChart";

{/*Note: We will need to account for the parameter we passed in to get here...as that will decide whether a certain chart will show or not
  (show linechartparameter only if the parameter is numeric)* I currently pass it as a boolean*/}

{/*Note: We need charts from charts.jsx too I believe, which is why
  we have "Add Chart" button here.The logic for that is the same. 
<<<<<<< HEAD
  
  "Add 1D Chart" is the new functionality. 
=======
    Updated Note: Add Chart also has values for the scenario parameter!

  "Add 1D Chart" is the new functionality. 

>>>>>>> c068269f28c7e672832e690dd2f2bfe47648591e
  
  */}

const OneD = () => {
  const { simulationId } = useParams();

  const [loading, setLoading] = useState(true);

  const [scenarioName, setScenarioName] = useState("Unknown Scenario");
  const [paramOneType, setParamOneType] = useState(null);
  const [paramOneName, setParamOneName] = useState(null);
  const [paramOneSteps, setParamOneSteps] = useState(null);

  const [showAddChartsModal, setShowAddChartsModal] = useState(false);
  const [showAdd1DModal, setShowAdd1DModal] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [charts, setCharts] = useState([]);

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/charts/${simulationId}`).then((response) => {
      const data = response.data;
      setScenarioName(data.scenarioName);
      setParamOneType(data.paramOneType);
      setParamOneName(data.paramOneName);
      setParamOneSteps(data.paramOneSteps);
      setLoading(false);
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
      {loading ?
        <>
          <div>
            Loading...
          </div>
        </>
        :
        <div className={styles.content}>
          <div className={styles.leftSide}>
            <h2>{scenarioName} 1D Results</h2>
            <h4>
              Type: {paramOneType !== "Disable Roth" ? <>{paramOneType}</> : <>Roth Optimizer</>}
              {paramOneType !== "Disable Roth" ? (
                <>
                  , Event: {paramOneName}
                  <br />
                  From: {paramOneSteps[0]}{paramOneType === "First of Two Investments" && "%"}
                  <br />
                  To: {paramOneSteps[paramOneSteps.length - 1]}{paramOneType === "First of Two Investments" && "%"}
                  <br />
                  Step: {paramOneSteps[1] - paramOneSteps[0]}{paramOneType === "First of Two Investments" && "%"}
                </>
              ) : (
                <>
                  , Enabled versus Disabled Roth
                </>
              )}
            </h4>
            <div className={styles.buttonGroup}>
              <button className={styles.addChart} onClick={() => setShowAdd1DModal(true)}>
                Add 1D Charts
              </button>
              <button className={styles.addChart} onClick={() => setShowAddChartsModal(true)}>
                Add Charts
              </button>
            </div>
            <div className={styles.chartGenerate}>
              <button onClick={handleGenerateCharts} className={styles.generateButton}>Generate Charts</button>
            </div>
            <ModalOneD
              isOpen={showAdd1DModal}
              setIsOpen={setShowAdd1DModal}
              setCharts={setCharts}
              isScenarioParameterNumeric={paramOneType !== "Disable Roth"}
            />


            <ModalAddChart
              isOpen={showAddChartsModal}
              setIsOpen={setShowAddChartsModal}
              setCharts={setCharts}
              hasParameterValue={true}
              paramOneType={paramOneType}
              paramOneName={paramOneName}
              paramOneSteps={paramOneSteps}
            />


            <h3>Added Charts</h3>
            <div className={styles.chartList}>
              {charts.map((chart) => (
                <div key={chart.id} className={styles.chartItem}>
                  <Accordion title={chart.type} content={chart.label} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.rightSide}>
            {!showCharts && <div className={styles.chartCount}>No Charts Generated Yet...</div>}
            {showCharts && charts.length === 0 && (
              <div className={styles.noChartsMessage}>
                Please add a selection of charts, and then generate.
              </div>
            )}
            {showCharts && charts.length > 0 && charts.map((chart) => (
              <div key={chart.id} className={styles.chart}>
                <h3>{chart.label}</h3>
                {/* Charts will show depending on type */}
                {chart.type === "Shaded Line Chart" && Object.keys(chart.data).length !== 0 && <ShadedLineChart data={chart.data} />}
                {chart.type === "Line Chart" && Object.keys(chart.data).length !== 0 && <LineChart data={chart.data} />}
                {chart.type === "Stacked Bar Chart" && Object.keys(chart.data).length !== 0 && <StackedBarChart data={chart.data} />}

                {chart.type === "Multi-Line Over Time" && Object.keys(chart.data).length !== 0 && (
                  <MultiLineChart data={chart.data.data} labels={chart.data.labels} />
                )}
                {chart.type === "Final Value vs Parameter" && Object.keys(chart.data).length !== 0 && (
                  <LineChartParameter data={chart.data.data} />
                )}
              </div>
            ))}
          </div>
        </div>}
    </Layout>
  );
};

export default OneD;