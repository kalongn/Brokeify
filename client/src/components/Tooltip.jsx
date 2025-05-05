import { useState } from 'react';
import styles from './tooltip.module.css';
import { IoInformationCircleOutline } from "react-icons/io5";
import { PropTypes } from 'prop-types';
/* NOte: I used ChatGPT to generate overall. Modified it slightly - specifically the icon used */
/* prompt: Please design a react component for a tooltip icon. White text over black squarish text bubble that displays over hover. **/

const Tooltip = ({ text, orientation = 'above' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={styles.tooltipWrapper}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Info icon */}
      <i className={styles.icon}><IoInformationCircleOutline /></i>

      {/* Tooltip text */}
      <div
        className={`${styles.tooltipText} ${styles[orientation]}`} // Add conditional class for orientation
        style={{
          visibility: isVisible ? 'visible' : 'hidden',
        }}
      >
        {text}
      </div>
    </div>
  );
};
Tooltip.propTypes = {
  text: PropTypes.string.isRequired,  
  orientation: PropTypes.oneOf(['above', 'below']),
};

Tooltip.defaultProps = {
  orientation: 'above', 
};

export default Tooltip;
