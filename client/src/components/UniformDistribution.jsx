import { PropTypes } from 'prop-types';
import styles from "../pages/scenarioSections/Form.module.css";

const UniformDistribution = ({ handleChange, defaultValue }) => {
  // TODO: if identifier for inputs is needed (automated testing), pass names from parent and do `${name}___`
  return (
    <div className={styles.columns}>
      <label className={styles.newline}>
        Lower Bound
        <br />
        <input
          type="number"
          data-testid="uniformLower"
          defaultValue={defaultValue.lowerBound}
          onChange={(e) => handleChange("lowerBound", e.target.value)}
        />
      </label>
      <label>
        Upper Bound
        <br />
        <input
          type="number"
          data-testid="uniformUpper"
          defaultValue={defaultValue.upperBound}
          onChange={(e) => handleChange("upperBound", e.target.value)}
        />
      </label>
    </div>
  );
}
UniformDistribution.propTypes = {
  handleChange: PropTypes.func.isRequired,
  defaultValue: PropTypes.object
};

export default UniformDistribution;