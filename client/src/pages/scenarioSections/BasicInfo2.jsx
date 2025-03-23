import { useState, useImperativeHandle } from "react";
import { useOutletContext } from "react-router-dom";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";

// TODO: add further number range validation

const BasicInfo2 = () => {
  // Get ref from the context 
  const { childRef } = useOutletContext();
  // Expose the handleSubmit function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));
  // For parsing to number
  const FIELD_TYPES = {
    NUMBER: new Set(["birthYear", "spouseBirthYear"]),
  };
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
  };

  const [formData, setFormData] = useState({
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
  };

  const validateFields = () => {
    console.log("============= validated");
    console.log(formData);
  };
  const handleSubmit = () => {
    validateFields();
  };

  return (
    <div>
      <h2>Basic Information Continued</h2>
      <form>
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
        </div>
        <div className={styles.columns}>
          <div>
          <label className={styles.newline}>
            Your Birth Year
            <input type="number" name="birthYear" onChange={handleChange} />
          </label>
          <Distributions
            label="Your Life Expectancy"
            options={["fixed", "normal"]}
            name="lifeExpectancy"
            value={distributions.lifeExpectancy.type}
            onChange={handleDistributionsChange}
            calculatedLabel={"Calculated Life Expectancy"}
          />
          </div>
          {formData.maritalStatus === "married" && <div>
            <label className={styles.newline}>
              Spouse Birth Year
              <input type="number" name="spouseBirthYear" onChange={handleChange} />
            </label>
            <Distributions
              label="Spouse Life Expectancy"
              options={["fixed", "normal"]}
              name="spouseLifeExpectancy"
              value={distributions.spouseLifeExpectancy.type}
              onChange={handleDistributionsChange}
              fixedLabel={"Fixed Value"}
              calculatedLabel={"Calculated Life Expectancy"}
            />
          </div>
          }
        </div>
        <br />
      </form>
    </div>
  );
};

export default BasicInfo2;