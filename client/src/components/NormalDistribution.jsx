import { PropTypes } from 'prop-types';
import styles from "../pages/scenarioSections/Form.module.css";

const NormalDistribution = ({ handleChange, defaultValue }) => {
  // TODO: if identifier for inputs is needed (automated testing), pass names from parent and do `${name}___`
  return (
    <div className={styles.columns}>
      <label className={styles.newline}>
        Mean
        <br />
        <input
          type="number"
          data-testid="normalMean"
          defaultValue={defaultValue.mean}
          onChange={(e) => handleChange("mean", e.target.value)}
        />
      </label>
      <label>
        Standard Deviation
        <br />
        <input
          type="number"
          data-testid="normalStandardDeviation"
          defaultValue={defaultValue.standardDeviation}
          onChange={(e) => handleChange("standardDeviation", e.target.value)}
        />
      </label>
    </div>
  );
}
NormalDistribution.propTypes = {
  handleChange: PropTypes.func.isRequired,
  defaultValue: PropTypes.object
};

export default NormalDistribution;