import React from "react";
import { useNavigate } from "react-router-dom";

const InvestmentTypes = () => {
    const navigate = useNavigate();
    const newInvestmentType = () => {
        navigate("/ScenarioForm/investment-types/new");
    }
    return (
        <div>
            <h2>Investment Types</h2>
            <p>
                Create investment types or view the default ones.
            </p>
            <form>
                <label>
                    Investment Type
                    <input type="text" name="cash" value="Cash" disabled />
                </label>
                <label>
                    Taxability
                    <input type="text" name="taxability" value="Taxable" disabled />
                </label>
                {/* Type button prevents form submission on click */}
                <button type="button" onClick={newInvestmentType}>
                    Add Investment Type
                </button>
            </form>
        </div>
    );
};

export default InvestmentTypes;