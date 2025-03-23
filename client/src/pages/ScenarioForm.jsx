import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useRef } from "react";
import Layout from "../components/Layout";
import styles from "./ScenarioForm.module.css";

const ScenarioForm = () => {
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
    { path: "sharing", label: "Sharing Settings" },
  ];

  // Determine the current section index based on the URL
  const currentSectionIndex = sections.findIndex(
    (section) => path.endsWith(section.path)
  );

  const handleNextSave = () => {
    if (currentSectionIndex < sections.length - 1) {
      navigate(`/ScenarioForm/${sections[currentSectionIndex + 1].path}`);
    }
    else {
      navigate(`/Home`);
    }
  };

  const handleBack = () => {
    navigate(`/ScenarioForm/${sections[currentSectionIndex - 1].path}`);
  };

  // Next/Save button acts as submission button
  // Must const handleSubmit in child component
  const handleSectionSubmit = () => {
    // console.log(childRef.current);
    if (childRef.current) {
      if(!childRef.current.handleSubmit()) {
        return;
      }
    }
    // navigate to the next page
    handleNextSave();
  };

  return (
    <Layout>
      <div id={styles.formBackground}>
        <div id={styles.formSection}>
          {/* Render the current section and pass the childRef */}
          <Outlet context={{ childRef }} />

          {/* Navigation buttons */}
          {/* Only appears if not creating a new investment type or event series */}
          {!path.includes("new") && <div id={styles.navButtons}>
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
    </Layout>
  );
};

export default ScenarioForm;
