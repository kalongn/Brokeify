import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { VscChromeClose } from "react-icons/vsc";

import ModalSharing from './ModalSharing';
import styles from './Header.module.css';

const Header = ({ setVerified }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const getHeaderTitle = () => {

    if (path.startsWith('/Scenario')) {
      return 'Scenario Simulation';
    }
    if (path.startsWith('/ViewScenario')) {
      return 'View Scenario';
    }
    switch (path) {
      case '/Home':
        return 'My Scenarios';
      case '/ScenarioForm':
        return 'Create/Edit Scenario';
      case '/SharedScenarios':
        return 'Shared Scenarios';
      case '/Profile':
        return 'My Profile';
      case '/Scenario':
        return 'Scenario Simulation';
      case '/ViewScenario':
        return 'View Scenario';
      default:
        return 'Brokeify';
    }
  };
  // TODO: implement the IMPORT SCENARIO button functionality
  const getHeaderButtons = () => {

    if (path.startsWith('/Scenario')) {

      return (
        <>
          <div className={styles.buttonGroupSimulation}>
            <button onClick={() =>{ setIsOpen(prev => !prev)}}>Share </button>
            <button onClick={() => console.log('Export Scenario')}>Export </button>
          </div>
          <ModalSharing isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
      );
    }
    if (path.startsWith('/ViewScenario')) {
      const pathParts = path.split('/');
      const id = pathParts[pathParts.length - 1];
      return (
        <>
          <Link to={`/Scenario/${id}`} className={styles.icon}><VscChromeClose /></Link>
        </>
      );
    }

    switch (path) {
      case '/Home':
        return (
          <>
            <button onClick={() => console.log('Import Scenario')}>Import Scenario</button>
          </>
        );
      case '/Profile':
        return (
          <>
            <Link onClick={() => setVerified(false)} className={styles.linkButton} to={`${import.meta.env.VITE_SERVER_ADDRESS}/logout`}>Logout</Link>
          </>
        );
      case '/SharedScenarios':
      case '/ScenarioForm':
      case '/Scenario':
        return (
          <>
            <div className={styles.buttonGroupSimulation}>
              <button onClick={() => console.log('Share Scenario')}>Share </button>
              <button onClick={() => console.log('Export Scenario')}>Export </button>
            </div>
          </>
        );
      case '/ViewScenario':
        return (
          <>
            <Link to='/Scenario' className={styles.icon}><VscChromeClose /></Link>
          </>
        );
      default:
        return null;
    }
  };
  return (
    <header className={styles.header}>
      <h1>{getHeaderTitle()}</h1>
      <div className={styles.buttons}>{getHeaderButtons()}</div>
    </header>
  );
}

Header.propTypes = {
  setVerified: PropTypes.func.isRequired,
};
export default Header;