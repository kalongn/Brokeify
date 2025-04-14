import { useState, useEffect, useImperativeHandle } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import Axios from "axios";

import { validateRequired, validateDistribution } from "../../utils/ScenarioHelper";
import Distributions from "../../components/Distributions";
import ErrorMessage from "../../components/ErrorMessage";

import styles from "./Form.module.css";
import errorStyles from "../../components/ErrorMessage.module.css";

const Limits = () => {
  // useOutletContext and useImperativeHandle were AI-generated solutions as stated in BasicInfo.jsx
  // Get ref from the context 
  const { scenarioId } = useParams();
  const { childRef } = useOutletContext();

  const [errors, setErrors] = useState({});
  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    // inflationAssumption can have fixedValue, lowerBound, upperBound, mean, or standardDeviation fields
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
    // Prompted AI (Amazon Q) then copied from RothStrategy.jsx
    setErrors(prev => {
      // eslint-disable-next-line no-unused-vars
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  };

  // Below handlers copied and pasted from AI code generation from BasicInfo.jsx
  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === "initialLimit" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors when user makes changes
    // Prompted AI (Amazon Q) then copied from RothStrategy.jsx
    setErrors(prev => {
      // eslint-disable-next-line no-unused-vars
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  };

  const validateFields = () => {
    const newErrors = {};
    const infDist = distributions.inflationAssumption;
    validateRequired(newErrors, "initialLimit", formData.initialLimit);
    validateDistribution(newErrors, "inflationAssumption", infDist);

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
      <h2 id={styles.heading}>Inflation & Contribution Limits</h2>
      <ErrorMessage errors={errors} />
      <form>
        <label id="inflationAssumption">Inflation Assumption Percentage</label>
        <Distributions
          options={["fixed", "uniform", "normal"]}
          name="inflationAssumption"
          requirePercentage={true}
          onChange={handleDistributionsChange}
          defaultValue={distributions.inflationAssumption}
          showCheckbox={false}
          className={errors.inflationAssumption ? errorStyles.highlight : ""}
        />
        <hr />
        <label id="initialLimit">
          After-Tax Retirement Accounts Initial Limit on Annual Contributions
          <br />
          <input
            type="number"
            name="initialLimit"
            onChange={handleChange}
            defaultValue={formData.initialLimit}
            className={errors.initialLimit ? errorStyles.errorInput : ""}
          />
        </label>
      </form>
    </div>
  );
};

export default Limits;