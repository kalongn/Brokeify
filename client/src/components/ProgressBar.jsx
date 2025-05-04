import PropTypes from "prop-types";
import styles from "./Progress.module.css";

const ProgressBar = ({ currProgress }) => {
  console.log("currProgress", currProgress);
  const sections = [
    "Basic Information",
    "Investment Types",
    "Investments",
    "Event Series",
    "Inflation & Contribution Limits",
    "Spending Strategy",
    "Expense Withdrawal Strategy",
    "Required Minimum Distribution Strategy",
    "Roth Conversion Strategy & Optimizer"
  ];
  return (
    <div className={styles.barContainer}>
      {/* Left value is an approximate centering */}
      <div className={styles.nodeContainer} style={{ left: `${(currProgress * 100) / 2 + 0.5}%` }}>
        <div className={styles.node} ></div>
        {/* <p className={styles.nodeText}>{sections[0]}</p> */}
      </div>
      <div className={styles.bar}>
        <div style={{ width: `${currProgress * 100}%` }} className={styles.fill}></div>
      </div>
    </div>
  );
}

ProgressBar.propTypes = {
  currProgress: PropTypes.number.isRequired,
};

export default ProgressBar;