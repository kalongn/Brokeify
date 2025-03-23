import { useState, useEffect, useImperativeHandle } from "react";
import { useOutletContext } from "react-router-dom"; import Select from "react-select";
import { FaTimes } from 'react-icons/fa';
import styles from "./Form.module.css";

const Investments = () => {
  // Get ref from the context 
  const { childRef } = useOutletContext();
  // Expose the validateFields function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));

  const [investmentTypes, setInvestmentTypes] = useState([
    { value: "Cash", label: "Cash" },
  ]);

  const taxStatuses = [
    { value: "Non-Retirement", label: "Non-Retirement" },
    { value: "Pre-Tax Retirement", label: "Pre-Tax Retirement" },
    { value: "After-Tax Retirement", label: "After-Tax Retirement" },
  ];
  // TODO: uncomment out and modify when route has been set up
  useEffect(() => {
    // TODO: remove superficial call to setInvestmentTypes (to satisfy ESLint for now)
    setInvestmentTypes([{ value: "Cash", label: "Cash" }]);
    // IIFE
    // (async () => {
    //   try {
    //     const response = await fetch('/api/investment-types');
    //     const data = await response.json();
        
    //     // Transform the data into the format needed for react-select
    //     const formattedTypes = data.map(type => ({
    //       value: type.name,
    //       label: type.name
    //     }));

    //     setInvestmentTypes(formattedTypes);
    //   } catch (error) {
    //     console.error('Error fetching investment types:', error);
    //   }
    // })();
  }, []);

  // Form data is only investments
  const [formData, setFormData] = useState(
    [{ type: "Cash", dollarValue: "", taxStatus: "" }],
  );

  const handleInputChange = (index, field, value) => {
    const updatedInvestments = [...formData];
    // Check if name is a number field and parse if so
    const processedValue = field === "dollarValue" ? Number(value) : value;
    updatedInvestments[index][field] = processedValue;
    setFormData(updatedInvestments);
  };

  const addNewInvestment = () => {
    setFormData([...formData, { type: "", dollarValue: "", taxStatus: "" }]);
  };
  const removeInvestment = (index) => {
    const updatedInvestments = formData.filter((_, i) => i !== index);
    setFormData(updatedInvestments);
  };

  const validateFields = () => {
    console.log("============= validated");
    console.log(formData);
  };
  const handleSubmit = () => {
    validateFields();
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
          {formData.map((investment, index) => (
            <tr key={index}>
              <td>
                <Select
                  className={`${styles.selectTable} ${styles.select}`}
                  options={investmentTypes}
                  value={investmentTypes.find((option) => option.value === formData[index].type)}
                  onChange={(e) =>
                    handleInputChange(index, "type", e.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  name="dollarValue"
                  value={investment.value}
                  onChange={(e) =>
                    handleInputChange(index, "dollarValue", e.target.value)
                  }
                  placeholder="$"
                />
              </td>
              <td>
                <Select
                  className={`${styles.selectTable} ${styles.select}`}
                  options={taxStatuses}
                  value={taxStatuses.find((option) => option.value === formData[index].type)}
                  onChange={(e) =>
                    handleInputChange(index, "taxStatus", e.value)
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