import { useState, useEffect, useImperativeHandle } from "react";
import { useOutletContext } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import { v4 as uuidv4 } from "uuid";
import Axios from 'axios';
import Select from "react-select";

import styles from "./Form.module.css";

const Investments = () => {
  // useOutletContext and useImperativeHandle were AI-generated solutions as stated in BasicInfo.jsx
  // Get ref from the context 
  const { childRef, scenarioId } = useOutletContext();
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [formData, setFormData] = useState([]);
  const [errors, setErrors] = useState([]);

  const taxStatuses = [
    { value: "Non-Retirement", label: "Non-Retirement" },
    { value: "Pre-Tax Retirement", label: "Pre-Tax Retirement" },
    { value: "After-Tax Retirement", label: "After-Tax Retirement" },
  ];

  // Expose the handleSubmit function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));

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

  // Below handlers copied and pasted from AI code generation from BasicInfo.jsx
  // removeInvestment function did not work and has not been fixed yet since this feature's priority is low
  const handleInputChange = (index, field, value) => {
    const updatedInvestments = [...formData];
    // Check if name is a number field and parse if so
    // Prompt to AI (Amazon Q): If the user clears the field, the dollar value should be undefined not 0
    const processedValue = field === "dollarValue"
      ? (value === "" ? undefined : Number(value))
      : value;

    updatedInvestments[index][field] = processedValue;
    setFormData(updatedInvestments);
  };

  const addNewInvestment = () => {
    // uuid needed to provide unique keys when mapping the formData to the table
    setFormData([...formData, { id: undefined, type: null, dollarValue: null, taxStatus: null, uuid: uuidv4() }]);
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, investments: "" }));
  };
  const removeInvestment = (uuid) => {
    const updatedInvestments = formData.filter((investment) => investment.uuid !== uuid);
    setFormData(updatedInvestments);
  }

  const validateFields = () => {
    const newErrors = {};
    // Check if there are any investments
    if (!formData[0]) {
      newErrors.investmentRow = "At least one investment must be added";
    }
    else {
      formData.forEach((row) => {
        // Check if investment is set and if all fields are filled
        if (!row.type || row.dollarValue === null || row.dollarValue === undefined || !row.taxStatus) {
          newErrors.investmentRow = "All row fields are required";
        }
        else if (row.dollarValue < 0) {
          newErrors.investmentRow = "Dollar values must be non-negative";
        }
      });
    }
    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };

  const uploadToBackend = async () => {
    const investments = formData;
    try {
      const response = await Axios.post(`/investments/${scenarioId}`, { investments });
      console.log(response.data);
      return true;
    } catch (error) {
      console.error('Error uploading investments:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      return false;
    }
    return await uploadToBackend();
  };

  return (
    <div>
      <h2 id={styles.heading}>Investments</h2>
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
          {/* 
            Prompt for AI (Amazon Q): I want a table with 3 input fields (Select, number, and Select) that can
            be dynamically added and removed.
            The frontend appears as intended and needed no changes.
           */}
          {/* Dynamically render rows of investments */}
          {formData.map((investment, index) => (
            <tr key={investment.uuid}>
              <td>
                <Select
                  className={`${styles.selectTable} ${styles.select}`}
                  options={investmentTypes}
                  defaultValue={investment.type ?
                    { value: investment.type, label: investment.type }
                    : null
                  }
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
                  defaultValue={investment.dollarValue}
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
                  defaultValue={investment.taxStatus ?
                    { value: investment.taxStatus, label: investment.taxStatus }
                    : null
                  }
                  onChange={(e) =>
                    handleInputChange(index, "taxStatus", e.value)
                  }
                />
              </td>
              <td>
                <button
                  onClick={() => removeInvestment(investment.uuid)}
                  className={styles.tableButton}>
                  <FaTimes />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {errors.investmentRow && <span className={styles.error}>{errors.investmentRow}</span>}
      <button id={styles.addButton} type="button" onClick={addNewInvestment}>
        Add New Investment
      </button>
    </div>
  );
};

export default Investments;