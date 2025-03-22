import React from "react";
import styles from "./Investment.module.css";
import PropTypes from 'prop-types';

const Investment = ({Type, DollarValue,AnnualReturn, Taxability,TaxStatus}) => {
  return (
    <div className={styles.investment}> 
      <h4>{Type}</h4>
      <div className={styles.investmentDetails}>
      <p className= {styles.investmentInfo1}>${DollarValue}</p>
      <p className={styles.investmentInfo2}>{AnnualReturn}% annual return</p>
      <p className={styles.investmentInfo3}>{Taxability}</p>
      <p className={styles.investmentInfo4}>{TaxStatus}</p>
      </div>
    </div>
  );
};



Investment.propTypes = {
    Type: PropTypes.string,
    DollarValue: PropTypes.number,
    AnnualReturn: PropTypes.number,
    Taxability: PropTypes.string,
    TaxStatus: PropTypes.string
  };

  

export default Investment;