import { useState } from "react";
import { useParams } from "react-router-dom";
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
  console.log("Simulation ID:", simulationId);

  const scenarioName = "My Scenario"; // Temp kept for ESLint
  const [showAddChartsModal, setShowAddChartsModal] = useState(false);
  const [showAdd2DModal, setShowAdd2DModal] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [charts, setCharts] = useState([]);

  const handleGenerateCharts = async () => {
    try {

      const mockSurfaceData = {
        x: [50, 55, 60, 65, 70, 75],
        y: [0.1, 0.2, 0.3, 0.4, 0.5],
        z: [
          [0.6, 0.8, 0.9, 0.7, 0.5, 0.3],
          [0.7, 1.0, 1.2, 0.9, 0.6, 0.4],
          [0.8, 1.3, 1.5, 1.1, 0.7, 0.5],
          [0.7, 1.0, 1.2, 0.9, 0.6, 0.4],
          [0.6, 0.8, 0.9, 0.7, 0.5, 0.3],
        ]
      };


      const generatedCharts = [
        {
          id: 1,
          type: "Surface Plot",
          label: "Surface Plot",
          data: mockSurfaceData
        },
        {
          id: 2,
          type: "Contour Plot",
          label: "Contour Plot",
          data: mockSurfaceData
        }
      ];

      setCharts(generatedCharts);
      setShowCharts(true);
    } catch (error) {
      console.error("Error generating charts:", error);
      setShowCharts(false);
    }
  };

  return (
    <Layout>
      <div className={styles.content}>
        <div className={styles.leftSide}>
          <h2>{scenarioName} 2D Results</h2>
          <div className={styles.buttonGroup}>
            <button className={styles.addChart} onClick={() => setShowAdd2DModal(true)}>
              Add 2D Charts
            </button>
            <button className={styles.addChart} onClick={() => setShowAddChartsModal(true)}>
              Add Charts
            </button>
          </div>
          <div className={styles.chartGenerate}>
            <button onClick={handleGenerateCharts} className={styles.generateButton}>
              Generate Charts
            </button>
          </div>

          <ModalTwoD
            isOpen={showAdd2DModal}
            setIsOpen={setShowAdd2DModal}
            setCharts={setCharts}
            isScenarioParameterNumeric={false}
          />

          <ModalAddChart
            isOpen={showAddChartsModal}
            setIsOpen={setShowAddChartsModal}
            setCharts={setCharts}
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
          {showCharts && charts.length > 0 && charts.map((chart) => (
            <div key={chart.id} className={styles.chart}>
              <h3>{chart.label}</h3>
              {/* Charts will show depending on type */}
              {chart.type === "Shaded Line Chart" && chart.data && <ShadedLineChart data={chart.data} />}
              {chart.type === "Line Chart" && chart.data && <LineChart data={chart.data} />}
              {chart.type === "Stacked Bar Chart" && chart.data && <StackedBarChart data={chart.data} />}
              {chart.type === "Surface Plot" && chart.data && (
                <SurfacePlot data={chart.data} />
              )}
              {chart.type === "Contour Plot" && chart.data && (
                <ContourPlot data={chart.data} />
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default TwoD;
