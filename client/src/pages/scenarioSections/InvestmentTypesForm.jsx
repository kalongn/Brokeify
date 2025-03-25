import { useState, useEffect, useImperativeHandle } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Axios from "axios";

import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";
import buttonStyles from "../ScenarioForm.module.css";

const InvestmentTypesForm = () => {
  const navigate = useNavigate();
  const { childRef, scenarioId } = useOutletContext();
  const [distributions, setDistributions] = useState({
    expectedAnnualReturn: { type: "", fixedValue: "", isPercentage: false, mean: "", stdDev: "" },
    expectedDividendsInterest: { type: "", fixedValue: "", isPercentage: false, mean: "", stdDev: "" },
  });
  const [formData, setFormData] = useState({
    investmentType: null,
    description: null,
    expectedAnnualReturn: distributions.expectedAnnualReturn,
    expenseRatio: null,
    expectedDividendsInterest: distributions.expectedDividendsInterest,
    taxability: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      expectedAnnualReturn: distributions.expectedAnnualReturn,
      expectedDividendsInterest: distributions.expectedDividendsInterest
    }));
  }, [distributions]);

  // Expose the validateFields function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Check if name is a number field and parse if so
    const processedValue = name === "expenseRatio" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleNavigate = () => {
    navigate(`/ScenarioForm/${scenarioId}/investment-types`);
  };

  const validateFields = () => {
    const newErrors = {};

    // Validate investment type name
    if (!formData.investmentType?.trim()) {
      newErrors.investmentType = "This field is required";
    }

    // Validate expected annual return distribution
    const expReturn = distributions.expectedAnnualReturn;
    if (!expReturn.type) {
      newErrors.expectedAnnualReturn = "This field is required";
    } else {
      if (expReturn.type === "fixed") {
        if (expReturn.fixedValue === "") {
          newErrors.expectedAnnualReturn = "This field is required";
        } else if (expReturn.fixedValue < 0) {
          newErrors.expectedAnnualReturn = "Expected annual return must be non-negative";
        } else if (expReturn.isPercentage && expReturn.fixedValue > 100) {
          newErrors.expectedAnnualReturn = "Percentage must be between 0 and 100";
        }
      } else if (expReturn.type === "normal") {
        if (!expReturn.mean || !expReturn.stdDev) {
          newErrors.expectedAnnualReturn = "Mean and standard deviation are required";
        } else if (expReturn.mean < 0) {
          newErrors.expectedAnnualReturn = "Mean must be non-negative";
        } else if (expReturn.stdDev < 0) {
          newErrors.expectedAnnualReturn = "Standard deviation must be non-negative";
        }
      }
    }

    // Validate Expense Ratio
    if (formData.expenseRatio === null || formData.expenseRatio === "") {
      newErrors.expenseRatio = "This field is required";
    } else if (formData.expenseRatio < 0) {
      newErrors.expenseRatio = "Expense Ratio must be non-negative";
    }

    // Validate expected dividends/interest distribution
    const expDiv = distributions.expectedDividendsInterest;
    if (!expDiv.type) {
      newErrors.expectedDividendsInterest = "This field is required";
    } else {
      if (expDiv.type === "fixed") {
        if (expDiv.fixedValue === "") {
          newErrors.expectedDividendsInterest = "This field is required";
        } else if (expDiv.fixedValue < 0) {
          newErrors.expectedDividendsInterest = "Expected annual income from dividends/interest must be non-negative";
        } else if (expDiv.isPercentage && expDiv.fixedValue > 100) {
          newErrors.expectedDividendsInterest = "Percentage must be between 0 and 100";
        }
      } else if (expDiv.type === "normal") {
        if (!expDiv.mean || !expDiv.stdDev) {
          newErrors.expectedDividendsInterest = "Mean and standard deviation are required";
        } else if (expDiv.mean < 0) {
          newErrors.expectedDividendsInterest = "Mean must be non-negative";
        } else if (expDiv.stdDev < 0) {
          newErrors.expectedDividendsInterest = "Standard deviation must be non-negative";
        }
      }
    }

    // Validate Taxability
    if (!formData.taxability) {
      newErrors.taxability = "This field is required";
    }

    // Set all errors at once
    setErrors(newErrors);
    console.log(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };

  const uploadToBackEnd = async () => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    const data = {
      name: formData.investmentType,
      description: formData.description,
      expectedAnnualReturn: distributions.expectedAnnualReturn,
      expenseRatio: formData.expenseRatio,
      expectedDividendsInterest: distributions.expectedDividendsInterest,
      taxability: formData.taxability === "taxable",
    };

    try {
      const response = await Axios.post(`/investmentType/${scenarioId}`, data);
      console.log(response.data);
      handleNavigate();
    } catch (error) {
      console.error('Error creating investment type:', error); //TODO: handle error on duplicate Investment Type name
      return false;
    }
  }

  const handleSubmit = async () => {
    if (!validateFields()) {
      return;
    }
    await uploadToBackEnd();
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