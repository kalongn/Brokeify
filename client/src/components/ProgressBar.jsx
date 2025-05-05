import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";

import styles from "./Progress.module.css";

const ProgressBar = ({ currProgress, sections }) => {
  const path = useLocation().pathname;
  const navigate = useNavigate();

  const handleClick = (index) => {
    const pathSegments = path.split("/").filter(Boolean);
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
            className={styles.fill}
            onClick={() => handleClick(index)}
          >
            <div className={styles.node} ></div>
            <p className={styles.nodeText}>{section.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

ProgressBar.propTypes = {
  currProgress: PropTypes.number.isRequired,
  sections: PropTypes.array.isRequired
};

export default ProgressBar;