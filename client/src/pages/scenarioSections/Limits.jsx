import { useState } from "react";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";

const Limits = () => {
  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    inflationAssumption: { type: "", fixedValue: "", isPercentage: true, lowerBound: "", upperBound: "", mean: "", stdDev: "" },
  });

  const handleDistributionsChange = (name, field, value) => {
    setDistributions((prev) => {
      const updatedDistributions = { ...prev };
      updatedDistributions[name][field] = value;
      return updatedDistributions;
    });
  };
  return (
    <div>
      <h2>Inflation & Contribution Limits</h2>
      <form>
        <Distributions
          label="Inflation Assumption"
          options={["fixed", "uniform", "normal"]}
          name="inflationAssumption"
          value={distributions.inflationAssumption.type}
          onChange={handleDistributionsChange}
          fixedLabel="Fixed Percentage"
          calculatedLabel={"Calculated Inflation Assumption"}
        />
        <hr />
        <label>
          Retirement Accounts Initial Limit on Annual Contributions
        </label>
        <label className={styles.newline}>
          Pre-Tax
          <input type="number" name="preTaxLimit" min="0" />
        </label>
        <label>
          After-Tax
          <input type="number" name="afterTaxLimit" min="0" />
        </label>
      </form>
    </div>
  );
};

export default Limits;