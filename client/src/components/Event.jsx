import styles from "./Event.module.css";
import PropTypes from 'prop-types';

const Event = ({ Name, DollarValue, Duration, StartYear, Type }) => {
  return (
    <div className={styles.event}>
      <h4>{Name}</h4>
      <div className={styles.eventDetails}>
        <p className={styles.eventInfo1}>${DollarValue}</p>
        <p className={styles.eventInfo2}>Start Year: {StartYear}</p>
        <p className={styles.eventInfo3}>{Duration} Years</p>
        <p className={styles.eventInfo4}>{Type}</p>
      </div>
    </div>
  );
};

Event.propTypes = {
  Name: PropTypes.string,
  DollarValue: PropTypes.number,
  Duration: PropTypes.number,
  StartYear: PropTypes.number,
  Type: PropTypes.string
};



export default Event;


