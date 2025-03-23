import { useState, useImperativeHandle } from "react";
import { useOutletContext } from "react-router-dom";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";

const Limits = () => {
  // Get ref from the context 
  const { childRef } = useOutletContext();
  // Expose the handleSubmit function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));
  // For error validation
  const [errors, setErrors] = useState({});

  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    inflationAssumption: { type: "", fixedValue: "", isPercentage: true, lowerBound: "", upperBound: "", mean: "", stdDev: "" },
  });

  const handleDistributionsChange = (name, field, value) => {
    setDistributions((prev) => {
      const updatedDistributions = { ...prev };
      // Check if name is a number field and parse if so
      let processedValue = value;
      if (field !== "type" && value.length > 0) {
        processedValue = Number(value);
      }
      updatedDistributions[name][field] = processedValue;
      return updatedDistributions;
    });
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const [formData, setFormData] = useState({
    inflationAssumption: distributions.inflationAssumption,
    initialLimit: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === "initialLimit" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateFields = () => {
    const newErrors = {};
    // Validate Expected Dividends/Interest
    if (!distributions.inflationAssumption.type) {
      newErrors.inflationAssumption = "Expected Dividends/Interest is required";
    } else {
      if (distributions.inflationAssumption.type === "fixed") {
        if (distributions.inflationAssumption.fixedValue === "") {
          newErrors.inflationAssumption = "Fixed percentage is required";
        }
      } else if (distributions.inflationAssumption.type === "uniform") {
        if (!distributions.inflationAssumption.lowerBound ||
          !distributions.inflationAssumption.upperBound) {
          newErrors.inflationAssumption = "Both lower and upper bounds are required";
        }
      } else if (distributions.inflationAssumption.type === "normal") {
        if (!distributions.inflationAssumption.mean || !distributions.inflationAssumption.stdDev) {
          newErrors.inflationAssumption = "Mean and standard deviation are required for normal distribution";
        }
      }
    }
    if (!formData.initialLimit && formData.initialLimit !== 0) {
      newErrors.initialLimit = "Initial limit is required";
    } else if (formData.initialLimit < 0) {
      newErrors.initialLimit = "Initial limit must be non-negative";
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = () => {
    validateFields();
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
        {errors.inflationAssumption && <span className={styles.error}>{errors.inflationAssumption}</span>}
        <hr />
        <label>
          After-Tax Retirement Accounts Initial Limit on Annual Contributions
          <br />
          <input type="number" name="initialLimit" min="0" onChange={handleChange} />
          {errors.initialLimit && <span className={styles.error}>{errors.initialLimit}</span>}
        </label>
      </form>
    </div>
  );
};

export default Limits;