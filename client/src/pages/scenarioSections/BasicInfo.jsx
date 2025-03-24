import { useState, useImperativeHandle } from "react";
import { useOutletContext } from "react-router-dom";
import Select from "react-select";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";

// TODO: add scenario name validation (no duplicates at the very least)

const BasicInfo1 = () => {
  // Get ref from the context 
  const { childRef } = useOutletContext();
  // Expose the validateFields function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));
  // For error validation
  const [errors, setErrors] = useState({});
  // For parsing to number
  const FIELD_TYPES = {
    NUMBER: new Set(["financialGoal", "birthYear", "spouseBirthYear"]),
  };

  const states = [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" },
    { value: "DE", label: "Delaware" },
    { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" },
    { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" },
    { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" },
    { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" },
    { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" },
    { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" },
    { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" },
    { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" },
    { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" },
    { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" },
    { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" },
    { value: "WY", label: "Wyoming" }
  ];

  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    lifeExpectancy: { type: null, fixedValue: null, mean: null, stdDev: null },
    spouseLifeExpectancy: { type: null, fixedValue: null, mean: null, stdDev: null },
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
    name: null,
    financialGoal: null,
    state: null,
    maritalStatus: null,
    birthYear: null,
    lifeExpectancy: distributions.lifeExpectancy,
    spouseBirthYear: null,
    spouseLifeExpectancy: distributions.spouseLifeExpectancy,
  });

  const handleChange = (e) => {
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
    // General check for if all required fields are filled out
    // TODO: fix for whitespace
    const requiredFields = ['name', 'financialGoal', 'state', 'maritalStatus', 'birthYear', 'lifeExpectancy'];
    requiredFields.forEach(field => {
      if (formData[field] === null || formData[field] === undefined || formData[field] === "") {
          newErrors[field] = "This field is required";
      }
      else {
        // Adds errors for distribution fields
        if (formData[field].type === null) {
          newErrors[field] = "This field is required";
        }
      }
    });
    // Validate financial goal
    if (formData.financialGoal < 0) {
      newErrors.financialGoal = "Financial goal must be non-negative";
    }
    // // TODO: add error checking for state if it is in db

    // Validate birth year
    if (formData.birthYear && (formData.birthYear < 1900 || formData.birthYear > currentYear)) {
      newErrors.birthYear = `Birth year must be between 1900 and ${currentYear}`;
    }
    // Validate life expectancy distribution
    const life = distributions.lifeExpectancy;
    if (life.type === "fixed") {
      if (!life.fixedValue) {
        newErrors.lifeExpectancy = "Fixed life expectancy value is required";
      } else if (formData.birthYear + life.fixedValue < currentYear) {
        newErrors.lifeExpectancy = "Life expectancy cannot result in a death year in the past";
      }
      else if (life.fixedValue > 122) {
        newErrors.lifeExpectancy = "Life expectancy cannot reasonably exceed 122";
      }
    }
    if (life.type === "normal") {
      if (!life.mean || (!life.stdDev && life.stdDev !== 0)) {
        newErrors.lifeExpectancy = "Mean and standard deviation are required";
      } else if (formData.birthYear + life.mean < currentYear) {
        newErrors.lifeExpectancy = "Mean life expectancy cannot result in a death year in the past";
      }
      else if (life.mean > 122) {
        newErrors.lifeExpectancy = "Life expectancy cannot reasonably exceed 122";
      }
    }

    // Validate spouse fields
    if (formData.maritalStatus === "married") {
      if (formData.spouseBirthYear === null || formData.spouseBirthYear === undefined || formData.spouseBirthYear === "") {
        newErrors.spouseBirthYear = "This field is required";
      }
      if (formData.spouseBirthYear && (formData.spouseBirthYear < 1900 || formData.spouseBirthYear > currentYear)) {
        newErrors.spouseBirthYear = `Birth year must be between 1900 and ${currentYear}`;
      }
      // Validate spouse life expectancy distribution
      const sLife = distributions.spouseLifeExpectancy;
      if(!sLife.type) {
        newErrors.spouseLifeExpectancy = "This field is required";
      }
      console.log(sLife);
      if (sLife.type === "fixed") {
        if (!sLife.fixedValue) {
          newErrors.spouseLifeExpectancy = "Fixed spouse life expectancy value is required";
        }
        else if (formData.spouseBirthYear + sLife.fixedValue < currentYear) {
          newErrors.spouseLifeExpectancy = "Life expectancy cannot result in a death year in the past";
        }
        else if (sLife.fixedValue > 122) {
          newErrors.lifeExpectancy = "Life expectancy cannot reasonably exceed 122";
        }
      }
      if (sLife.type === "normal") {
        if (!sLife.mean || (!sLife.stdDev && sLife.stdDev !== 0)) {
          newErrors.spouseLifeExpectancy = "Mean and standard deviation are required";
        } else if (formData.spouseBirthYear + sLife.mean < currentYear) {
          newErrors.spouseLifeExpectancy = "Mean life expectancy cannot result in a death year in the past";
        }
      }
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = () => {
    return validateFields();
  };

  // TODO: apply the heading style to all other section components
  return (
    <div id={styles.formSection}>
      <h2 id={styles.heading}>Basic Information</h2>
      <form>
        <label>
          Scenario Name
          <input
            type="text"
            name="name"
            className={styles.newline}
            onChange={handleChange}
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
            <input type="number" name="financialGoal" min="0" onChange={handleChange} />
          </div>
          {errors.financialGoal && <span className={styles.error}>{errors.financialGoal}</span>}
        </label>
        <label className={styles.newline}>
          State of Residence
          <Select options={states} className={`${styles.shortInput} ${styles.select}`} onChange={handleSelectChange} />
          {errors.state && <span className={styles.error}>{errors.state}</span>}
        </label>
        <label className={styles.newline}>
          Martial Status
        </label>
        <div className={styles.radioButtonContainer}>
          <label className={styles.radioButton}>
            <input
              type="radio"
              name="maritalStatus"
              value="single"
              onChange={handleChange}
            />
            Single
          </label>
          <label className={styles.radioButton}>
            <input
              type="radio"
              name="maritalStatus"
              value="married"
              onChange={handleChange}
            />
            Married
          </label>
          {errors.maritalStatus && <span className={styles.error}>{errors.maritalStatus}</span>}
        </div>
        <div className={styles.columns}>
          <div>
            <label className={styles.newline}>
              Your Birth Year
              <input type="number" name="birthYear" onChange={handleChange} />
              {errors.birthYear && <span className={styles.error}>{errors.birthYear}</span>}
            </label>
            <Distributions
              label="Your Life Expectancy"
              options={["fixed", "normal"]}
              name="lifeExpectancy"
              value={distributions.lifeExpectancy.type}
              onChange={handleDistributionsChange}
            />
            {errors.lifeExpectancy && <span className={styles.error}>{errors.lifeExpectancy}</span>}
          </div>
          {formData.maritalStatus === "married" && <div>
            <label className={styles.newline}>
              Spouse Birth Year
              <input type="number" name="spouseBirthYear" onChange={handleChange} />
              {errors.spouseBirthYear && <span className={styles.error}>{errors.spouseBirthYear}</span>}
            </label>
            <Distributions
              label="Spouse Life Expectancy"
              options={["fixed", "normal"]}
              name="spouseLifeExpectancy"
              value={distributions.spouseLifeExpectancy.type}
              onChange={handleDistributionsChange}
              fixedLabel={"Fixed Value"}
            />
            {errors.spouseLifeExpectancy && <span className={styles.error}>{errors.spouseLifeExpectancy}</span>}
          </div>
          }
        </div>
        <br />
      </form>
    </div>
  );
};

export default BasicInfo1;