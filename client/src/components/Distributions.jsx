import PropTypes from "prop-types";
import Select from "react-select";
import styles from "../pages/scenarioSections/Form.module.css";

const Distributions = ({
  label,
  // options include ["fixed", "uniform", "normal", "eventStart", "eventEnd"]
  options,
  name,
  value,
  onChange,
  fixedLabel = "Fixed Value",
}) => {
  // isPercentage is for fixed value
  // Pass the name of the label, name of form field, input value of the field, and isPercentage to the parent
  const handleInputChange = (field, fieldValue, isPercentage = false) => {
    onChange(name, field, fieldValue, isPercentage);
  };

  // TODO: replace all options with user-defined ones
  const events = [
    { value: "event1", label: "Event 1" },
    { value: "event2", label: "Event 2" },
    { value: "event3", label: "Event 3" },
  ];

  return (
    <div>
      <label>{label}</label>
      {/* Show only the specified options */}
      <div>
        {options.includes("fixed") && (
          <label className={styles.newline}>
            <input
              type="radio"
              name={name}
              value="fixed"
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
            {fixedLabel}
          </label>
        )}
        {options.includes("uniform") && (
          <label className={styles.newline}>
            <input
              type="radio"
              name={name}
              value="uniform"
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
            Sample from Uniform Distribution
          </label>
        )}
        {options.includes("normal") && (
          <label>
            <input
              type="radio"
              name={name}
              value="normal"
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
            Sample from Normal Distribution
          </label>
        )}
      </div>
      <div>
        {options.includes("eventStart") && (
          <label className={styles.newline}>
            <input
              type="radio"
              name={name}
              value="eventStart"
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
            Same Year that Specified Event Starts
          </label>
        )}
        {options.includes("eventEnd") && (
          <label>
            <input
              type="radio"
              name={name}
              value="eventEnd"
              onChange={(e) => handleInputChange("type", e.target.value)}
            />
            Year After Specified Event Ends
          </label>
        )}
      </div>

      {value === "fixed" && (
        <>
          <label className={styles.newline}>
            {fixedLabel}
            <input
              type="number"
              name={`${name}Fixed`}
              className={styles.newline}
              min="1"
              onChange={(e) => handleInputChange("fixedValue", e.target.value)}
            />
          </label>
          {/* Checkbox for Fixed Value or Percentage */}
          {fixedLabel === "Fixed Value or Percentage" && (<label>
            <input
              type="checkbox"
              name={`${name}Percent`}
              onChange={(e) => handleInputChange("isPercentage", e.target.checked)}
            />
            Percentage
          </label>
          )}
        </>
      )}
      {value === "uniform" && (
          <div className={styles.columns}>
            <label className={styles.newline}>
              Lower Bound
              <br />
              <input
                type="number"
                name={`${name}Lower`}
                min="0"
                onChange={(e) => handleInputChange("lowerBound", e.target.value)}
              />
            </label>
            <label>
              Upper Bound
              <br />
              <input
                type="number"
                name={`${name}Upper`}
                min="0"
                onChange={(e) => handleInputChange("upperBound", e.target.value)}
              />
            </label>
          </div>
      )}
      {value === "normal" && (
          <div className={styles.columns}>
            <label className={styles.newline}>
              Mean
              <br />
              <input
                type="number"
                name={`${name}Mean`}
                min="1"
                onChange={(e) => handleInputChange("mean", e.target.value)}
              />
            </label>
            <label>
              Standard Deviation
              <br />
              <input
                type="number"
                name={`${name}StdDev`}
                min="0"
                onChange={(e) => handleInputChange("stdDev", e.target.value)}
              />
            </label>
          </div>
      )}
      {(value === "eventStart" || value === "eventEnd") && (
        <label className={styles.newline}>
          Specified Event
          <Select
            options={events}
            name={`${name}Event`}
            onChange={(selectedOption) => handleInputChange("event", selectedOption?.value)}
          />
        </label>
      )}
    </div>
  );
};

// PropTypes validation
Distributions.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  fixedLabel: PropTypes.string,
};

export default Distributions;