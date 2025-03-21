import React from "react";
import { useState } from "react";
import styles from "./Form.module.css";

// TODO: add further number range validation

const BasicInfo2 = () => {
    // Determine if fixed or distribution fields are shown
    const [lifeExpectancy, setLifeExpectancy] = useState("");
    const [spouseLifeExpectancy, setSpouseLifeExpectancy] = useState("");
    // Determine if spouse fields are shown
    const [maritalStatus, setMaritalStatus] = useState("");
    return (
        <div>
            <h2>Basic Information Continued</h2>
            <form>
                <label className={styles.newline}>
                    Martial Status
                </label>
                <label>
                    <input 
                    type="radio" 
                    name="marital-status" 
                    value="single" 
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    />
                    Single
                </label>
                <label>
                    <input 
                    type="radio" 
                    name="marital-status" 
                    value="married" 
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    />
                    Married
                </label>
                <br />

                <div>
                    <label>
                        Your Birth Year
                        <input type="number" name="birth-year"  className={styles.newline}/>
                    </label>
                    <label className={styles.newline}>
                        Your Life Expectancy
                    </label>
                    <label className={styles.newline}>
                        <input 
                        type="radio" 
                        name="life-expectancy" 
                        value="fixed" 
                        onChange={(e) => setLifeExpectancy(e.target.value)}
                        />
                        Fixed Value
                    </label>
                    <label>
                        <input 
                        type="radio" 
                        name="life-expectancy" 
                        value="normal-dist" 
                        onChange={(e) => setLifeExpectancy(e.target.value)}
                        />
                        Sample from Normal Distribution
                    </label>
                    {lifeExpectancy === "fixed" && (
                        <label className={styles.newline}>
                            Fixed Value
                            <input type="number" name="fixed-value" className={styles.newline} min="1" />
                        </label>
                    )}
                    {lifeExpectancy === "normal-dist" && (
                        <>
                        <label className={styles.newline}>
                            Mean
                            <input type="number" name="mean" min="1" />
                            Standard Deviation
                            <input type="number" name="std-dev" min="0" />
                        </label>
                        <label>
                            Calculated Life Expectancy
                            <input type="number" name="calculated-life-expectancy" className={styles.newline} disabled />
                        </label>
                        </>
                    )}
                </div>

                {maritalStatus === "married" && <div>
                    <div>
                    <label>
                        Spouse Birth Year
                        <input type="number" name="spouse-birth-year" className={styles.newline} min="1" />
                    </label>
                    <label>
                        Spouse Life Expectancy
                    </label>
                    <label className={styles.newline}>
                        <input 
                        type="radio" 
                        name="spouse-life-expectancy" 
                        value="fixed" 
                        onChange={(e) => setSpouseLifeExpectancy(e.target.value)}
                        />
                        Fixed Value
                    </label>
                    <label>
                        <input 
                        type="radio" 
                        name="spouse-life-expectancy" 
                        value="normal-dist" 
                        onChange={(e) => setSpouseLifeExpectancy(e.target.value)}
                        />
                        Sample from Normal Distribution
                    </label>
                    {spouseLifeExpectancy === "fixed" && (
                        <label className={styles.newline}>
                            Fixed Value
                            <input type="number" name="fixed-value" className={styles.newline} />
                        </label>
                    )}
                    {spouseLifeExpectancy === "normal-dist" && (
                        <>
                        <label className={styles.newline}>
                            Mean
                            <input type="number" name="mean" min="1" />
                            Standard Deviation
                            <input type="number" name="std-dev" min="0" />
                        </label>
                        <label>
                            Calculated Life Expectancy
                            <input type="number" name="calculated-life-expectancy" className={styles.newline} disabled />
                        </label>
                        </>
                    )}
                </div>
                </div>}
                <br />
            </form>
        </div>
    );
};

export default BasicInfo2;