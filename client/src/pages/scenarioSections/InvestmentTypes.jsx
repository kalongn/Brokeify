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
            {/* TODO: fix global table styling */}
            <table>
                <thead>
                    <tr>
                        <th>Investment Type</th>
                        <th>Taxability</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Cash</td>
                        <td>Taxable</td>
                    </tr>
                </tbody>
            </table>
            <button onClick={newInvestmentType}>
                Add New Investment Type
            </button>
        </div>
    );
};

export default InvestmentTypes;