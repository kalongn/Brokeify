import { useState, useImperativeHandle } from "react";
import { useOutletContext } from "react-router-dom";
import Distributions from "../../components/Distributions";
// import styles from "./Form.module.css";

const Limits = () => {
  // Get ref from the context 
  const { childRef } = useOutletContext();
  // Expose the handleSubmit function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));
  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    inflationAssumption: { type: "", fixedValue: "", isPercentage: true, lowerBound: "", upperBound: "", mean: "", stdDev: "" },
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
    inflationAssumption: distributions.inflationAssumption,
    initialLimit: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === "initialLimit" ? Number(value) : value;
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
      <h2>Inflation & Contribution Limits</h2>
      <form>
        <Distributions
          label="Inflation Assumption"
          options={["fixed", "uniform", "normal"]}
          name="inflationAssumption"
          value={distributions.inflationAssumption.type}
          onChange={handleDistributionsChange}
          fixedLabel="Fixed Percentage"
          calculatedLabel={"Calculated Inflation Assumption"}
        />
        <hr />
        <label>
          After-Tax Retirement Accounts Initial Limit on Annual Contributions
          <input type="number" name="initialLimit" min="0" onChange={handleChange} />
        </label>
      </form>
    </div>
  );
};

export default Limits;