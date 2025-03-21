import React from "react";
import { useState } from "react";

const BasicInfo2 = () => {
    const [lifeExpectancy, setLifeExpectancy] = useState("");
    const [spouseLifeExpectancy, setSpouseLifeExpectancy] = useState("");
    const [maritalStatus, setMaritalStatus] = useState("");
    return (
        <div>
            <h2>Basic Information Continued</h2>
            <form>
                <label>
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
                        <input type="number" name="birth-year" />
                    </label>
                    <label>
                        Your Life Expectancy
                    </label>
                    <label>
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
                        <label>
                            Fixed Value
                            <input type="number" name="fixed-value" />
                        </label>
                    )}
                    {lifeExpectancy === "normal-dist" && (
                        <label>
                            Mean
                            <input type="number" name="mean" />
                            Standard Deviation
                            <input type="number" name="std-dev" />
                        </label>
                    )}
                </div>

                {maritalStatus === "married" && <div>
                    <div>
                    <label>
                        Spouse Birth Year
                        <input type="number" name="spouse-birth-year" />
                    </label>
                    <label>
                        Spouse Life Expectancy
                    </label>
                    <label>
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
                        <label>
                            Fixed Value
                            <input type="number" name="fixed-value" />
                        </label>
                    )}
                    {spouseLifeExpectancy === "normal-dist" && (
                        <label>
                            Mean
                            <input type="number" name="mean" />
                            Standard Deviation
                            <input type="number" name="std-dev" />
                        </label>
                    )}
                </div>
                </div>}
                <br />
            </form>
        </div>
    );
};

export default BasicInfo2;