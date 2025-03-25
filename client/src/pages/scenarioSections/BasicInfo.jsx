import { useState, useImperativeHandle, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import Select from "react-select";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";
import Axios from "axios";

const BasicInfo1 = () => {
  // Prompt to AI (Amazon Q): I want field validation in the children and the submit button is in the parent
  // It took multiple rounds of prompts and adding context to get the solution with useOutletContext and useImperativeHandler

  // Get ref from the context 
  const { childRef, scenarioId } = useOutletContext();
  // Expose the validateFields function to the parent component

  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    lifeExpectancy: { type: null, fixedValue: null, mean: null, stdDev: null },
    spouseLifeExpectancy: { type: null, fixedValue: null, mean: null, stdDev: null },
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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize formData with default values for the scenario
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    const distributionMap = {
      "FIXED_AMOUNT": "fixed",
      "NORMAL_AMOUNT": "normal",
    }

    const maritalStatusMap = {
      "SINGLE": "single",
      "MARRIEDJOINT": "married",
    }

    Axios.get(`/basicInfo/${scenarioId}`)
      .then((response) => {
        const data = response.data;

        const lifeExpectancyCast = {
          type: distributionMap[data.lifeExpectancy?.distributionType] || null,
          fixedValue: data.lifeExpectancy?.value || null,
          mean: data.lifeExpectancy?.mean || null,
          stdDev: data.lifeExpectancy?.standardDeviation || null
        }

        const spouseLifeExpectancyCast = {
          type: distributionMap[data.spouseLifeExpectancy?.distributionType] || null,
          fixedValue: data.spouseLifeExpectancy?.value || null,
          mean: data.spouseLifeExpectancy?.mean || null,
          stdDev: data.spouseLifeExpectancy?.standardDeviation || null
        }

        setDistributions((prev) => ({
          ...prev,
          lifeExpectancy: lifeExpectancyCast || prev.lifeExpectancy,
          spouseLifeExpectancy: spouseLifeExpectancyCast || prev.spouseLifeExpectancy
        }));

        setFormData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          financialGoal: data.financialGoal || prev.financialGoal,
          state: data.state || prev.state,
          maritalStatus: maritalStatusMap[data.maritalStatus] || prev.maritalStatus,
          birthYear: data.birthYear || prev.birthYear,
          spouseBirthYear: data.spouseBirthYear || prev.spouseBirthYear,
          lifeExpectancy: data.lifeExpectancy || prev.lifeExpectancy,
          spouseLifeExpectancy: data.spouseLifeExpectancy || prev.spouseLifeExpectancy
        }));
      }).catch((error) => {
        console.error("Error fetching basic info:", error);
      });

    setLoading(false);
  }, [scenarioId]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      lifeExpectancy: distributions.lifeExpectancy,
      spouseLifeExpectancy: distributions.spouseLifeExpectancy
    }));
  }, [distributions]);

  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));
  // For error validation
  // For parsing to number
  const FIELD_TYPES = {
    NUMBER: new Set(["financialGoal", "birthYear", "spouseBirthYear"]),
  };

  // AI (Amazon Q) In-line code generation for list of states
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

  // Prompt to AI (Amazon Q): How do I get the form fields for the distributions to save to the distributions data set?
  // There were no changes needed for this code snippet
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

    // Prompt to AI (Amazon Q): Write error checking to see if the values are non-negative. All of the fields are required.
    // Additionally, some minor AI (Amazon Q) in-line code generation (e.g. completing error message)
    // The generation worked well as a skeleton but the logic needed to be refined for each  field

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
      if (!sLife.type) {
        newErrors.spouseLifeExpectancy = "This field is required";
      }
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

  const uploadToBackend = async () => {
    const distributionMap = {
      "fixed": "FIXED_AMOUNT",
      "normal": "NORMAL_AMOUNT",
    }

    const maritalStatusMap = {
      "single": "SINGLE",
      "married": "MARRIEDJOINT",
    }

    const lifeExpectancyCast = {
      distributionType: distributionMap[distributions.lifeExpectancy.type],
      ...(distributions.lifeExpectancy.type === "fixed" && { value: distributions.lifeExpectancy.fixedValue }),
      ...(distributions.lifeExpectancy.type === "normal" && { mean: distributions.lifeExpectancy.mean, standardDeviation: distributions.lifeExpectancy.stdDev })
    }

    const spouseLifeExpectancyCast = {
      distributionType: distributionMap[distributions.spouseLifeExpectancy.type],
      ...(distributions.spouseLifeExpectancy.type === "fixed" && { value: distributions.spouseLifeExpectancy.fixedValue }),
      ...(distributions.spouseLifeExpectancy.type === "normal" && { mean: distributions.spouseLifeExpectancy.mean, standardDeviation: distributions.spouseLifeExpectancy.stdDev })
    }

    const data = {
      name: formData.name,
      financialGoal: formData.financialGoal,
      state: formData.state,
      maritalStatus: maritalStatusMap[formData.maritalStatus],
      birthYear: formData.birthYear,
      lifeExpectancy: lifeExpectancyCast,
      spouseBirthYear: formData.maritalStatus === "single" ? undefined : formData.spouseBirthYear,
      spouseLifeExpectancy: formData.maritalStatus === "single" ? undefined : spouseLifeExpectancyCast,
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

  // TODO: apply the heading style to all other section components
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
            <Select options={states} className={`${styles.shortInput} ${styles.select}`} onChange={handleSelectChange}
              value={states.find(state => state.value === formData.state) || undefined} />
            {errors.state && <span className={styles.error}>{errors.state}</span>}
          </label>
          <label className={styles.newline}>
            Martial Status
          </label>
          <div className={styles.radioButtonContainer}>
            <label className={styles.radioButton}>
              <input
                type="radio"
                checked={formData.maritalStatus === "single"}
                onChange={() => setFormData((prev) => ({ ...prev, maritalStatus: "single" }))}
              />
              Single
            </label>
            <label className={styles.radioButton}>
              <input
                type="radio"
                checked={formData.maritalStatus === "married"}
                onChange={() => setFormData((prev) => ({ ...prev, maritalStatus: "married" }))}
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
                options={["fixed", "normal", "percentage"]}
                name="lifeExpectancy"
                onChange={handleDistributionsChange}
                defaultValue={distributions.lifeExpectancy}
              />
              {errors.lifeExpectancy && <span className={styles.error}>{errors.lifeExpectancy}</span>}
            </div>
            {formData.maritalStatus === "married" && <div>
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
              {/* <Distributions
                label="Spouse Life Expectancy"
                options={["fixed", "normal"]}
                name="spouseLifeExpectancy"
                value={distributions.spouseLifeExpectancy.type}
                onChange={handleDistributionsChange}
                fixedLabel={"Fixed Value"}
                defaultValue={distributions.spouseLifeExpectancy}
              /> */}
              {errors.spouseLifeExpectancy && <span className={styles.error}>{errors.spouseLifeExpectancy}</span>}
            </div>
            }
          </div>
          <br />
        </form>}
    </div>
  );
};

export default BasicInfo1;