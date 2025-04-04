import { useState, useImperativeHandle, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { stateMap, validateRequired, validateDistribution } from "../../utils/ScenarioHelper";
import Select from "react-select";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";
import Axios from "axios";

const BasicInfo = () => {
  // Prompt to AI (Amazon Q): I want field validation in the children and the submit button is in the parent
  // It took multiple rounds of prompts and adding context to get the solution with useOutletContext and useImperativeHandler

  // Get ref from the context 
  const { childRef, scenarioId } = useOutletContext();

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    // lifeExpectancy and spouseLifeExpectancy can have fixedValue, mean, or stdDev fields
    lifeExpectancy: { type: "" },
    spouseLifeExpectancy: { type: "" },
  });

  const [formData, setFormData] = useState({
    name: null,
    financialGoal: null,
    state: null,
    maritalStatus: null,
    birthYear: null,
    lifeExpectancy: distributions.lifeExpectancy,
    spouseBirthYear: null,
    spouseLifeExpectancy: distributions.spouseLifeExpectancy,
  });

  // Expose the validateFields function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));

  useEffect(() => {
    // Initialize formData with default values for the scenario
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/basicInfo/${scenarioId}`)
      .then((response) => {
        const data = response.data;
        setDistributions((prev) => ({
          ...prev,
          lifeExpectancy: data.lifeExpectancy || prev.lifeExpectancy,
          spouseLifeExpectancy: data.spouseLifeExpectancy || prev.spouseLifeExpectancy,
        }));

        setFormData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          financialGoal: data.financialGoal || prev.financialGoal,
          state: data.state || prev.state,
          maritalStatus: data.maritalStatus || prev.maritalStatus,
          birthYear: data.birthYear || prev.birthYear,
          spouseBirthYear: data.spouseBirthYear || prev.spouseBirthYear,
        }));
      }).catch((error) => {
        console.error("Error fetching basic info:", error);
      });

    setLoading(false);
  }, [scenarioId]);

  // For field validation and parsing to number
  const FIELD_TYPES = {
    NUMBER: new Set(["financialGoal", "birthYear", "spouseBirthYear"]),
  };

  // Prompt to AI (Amazon Q): How do I get the form fields for the distributions to save to the distributions data set?
  // There were no changes needed for this code snippet
  const handleDistributionsChange = (name, field, value) => {
    setDistributions((prev) => {
      const updatedDistributions = { ...prev };
      if (field === "type") {
        // Reset the distribution values when the type changes
        switch (value) {
          case "fixed":
            updatedDistributions[name] = { type: value, value: null };
            break;
          case "normal":
            updatedDistributions[name] = { type: value, mean: null, standardDeviation: null };
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

  // Prompt to AI (Amazon Q): How do I get the form fields for the fields to be saved? Number fields should be parsed to numbers
  // There were no changes needed for both the handlers below
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    // Check if name is a number field and parse if so
    let processedValue = value;
    if (FIELD_TYPES.NUMBER.has(name)) {
      processedValue = Number(value);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, state: selectedOption.value }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, state: "" }));
  };

  const validateFields = () => {
    const newErrors = {};
    const currentYear = new Date().getFullYear();
    for (const [field, value] of Object.entries(formData)) {
      // Spouse fields are dependent on maritalStatus
      if (formData.maritalStatus !== "MARRIEDJOINT" && field.includes("spouse")) {
        continue;
      }
      // Distribution fields require a different function to validate
      validateRequired(newErrors, field, value);
    }

    // Validate distribution fields
    validateDistribution(newErrors, "lifeExpectancy", distributions.lifeExpectancy);
    if (formData.maritalStatus === "MARRIEDJOINT") {
      validateDistribution(newErrors, "spouseLifeExpectancy", distributions.spouseLifeExpectancy);
    }


    // Validate birth year
    if (formData.birthYear !== undefined) {
      if (formData.birthYear < 1900 || formData.birthYear > currentYear) {
        newErrors.birthYear = `Birth year must be between 1900 and ${currentYear}`;
      }
      // Validate life expectancy distribution
      if (distributions.lifeExpectancy.value !== undefined && distributions.lifeExpectancy.value !== null) {
        if (formData.birthYear + distributions.lifeExpectancy.value < currentYear) {
          newErrors.lifeExpectancy = "Life expectancy cannot result in a death year in the past";
        }
        else if (distributions.lifeExpectancy.value > 122) {
          newErrors.lifeExpectancy = "Life expectancy cannot reasonably exceed 122";
        }
      }
    }

    // Validate spouse birth year
    if (formData.spouseBirthYear !== undefined && formData.maritalStatus === "MARRIEDJOINT") {
      if ((formData.spouseBirthYear < 1900 || formData.spouseBirthYear > currentYear)) {
        newErrors.spouseBirthYear = `Birth year must be between 1900 and ${currentYear}`;
      }
      // Validate spouse life expectancy distribution
      if (distributions.spouseLifeExpectancy.value !== undefined && distributions.spouseLifeExpectancy.value !== null) {

        if (formData.spouseBirthYear + distributions.spouseLifeExpectancy.value < currentYear) {
          newErrors.spouseLifeExpectancy = "Life expectancy cannot result in death in the past";
        }
        else if (distributions.spouseLifeExpectancy.value > 122) {
          newErrors.spouseLifeExpectancy = "Life expectancy cannot reasonably exceed 122";
        }
      }
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };

  const uploadToBackend = async () => {
    const data = {
      name: formData.name,
      financialGoal: formData.financialGoal,
      state: formData.state,
      maritalStatus: formData.maritalStatus,
      birthYear: formData.birthYear,
      lifeExpectancy: distributions.lifeExpectancy,
      spouseBirthYear: formData.maritalStatus === "SINGLE" ? undefined : formData.spouseBirthYear,
      spouseLifeExpectancy: formData.maritalStatus === "SINGLE" ? undefined : distributions.spouseLifeExpectancy,
    };

    try {
      const response = await Axios.post(`/basicInfo/${scenarioId}`, data);
      console.log(response.data);
      return true;
    } catch (error) {
      console.error("Error uploading basic info:", error);
      return false;
    }
  }

  const handleSubmit = async () => {
    if (!validateFields()) {
      return false;
    }
    return await uploadToBackend();
  };

  return (
    <div id={styles.formSection}>
      <h2 id={styles.heading}>Basic Information</h2>
      {loading ? <div> Loading...</div> :
        <form>
          <label>
            Scenario Name
            <input
              type="text"
              name="name"
              className={styles.newline}
              onChange={handleTextChange}
              defaultValue={formData.name || undefined}
              required
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
          </label>
          <label>
            Financial Goal
            <p className={styles.description}>
              Specify a non-negative number representing the desired yearly
              minimum total value of your investments.
            </p>
            <div className={`${styles.moneyInputContainer} ${styles.shortInput}`}>
              <input type="number" name="financialGoal" min="0"
                defaultValue={formData.financialGoal || undefined} onChange={handleTextChange} />
            </div>
            {errors.financialGoal && <span className={styles.error}>{errors.financialGoal}</span>}
          </label>
          <label className={styles.newline}>
            State of Residence
            {/* 
              Prompt to AI (Amazon Q): Rewrite the highlighted code to account for the structure
              of stateMap in the utility file: <PASTED_UTILITY_FILE_CODE>
            */}
            <Select
              options={Object.entries(stateMap).map(([value, label]) => ({ value, label }))}
              className={`${styles.shortInput} ${styles.select}`}
              onChange={handleSelectChange}
              value={formData.state ? { value: formData.state, label: stateMap[formData.state] } : undefined}
            />

            {errors.state && <span className={styles.error}>{errors.state}</span>}
          </label>
          <label className={styles.newline}>
            Martial Status
          </label>
          <div className={styles.radioButtonContainer}>
            <label className={styles.radioButton}>
              <input
                type="radio"
                checked={formData.maritalStatus === "SINGLE"}
                onChange={() => setFormData((prev) => ({ ...prev, maritalStatus: "SINGLE" }))}
              />
              Single
            </label>
            <label className={styles.radioButton}>
              <input
                type="radio"
                checked={formData.maritalStatus === "MARRIEDJOINT"}
                onChange={() => setFormData((prev) => ({ ...prev, maritalStatus: "MARRIEDJOINT" }))}
              />
              Married
            </label>
            {errors.maritalStatus && <span className={styles.error}>{errors.maritalStatus}</span>}
          </div>
          <div className={styles.columns}>
            <div>
              <label className={styles.newline}>
                Your Birth Year
                <input type="number" name="birthYear" onChange={handleTextChange} defaultValue={formData.birthYear} />
                {errors.birthYear && <span className={styles.error}>{errors.birthYear}</span>}
              </label>
              <label>Your Life Expectancy</label>
              <Distributions
                options={["fixed", "normal"]}
                name="lifeExpectancy"
                onChange={handleDistributionsChange}
                defaultValue={distributions.lifeExpectancy}
              />
              {errors.lifeExpectancy && <span className={styles.error}>{errors.lifeExpectancy}</span>}
            </div>
            {formData.maritalStatus === "MARRIEDJOINT" && <div>
              <label className={styles.newline}>
                Spouse Birth Year
                <input type="number" name="spouseBirthYear" onChange={handleTextChange} defaultValue={formData.spouseBirthYear} />
                {errors.spouseBirthYear && <span className={styles.error}>{errors.spouseBirthYear}</span>}
              </label>
              <label>Spouse Life Expectancy</label>
              <Distributions
                options={["fixed", "normal"]}
                name="spouseLifeExpectancy"
                onChange={handleDistributionsChange}
                defaultValue={distributions.spouseLifeExpectancy}
              />
              {errors.spouseLifeExpectancy && <span className={styles.error}>{errors.spouseLifeExpectancy}</span>}
            </div>
            }
          </div>
          <br />
        </form>}
    </div>
  );
};

export default BasicInfo;
