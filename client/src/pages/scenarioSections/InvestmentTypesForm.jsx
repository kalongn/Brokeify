import { useState, useImperativeHandle, useEffect } from "react";
import { useNavigate, useOutletContext, useParams, useLocation } from "react-router-dom";
import { validateRequired, validateDistribution } from "../../utils/ScenarioHelper";
import Axios from "axios";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";
import buttonStyles from "../ScenarioForm.module.css";

const InvestmentTypesForm = () => {
  const navigate = useNavigate();
  // Access the list of investmentTypesNames passed from InvestmentTypes section page
  const investmentTypeNames = useLocation().state;

  const { childRef } = useOutletContext();
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
  };

  // Below handlers copied and pasted from AI code generation from BasicInfo.jsx
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
    for (const [field, value] of Object.entries(formData)) {
      // Description is optional
      if (field === "description") {
        continue;
      }
      validateRequired(newErrors, field, value);
    }

    validateDistribution(newErrors, "expectedAnnualReturn", distributions.expectedAnnualReturn);
    validateDistribution(newErrors, "expectedDividendsInterest", distributions.expectedDividendsInterest);

    if (formData.expenseRatio !== null && formData.expenseRatio > 100) {
      newErrors.expenseRatio = "Expense ratio must be between 0 and 100";
    }

    // Check for duplicate names
    const hasDuplicateName = investmentTypeNames.find(name =>
      name === formData.investmentType.trim()
    );
    if(hasDuplicateName) {
      newErrors.investmentType = "Investment type name already exists";
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
      name: formData.investmentType,
      description: formData.description,
      expectedAnnualReturn: distributions.expectedAnnualReturn,
      expenseRatio: formData.expenseRatio,
      expectedDividendsInterest: distributions.expectedDividendsInterest,
      taxability: formData.taxability,
    };

    try {
      const response = id ? await Axios.put(`/investmentType/${scenarioId}/${id}`, data) : await Axios.post(`/investmentType/${scenarioId}`, data);
      console.log(response.data);
      handleNavigate();
    } catch (error) {
      console.error('Error creating investment type:', error);
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
      {loading ?
        <p>Loading...</p>
        :
        <>
          <h2>New Investment Type</h2>
          <form>
            <label>
              Investment Type Name
              <input type="text" name="investmentType" defaultValue={formData.investmentType} className={styles.newline} onChange={handleChange} />
              {errors.investmentType && <div className={styles.error}>{errors.investmentType}</div>}
            </label>
            <label>
              Description
              <textarea name="description" defaultValue={formData.description} onChange={handleChange} />
            </label>
            <label>Expected Annual Return</label>
            <Distributions
              name="expectedAnnualReturn"
              options={["fixed", "normal"]}
              requirePercentage={true}
              onChange={handleDistributionsChange}
              defaultValue={distributions.expectedAnnualReturn}
            />
            {errors.expectedAnnualReturn && <div className={styles.error}>{errors.expectedAnnualReturn}</div>}
            <label className={styles.newline}>
              Expense Ratio
              <input type="number" name="expenseRatio" defaultValue={formData.expenseRatio} className={styles.newline} onChange={handleChange} />
              {errors.expenseRatio && <div className={styles.error}>{errors.expenseRatio}</div>}
            </label>
            <label>Expected Annual Income from Dividends or Interests</label>
            <Distributions
              name="expectedDividendsInterest"
              options={["fixed", "normal"]}
              requirePercentage={true}
              onChange={handleDistributionsChange}
              defaultValue={distributions.expectedDividendsInterest}
            />
            {errors.expectedDividendsInterest && <div className={styles.error}>{errors.expectedDividendsInterest}</div>}
            <label className={styles.newline}>
              Taxability
            </label>
            <label className={styles.radioButton}>
              <input type="radio" name="taxability" value="taxExempt" checked={formData.taxability === "taxExempt"} onChange={handleChange} />
              Tax-exempt
            </label>
            <label className={styles.radioButton}>
              <input type="radio" name="taxability" value="taxable" checked={formData.taxability === "taxable"} onChange={handleChange} />
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
              {id ? "Update" : "Create"}
            </button>
          </div>
        </>
      }
    </div>
  );
};

export default InvestmentTypesForm;