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
  };

  const navigate = useNavigate();
  const handleNavigate = () => {
    navigate("/ScenarioForm/investment-types");
  };
  const validateFields = () => {
    console.log("============= validated");
    console.log(formData);
  };
  const handleSubmit = () => {
    validateFields();
    handleNavigate();
  };
  return (
    <div id={styles.newItemContainer}>
      <h2>New Investment Type</h2>
      <form>
        <label>
          Investment Type Name
          <input type="text" name="investmentType" className={styles.newline} onChange={handleChange} />
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
          calculatedLabel={"Calculated Annual Return"}
        />
        <label className={styles.newline}>
          Expense Ratio
          <input type="number" name="expenseRatio" className={styles.newline} onChange={handleChange}/>
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
        <label className={styles.radioButton}>
          <input type="radio" name="taxability" value="taxExempt" onChange={handleChange} />
          Tax-exempt
        </label>
        <label className={styles.radioButton}>
          <input type="radio" name="taxability" value="taxable" onChange={handleChange} />
          Taxable
        </label>
      </form>

      <div id={buttonStyles.navButtons} style={{margin: "1rem 0"}}>
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