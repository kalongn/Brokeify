import { useState, useImperativeHandle } from "react";
import { useOutletContext } from "react-router-dom";
import Select from "react-select";
import styles from "./Form.module.css";

// TODO: add scenario name validation (no duplicates at the very least)

const BasicInfo1 = () => {
  // Get ref from the context 
  const { childRef } = useOutletContext();
  // Expose the validateFields function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));
  // For parsing to number
  const FIELD_TYPES = {
    NUMBER: new Set(["financialGoal"]),
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
  const [formData, setFormData] = useState({
    name: null,
    financialGoal: null,
    state: null,
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

  const handleSelectChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, state: selectedOption.value }));
  };

  const validateFields = () => {
    console.log("============= validated");
    console.log(formData);
  };
  const handleSubmit = () => {
    validateFields();
  };

  // TODO: apply the heading style to all other section components
  return (
    <div id={styles.formSection}>
      <h2 id={styles.heading}>Basic Information</h2>
      <form>
        <label>
          Scenario Name
          <input type="text" name="name" className={styles.newline} onChange={handleChange} />
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
        </label>
        <label className={styles.newline}>
          State of Residence
          <Select options={states} className={`${styles.shortInput} ${styles.select}`} onChange={handleSelectChange} />
        </label>
      </form>
    </div>
  );
};

export default BasicInfo1;