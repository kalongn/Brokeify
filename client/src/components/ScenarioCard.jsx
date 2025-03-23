import styles from './ScenarioCard.module.css';
import { IoPersonCircle } from "react-icons/io5";
import { TbTargetArrow } from "react-icons/tb";
import { IoMdCalendar } from "react-icons/io";
import { FaPiggyBank } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const ScenarioCard = ({ title, martialStatus, targetAmount, investments, events }) => {
  return (
    <Link to='/Scenario' className={styles.scenarioCard} onClick={() => console.log("Card clicked")}>
      {/*Note: we will need to set these routes to be scenario id based!*/}
      <div className={styles.titleContainer}>
        {/*Note: This is what's shown originally, when the user isn't hovering 
        over the scenario card*/}
        <div className={styles.title}>{title}</div>
      </div>

      <div className={styles.detailContainer}>
        {/*Note: This info is visible over hover*/}
        <div className={styles.detailHeader}>
          <p className={styles.detailTitle}> {title} </p>
        </div>
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <IoPersonCircle size={30} /> <span>{martialStatus}</span>
          </div>
          <div className={styles.infoRow}>
            <TbTargetArrow size={30} /> <span>{targetAmount?.toLocaleString() ?? "N/A"}</span>
          </div>
          <div className={styles.infoRow}>
            <IoMdCalendar size={30} /> <span>{investments} Investments</span>
          </div>
          <div className={styles.infoRow}>
            <FaPiggyBank size={30} /> <span>{events} Events</span>
          </div>
        </div>
      </div>
    </Link>
  );
};


ScenarioCard.propTypes = {
  title: PropTypes.string.isRequired,
  martialStatus: PropTypes.string,
  targetAmount: PropTypes.number,
  investments: PropTypes.number,
  events: PropTypes.number,
};

export default ScenarioCard;
