import { PropTypes } from 'prop-types';
import styles from "../pages/scenarioSections/Form.module.css";

const UniformDistribution = ({ handleChange, hasPercentage, defaultValue }) => {
  // TODO: if identifier for inputs is needed (automated testing), pass names from parent and do `${name}___`
  return (
    <>
      <div className={styles.columns}>
        <label className={styles.newline}>
          Lower Bound
          <br />
          <input
            type="number"
            defaultValue={defaultValue.lowerBound}
            onChange={(e) => handleChange("lowerBound", e.target.value)}
          />
        </label>
        <label>
          Standard Deviation
          <br />
          <input
            type="number"
            defaultValue={defaultValue.upperBound}
            onChange={(e) => handleChange("upperBound", e.target.value)}
          />
        </label>
      </div>
      {hasPercentage && <label>
        <input
          type="checkbox"
          onChange={(e) => handleChange("isPercentage", e.target.checked)}
        />
        Percentage
      </label>}
    </>
  );
}
UniformDistribution.propTypes = {
  handleChange: PropTypes.func.isRequired,
  hasPercentage: PropTypes.bool,
  defaultValue: PropTypes.object
};

export default UniformDistribution;