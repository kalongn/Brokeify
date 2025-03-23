import { useState } from "react";
import Select from "react-select";
import { FaTimes } from 'react-icons/fa';
import styles from "./Form.module.css";

const Investments = () => {
  // TODO: replace with investments from db
  const [investments, setInvestments] = useState([
    { type: "Cash", value: "", taxStatus: "" },
  ]);

  // TODO: replace all options except for Cash with user-defined ones
  const investmentTypes = [
    { value: "Cash", label: "Cash" },
    { value: "Stocks", label: "Stocks" },
    { value: "Bonds", label: "Bonds" },
    { value: "Real Estate", label: "Real Estate" },
    { value: "Mutual Funds", label: "Mutual Funds" },
  ];
  const taxStatuses = [
    { value: "Non-Retirement", label: "Non-Retirement" },
    { value: "Pre-Tax Retirement", label: "Pre-Tax Retirement" },
    { value: "After-Tax Retirement", label: "After-Tax Retirement" },
  ];

  const handleInputChange = (index, field, value) => {
    const updatedInvestments = [...investments];
    updatedInvestments[index][field] = value;
    setInvestments(updatedInvestments);
  };

  const addNewInvestment = () => {
    setInvestments([...investments, { type: "", value: "", taxStatus: "" }]);
  };
  const removeInvestment = (index) => {
    const updatedInvestments = investments.filter((_, i) => i !== index);
    setInvestments(updatedInvestments);
  };

  return (
    <div>
      <h2>Investments</h2>
      <p>
        If married, investments will automatically be assumed as jointly owned.
      </p>

      <table id={styles.inputTable}>
        <thead>
          <tr>
            <th>Investment Type</th>
            <th>Dollar Value</th>
            <th>Tax Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {/* Dynamically render rows of investments */}
          {investments.map((investment, index) => (
            <tr key={index}>
              <td>
                <Select
                  className={`${styles.selectTable} ${styles.select}`}
                  options={investmentTypes}
                  value={investmentTypes.find((option) => option.value === investments[index].type)}
                  onChange={(e) =>
                    handleInputChange(index, "type", e.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={investment.value}
                  onChange={(e) =>
                    handleInputChange(index, "value", e.target.value)
                  }
                  placeholder="$"
                />
              </td>
              <td>
                {/* TODO: Selects seem to be connected */}
                <Select
                  className={`${styles.selectTable} ${styles.select}`}
                  options={taxStatuses}
                  value={investmentTypes.find((option) => option.value === investments[index].type)}
                  onChange={(e) =>
                    handleInputChange(index, "type", e.value)
                  }
                />
              </td>
              <td>
                <button
                  onClick={() => removeInvestment(index)}
                  className={styles.tableButton}>
                  <FaTimes />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button id={styles.addButton} type="button" onClick={addNewInvestment}>
        Add New Investment
      </button>
    </div>
  );
};

export default Investments;