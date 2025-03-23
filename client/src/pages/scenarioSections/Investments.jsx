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
  const [errors, setErrors] = useState({
    investments: ""
  });

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
  // TODO: fix bug where deleting a row above actually removes the one below
  const removeInvestment = (index) => {
    const updatedInvestments = formData.filter((_, i) => i !== index);
    setFormData(updatedInvestments);
  };

  const validateFields = () => {
    let isValid = true;
    const newErrors = {};

    // Check if there are any investments
    if (formData.length === 0) {
      newErrors.investments = "At least one investment must be added";
      isValid = false;
      setErrors(newErrors);
      return isValid;
    }

    // Validate each investment
    formData.forEach((investment, index) => {
      newErrors[index] = {};

      // Validate Investment Type
      if (!investment.type) {
        newErrors[index].type = "Investment type is required";
        isValid = false;
      }

      // Validate Dollar Value
      if (investment.dollarValue === null || investment.dollarValue === "") {
        newErrors[index].dollarValue = "Dollar value is required";
        isValid = false;
      } else if (isNaN(investment.dollarValue)) {
        newErrors[index].dollarValue = "Dollar value must be a number";
        isValid = false;
      } else if (investment.dollarValue < 0) {
        newErrors[index].dollarValue = "Dollar value cannot be negative";
        isValid = false;
      }
      // Validate Tax Status
      if (!investment.taxStatus) {
        newErrors[index].taxStatus = "Tax status is required";
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };
  const handleSubmit = () => {
    return validateFields();
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
                {errors[index]?.type && <span className={styles.error}>{errors[index].type}</span>}
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
                {errors[index]?.dollarValue && <span className={styles.error}>{errors[index].dollarValue}</span>}
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
                {errors[index]?.taxStatus && <span className={styles.error}>{errors[index].taxStatus}</span>}
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