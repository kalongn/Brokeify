import React, { useState } from 'react';
import styles from './tooltip.module.css';
import { IoInformationCircleOutline } from "react-icons/io5";

/*NOte: I used ChatGPT to generate overall. Modified it slightly - speciically the icon used*/
/*prompt: Please design a react component  for a tooltip icon. White text over black squarish text bubble that displays 
over hover.  **/
const Tooltip = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={styles.tooltipWrapper}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Info icon (using Unicode "i" character as an icon) */}
      <i className={styles.icon}><  IoInformationCircleOutline /></i>

      {/* Tooltip text */}
      <div
        className={styles.tooltipText}
        style={{
          visibility: isVisible ? 'visible' : 'hidden',
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default Tooltip;
