import React from 'react';
import styles from  './Header.module.css';
import { useLocation } from 'react-router-dom';

const Header = () => {
    const location = useLocation();
    const path = location.pathname;
    const getHeaderTitle = () => {
        switch(path) {
            case '/Home':
                return 'My Scenarios';
            case '/ScenarioForm':
                return 'Create/Edit Scenario';
            case '/SharedScenarios':
                return 'Shared Scenarios';
            default:
                return 'Brokeify';
        }
    };
    return (
      // TODO: replace simple header placeholder
        <header>
            <h1>{getHeaderTitle()}</h1>
        </header>
    );
};
export default Header;