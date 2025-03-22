import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";

// TODO: add edit/delete buttons for investment types

const InvestmentTypesForm = () => {
  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    expectedAnnualReturn: { type: "", fixedValue: "", isPercentage: false, mean: "", stdDev: "" },
    expectedDividendsInterest: { type: "", fixedValue: "", isPercentage: false, mean: "", stdDev: "" },
  });

  const handleDistributionsChange = (name, field, value) => {
    setDistributions((prev) => {
      const updatedDistributions = { ...prev };
      updatedDistributions[name][field] = value;
      return updatedDistributions;
    });
  };

  const navigate = useNavigate();
  // TODO: add handler function for creation
  const handleClick = () => {
    navigate("/ScenarioForm/investment-types");
  };
  return (
    <div>
      <h2>New Investment Type</h2>
      <form>
        <label>
          Investment Type Name
          <input type="text" name="investmentType" className={styles.newline} />
        </label>
        <label className={styles.newline}>
          Description
          <input type="text" name="description" className={styles.newline} />
        </label>

        <Distributions
          label="Expected Annual Return"
          options={["fixed", "normal"]}
          name="expectedAnnualReturn"
          value={distributions.expectedAnnualReturn.type}
          onChange={handleDistributionsChange}
          fixedLabel={"Fixed Value or Percentage"}
          calculatedLabel={"Calculated Annual Return"}
        />
        <label className={styles.newline}>
          Expense Ratio
          <input type="number" className={styles.newline} />
        </label>
        <Distributions
          label="Expected Annual Income from Dividends or Interests"
          options={["fixed", "normal"]}
          name="expectedDividendsInterest"
          value={distributions.expectedDividendsInterest.type}
          onChange={handleDistributionsChange}
          fixedLabel={"Fixed Value or Percentage"}
          calculatedLabel={"Calculated Annual Income"}
        />
        <label className={styles.newline}>
          Taxability
        </label>
        <label>
          <input type="radio" value="taxExempt" />
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