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
    const[loading,setLoading] = useState(false);
    const [previousRun, setPreviousRun] = useState(null);
    // Sample scenarios array for testing purposes
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
        if (isNaN(num) || num < 10 || num > 50) {
            setErrorMessage('Please enter a number between 10 and 50.');
            return;
        }

        setErrorMessage(''); // Clear previous error message
        setIsRunning(true); // Set simulation as running

        // Start the Ladda button spinner
        const laddaBtn = Ladda.create(e.currentTarget);
        laddaBtn.start();

        let progress = 0;
        const interval = setInterval(() => {
            if (progress < 1) {
                progress += 0.1; // Increase progress by 10%
                laddaBtn.setProgress(progress); // Update Ladda progress
            }
        }, 1000);

        try {
            // Simulate a delay representing the time the simulation takes
            await new Promise((resolve) => setTimeout(resolve, 12000)); // Simulating a 12-second delay for testing

            setIsRunning(false); // Set simulation as finished
            setLoading(false); // Hide loading spinner
            setPreviousRun(true);
            // Placeholder for any actual logic once simulation is finished
            console.log(`Simulation completed with ${num} runs.`);
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

            {/* Scenario Selection */}
            <div className = {styles.section}>
                <div className={styles.group}>
                <p>Select a Scenario:</p>

                <select className ={styles.dropdown} value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value)}>
                    <option value="" hidden>-- Select a Scenario --</option>
                    {scenarios.map((scenario, index) => (
                        <option key={index} value={scenario._id}>
                            {scenario.name}
                        </option>
                    ))}
                </select>
                </div>
               
            {/* Number of Runs Input */}
            
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

            {/* Error Message */}
            {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}

            {/* Run Simulation Button */}
            <div className={styles.buttonBox}>
                <div className={styles.buttons}>
                    <div className={styles.simulationButtons}>
                    </div>
                    {/*<button className={styles.runSimulation} onClick={runSimulation}>Run Simulation</button>*/}
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

            {/* Additional Section for Results (Optional) */}
            <div className = {styles.section}>
                <h2>Results</h2>
            {isRunning ? (
                <p>Simulation is running... Please wait.</p>
            ) : (
                <div>  
                    { !isRunning ? (
                        <div>
                        <p>Your scenario has run sucessfully!</p>
                        <Link className = {styles.seeResults} to={`/visualizations/charts/${selectedScenario}`}>
                            See Results
                        </Link>
                        </div>
                    ) : (
                        <div>
                        x<span>See Results (Unavailable until simulation is complete)</span>
                        </div>
                    )}
                </div>
            )}
            </div>
        </div>
        </Layout>
    );
};

export default ScenarioSimulation;
