import { useState, useImperativeHandle, useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { validateRequired, validateDistribution, clearErrors } from "../../utils/ScenarioHelper";
import Axios from "axios";

import Distributions from "../../components/Distributions";
import ErrorMessage from "../../components/ErrorMessage";

import styles from "./Form.module.css";
import errorStyles from "../../components/ErrorMessage.module.css";
import buttonStyles from "../ScenarioForm.module.css";
import Tooltip from "../../components/Tooltip";
const InvestmentTypesForm = () => {
  const navigate = useNavigate();

  const { childRef, scenarioHash, fetchScenarioHash } = useOutletContext();
  const { scenarioId, id } = useParams();

  const [loading, setLoading] = useState(true);
  // expectedAnnualReturn and expectedDividendsInterest can have fixedValue, mean, or stdDev fields
  const [distributions, setDistributions] = useState({
    expectedAnnualReturn: { type: "", isPercentage: false },
    expectedDividendsInterest: { type: "", isPercentage: false },
  });
  const [formData, setFormData] = useState({
    investmentType: null,
    description: null,
    expenseRatio: null,
    taxability: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
      Axios.defaults.withCredentials = true;

      // Fetch the existing investment type data from the server
      Axios.get(`/investmentType/${scenarioId}/${id}`).then((response) => {
        const investmentType = response.data;
        console.log(investmentType);
        setDistributions((prev) => ({
          ...prev,
          expectedAnnualReturn: investmentType.expectedAnnualReturn || prev.expectedAnnualReturn,
          expectedDividendsInterest: investmentType.expectedDividendsInterest || prev.expectedDividendsInterest,
        }));
        setFormData((prev) => ({
          ...prev,
          investmentType: investmentType.name || prev.investmentType,
          description: investmentType.description || prev.description,
          expenseRatio: investmentType.expenseRatio || prev.expenseRatio,
          taxability: investmentType.taxability || prev.taxability,
        }));
        setLoading(false);
      }).catch((error) => {
        console.error('Error fetching investment type:', error);
      });
    } else {
      setLoading(false);
    }
  }, [id, scenarioId]);


  // Expose the handleSubmit function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));

  // Below handler copied and pasted from AI code generation from BasicInfo.jsx
  const handleDistributionsChange = (name, field, value) => {
    setDistributions((prev) => {
      const updatedDistributions = { ...prev };
      if (field === "type") {
        // Reset the distribution values when the type changes
        switch (value) {
          case "fixed":
            updatedDistributions[name] = { type: value, isPercentage: false, value: null };
            break;
          case "normal":
            updatedDistributions[name] = { type: value, isPercentage: false, mean: null, standardDeviation: null };
            break;
          default:
            // Should not happen
            break;
        }
      } else {
        const processedValue = value === "" ? null : Number(value);
        updatedDistributions[name][field] = processedValue;
      }
      return updatedDistributions;
    })
    // Clear errors when user makes changes
    clearErrors(setErrors, name);
  };

  // Below handlers copied and pasted from AI code generation from BasicInfo.jsx
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Check if name is a number field and parse if so
    const processedValue = name === "expenseRatio" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors when user makes changes
    clearErrors(setErrors, name);
  };

  const handleNavigate = async () => {
    await fetchScenarioHash();
    navigate(`/ScenarioForm/${scenarioId}/investment-types`);
  };

  const validateFields = () => {
    const newErrors = {};
    for (const [field, value] of Object.entries(formData)) {
      // Description is optional
      if (field === "description") {
        continue;
      }
      validateRequired(newErrors, field, value);
    }

    validateDistribution(newErrors, "expectedAnnualReturn", distributions.expectedAnnualReturn, true);
    validateDistribution(newErrors, "expectedDividendsInterest", distributions.expectedDividendsInterest);

    if (formData.expenseRatio !== null && formData.expenseRatio > 100) {
      newErrors.expenseRatio = "Expense ratio must be between 0 and 100";
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };

  const uploadToBackEnd = async () => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    const data = {
      name: formData.investmentType.trim(),
      description: formData.description,
      expectedAnnualReturn: distributions.expectedAnnualReturn,
      expenseRatio: formData.expenseRatio,
      expectedDividendsInterest: distributions.expectedDividendsInterest,
      taxability: formData.taxability,
    };

    try {
      let response = null;
      if (id) {
        const currentHash = await Axios.get(`/concurrency/${scenarioId}`);
        if (currentHash.data !== scenarioHash) {
          alert("This scenario has been modified by you on another tab or another user. Redirecting to the Investment Type page...");
          handleNavigate();
          return;
        }
        response = await Axios.put(`/investmentType/${scenarioId}/${id}`, data);
      } else {
        response = await Axios.post(`/investmentType/${scenarioId}`, data);
      }
      console.log(response.data);
      handleNavigate();
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors((prev) => ({ ...prev, investmentType: "Investment type name already exists" }));
      } else if (error.response?.status === 403) {
        setErrors((prev) => ({ ...prev, investmentType: "You do not have permission to edit this scenario" }));
      } else {
        setErrors((prev) => ({ ...prev, investmentType: "An error occurred while creating the investment type" }));
      }
      console.error('Error creating investment type:', error);
      return false;
    } finally {
      await fetchScenarioHash();
    }
  }

  const handleSubmit = async () => {
    if (!validateFields()) {
      // Scroll to the top to show the error message
      window.scrollTo(0, 0);
      return;
    }
    await uploadToBackEnd();
  };

  return (
    <div id={styles.newItemContainer}>
      {loading ?
        <p>Loading...</p>
        :
        <>
          <h2>New Investment Type</h2>
          <ErrorMessage errors={errors} />
          <form>
            <label>
              Investment Type Name
              <input
                type="text"
                name="investmentType"
                defaultValue={formData.investmentType}
                id="investmentType"
                className={`${styles.newline} ${errors.investmentType ? errorStyles.errorInput : ""}`}
                onChange={handleChange}
              />
            </label>
            <label>
              Description
              <textarea name="description" defaultValue={formData.description} onChange={handleChange} />
            </label>
            <label id="expectedAnnualReturn">Expected Annual Return <Tooltip text ="This is the anticipated yearly gain or loss from an investment."/></label>
            <Distributions
              name="expectedAnnualReturn"
              options={["fixed", "normal"]}
              requirePercentage={true}
              onChange={handleDistributionsChange}
              defaultValue={distributions.expectedAnnualReturn}
              className={errors.expectedAnnualReturn ? errorStyles.highlight : ""}
            />
            <label className={styles.newline}>
              Expense Ratio <Tooltip text = "This is the annual fee a fund charges to manage investments, expressed as a percentage. Input a number between 0-100."/>
              <input
                type="number"
                name="expenseRatio"
                defaultValue={formData.expenseRatio}
                id="expenseRatio"
                className={`${styles.newline} ${errors.expenseRatio ? errorStyles.errorInput : ""}`}
                onChange={handleChange}
              />
            </label>
            <label id="expectedDividendsInterest">Expected Annual Income from Dividends or Interests <Tooltip text = " The estimated yearly income earned from holding investments like stocks (dividends) or bonds (interest)." /></label>
            <Distributions
              name="expectedDividendsInterest"
              options={["fixed", "normal"]}
              requirePercentage={true}
              onChange={handleDistributionsChange}
              defaultValue={distributions.expectedDividendsInterest}
              className={errors.expectedDividendsInterest ? errorStyles.highlight : ""}
            />
            <label id="taxability" className={styles.newline}>
              Taxability
            </label>
            <label className={`${styles.radioButton} ${errors.taxability ? errorStyles.highlight : ""}`}>
              <input type="radio" name="taxability" value="taxExempt" checked={formData.taxability === "taxExempt"} onChange={handleChange} />
              Tax-exempt
            </label>
            <label className={`${styles.radioButton} ${errors.taxability ? errorStyles.highlight : ""}`}>
              <input type="radio" name="taxability" value="taxable" checked={formData.taxability === "taxable"} onChange={handleChange} />
              Taxable
            </label>
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
              {id ? "Update" : "Create"}
            </button>
          </div>
        </>
      }
    </div>
  );
};

export default InvestmentTypesForm;