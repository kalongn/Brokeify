import { PropTypes } from 'prop-types';
import styles from "../pages/scenarioSections/Form.module.css";

const FixedDistribution = ({ handleChange, hasPercentage, defaultValue }) => {
  // TODO: if identifier for inputs is needed (automated testing), pass names from parent and do `${name}___`
  const inputLabel = hasPercentage ? "Fixed Value or Percentage" : "Fixed Value";

  return (
    <div>
      <label className={styles.newline}>
        {inputLabel}
        <input
          type="number"
          className={styles.newline}
          defaultValue={defaultValue.fixedValue}
          onChange={(e) => handleChange("fixedValue", e.target.value)}
        />
      </label>
      {hasPercentage && <label>
        <input
          type="checkbox"
          onChange={(e) => handleChange("isPercentage", e.target.checked)}
        />
        Percentage
      </label>}
    </div>
  );
}
FixedDistribution.propTypes = {
  handleChange: PropTypes.func.isRequired,
  hasPercentage: PropTypes.bool,
  defaultValue: PropTypes.object
};

export default FixedDistribution;