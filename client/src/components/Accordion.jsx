import React, { useState } from 'react';
import styles from './Accordion.module.css';
import { RiArrowDownSFill } from "react-icons/ri";
import { RiArrowUpSFill } from "react-icons/ri";
const Accordion = ({ title, content }) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className={styles.accordion}>
      <div className={styles.accordionTitle} onClick={() => setIsActive(!isActive)}>
        <h3>{title}</h3> 
        <div>{isActive ? <RiArrowUpSFill /> : <RiArrowDownSFill />}</div>
      </div>
      {isActive && (
        <div className={styles.accordionContent}>
          {Array.isArray(content) ? (
            <div>
              {content.map((item, index) => (
                <p key={index}>{index + 1}. {item}</p>
              ))}
            </div>
          ) : (
            <p>{content}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Accordion;
