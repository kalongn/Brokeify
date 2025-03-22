import React from "react";
import { useState } from "react";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";

const Limits = () => {
    const [inflationAssumption, setInflationAssumption] = useState("");
    return (
        <div>
            <h2>Inflation & Contribution Limits</h2>
            <form>
            <Distributions 
                label="Inflation Assumption"
                options={["fixed", "uniform-dist", "normal-dist"]}
                name="inflation-assumption"
                value={inflationAssumption}
                onChange={setInflationAssumption}
                fixedLabel="Fixed Percentage"
                calculatedLabel={"Calculated Inflation Assumption"}
            />
            <hr />
            <label>
                Retirement Accounts Initial Limit on Annual Contributions
            </label>
            <label className={styles.newline}>
                Pre-Tax
                <input type="number" name="pre-tax-limit" min="0" />
            </label>
            <label>
                After-Tax
                <input type="number" name="after-tax-limit" min="0" />
            </label>
            </form>
        </div>
    );
};

export default Limits;