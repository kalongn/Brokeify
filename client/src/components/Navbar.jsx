import styles from './NavBar.module.css';
import { Link, useLocation } from 'react-router-dom';
import { FaPlus } from "react-icons/fa6";

const Navbar = () => {
  const path = useLocation().pathname;

  return (
    <div className={styles.navbar}>
      <div className={styles.title}>
        <img src="/icon.svg"></img>
        <h2> Brokeify</h2>
      </div>
      <Link id={styles.createButton} to="/NewScenario" className={styles.createButton}>
        <FaPlus /> Create Scenario
      </Link>
      <div className={styles.navLinks}>
        <Link to='/Home' className={`${styles.navLink} ${path === "/Home" ? styles.active : ""}`}>My Scenarios</Link>
        <Link to='/SharedScenarios' className={`${styles.navLink} ${path === "/SharedScenarios" ? styles.active : ""}`}>Shared Scenarios</Link>
        <Link to='/Simulation' className={`${styles.navLink} ${path === "/Simulation" ? styles.active : ""}`}>Simulation</Link>
        <Link to='/Profile' className={`${styles.profileLink} ${path === "/Profile" ? styles.active : ""}`}>My Profile</Link>
      </div>
    </div>
  );
}

export default Navbar;