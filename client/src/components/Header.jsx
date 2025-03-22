import styles from './Header.module.css';
import { useLocation, Link } from 'react-router-dom';

const Header = () => {
    const location = useLocation();
    const path = location.pathname;
    const getHeaderTitle = () => {
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
            default:
                return 'Brokeify';
        }
    };
    // TODO: implement the IMPORT SCENARIO button functionality
    const getHeaderButtons = () => {
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
                        <Link className={styles.linkButton} to={`${import.meta.env.VITE_SERVER_ADDRESS}/logout`}>Logout</Link>
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
};
export default Header;