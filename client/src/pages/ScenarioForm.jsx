import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";

const ScenarioForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;

    // Define the sections and their paths
    const sections = [
        { path: "basic-information", label: "Basic Information" },
        { path: "basic-information-continued", label: "Basic Information Continued" },
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

    // Redirect to the first section when first creating new scenario
    useEffect(() => {
        if (path === "/ScenarioForm") {
            navigate(`/ScenarioForm/${sections[0].path}`);
        }
    }, [path, navigate, sections]);

    // Determine the current section index based on the URL
    const currentSectionIndex = sections.findIndex(
        (section) => path.endsWith(section.path)
    );

    const handleNext = () => {
        if (currentSectionIndex < sections.length - 1) {
            navigate(`/ScenarioForm/${sections[currentSectionIndex + 1].path}`);
        }
    };

    const handleBack = () => {
        if (currentSectionIndex > 0) {
            navigate(`/ScenarioForm/${sections[currentSectionIndex - 1].path}`);
        }
    };
    const handleSave = () => {
        navigate(`/Home`);
        console.log("Save & Close clicked");
    };
    return (
        <Layout>
            <div>
                {/* Render the current section */}
                <Outlet />

                {/* Navigation buttons */}
                {/* Only appears if not creating a new investment type or event series */}
                {!path.includes("new") && <div style={{ marginTop: "20px" }}>
                    <button
                        onClick={handleBack}
                        disabled={currentSectionIndex === 0}
                        style={{ marginRight: "10px" }}
                    >
                        Back
                    </button>
                    {/* On the last section, next replaced by save & close */}
                    {currentSectionIndex !== sections.length - 1 ? 
                      <button onClick={handleNext}>Next</button>
                      :
                      <button onClick={handleSave}>Save & Close</button>
                    }
                </div>}
            </div>
        </Layout>
    );
};

export default ScenarioForm;
