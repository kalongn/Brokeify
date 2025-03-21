import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Form.module.css";

// TODO: try modularizing for fixed and normal dist
// TODO: add edit/delete buttons for investment types

const InvestmentTypesForm = () => {
    const [expectedAnnualReturn, setExpectedAnnualReturn] = useState("");
    const [expectedDividendsInterest, setExpectedDividendsInterest] = useState("");
    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate("/ScenarioForm/investment-types");
    };
    return (
        <div>
            <h2>New Investment Type</h2>
            <form>
                <label>
                    Investment Type Name
                    <input type="text" name="investment-type" className={styles.newline} />
                </label>
                <label className={styles.newline}>
                    Description
                    <input type="text" name="description" className={styles.newline} />
                </label>
                <label className={styles.newline}>
                    Expected Annual Return
                </label>
                <label>
                    <input 
                    type="radio" 
                    name="expected-annual-return" 
                    value="fixed" 
                    onClick={(e) => setExpectedAnnualReturn(e.target.value)}
                    />
                    Fixed Value or Percentage
                </label>
                <label className={styles.newline}>
                    <input 
                    type="radio" 
                    name="expected-annual-return" 
                    value="normal-dist" 
                    onClick={(e) => setExpectedAnnualReturn(e.target.value)}
                    />
                    Sample from Normal Distribution
                </label>

                {expectedAnnualReturn === "fixed" && (
                    <>
                    <label>
                        Fixed Value (specify if percentage)
                        <input type="number" name="fixed-value" className={styles.newline}/>
                    </label>
                    <label>
                        <input type="checkbox" />
                        Percentage
                    </label>
                    </>
                )}
                {expectedAnnualReturn === "normal-dist" && (
                    <>
                    <label>
                        Mean
                        <input type="number" name="mean" min="1" />
                        Standard Deviation
                        <input type="number" name="std-dev" min="0" />
                    </label>
                    <label>
                        Calculated Annual Return
                        <input type="number" name="calculated-return" disabled />
                    </label>
                    </>
                )}
                <label className={styles.newline}>
                    Expense Ratio
                    <input type="number" className={styles.newline} />
                </label>
                <label>
                    Expected Annual Income from Dividends or Interests
                </label>
                <label className={styles.newline}>
                    <input 
                    type="radio" 
                    name="expected-dividends-interest" 
                    value="fixed" 
                    onClick={(e) => setExpectedDividendsInterest(e.target.value)}
                    />
                    Fixed Value or Percentage
                </label>
                <label className={styles.newline}>
                    <input 
                    type="radio" 
                    name="expected-dividends-interest" 
                    value="normal-dist" 
                    onClick={(e) => setExpectedDividendsInterest(e.target.value)}
                    />
                    Sample from Normal Distribution
                </label>
                {expectedDividendsInterest === "fixed" && (
                    <>
                    <label>
                        Fixed Value (specify if percentage)
                        <input type="number" name="fixed-value" className={styles.newline}/>
                    </label>
                    <label>
                        <input type="checkbox" />
                        Percentage
                    </label>
                    </>
                )}
                {expectedDividendsInterest === "normal-dist" && (
                    <>
                    <label>
                        Mean
                        <input type="number" name="mean" min="1" />
                        Standard Deviation
                        <input type="number" name="std-dev" min="0" />
                    </label>
                    <label>
                        Calculated Annual Return
                        <input type="number" name="calculated-return" disabled />
                    </label>
                    </>
                )}
            </form>

            <div style={{ marginTop: "20px" }}>
              <button
                  onClick={handleClick}
                  style={{ marginRight: "10px" }}
              >
                  Cancel
              </button>
              <button onClick={handleClick}>Create</button>
          </div>
        </div>
    );
};

export default InvestmentTypesForm;