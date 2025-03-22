import PropTypes from "prop-types";
import Select from "react-select";
import styles from "../pages/scenarioSections/Form.module.css";

const Distributions = ({
    label,
    // options include ["fixed", "uniform-dist", "normal-dist", "event-start", "event-end"]
    options,
    name,
    value,
    onChange,
    fixedLabel = "Fixed Value",
    calculatedLabel,
}) => {
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
              onChange={(e) => onChange(e.target.value)}
              />
              {fixedLabel}
            </label>
          )}
          {options.includes("uniform-dist") && (
            <label className={styles.newline}>
              <input
              type="radio"
              name={name}
              value="uniform-dist"
              onChange={(e) => onChange(e.target.value)}
              />
              Sample from Uniform Distribution
            </label>
          )}
          {options.includes("normal-dist") && (
            <label>
              <input
              type="radio"
              name={name}
              value="normal-dist"
              onChange={(e) => onChange(e.target.value)}
              />
              Sample from Normal Distribution
            </label>
          )}
          </div>
          <div>
            {options.includes("event-start") && (
              <label className={styles.newline}>
                <input
                type="radio"
                name={name}
                value="event-start"
                onChange={(e) => onChange(e.target.value)}
                />
                Same Year that Specified Event Starts
              </label>
            )}
            {options.includes("event-end") && (
              <label>
                <input
                type="radio"
                name={name}
                value="event-end"
                onChange={(e) => onChange(e.target.value)}
                />
                Year After Specified Event Ends
              </label>
            )}
          </div>

          {value === "fixed" && (
            <>
            <label className={styles.newline}>
              {fixedLabel}
              <input type="number" name={`${name}-fixed`} className={styles.newline} min="1" />
            </label>
            {/* Checkbox for Fixed Value or Percentage */}
            {fixedLabel === "Fixed Value or Percentage" && (<label>
              <input type="checkbox" name={`${name}-percent`} />
              Percentage
            </label>
            )}
            </>
          )}
          {value === "uniform-dist" && (
            <>
              <label className={styles.newline}>
                Lower Bound
                <input type="number" name={`${name}-lower`} min="0" />
                Upper Bound
                <input type="number" name={`${name}-upper`} min="0" />
              </label>
              <label>
                {calculatedLabel}
                <input type="number" name={`${name}-calculated`} className={styles.newline} disabled />
              </label>
            </>
          )}
          {value === "normal-dist" && (
            <>
              <label className={styles.newline}>
                Mean
                <input type="number" name={`${name}-mean`} min="1" />
                Standard Deviation
                <input type="number" name={`${name}-std-dev`} min="0" />
              </label>
              <label>
                {calculatedLabel}
                <input type="number" name={`${name}-calculated`} className={styles.newline} disabled />
              </label>
            </>
          )}
          {(value === "event-start" || value === "event-end") && (
            <label className={styles.newline}>
              Specified Event
              <Select options={events} />
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
  calculatedLabel: PropTypes.string,
};

export default Distributions;