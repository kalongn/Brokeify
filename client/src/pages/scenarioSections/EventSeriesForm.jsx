import { useState, useEffect, useImperativeHandle } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import Select from "react-select";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";
import buttonStyles from "../ScenarioForm.module.css";

const EventSeriesForm = () => {
  // Get ref from the context 
  const { childRef } = useOutletContext();
  // Expose the handleSubmit function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));
  // For parsing to number
  const FIELD_TYPES = {
    NUMBER: new Set(["initialValue", "percentageIncrease", "spousePercentageIncrease", "maxCash"]),
  };

  // TODO: replace with investments from db
  const [investments, setInvestments] = useState([
    { value: "Cash", label: "Cash" },
  ]);
  // TODO: uncomment out and modify when route has been set up
    useEffect(() => {
      // TODO: remove superficial call to setInvestments (to satisfy ESLint for now)
      setInvestments([
        { value: "Stocks", label: "Stocks" },
        { value: "Bonds", label: "Bonds" },
        { value: "Real Estate", label: "Real Estate" },
        { value: "Cash", label: "Cash" },
        { value: "Mutual Funds", label: "Mutual Funds" },
      ]);
      // IIFE
      // (async () => {
      //   try {
      //     const response = await fetch('/api/investments');
      //     const data = await response.json();
          
      //     const formattedInvestments = data.map(type => ({
      //       value: type.name,
      //       label: type.name
      //     }));
  
      //     setInvestment(formattedInvestments);
      //   } catch (error) {
      //     console.error('Error fetching investments:', error);
      //   }
      // })();
    }, []);
  const taxStatuses = [
    { value: "Non-Retirement", label: "Non-Retirement" },
    { value: "Pre-Tax Retirement", label: "Pre-Tax Retirement" },
    { value: "After-Tax Retirement", label: "After-Tax Retirement" },
  ];

  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    startYear: { type: null, fixedValue: null, lowerBound: null, upperBound: null, mean: null, stdDev: null, event: null },
    duration: { type: null, fixedValue: null, lowerBound: null, upperBound: null, mean: null, stdDev: null },
    expectedAnnualChange: { type: null, fixedValue: null, lowerBound: null, upperBound: null, mean: null, stdDev: null },
  });

  const handleDistributionsChange = (name, field, value) => {
    setDistributions((prev) => {
      const updatedDistributions = { ...prev };
      // Check if name is a number field and parse if so
      let processedValue = value;
      if (field !== "type" && field !== "event" && value.length > 0) {
        processedValue = Number(value);
      }
      updatedDistributions[name][field] = processedValue;
      return updatedDistributions;
    });
  };

  // InvestmentRow functions are for invest and rebalance types
  const handleInvestmentRowChange = (index, field, value) => {
    const updatedInvestmentRows = [...formData.investmentRows];
    // Check if name is a number field and parse if so
    let processedValue = value;
    if (field !== "investment" && value.length > 0) {
      processedValue = Number(value);
    }
    updatedInvestmentRows[index] = {
      ...updatedInvestmentRows[index],
      [field]: processedValue
    };
    setFormData(prev => ({ ...prev, investmentRows: updatedInvestmentRows }));
  };

  const addInvestmentRow = () => {
    setFormData(prev => ({
      ...prev,
      investmentRows: [...prev.investmentRows, { investment: "" }]
    }));
  };
  const removeInvestmentRow = (index) => {
    setFormData(prev => ({
      ...prev,
      investmentRows: prev.investmentRows.filter((_, i) => i !== index)
    }));
  };

  const [formData, setFormData] = useState({
    eventSeriesName: null,
    description: null,
    startYear: distributions.startYear,
    duration: distributions.duration,
    eventType: null,
    isSocialSecurity: null,
    isDiscretionary: null,
    initialValue: null,
    expectedAnnualChange: distributions.expectedAnnualChange,
    percentageIncrease: null,
    spousePercentageIncrease: null,
    isAdjustInflation: null,
    allocationMethod: null,
    taxStatus: null,
    // percentage, initialPercentage, and finalPercentage are not in the initial states
    investmentRows: [{}],
    maxCash: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Check if name is a number field and parse if so
    let processedValue = value;
    if (FIELD_TYPES.NUMBER.has(name)) {
      processedValue = Number(value);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };
  const handleSelectChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, taxStatus: selectedOption.value }));
  };

  const navigate = useNavigate();
  const handleNavigate = () => {
    navigate("/ScenarioForm/event-series");
  };
  const validateFields = () => {
    console.log("============= validated");
    console.log(formData);
  };
  const handleSubmit = () => {
    validateFields();
    handleNavigate();
  };

  return (
    <div id={styles.newItemContainer}>
      <h2>New Event Series</h2>
      <form>
        <label>
          Event Series Name
          <input type="text" name="eventSeriesName" className={styles.newline} onChange={handleChange} />
        </label>
        <label>
          Description
          <textarea name="description" onChange={handleChange} />
        </label>
        <Distributions
          label="Start Year"
          options={["fixed", "uniform", "normal", "eventStart", "eventEnd"]}
          name="startYear"
          value={distributions.startYear.type}
          onChange={handleDistributionsChange}
          calculatedLabel={"Calculated Start Year"}
        />
        <Distributions
          label="Duration (in years)"
          options={["fixed", "uniform", "normal"]}
          name="duration"
          value={distributions.duration.type}
          onChange={handleDistributionsChange}
          calculatedLabel={"Calculated Duration"}
        />
        <label className={styles.newline}>
          Type
        </label>
        <div>
          <label className={styles.radioButton}>
            <input type="radio" name="eventType" value="income" onChange={handleChange} />
            Income
          </label>
          <label className={styles.radioButton}>
            <input type="radio" name="eventType" value="expense" onChange={handleChange} />
            Expense
          </label>
        </div>
        <div>
          <label className={styles.radioButton}>
            <input type="radio" name="eventType" value="invest" onChange={handleChange} />
            Invest
          </label>
          <label className={styles.radioButton}>
            <input type="radio" name="eventType" value="rebalance" onChange={handleChange} />
            Rebalance
          </label>
        </div>
        <hr />
        {(formData.eventType === "income" || formData.eventType === "expense") && (
          <div>
            {/* TODO: replace with toggle button */}
            {formData.eventType === "income" && (
              <label>
                <input type="checkbox" name="isSocialSecurity" value="socialSecurity" onChange={handleChange} />
                Social Security
              </label>
            )}
            {formData.eventType === "expense" && (
              <label>
                <input type="checkbox" name="isDiscretionary" value="discretionary" onChange={handleChange} />
                Discretionary
              </label>
            )}
            <label className={styles.newline}>
              Initial Value
              <input type="number" name="initialValue" className={styles.newline} onChange={handleChange} />
            </label>
            <Distributions
              label="Expected Annual Change"
              options={["fixed", "uniform", "normal"]}
              name="expectedAnnualChange"
              value={distributions.expectedAnnualChange.type}
              onChange={handleDistributionsChange}
              fixedLabel="Fixed Value or Percentage"
              calculatedLabel={"Calculated Annual Change"}
            />
            <label>
              Specific Percentage Increase
            </label>
            <label className={styles.newline}>
              Your Increase
              <input type="number" name="percentageIncrease" onChange={handleChange} />
            </label>
            {/* TODO: show depending on marital status */}
            <label className={styles.newline}>
              Spouse&apos;s Increase
              <input type="number" name="spousePercentageIncrease" onChange={handleChange} />
            </label>
            <label>
              <input type="checkbox" name="isAdjustInflation" onChange={handleChange} />
              Adjust for Inflation
            </label>
          </div>
        )}
        {(formData.eventType === "invest" || formData.eventType === "rebalance") && (
          <div>
            <label className={styles.newline}>
              Investment Allocation Method
            </label>
            <label className={styles.radioButton}>
              <input
                type="radio"
                name="allocationMethod"
                value="fixed"
                checked={formData.allocationMethod === "fixed"}
                onChange={handleChange}
              />
              Fixed Percentages
            </label>
            <label className={styles.radioButton}>
              <input
                type="radio"
                name="allocationMethod"
                value="glidePath"
                onChange={handleChange}
              />
              Glide Path
            </label>
            {formData.eventType === "rebalance" && (
              <label className={styles.newline}>
                Tax Status
                <Select
                  options={taxStatuses}
                  className={styles.select}
                  onChange={handleSelectChange}
                />
              </label>
            )}
            {/* Render inputs based on the selected allocation method */}
            {formData.allocationMethod === "fixed" && (
              <div id={styles.inputTable}>
                <table id={styles.inputTable}>
                  <thead>
                    <tr>
                      <th>Investment</th>
                      <th>Percentage</th>
                      {/* To account for remove button */}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.investmentRows.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <Select
                            options={investments}
                            value={investments.find((option) => option.value === row.investment)}
                            onChange={(selectedOption) =>
                              handleInvestmentRowChange(index, "investment", selectedOption.value)
                            }
                            placeholder="Select Investment"
                            className={styles.select}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.percentage}
                            onChange={(e) =>
                              handleInvestmentRowChange(index, "percentage", e.target.value)
                            }
                            placeholder="%"
                            min="0"
                            max="100"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeInvestmentRow(index)}
                            className={styles.tableButton}
                          >
                            <FaTimes />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button id={styles.addButton}
                  type="button"
                  onClick={addInvestmentRow}
                  style={{ backgroundColor: "var(--color-white)" }}
                >
                  Add Investment
                </button>
              </div>
            )}

            {formData.allocationMethod === "glidePath" && (
              <div>
                <table id={styles.inputTable}>
                  <thead>
                    <tr>
                      <th>Investment</th>
                      <th>Initial Percentage (must sum to 100)</th>
                      <th>Final Percentages (must sum to 100)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.investmentRows.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <Select
                            options={investments}
                            value={investments.find((option) => option.value === row.investment)}
                            onChange={(selectedOption) =>
                              handleInvestmentRowChange(index, "investment", selectedOption.value)
                            }
                            placeholder="Select Investment"
                            className={styles.select}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.initialPercentage}
                            onChange={(e) =>
                              handleInvestmentRowChange(index, "initialPercentage", e.target.value)
                            }
                            placeholder="Initial %"
                            min="0"
                            max="100"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.finalPercentage}
                            onChange={(e) =>
                              handleInvestmentRowChange(index, "finalPercentage", e.target.value)
                            }
                            placeholder="Final %"
                            min="0"
                            max="100"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeInvestmentRow(index)}
                            className={styles.tableButton}
                          >
                            <FaTimes />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  id={styles.addButton}
                  type="button"
                  onClick={addInvestmentRow}
                  style={{ backgroundColor: "var(--color-white)" }}
                >
                  Add Investment
                </button>
              </div>
            )}
            <label className={styles.newline}>
              Maximum Cash (in pre-defined cash investment)
              <input type="number" name="maxCash" className={styles.newline} onChange={handleChange} />
            </label>
          </div>
        )}
      </form>

      <div id={buttonStyles.navButtons} style={{ margin: "1rem 0" }}>
        <button
          onClick={handleNavigate}
          className={buttonStyles.deemphasizedButton}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className={buttonStyles.emphasizedButton}
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default EventSeriesForm;