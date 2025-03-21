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
          <div className={styles.detailHeader}>
            <p className={styles.detailTitle}> {title} </p>
          </div>
          <div className = {styles.info}>
          <div className={styles.infoRow}>
            <IoPersonCircle size ={30}/> <span>{name}</span>
          </div>
          <div className={styles.infoRow}>
            <TbTargetArrow size ={30} /> <span>{targetAmount?.toLocaleString() ?? "N/A"}</span>
          </div>
          <div className={styles.infoRow}>
            <IoMdCalendar size ={30} /> <span>{investments} Investments</span>
          </div>
          <div className={styles.infoRow}>
            <FaPiggyBank size ={30} /> <span>{events} Events</span>
          </div>
          </div> 
      </div>
    </div>
  );
};

export default ScenarioCard;
