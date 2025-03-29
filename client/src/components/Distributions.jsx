import PropTypes from "prop-types";
import Fixed from "./FixedDistribution";
import Uniform from "./UniformDistribution";
import Normal from "./NormalDistribution";
import { useState } from "react";

const Distributions = ({
  name, // Distribution key (e.g. lifeExpectancy)
  options, // Includes ["fixed", "uniform", "normal", "percentage"]
  onChange, // Change handler function
  defaultValue = {}, // Default value for the select input (if any)
}) => {
  const [type, setType] = useState("");
  // Pass the name of the distributions key (e.g. lifeExpectancy), 
  // name of form field, and input value of the field to the parent
  // Should be passed down to children too
  const handleChange = (field, fieldValue) => {
    // TODO: minor bug where if the user selects Percentage for one distribution
    // that isPercentage value carries over if they then select another distribution
    // Could change isPercentage to uniformPercentage, etc.
    onChange(name, field, fieldValue);
  };
  // Sets the type and should not be passed down to children
  const handleRadio = (field, fieldValue) => {
    setType(fieldValue);
    handleChange(field, fieldValue);
  };

  const inputLabel = options.includes("percentage") ? "Fixed Value or Percentage" : "Fixed Value";

  const distributionType = () => {
    switch (type) {
      case "fixed":
        return <Fixed
          handleChange={handleChange}
          hasPercentage={options.includes("percentage")}
          defaultValue={defaultValue}
        />
      case "uniform":
        return <Uniform
          handleChange={handleChange}
          hasPercentage={options.includes("percentage")}
          defaultValue={defaultValue}
        />
      case "normal":
        return <Normal
          handleChange={handleChange}
          hasPercentage={options.includes("percentage")}
          defaultValue={defaultValue}
        />
      default:
        break;
    }
  };

  return (
    <div>
      {options.includes("fixed") && (
        <>
          <label>
            <input
              type="radio"
              value="fixed"
              checked={type === "fixed"}
              onChange={(e) => handleRadio("type", e.target.value)}
            />
            {inputLabel}
          </label>
          <br />
        </>
      )}
      {options.includes("uniform") && (
        <>
          <label>
            <input
              type="radio"
              value="uniform"
              checked={type === "uniform"}
              onChange={(e) => handleRadio("type", e.target.value)}
            />
            Sample from Uniform Distribution
          </label>
          <br />
        </>
      )}
      {options.includes("normal") && (
        <label>
          <input
            type="radio"
            value="normal"
            checked={type === "normal"}
            onChange={(e) => handleRadio("type", e.target.value)}
          />
          Sample from Normal Distribution
        </label>
      )}
      {/* Show only the specified options */}
      {distributionType()}
    </div>
  );
};

// Prompt to AI (Amazon Q): Pasted the error ___ is missing in props validation
// No changes made
Distributions.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  defaultValue: PropTypes.object
};

export default Distributions;