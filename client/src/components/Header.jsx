import { useLocation, Link } from 'react-router-dom';
import { useState } from "react";
import PropTypes from 'prop-types';
import { VscChromeClose } from "react-icons/vsc";
import ModalImport from './ModalImport';

import styles from './Header.module.css';

const Header = ({ setVerified }) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const getHeaderTitle = () => {
    // Some paths have scenario ID, so need to check with startsWith
    if (path.startsWith('/ScenarioForm')) {
      return 'Create/Edit Scenario';
    }

    if (path.startsWith('/Scenario')) {
      return 'Scenario Simulation';
    }

    if (path.startsWith('/ViewScenario')) {
      return 'View Scenario';
    }

    if (path.startsWith('/Sharing')) {
      return 'Sharing Settings';
    }

    if (path.startsWith('/Visualizations/Charts')) {
      return 'Visualization: Charts';
    }

    switch (path) {
      case '/Home':
        return 'My Scenarios';
      case '/SharedScenarios':
        return 'Shared Scenarios';
      case '/Profile':
        return 'My Profile';
      default:
        return 'Brokeify';
    }
  };
  // TODO: implement the IMPORT SCENARIO button functionality
  const getHeaderButtons = () => {
    // Scenario simulation page
    if (path.startsWith('/Scenario/')) {
      return (
        <div className={styles.buttonGroupSimulation}>
          <button onClick={() => console.log('Share Scenario')}>Share </button>
          <button onClick={() => console.log('Export Scenario')}>Export </button>
        </div>
      );
    }
    // View scenario page
    if (path.startsWith('/ViewScenario')) {
      const pathParts = path.split('/');
      const id = pathParts[pathParts.length - 1];
      return (
        <Link to={`/Scenario/${id}`} className={styles.icon}><VscChromeClose /></Link>
      );
    }
    // Sharing page
    if (path.startsWith('/Sharing')) {
      const pathParts = path.split('/');
      const id = pathParts[pathParts.length - 1];
      return (
        <Link to={`/Scenario/${id}`} className={styles.icon}><VscChromeClose /></Link>
      );
    }
    // Charts page
    if (path.startsWith('/Visualizations/Charts')) {
      const pathParts = path.split('/');
      const id = pathParts[pathParts.length - 1];
      return (
        <Link to={`/Scenario/${id}`} className={styles.icon}><VscChromeClose /></Link>
      );
    }

    switch (path) {
      case '/Home':
        return (
          <>
            <button onClick={() => setShowImportModal(true)}>Import Scenario</button>
            <ModalImport isOpen={showImportModal} onClose={setShowImportModal} />
          </>
        );
      case '/Profile':
        return (
          <Link onClick={() => setVerified(false)} className={styles.linkButton} to={`${import.meta.env.VITE_SERVER_ADDRESS}/logout`}>Logout</Link>
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