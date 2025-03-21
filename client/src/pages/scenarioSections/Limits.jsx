import React from "react";
import { useState } from "react";

const Limits = () => {
    const [inflationAssumption, setInflationAssumption] = useState("");
    return (
        <div>
            <h2>Inflation & Contribution Limits</h2>
            <form>
                <label>
                    Inflation Assumption
                </label>
                <label>
                    <input 
                    type="radio" 
                    name="inflation-assumption" 
                    value="fixed" 
                    onChange={(e) => setInflationAssumption(e.target.value)}
                    />
                    Fixed Percentage
                </label>
                <label>
                    <input 
                    type="radio" 
                    name="inflation-assumption" 
                    value="normal-dist" 
                    onChange={(e) => setInflationAssumption(e.target.value)}
                    />
                    Sample from Normal Distribution
                </label>
                <label>
                    <input 
                    type="radio" 
                    name="inflation-assumption" 
                    value="uniform-dist" 
                    onChange={(e) => setInflationAssumption(e.target.value)}
                    />
                    Sample from Uniform Distribution
                </label>
            </form>
        </div>
    );
};

export default Limits;