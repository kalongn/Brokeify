import React from "react";
import { useState } from "react";
import Distributions from "../../components/Distributions";
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
                    <Distributions 
                        label="Your Life Expectancy"
                        options={["fixed", "normal-dist"]}
                        name="life-expectancy"
                        value={lifeExpectancy}
                        onChange={setLifeExpectancy}
                        calculatedLabel={"Calculated Life Expectancy"}
                    />
                </div>

                {maritalStatus === "married" && <div>
                    <div>
                    <label>
                        Spouse Birth Year
                        <input type="number" name="spouse-birth-year" className={styles.newline} min="1" />
                    </label>
                    <Distributions 
                        label="Spouse Life Expectancy"
                        options={["fixed", "normal-dist"]}
                        name="spouse-life-expectancy"
                        value={spouseLifeExpectancy}
                        onChange={setSpouseLifeExpectancy}
                        fixedLabel={"Fixed Value"}
                        calculatedLabel={"Calculated Life Expectancy"}
                    />
                </div>
                </div>}
                <br />
            </form>
        </div>
    );
};

export default BasicInfo2;