import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

import 'ladda/dist/ladda.min.css';
import * as Ladda from 'ladda/js/ladda'; // or import from submodule path

import styles from './SimulationPage.module.css';

const ScenarioSimulation = () => {
    const [selectedScenario, setSelectedScenario] = useState('');
    const [numSimulations, setNumSimulations] = useState(50);
    const [errorMessage, setErrorMessage] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [previousRun, setPreviousRun] = useState(null);
    
    //For the sake of ESLint Errors
    console.log(loading);
    console.log(previousRun);

    // Sample scenarios array for testing purposes (Note: get name so that it displays as such in dropdown.  Need id to navigate 
    //for results button 
    const scenarios = [
        {
            _id: "67f6e777015c679cd03c4638",
            name: "My Own Scenario"
        },
        {
            _id: "67f6e55262ecee008d00cf1e",
            name: "Test Scenario 2"
        }
    ];
      
    const handleRunSimulation = async (e) => {
        const num = numSimulations;
        if (!selectedScenario) {
            setErrorMessage('Please select a scenario.');
            return;
        }
        if (isNaN(num) || num < 10 || num > 50) {
            setErrorMessage('Please enter a number between 10 and 50.');
            return;
        }

        setErrorMessage(''); // Clear previous error message
        setIsRunning(true); // Set simulation as running

        const laddaBtn = Ladda.create(e.currentTarget);
        laddaBtn.start();  // Start the Ladda button spinner

        let progress = 0;
        const interval = setInterval(() => {
            if (progress < 1) {
                progress += 0.1; // Increase progress by 10%
                laddaBtn.setProgress(progress);
            }
        }, 1000);

        try {
            await new Promise((resolve) => setTimeout(resolve, 12000)); // Simulating a 12-second delay for testing
            setIsRunning(false); // Simulation done
            setLoading(false); // Loading icons gone
            setPreviousRun(true); //TODO: Update this with the current run! 
        } catch (error) {
            setErrorMessage('An error occurred during the simulation.');
            console.error('Simulation error:', error);
        } finally {
            clearInterval(interval); // Clear the progress interval when done
            laddaBtn.stop(); // Stop the Ladda spinner
        }
    };

    return (
        <Layout>
            <div className={styles.background}>
                <h2>Scenario Simulation</h2>

                <div className={styles.section}>
                    <div className={styles.group}>
                        <p>Select a Scenario:</p>
                        <select className={styles.dropdown} value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value)}>
                            <option value="" hidden disabled>-- Select a Scenario --</option>
                            {scenarios.map((scenario, index) => (
                                <option key={index} value={scenario._id}>
                                    {scenario.name}
                                </option>
                            ))}
                        </select>
                    </div>
                
                    <div>
                        <p>Enter number of simulation runs: </p>
                        <input
                            id="sim-count"
                            type="number"
                            min="10"
                            max="50"
                            step="1"
                            className={styles.simInput}
                            value={numSimulations}
                            onChange={(e) => setNumSimulations(e.target.value)}
                        />
                    </div>

                    {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}

                    <div className={styles.buttonBox}>
                        <div className={styles.buttons}>
                            <div className={styles.simulationButtons}>
                            </div>
                            <button
                                className={`${styles.runSimulation} ladda-button`}
                                data-style="expand-left"
                                data-spinner-size="25"
                                onClick={(e) => handleRunSimulation(e)}
                            >
                                <span>Run Simulation</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>Results</h2>
                    {!isRunning && previousRun === null && (
                        <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
                            Please select a scenario, enter number of simulations, and run simulation to see results.
                        </p>
                    )}

                    {isRunning ? (
                        <p>Simulation is running... Please wait.</p>
                    ) : (
                        previousRun !== null && (
                            <div>
                                <p>Your scenario has run successfully!</p>
                                <Link className={styles.seeResults} to={`/visualizations/charts/${selectedScenario}`}>
                                    See Results
                                </Link>
                            </div>
                        )
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ScenarioSimulation;
