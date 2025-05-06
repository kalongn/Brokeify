import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";

import styles from "./Progress.module.css";
const ProgressBar = ({ currentSectionIndex, sections }) => {
  const currProgress = (currentSectionIndex + 1) / sections.length;
  const path = useLocation().pathname;
  const pathSegments = path.split("/").filter(Boolean);
  // const pathSection = pathSegments.slice(-1);
  const navigate = useNavigate();

  const handleClick = (index) => {
    pathSegments.pop();
    pathSegments.push(sections[index].path);
    navigate(`/${pathSegments.join("/")}`);
  }

  return (
    <div className={styles.barContainer}>
      <div className={styles.bar}>
        {sections.map((section, index) => (
          <button
            key={index}
            style={{ width: `${currProgress * 100}%` }}
            className={`${styles.barUnit} ${index <= currentSectionIndex ? styles.filled : ''}`}
            onClick={() => handleClick(index)}
          >
            <div className={`${styles.node} ${index <= currentSectionIndex ? styles.filled : ''}`}></div>
            <p className={styles.nodeText}>{section.label}</p>
          </button>
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