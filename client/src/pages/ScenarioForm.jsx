import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { useRef } from "react";
import Axios from "axios";

import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
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
    { path: "limits", label: "Inflation & Limits" },
    { path: "spending-strategy", label: "Spending Strategy" },
    { path: "expense-strategy", label: "Expense Strategy" },
    { path: "rmd-strategy", label: "RMD Strategy" },
    { path: "roth-strategy", label: "Roth Strategy" },
  ];
  const onCreationForm = path.includes("new") || path.includes("edit");

  const [scenarioHash, setScenarioHash] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;
  }, []);

  const fetchScenarioHash = useCallback(async () => {
    try {
      const response = await Axios.get(`/concurrency/${scenarioId}`);
      setScenarioHash(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching scenario hash:', error);
      alert("Error fetching scenario hash. Please try again.");
      return null;
    }
  }, [scenarioId]);

  useEffect(() => {
    setLoading(true);
    fetchScenarioHash().then((hash) => {
      if (hash) {
        setLoading(false);
      }
    });
  }, [scenarioId, fetchScenarioHash]);

  useEffect(() => {
    console.log("Scenario Hash:", scenarioHash);
  }, [scenarioHash]);

  // Determine the current section index based on the URL
  const currentSectionIndex = sections.findIndex(
    (section) => path.endsWith(section.path)
  );

  const handleNextSave = async () => {
    await fetchScenarioHash();
    if (currentSectionIndex < sections.length - 1) {
      navigate(`/ScenarioForm/${scenarioId}/${sections[currentSectionIndex + 1].path}`);
    }
    else {
      navigate(`/Home`);
    }
  };

  const handleBack = async () => {
    await fetchScenarioHash();
    navigate(`/ScenarioForm/${scenarioId}/${sections[currentSectionIndex - 1].path}`);
  };

  // Next/Save button acts as submission button
  // Must const handleSubmit in child component
  const handleSectionSubmit = async () => {
    try {
      const upToDateHash = await Axios.get(`/concurrency/${scenarioId}`);
      if (upToDateHash.data !== scenarioHash) {
        setScenarioHash(upToDateHash.data);
        alert("This scenario has been modified by you on another tab or another user. Will be refreshing the page...");
        navigate(0);
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
          {!onCreationForm &&
            <ProgressBar currentSectionIndex={currentSectionIndex} sections={sections} />
          }
          <div id={styles.formSection} style={onCreationForm ? { marginTop: "4rem" } : {}}>
            <Outlet context={{ childRef, scenarioId, scenarioHash, fetchScenarioHash }} />
            {/* Navigation buttons */}
            {/* Only appears if not creating a new investment type or event series */}
            {/* 
            Prompt to AI (Copilot): Create navigation buttons to go between sections
            Generated code worked and only condensed Next and Save & Close buttons code
           */}
            {!onCreationForm && <div id={styles.navButtons}>
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
