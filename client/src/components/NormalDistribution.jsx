import { PropTypes } from 'prop-types';
import styles from "../pages/scenarioSections/Form.module.css";

const NormalDistribution = ({ handleChange, hasPercentage, defaultValue }) => {
  // TODO: if identifier for inputs is needed (automated testing), pass names from parent and do `${name}___`
  return (
    <>
      <div className={styles.columns}>
        <label className={styles.newline}>
          Mean
          <br />
          <input
            type="number"
            defaultValue={defaultValue.mean}
            onChange={(e) => handleChange("mean", e.target.value)}
          />
        </label>
        <label>
          Standard Deviation
          <br />
          <input
            type="number"
            defaultValue={defaultValue.stdDev}
            onChange={(e) => handleChange("stdDev", e.target.value)}
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
NormalDistribution.propTypes = {
  handleChange: PropTypes.func.isRequired,
  hasPercentage: PropTypes.bool,
  defaultValue: PropTypes.object
};

export default NormalDistribution;