import React from "react";
import { useNavigate } from "react-router-dom";

const InvestmentTypesForm = () => {
  const navigate = useNavigate();
    const handleClick = () => {
        navigate("/ScenarioForm/investment-types");
    };
    return (
        <div>
            <h2>New Investment Type</h2>
            <form>
                <label>
                    Investment Type Name
                    <input type="text" name="investment-type" required/>
                </label>
                <label>
                    Description
                    <input type="text" name="description" />
                </label>
            </form>
            <div style={{ marginTop: "20px" }}>
              <button
                  onClick={handleClick}
                  style={{ marginRight: "10px" }}
              >
                  Cancel
              </button>
              <button
                  onClick={handleClick}
              >
                  Create
              </button>
          </div>
        </div>
    );
};

export default InvestmentTypesForm;