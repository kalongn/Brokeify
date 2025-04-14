import { PropTypes } from 'prop-types';
import styles from "../pages/scenarioSections/Form.module.css";

const FixedDistribution = ({ handleChange, defaultValue }) => {
  // TODO: if identifier for inputs is needed (automated testing), pass names from parent and do `${name}___`

  return (
    <div>
      <label className={styles.newline}>
        Input Value
        <input
          type="number"
          data-testid="fixedInput"
          className={styles.newline}
          defaultValue={defaultValue.value}
          onChange={(e) => handleChange("value", e.target.value)}
        />
      </label>
    </div>
  );
}
FixedDistribution.propTypes = {
  handleChange: PropTypes.func.isRequired,
  defaultValue: PropTypes.object
};

export default FixedDistribution;