import { useState, useImperativeHandle } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";
import buttonStyles from "../ScenarioForm.module.css";

const InvestmentTypesForm = () => {
  // Get ref from the context 
  const { childRef } = useOutletContext();
  // Expose the validateFields function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));

  // Add error state
  const [errors, setErrors] = useState({});

  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    expectedAnnualReturn: { type: "", fixedValue: "", isPercentage: false, mean: "", stdDev: "" },
    expectedDividendsInterest: { type: "", fixedValue: "", isPercentage: false, mean: "", stdDev: "" },
  });

  const handleDistributionsChange = (name, field, value) => {
    setDistributions((prev) => {
      const updatedDistributions = { ...prev };
      // Check if name is a number field and parse if so
      // If the input is a percentage (denoted by isPercentage), must convert in backend
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
    investmentType: null,
    description: null,
    expectedAnnualReturn: distributions.expectedAnnualReturn,
    expenseRatio: null,
    expectedDividendsInterest: distributions.expectedDividendsInterest,
    taxability: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Check if name is a number field and parse if so
    const processedValue = name === "expenseRatio" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const navigate = useNavigate();
  const handleNavigate = () => {
    navigate("/ScenarioForm/investment-types");
  };
  const validateFields = () => {
    const newErrors = {};

    // Validate Investment Type Name
    if (!formData.investmentType?.trim()) {
      newErrors.investmentType = "Investment Type Name is required";
    }

    // Validate Expected Annual Return
    if (!distributions.expectedAnnualReturn.type) {
      newErrors.expectedAnnualReturn = "Expected Annual Return is required";
    } else {
      if (distributions.expectedAnnualReturn.type === "fixed") {
        if (distributions.expectedAnnualReturn.fixedValue === "") {
          newErrors.expectedAnnualReturn = "Fixed value or percentage is required";
        }
      } else if (distributions.expectedAnnualReturn.type === "normal") {
        if (!distributions.expectedAnnualReturn.mean || !distributions.expectedAnnualReturn.stdDev) {
          newErrors.expectedAnnualReturn = "Mean and standard deviation are required for normal distribution";
        }
      }
    }

    // Validate Expense Ratio
    if (formData.expenseRatio === null || formData.expenseRatio === "") {
      newErrors.expenseRatio = "Expense Ratio is required";
    } else if (formData.expenseRatio < 0) {
      newErrors.expenseRatio = "Expense Ratio cannot be negative";
    }

    // Validate Expected Dividends/Interest
    if (!distributions.expectedDividendsInterest.type) {
      newErrors.expectedDividendsInterest = "Expected Dividends/Interest is required";
    } else {
      if (distributions.expectedDividendsInterest.type === "fixed") {
        if (distributions.expectedDividendsInterest.fixedValue === "") {
          newErrors.expectedDividendsInterest = "Fixed value or percentage is required";
        }
      } else if (distributions.expectedDividendsInterest.type === "normal") {
        if (!distributions.expectedDividendsInterest.mean || !distributions.expectedDividendsInterest.stdDev) {
          newErrors.expectedDividendsInterest = "Mean and standard deviation are required for normal distribution";
        }
      }
    }

    // Validate Taxability
    if (!formData.taxability) {
      newErrors.taxability = "Taxability is required";
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = () => {
    if (!validateFields()) {
      return;
    }
    handleNavigate();
  };
  return (
    <div id={styles.newItemContainer}>
      <h2>New Investment Type</h2>
      <form>
        <label>
          Investment Type Name
          <input type="text" name="investmentType" className={styles.newline} onChange={handleChange} />
          {errors.investmentType && <div className={styles.error}>{errors.investmentType}</div>}
        </label>
        <label>
          Description
          <textarea name="description" onChange={handleChange} />
        </label>

        <Distributions
          label="Expected Annual Return"
          options={["fixed", "normal"]}
          name="expectedAnnualReturn"
          value={distributions.expectedAnnualReturn.type}
          onChange={handleDistributionsChange}
          fixedLabel={"Fixed Value or Percentage"}
        />
        {errors.expectedAnnualReturn && <div className={styles.error}>{errors.expectedAnnualReturn}</div>}
        <label className={styles.newline}>
          Expense Ratio
          <input type="number" name="expenseRatio" className={styles.newline} onChange={handleChange} />
          {errors.expenseRatio && <div className={styles.error}>{errors.expenseRatio}</div>}
        </label>
        <Distributions
          label="Expected Annual Income from Dividends or Interests"
          options={["fixed", "normal"]}
          name="expectedDividendsInterest"
          value={distributions.expectedDividendsInterest.type}
          onChange={handleDistributionsChange}
          fixedLabel={"Fixed Value or Percentage"}
        />
        {errors.expectedDividendsInterest && <div className={styles.error}>{errors.expectedDividendsInterest}</div>}
        <label className={styles.newline}>
          Taxability
        </label>
        <label className={styles.radioButton}>
          <input type="radio" name="taxability" value="taxExempt" onChange={handleChange} />
          Tax-exempt
        </label>
        <label className={styles.radioButton}>
          <input type="radio" name="taxability" value="taxable" onChange={handleChange} />
          Taxable
        </label>
        {errors.taxability && <div className={styles.error}>{errors.taxability}</div>}
      </form>

      <div id={buttonStyles.navButtons} style={{ margin: "1rem 0" }}>
        <button
          onClick={handleNavigate}
          className={buttonStyles.deemphasizedButton}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className={buttonStyles.emphasizedButton}
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default InvestmentTypesForm;