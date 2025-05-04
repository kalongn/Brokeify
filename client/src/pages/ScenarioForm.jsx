import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { useRef } from "react";
import Axios from "axios";

import Layout from "../components/Layout";
import styles from "./ScenarioForm.module.css";

const ScenarioForm = () => {

  const { scenarioId } = useParams(); // Get the scenario ID from the URL params

  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  // Enables access to children components (AKA form sections)
  const childRef = useRef(null);

  // Define the sections and their paths
  const sections = [
    { path: "basic-information", label: "Basic Information" },
    { path: "investment-types", label: "Investment Types" },
    { path: "investments", label: "Investments" },
    { path: "event-series", label: "Event Series" },
    { path: "limits", label: "Inflation & Contribution Limits" },
    { path: "spending-strategy", label: "Spending Strategy" },
    { path: "expense-strategy", label: "Expense Withdrawal Strategy" },
    { path: "rmd-strategy", label: "Required Minimum Distribution Strategy" },
    { path: "roth-strategy", label: "Roth Conversion Strategy & Optimizer" },
  ];

  const [pageNumber, setPageNumber] = useState(0);
  const [scenarioHash, setScenarioHash] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set the base URL for Axios
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/concurrency/${scenarioId}`).then((response) => {
      setLoading(false);
      console.log(response.data);
      setScenarioHash(response.data);
    }).catch((error) => {
      console.error('Error fetching scenario name:', error);
    });
  }, [scenarioId, pageNumber]);

  // Determine the current section index based on the URL
  const currentSectionIndex = sections.findIndex(
    (section) => path.endsWith(section.path)
  );

  const handleNextSave = () => {
    if (currentSectionIndex < sections.length - 1) {
      navigate(`/ScenarioForm/${scenarioId}/${sections[currentSectionIndex + 1].path}`);
      setPageNumber(currentSectionIndex + 1);
    }
    else {
      navigate(`/Home`);
    }
  };

  const handleBack = () => {
    navigate(`/ScenarioForm/${scenarioId}/${sections[currentSectionIndex - 1].path}`);
    setPageNumber(currentSectionIndex - 1);
  };

  // Next/Save button acts as submission button
  // Must const handleSubmit in child component
  const handleSectionSubmit = async () => {
    // console.log(childRef.current);
    try {
      const upToDateHash = await Axios.get(`/concurrency/${scenarioId}`);
      if (upToDateHash.data !== scenarioHash) {
        alert("This scenario has been modified by another user. Please refresh the page.");
        return;
      }
    } catch (error) {
      console.error('Error fetching scenario hash:', error);
      alert("Error fetching scenario hash. Please try again.");
      return;
    }
    if (childRef.current) {
      if (!await childRef.current.handleSubmit()) {
        // Scroll to the top to show the error message
        window.scrollTo(0, 0);
        return;
      }
    }
    // navigate to the next page
    handleNextSave();
  };

  return (
    <Layout>
      {loading ?
        <div>
          Loading...
        </div> :
        <div id={styles.formBackground}>
          <div id={styles.formSection}>
            <Outlet context={{ childRef, scenarioId }} />
            {/* Navigation buttons */}
            {/* Only appears if not creating a new investment type or event series */}
            {/* 
            Prompt to AI (Copilot): Create navigation buttons to go between sections
            Generated code worked and only condensed Next and Save & Close buttons code
           */}
            {!(path.includes("new") || path.includes("edit")) && <div id={styles.navButtons}>
              <button
                className={styles.deemphasizedButton}
                onClick={handleBack}
                disabled={currentSectionIndex === 0}
              >
                Back
              </button>
              {/* On the last section, next replaced by save & close */}
              <button type="submit" className={styles.emphasizedButton} onClick={handleSectionSubmit}>
                {currentSectionIndex !== sections.length - 1 ? "Next" : "Save & Close"}
              </button>
            </div>}
          </div>
        </div>
      }

    </Layout>
  );
};

export default ScenarioForm;
