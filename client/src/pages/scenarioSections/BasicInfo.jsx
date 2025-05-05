import { useState, useImperativeHandle, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { stateMap, validateRequired, validateDistribution, clearErrors } from "../../utils/ScenarioHelper";
import Axios from "axios";

import Select from "react-select";
import Distributions from "../../components/Distributions";
import ModalState from "../../components/ModalState";
import ErrorMessage from "../../components/ErrorMessage";

import styles from "./Form.module.css";
import errorStyles from "../../components/ErrorMessage.module.css";
import Tooltip from "../../components/Tooltip";
const BasicInfo = () => {
  // Prompt to AI (Amazon Q): I want field validation in the children and the submit button is in the parent
  // It took multiple rounds of prompts and adding context to get the solution with useOutletContext and useImperativeHandler

  // Get ref from the context 
  const { childRef, scenarioId } = useOutletContext();

  const [showStateModal, setShowStateModal] = useState(false);
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
    clearErrors(setErrors, name);
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
    clearErrors(setErrors, name);
  };

  const handleSelectChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, state: selectedOption.value }));
    // Clear errors when user makes changes
    clearErrors(setErrors, "selectInput");
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
    if (formData.birthYear !== undefined && newErrors.birthYear === undefined) {
      if (formData.birthYear < 1900 || formData.birthYear > currentYear) {
        newErrors.birthYear = `Birth Year must be between 1900 and ${currentYear}`;
      }
      // Validate life expectancy distribution
      // Account for fixed and normal distribution
      const lifeExpectancyNum = distributions.lifeExpectancy.value !== undefined && distributions.lifeExpectancy.value !== null ?
        distributions.lifeExpectancy.value : distributions.lifeExpectancy.mean;

      if (lifeExpectancyNum !== undefined && lifeExpectancyNum !== null) {
        if (formData.birthYear + lifeExpectancyNum < currentYear) {
          newErrors.lifeExpectancy = "Life Expectancy cannot result in a death year in the past";
        }
        else if (lifeExpectancyNum > 122) {
          newErrors.lifeExpectancy = "Life Expectancy cannot reasonably exceed 122";
        }
      }
    }

    // Validate spouse birth year
    if (formData.spouseBirthYear !== undefined && newErrors.spouseBirthYear === undefined && formData.maritalStatus === "MARRIEDJOINT") {
      if ((formData.spouseBirthYear < 1900 || formData.spouseBirthYear > currentYear)) {
        newErrors.spouseBirthYear = `Spouse Birth Year must be between 1900 and ${currentYear}`;
      }
      // Validate spouse life expectancy distribution
      // Account for fixed and normal distribution
      const spouseLifeExpectancyNum = distributions.spouseLifeExpectancy.value !== undefined && distributions.spouseLifeExpectancy.value !== null ?
        distributions.spouseLifeExpectancy.value : distributions.spouseLifeExpectancy.mean;

      if (spouseLifeExpectancyNum !== undefined && spouseLifeExpectancyNum !== null) {
        if (formData.spouseBirthYear + spouseLifeExpectancyNum < currentYear) {
          newErrors.spouseLifeExpectancy = "Spouse Life Expectancy cannot result in death in the past";
        }
        else if (spouseLifeExpectancyNum > 122) {
          newErrors.spouseLifeExpectancy = "Spouse Life Expectancy cannot reasonably exceed 122";
        }
      }
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };

  // Check if state tax data is in database
  const validateStateFile = () => {
    const stateFile = `${formData.state}_${formData.maritalStatus}`;
    // TODO: fix this arbitrary if statement
    if (stateFile !== "NY_MARRIEDJOINT" && Object.keys(errors).length === 0) {
      setShowStateModal(true);
      return false;
    }
    return true;
  }

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
    if (!validateFields() || !validateStateFile()) {
      return false;
    }
    return await uploadToBackend();
  };

  return (
    <div id={styles.formSection}>
      <h2 id={styles.heading}>Basic Information</h2>
      <ModalState isOpen={showStateModal} onClose={setShowStateModal} uploadToBackend={uploadToBackend} />
      {loading ? <div> Loading...</div> :
        <>
          <ErrorMessage errors={errors} />
          <form>
            <label>
              Scenario Name
              <input
                type="text"
                name="name"
                className={errors.name ? errorStyles.errorInput : ""}
                onChange={handleTextChange}
                defaultValue={formData.name || undefined}
              />
            </label>
            <label>
              Financial Goal
              <p className={styles.description}>
                Specify a non-negative number representing the desired yearly
                minimum total value of your investments.
              </p>
              <div className={`${styles.moneyInputContainer} ${styles.shortInput}`}>
                <input
                  type="number"
                  name="financialGoal"
                  id="financialGoal"
                  className={errors.financialGoal ? errorStyles.errorInput : ""}
                  defaultValue={formData.financialGoal || undefined} onChange={handleTextChange} />
              </div>
            </label>
            <label className={styles.newline}>
              <div className={styles.groupIcon}>
                <span>State of Residence</span>
                <Tooltip text={"If state income tax data for your residence is missing, upload a YAML file or tax will be ignored. Brackets/deductions adjust for inflation."} />
              </div>
              {/* 
              Prompt to AI (Amazon Q): Rewrite the highlighted code to account for the structure
              of stateMap in the utility file: <PASTED_UTILITY_FILE_CODE>
            */}
              <Select
                options={Object.entries(stateMap).map(([value, label]) => ({ value, label }))}
                id="state"
                className={`${styles.shortInput} select ${errors.state ? errorStyles.errorInput : ""}`}
                onChange={handleSelectChange}
                value={formData.state ? { value: formData.state, label: stateMap[formData.state] } : undefined}
              />
            </label>
            <label className={styles.newline}>
              Martial Status
            </label>
            <div id="maritalStatus" className={styles.radioButtonContainer}>
              <label className={`${styles.radioButton} ${errors.maritalStatus ? errorStyles.highlight : ""}`}>
                <input
                  type="radio"
                  checked={formData.maritalStatus === "SINGLE"}
                  onChange={() => { setFormData((prev) => ({ ...prev, maritalStatus: "SINGLE" })); clearErrors(setErrors, "maritalStatus"); }}
                />
                Single
              </label>
              <label className={`${styles.radioButton} ${errors.maritalStatus ? errorStyles.highlight : ""}`}>
                <input
                  type="radio"
                  checked={formData.maritalStatus === "MARRIEDJOINT"}
                  onChange={() => { setFormData((prev) => ({ ...prev, maritalStatus: "MARRIEDJOINT" })); clearErrors(setErrors, "maritalStatus"); }}
                />
                Married
              </label>
            </div>
            <div className={styles.columns}>
              <div>
                <label className={styles.newline}>
                  Your Birth Year
                  <input
                    type="number"
                    name="birthYear"
                    id="birthYear"
                    className={errors.birthYear ? errorStyles.errorInput : ""}
                    onChange={handleTextChange} defaultValue={formData.birthYear}
                  />
                </label>
                <label id="lifeExpectancy">Your Life Expectancy</label>
                <span><Tooltip text={"Note: A simultion of a scenario starts in current year and ends when user reaches this life expenectancy."}></Tooltip>
                </span>

                <Distributions
                  options={["fixed", "normal"]}
                  name="lifeExpectancy"
                  onChange={handleDistributionsChange}
                  defaultValue={distributions.lifeExpectancy}
                  className={errors.lifeExpectancy ? errorStyles.highlight : ""}
                />
              </div>
              {formData.maritalStatus === "MARRIEDJOINT" && <div>
                <label id="spouseBirthYear" className={styles.newline}>
                  Spouse Birth Year
                  <input
                    type="number"
                    name="spouseBirthYear"
                    onChange={handleTextChange}
                    defaultValue={formData.spouseBirthYear}
                    className={errors.spouseBirthYear ? errorStyles.errorInput : ""}
                  />
                </label>
                <label id="spouseLifeExpectancy">Spouse Life Expectancy</label>
                <span><Tooltip text={"The system assumes joint investment ownership, and upon one spouse’s death, the survivor’s tax status changes to single, excluding the deceased's income and expenses from future transactions."}></Tooltip> </span>
                <Distributions
                  options={["fixed", "normal"]}
                  name="spouseLifeExpectancy"
                  onChange={handleDistributionsChange}
                  defaultValue={distributions.spouseLifeExpectancy}
                  className={errors.spouseLifeExpectancy ? errorStyles.highlight : ""}
                />
              </div>
              }
            </div>
            <br />
          </form>
        </>}
    </div>
  );
};

export default BasicInfo;
