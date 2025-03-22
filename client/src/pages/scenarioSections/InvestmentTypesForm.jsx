import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Distributions from "../../components/Distributions";
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

                <Distributions 
                    label="Expected Annual Return"
                    options={["fixed", "normal-dist"]}
                    name="expected-annual-return"
                    value={expectedAnnualReturn}
                    onChange={setExpectedAnnualReturn}
                    fixedLabel={"Fixed Value or Percentage"}
                    calculatedLabel={"Calculated Annual Return"}
                />
                <label className={styles.newline}>
                    Expense Ratio
                    <input type="number" className={styles.newline} />
                </label>
                <Distributions 
                    label="Expected Annual Income from Dividends or Interests"
                    options={["fixed", "normal-dist"]}
                    name="expected-dividends-interest"
                    value={expectedDividendsInterest}
                    onChange={setExpectedDividendsInterest}
                    fixedLabel={"Fixed Value or Percentage"}
                    calculatedLabel={"Calculated Annual Income"}
                />
                <label className={styles.newline}>
                    Taxability
                </label>
                <label>
                    <input type="radio" value="tax-exempt" />
                    Tax-exempt
                    <input type="radio" value="taxable" />
                    Taxable
                </label>
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