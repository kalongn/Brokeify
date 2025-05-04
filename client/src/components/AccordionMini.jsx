import { useState } from 'react';
import styles from './Accordion.module.css';
import { RiArrowDownSFill } from "react-icons/ri";
import { RiArrowUpSFill } from "react-icons/ri";
import PropTypes from 'prop-types';

const Accordion = ({ title, content }) => {
  const [isActive, setIsActive] = useState(false);

  
  return (
    <div className={styles.accordionMini}>
      <div className={styles.accordionMiniTitle} onClick={() => setIsActive(!isActive)}>
        <p>{title}</p>
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

Accordion.propTypes = {
  title: PropTypes.string,
  content: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ])
};


export default Accordion;
