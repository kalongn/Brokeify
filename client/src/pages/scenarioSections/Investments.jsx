import { useState, useEffect, useImperativeHandle } from "react";
import { useOutletContext } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import { v4 as uuidv4 } from "uuid";
import Select from "react-select";
import ErrorMessage from "../../components/ErrorMessage";
import Axios from 'axios';

import styles from "./Form.module.css";
import errorStyles from "../../components/ErrorMessage.module.css";
import Tooltip from "../../components/Tooltip";
const Investments = () => {
  // useOutletContext and useImperativeHandle were AI-generated solutions as stated in BasicInfo.jsx
  // Get ref from the context 
  const { childRef, scenarioId } = useOutletContext();
  const [cashId, setCashId] = useState(null);
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [formData, setFormData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);

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
      const investmentTypeOptions = response.data
        .filter((investmentType) => {
          if (investmentType.name === "Cash") {
            setCashId(investmentType.id);
          }
          return investmentType.name !== "Cash"
        }).map((investmentType) => {
          return { value: investmentType.id, label: investmentType.name };
        });
      setInvestmentTypes(investmentTypeOptions);
    }).catch((error) => {
      console.error('Error fetching investment types:', error);
    });

    Axios.get(`/investments/${scenarioId}`).then((response) => {
      const investments = response.data?.map(investment => {
        if (investment.uuid) return investment;
        return { ...investment, uuid: uuidv4() }
      });
      setFormData(investments);
    }).catch((error) => {
      console.error('Error fetching investments:', error);
    });
  }, [scenarioId]);

  // Below handlers copied and pasted from AI code generation from BasicInfo.jsx
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
    setFormData([...formData, { id: undefined, typeId: null, dollarValue: undefined, taxStatus: null, uuid: uuidv4() }]);
  };

  const removeInvestment = async (uuid) => {
    if (!confirm("Are you sure you want to delete this investment?")) {
      return;
    }
    const deleteRow = formData.find((investment) => investment.uuid === uuid);
    if (!deleteRow.id) {
      setFormData((prev) => prev.filter((investment) => investment.uuid !== uuid));
      return;
    }

    try {
      const response = await Axios.delete(`/investments/${scenarioId}`, {
        data: { investmentId: deleteRow.id, typeId: deleteRow.typeId },
      });
      console.log(response.data);
      setFormData((prev) => prev.filter((investment) => investment.uuid !== uuid));
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors((prev) => ({ ...prev, investmentRow: "Investment cannot be deleted because it is used in an invest / rebalance event." }));
      } else {
        setErrors((prev) => ({ ...prev, investmentRow: "An unknown error occurred while deleting the investment." }));
      }
      console.error('Error deleting investment:', error);
    }
  }

  const validateFields = () => {
    const newErrors = {};
    const duplicatesCheck = new Set();

    // Investments will always have a cash row
    formData.forEach((row) => {
      // Check if investment is set and if all fields are filled
      if (!row.typeId || row.dollarValue === undefined || !row.taxStatus) {
        newErrors.investmentRow = "All row fields are required";
      }
      else if (row.dollarValue < 0) {
        newErrors.investmentRow = "Dollar values must be non-negative";
      }
      else if (duplicatesCheck.has(`${row.typeId}-${row.taxStatus}`)) {
        // List of duplicate rows
        setDuplicates(prev => [...prev, `${row.typeId}-${row.taxStatus}`]);
      }
      else {
        duplicatesCheck.add(`${row.typeId}-${row.taxStatus}`);
      }
    });
    if (newErrors.investmentRow === undefined && duplicatesCheck.size !== formData.length) {
      newErrors.investmentRow = "Investments with the same type and tax status are not allowed";
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
      <h2 id={styles.heading} data-testid="heading">Investments</h2>
      <p>
        If married, investments will automatically be assumed as jointly owned.
      </p>
      <ErrorMessage errors={errors} />

      <table id={styles.inputTable}>
        <thead>
          <tr>
            <th>Investment Type</th>
            <th>Dollar Value</th>
            <th>Tax Status  <Tooltip orientation="below" text="Non-retirement accounts are taxed annually, pre-tax retirement accounts are taxed upon withdrawal, and after-tax retirement accounts offer tax-free withdrawals." />
            </th>
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
            // Apply highlight CSS on row if there's an error
            <tr
              key={investment.uuid}
              className={
                (errors.investmentRow !== undefined &&
                  ((!investment.typeId || investment.dollarValue === undefined || investment.dollarValue < 0 || !investment.taxStatus))) ||
                  (duplicates.includes(`${investment.typeId}-${investment.taxStatus}`))
                  ? errorStyles.highlight : ""
              }
            >
              <td>
                <Select
                  className={`${styles.selectTable} select`}
                  options={investmentTypes}
                  defaultValue={investment.typeName && investment.typeId ?
                    { value: investment.typeId, label: investment.typeName }
                    : null
                  }
                  isDisabled={investment.typeId === cashId}
                  onChange={(e) =>
                    handleInputChange(index, "typeId", e.value)
                  }
                  id="selectInvestment"
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
                  className={`${styles.selectTable} select`}
                  options={taxStatuses}
                  defaultValue={investment.taxStatus ?
                    { value: investment.taxStatus, label: investment.taxStatus }
                    : null
                  }
                  isDisabled={investment.typeId === cashId}
                  onChange={(e) =>
                    handleInputChange(index, "taxStatus", e.value)
                  }
                  id="selectTaxStatus"
                />
              </td>
              <td>
                <button
                  disabled={investment.typeId === cashId}
                  onClick={() => removeInvestment(investment.uuid)}
                  className={investment.typeId === cashId
                    ? `${styles.tableButton} ${styles.disabledButton}`
                    : styles.tableButton}
                  data-testid="deleteButton"
                >
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