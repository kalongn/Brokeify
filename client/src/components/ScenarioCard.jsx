import styles from './ScenarioCard.module.css';
import { IoPersonCircle } from "react-icons/io5";
import { TbTargetArrow } from "react-icons/tb";
import { IoMdCalendar } from "react-icons/io";
import { BsGraphUpArrow } from "react-icons/bs";
import { FaPiggyBank } from "react-icons/fa6";
const ScenarioCard = ({ title, name, targetAmount, investments, events }) => {
  return (
    <div className={styles.scenarioCard}>

      <div className={styles.titleContainer}>
        {/*Note: This is what's shown originally, when the user isn't hovering 
        over the scenario card*/}
        <div className={styles.title}>{title}</div>
      </div>

      <div className={styles.detailContainer}>
          {/*Note: This info is visible over hover*/}
          <p className ={styles.detailTitle}>{title}</p>
          <div className = {styles.info}>
          <IoPersonCircle /><p className = {styles.infoRow}>  {name}</p>
          <TbTargetArrow /> <p className = {styles.infoRow}> {targetAmount.toLocaleString()}</p>
          <IoMdCalendar />  <p className ={styles.infoRow}> {investments} Investments</p>
          <FaPiggyBank /> <p className= {styles.infoRow}>{events} Events</p>
          </div> 
      </div>
    </div>
  );
};

export default ScenarioCard;
