import { useState, useEffect, useImperativeHandle } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import Axios from "axios";

import { validateRequired, validateDistribution } from "../../utils/ScenarioHelper";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";

const Limits = () => {
  // useOutletContext and useImperativeHandle were AI-generated solutions as stated in BasicInfo.jsx
  // Get ref from the context 
  const { scenarioId } = useParams();
  const { childRef } = useOutletContext();

  const [errors, setErrors] = useState({});
  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    // inflationAssumption can have fixedValue, lowerBound, upperBound, mean, or stdDev fields
    inflationAssumption: { type: "" },
  });

  const [formData, setFormData] = useState({
    initialLimit: null,
  });

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    // Fetch the existing limits data from the server
    Axios.get(`/limits/${scenarioId}`).then((response) => {
      const limits = response.data;
      setDistributions((prev) => ({
        ...prev,
        inflationAssumption: limits.inflationAssumptionDistribution || prev.inflationAssumption
      }));
      setFormData((prev) => ({
        ...prev,
        initialLimit: limits.annualPostTaxContributionLimit || prev.initialLimit
      }));
    }).catch((error) => {
      console.error('Error fetching limits:', error);
    });
  }, [scenarioId]);

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
            updatedDistributions[name] = { type: value, value: null, isPercentage: true };
            break;
          case "normal":
            updatedDistributions[name] = { type: value, mean: null, standardDeviation: null, isPercentage: true };
            break;
          case "uniform":
            updatedDistributions[name] = { type: value, lowerBound: null, upperBound: null, isPercentage: true };
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
    });
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Below handlers copied and pasted from AI code generation from BasicInfo.jsx
  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === "initialLimit" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateFields = () => {
    const newErrors = {};
    for (const [field, value] of Object.entries(formData)) {
      // Distribution fields require a different function to validate
      if (field !== "inflationAssumption") {
        validateRequired(newErrors, field, value);
      } else {
        validateDistribution(newErrors, field, value);
      }
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };

  const uploadToBackend = async () => {
    const limits = {
      initialLimit: formData.initialLimit,
      inflationAssumption: distributions.inflationAssumption,
    };

    try {
      // Send the limits data to the server
      const response = await Axios.post(`/limits/${scenarioId}`, limits);
      console.log(response.data);
      return true;
    }
    catch (error) {
      console.error('Error saving limits:', error);
      return false
    }
  }

  const handleSubmit = async () => {
    if (!validateFields()) {
      return false;
    }
    return await uploadToBackend();
  };

  return (
    <div>
      <h2>Inflation & Contribution Limits</h2>
      <form>
        <label>Inflation Assumption</label>
        <Distributions
          options={["fixed", "uniform", "normal"]}
          name="inflationAssumption"
          onChange={handleDistributionsChange}
          defaultValue={distributions.inflationAssumption}
        />
        {errors.inflationAssumption && <span className={styles.error}>{errors.inflationAssumption}</span>}
        <hr />
        <label>
          After-Tax Retirement Accounts Initial Limit on Annual Contributions
          <br />
          <input
            type="number"
            name="initialLimit"
            onChange={handleChange}
            defaultValue={formData.initialLimit}
          />
          {errors.initialLimit && <span className={styles.error}>{errors.initialLimit}</span>}
        </label>
      </form>
    </div>
  );
};

export default Limits;