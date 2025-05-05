import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Axios from "axios";

import Layout from "../../components/Layout";
import styles from "./Charts.module.css";
import Accordion from "../../components/Accordion";
import LineChart from "../../components/LineChart";
import ShadedLineChart from "../../components/ShadedLineChart";
import StackedBarChart from "../../components/StackedBarChart";
import ModalAddChart from "../../components/ModalAddChart";
import SurfacePlot from "../../components/SurfacePlot";
import ContourPlot from "../../components/ContourPlot";
import ModalTwoD from "../../components/ModalTwoD";

const TwoD = () => {
  const { simulationId } = useParams();

  const [loading, setLoading] = useState(true);
  const [scenarioName, setScenarioName] = useState("Unknown Scenario");

  const [paramsType, setParamsType] = useState([]); // [0] = paramOneType, [1] = paramTwoType
  const [paramsName, setParamsName] = useState([]); // [0] = paramOneName, [1] = paramTwoName
  const [paramsSteps, setParamsSteps] = useState([]); // [0] = paramOneSteps, [1] = paramTwoSteps

  const [showAddChartsModal, setShowAddChartsModal] = useState(false);
  const [showAdd2DModal, setShowAdd2DModal] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [charts, setCharts] = useState([]);

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/charts/${simulationId}`).then((response) => {
      const data = response.data;
      setScenarioName(data.scenarioName);
      setParamsType([data.paramOneType, data.paramTwoType]);
      setParamsName([data.paramOneName, data.paramTwoName]);
      setParamsSteps([data.paramOneSteps, data.paramTwoSteps]);
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
      {loading ? (
        <>
          <div>Loading...</div>
        </>
      ) : (
        <div className={styles.content}>
          <div className={styles.leftSide}>
            <h2>{scenarioName} 2D Results</h2>
            {paramsType.map((paramType, index) => (
              <h4 key={index}>
                Parameter {index + 1}: {paramType}
                <br />
                - Event: {paramsName[index]}
                <br />
                - Lower Bound: {paramsSteps[index][0]}{paramType === "First of Two Investments" && "%"}
                <br />
                - Upper Bound: {paramsSteps[index][paramsSteps[index].length - 1]}{paramType === "First of Two Investments" && "%"}
                <br />
                - Step Size: {paramsSteps[index][1] - paramsSteps[index][0]}{paramType === "First of Two Investments" && "%"}
              </h4>
            ))}
            <div className={styles.buttonGroup}>
              <button
                className={styles.addChart}
                onClick={() => setShowAdd2DModal(true)}
              >
                Add 2D Charts
              </button>
              <button
                className={styles.addChart}
                onClick={() => setShowAddChartsModal(true)}
              >
                Add Charts
              </button>
            </div>
            <div className={styles.chartGenerate}>
              <button
                onClick={handleGenerateCharts}
                className={styles.generateButton}
              >
                Generate Charts
              </button>
            </div>

            <ModalTwoD
              isOpen={showAdd2DModal}
              setIsOpen={setShowAdd2DModal}
              setCharts={setCharts}
            />

            <ModalAddChart
              isOpen={showAddChartsModal}
              setIsOpen={setShowAddChartsModal}
              setCharts={setCharts}
              hasParameterValue={true}
              paramOneType={paramsType[0]}
              paramOneName={paramsName[0]}
              paramOneSteps={paramsSteps[0]}
              paramTwoType={paramsType[1]}
              paramTwoName={paramsName[1]}
              paramTwoSteps={paramsSteps[1]}
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
            {!showCharts && (
              <div className={styles.chartCount}>No Charts Generated Yet...</div>
            )}
            {showCharts && charts.length === 0 && (
              <div className={styles.noChartsMessage}>
                Please add a selection of charts, and then generate.
              </div>
            )}
            {showCharts &&
              charts.length > 0 &&
              charts.map((chart) => (
                <div key={chart.id} className={styles.chart}>
                  <h3>{chart.label}</h3>
                  {/* Charts will show depending on type */}
                  {chart.type === "Shaded Line Chart" && Object.keys(chart.data).length !== 0 && (
                    <ShadedLineChart data={chart.data} />
                  )}
                  {chart.type === "Line Chart" && Object.keys(chart.data).length !== 0 && (
                    <LineChart data={chart.data} />
                  )}
                  {chart.type === "Stacked Bar Chart" && Object.keys(chart.data).length !== 0 && (
                    <StackedBarChart data={chart.data} />
                  )}
                  {chart.type === "Surface Plot" && Object.keys(chart.data).length !== 0 && (
                    <SurfacePlot data={chart.data} />
                  )}
                  {chart.type === "Contour Plot" && Object.keys(chart.data).length !== 0 && (
                    <ContourPlot data={chart.data} />
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </Layout >
  );
};

export default TwoD;
