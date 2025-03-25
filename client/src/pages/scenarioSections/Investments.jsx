import { useState, useEffect, useImperativeHandle } from "react";
import { useOutletContext } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import Axios from 'axios';
import Select from "react-select";

import styles from "./Form.module.css";

const Investments = () => {
  const { childRef, scenarioId } = useOutletContext();

  const [formData, setFormData] = useState([]);

  const [errors, setErrors] = useState({
    investments: ""
  });

  const [investmentTypes, setInvestmentTypes] = useState([]);

  // Expose the validateFields function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));

  const taxStatuses = [
    { value: "Cash", label: "Cash" },
    { value: "Non-Retirement", label: "Non-Retirement" },
    { value: "Pre-Tax Retirement", label: "Pre-Tax Retirement" },
    { value: "After-Tax Retirement", label: "After-Tax Retirement" },
  ];

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/investmentTypes/${scenarioId}`).then((response) => {
      const investmentTypeOptions = response.data.map((investmentType) => {
        return { value: investmentType.name, label: investmentType.name };
      });
      setInvestmentTypes(investmentTypeOptions);
    }).catch((error) => {
      console.error('Error fetching investment types:', error);
    });

    Axios.get(`/investments/${scenarioId}`).then((response) => {
      const investments = response.data;
      setFormData(investments);
    }).catch((error) => {
      console.error('Error fetching investments:', error);
    });
  }, [scenarioId]);


  const handleInputChange = (index, field, value) => {
    const updatedInvestments = [...formData];
    // Check if name is a number field and parse if so
    const processedValue = field === "dollarValue" ? Number(value) : value;
    updatedInvestments[index][field] = processedValue;
    setFormData(updatedInvestments);
  };

  const addNewInvestment = () => {
    setFormData([...formData, { id: undefined, type: "", dollarValue: "", taxStatus: "" }]);
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, investments: "" }));
  };
  // TODO: fix bug where deleting a row above actually removes the one below
  const removeInvestment = (index) => {
    alert("NOT IMPLEMENTED YET + index clicked: " + index);
    // const updatedInvestments = formData.filter((_, i) => i !== index);
    // setFormData(updatedInvestments);
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
        newErrors[index].type = "This field is required";
        isValid = false;
      }

      // Validate Dollar Value
      if (investment.dollarValue === null || investment.dollarValue === "") {
        newErrors[index].dollarValue = "This field is required";
        isValid = false;
      } else if (isNaN(investment.dollarValue)) {
        newErrors[index].dollarValue = "Dollar value must be a number";
        isValid = false;
      } else if (investment.dollarValue < 0) {
        newErrors[index].dollarValue = "Dollar value must be non-negative";
        isValid = false;
      }
      // Validate Tax Status
      if (!investment.taxStatus) {
        newErrors[index].taxStatus = "This field is required";
        isValid = false;
      }
    });

    setErrors(newErrors);
    console.log(newErrors);
    return isValid;
  };

  const uploadToBackend = () => {
    const investments = formData;
    console.log('Uploading investments:', investments);
    Axios.post(`/investments/${scenarioId}`, { investments }).then((response) => {
      console.log('Investments uploaded:', response.data);
      return true;
    }).catch((error) => {
      console.error('Error uploading investments:', error);
      return false;
    });
  };

  const handleSubmit = () => {
    if (!validateFields()) {
      return false;
    }
    return uploadToBackend();
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
                  defaultValue={investment.dollarValue}
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
                  value={taxStatuses.find((option) => option.value === formData[index].taxStatus)}
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
      {errors.investments && <span className={styles.error}>{errors.investments}</span>}
      <button id={styles.addButton} type="button" onClick={addNewInvestment}>
        Add New Investment
      </button>
    </div>
  );
};

export default Investments;