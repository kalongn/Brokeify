import { useLocation, Link } from 'react-router-dom';
import { useState } from "react";
import { VscChromeClose } from "react-icons/vsc";
import { IoMdArrowBack } from "react-icons/io";

import PropTypes from 'prop-types';
import ModalImport from './ModalImport';
import Axios from 'axios';

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
      return 'Scenario Overview';
    }

    if (path.startsWith('/ViewScenario')) {
      return 'View Scenario';
    }

    if (path.startsWith('/Sharing')) {
      return 'Sharing Settings';
    }

    if (path.startsWith('/visualizations/charts')) {
      return 'Visualization: Charts';
    }

    switch (path) {
      case '/Home':
        return 'My Scenarios';
      case '/SharedScenarios':
        return 'Shared Scenarios';
      case '/Profile':
        return 'My Profile';
      case '/Simulation':
        return 'Scenario Simulation';
      default:
        return 'Brokeify';
    }
  };

  const getHeaderButtons = () => {
    // Scenario simulation page
    if (path.startsWith('/Scenario/')) {
      return (
        <button className={styles.headerButton} onClick={async () => {
          const pathParts = path.split('/');
          const id = pathParts[pathParts.length - 1];
          try {
            const response = await Axios.get(`${import.meta.env.VITE_SERVER_ADDRESS}/scenario/${id}/export`, { withCredentials: true, responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/yaml' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // AI Co-pilot, obtain the filename from the response headers
            const disposition = response.headers['content-disposition'];
            let filename = `${id}.yaml`; // fallback
            if (disposition && disposition.includes('filename=')) {
              const match = disposition.match(/filename="?([^"]+)"?/);
              if (match?.[1]) {
                filename = match[1];
              }
            }
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
          } catch (error) {
            if (error.response?.status === 409) {
              console.error('Scenario not filled out up to basic requirements.');
              alert('Scenario not filled out up to basic requirements.');
            } else if (error.response?.status === 403) {
              console.error('You do not have permission to access this scenario.');
              alert('You do not have permission to access this scenario.');
            } else {
              console.error('Error downloading file:', error);
              alert('Error downloading file. Please try again.');
            }
          }
        }}>Export Scenario</button>
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
    if (path.startsWith('/visualizations/')) {
      return (
        <Link to={`/Simulation`} className={styles.icon}><IoMdArrowBack size={25} /></Link>
      );
    }

    switch (path) {
      case '/Home':
        return (
          <>
            <button className={styles.headerButton} onClick={() => setShowImportModal(true)}>Import Scenario</button>
            <ModalImport isOpen={showImportModal} onClose={setShowImportModal} />
          </>
        );
      case '/Profile':
        return (
          <Link onClick={() => setVerified(false)} className={styles.logout} to={`${import.meta.env.VITE_SERVER_ADDRESS}/logout`}>Logout</Link>
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