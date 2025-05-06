import PropTypes from "prop-types";

import styles from "./Progress.module.css";
const ProgressBar = ({ currentSectionIndex, sections }) => {
  const currProgress = (currentSectionIndex + 1) / sections.length;

  return (
    <div className={styles.barContainer}>
      <div className={styles.bar}>
        {sections.map((section, index) => (
          <div
            key={index}
            style={{ width: `${currProgress * 100}%` }}
            className={`${styles.barUnit} ${index <= currentSectionIndex ? styles.filled : ''}`}
          >
            <div className={`${styles.node} ${index <= currentSectionIndex ? styles.filled : ''}`}></div>
            <p className={styles.nodeText}>{section.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

ProgressBar.propTypes = {
  currentSectionIndex: PropTypes.number.isRequired,
  sections: PropTypes.array.isRequired
};

export default ProgressBar;