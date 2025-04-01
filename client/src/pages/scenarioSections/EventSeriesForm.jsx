import { useState, useEffect, useImperativeHandle } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import Select from "react-select";
import Axios from "axios";

import { validateRequired, validateDistribution } from "../../utils/ScenarioHelper";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";
import buttonStyles from "../ScenarioForm.module.css";

const EventSeriesForm = () => {
  const navigate = useNavigate();

  // useOutletContext and useImperativeHandle were AI-generated solutions as stated in BasicInfo.jsx
  // Get ref from the context 
  const { childRef } = useOutletContext();
  const { scenarioId } = useParams();

  const [allInvestments, setAllInvestments] = useState([]); // as needed to populate the actual investments option differently
  const [distributions, setDistributions] = useState({
    startYear: { type: "" },
    duration: { type: "" },
    expectedAnnualChange: { type: "" },
  });
  const [formData, setFormData] = useState({
    eventSeriesName: null,
    description: null,
    eventType: null,
    isSocialSecurity: null,
    isDiscretionary: null,
    initialValue: null,
    percentageIncrease: null,
    spousePercentageIncrease: null,
    isAdjustInflation: null,
    allocationMethod: null,
    taxStatus: null,
    investmentRows: [{ investment: "", percentage: "", initialPercentage: "", finalPercentage: "" }],
    maxCash: null
  });
  const [investments, setInvestments] = useState([]);
  const [events, setEvents] = useState([]);

  const [errors, setErrors] = useState({});

  // For parsing to number
  const FIELD_TYPES = {
    NUMBER: new Set(["initialValue", "percentageIncrease", "spousePercentageIncrease", "maxCash"]),
  };

  const taxStatuses = [
    { value: "Non-Retirement", label: "Non-Retirement" },
    { value: "Pre-Tax Retirement", label: "Pre-Tax Retirement" },
    { value: "After-Tax Retirement", label: "After-Tax Retirement" },
  ];

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/event/${scenarioId}`).then((response) => {
      const eventsData = response.data.events;
      const investmentsData = response.data.investments;

      const eventOptions = eventsData.map((event) => {
        return { value: event.id, label: event.name };
      });

      setEvents(eventOptions);
      setAllInvestments(investmentsData);
    }).catch((error) => {
      console.error('Error fetching event series:', error);
    });
  }, [scenarioId]);

  useEffect(() => {
    switch (formData.eventType) {
      case "invest": {
        const relevantInvestments = allInvestments.filter((investment) => investment.taxStatus !== "Pre-Tax Retirement");
        const investmentOptions = relevantInvestments.map((investment) => {
          return { value: investment.id, label: investment.label + " (" + investment.taxStatus + ")" };
        });
        setInvestments(investmentOptions);
        break;
      }
      case "rebalance": {
        const rebalanceInvestments = allInvestments.filter((investment) => investment.taxStatus === formData.taxStatus);
        const rebalanceOptions = rebalanceInvestments.map((investment) => {
          return { value: investment.id, label: investment.label };
        });
        setInvestments(rebalanceOptions);
        break;
      }
      default: {
        setInvestments([]);
        break;
      }
    }
  }, [allInvestments, formData.eventType, formData.taxStatus]);

  // Expose the handleSubmit function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));

  // Below handler copied and pasted from AI code generation from BasicInfo.jsx
  const handleDistributionsChange = (name, field, value) => {
    setDistributions((prev) => {
      const updatedDistributions = { ...prev };
      if (field === "type") {
        // Reset the distribution values when the type changes
        switch (value) {
          case "fixed":
            updatedDistributions[name] = { type: value, value: null };
            break;
          case "uniform":
            updatedDistributions[name] = { type: value, lowerBound: null, upperBound: null };
            break;
          case "normal":
            updatedDistributions[name] = { type: value, mean: null, standardDeviation: null };
            break;
          case "eventStart":
          case "eventEnd":
            updatedDistributions[name] = { type: value, event: null };
            break;
          default:
            // Should not happen
            break;
        }
      } else {
        const processedValue = value === "" ? null : Number(value);
        updatedDistributions[name][field] = processedValue;
      }
      return updatedDistributions;
    });
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Prompt for AI (Amazon Q): I have a table with 3 or 4 input fields when 
  // add button is clicked a new row with all the input fields should be added to the table.
  // The number of input fields are dependent on the allocation method.
  // There were no changes needed for the generated code.

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
      investmentRows: [...prev.investmentRows, { investment: "", percentage: "", initialPercentage: "", finalPercentage: "" }]
    }));
  };
  const removeInvestmentRow = (index) => {
    setFormData(prev => ({
      ...prev,
      investmentRows: prev.investmentRows.filter((_, i) => i !== index)
    }));
  };

  // Below handlers copied and pasted from AI code generation from BasicInfo.jsx
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (value.includes("event")) {
      handleDistributionsChange(name, "type", value);
    }
    else {
      // Check if name is a number field and parse if so
      let processedValue = value;
      if (FIELD_TYPES.NUMBER.has(name)) {
        processedValue = Number(value);
      }
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
      // Clear errors when user makes changes
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (selectedOption, field) => {
    // For start year's event options
    if (field === "event") {
      handleDistributionsChange("startYear", "event", selectedOption.value);
    }
    else {
      setFormData((prev) => ({ ...prev, [field]: selectedOption.value }));
    }
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, state: "" }));
  };

  const handleNavigate = () => {
    navigate(`/ScenarioForm/${scenarioId}/event-series`);
  };

  const validateFields = () => {
    const newErrors = {};
    const eventType = formData.eventType;
    for (const [field, value] of Object.entries(formData)) {
      // Description, adjust inflation, discretionary expense, and social security are optional
      if (field === "description" || field === "isAdjustInflation" || field === "isDiscretionary" || field === "isSocialSecurity") {
        continue;
      }
      // Distribution fields require a different function to validate
      if (field !== "startYear" && field !== "duration" && field !== "expectedAnnualChange") {
        // These fields are specific to eventTypes
        if (field === "initialValue" || field === "percentageIncrease" || (field === "spousePercentageIncrease")) {
          if (eventType !== "income" && eventType !== "expense") {
            continue;
          }
        }
        if (field === "allocationMethod" || field === "maxCash") {
          if (eventType !== "invest" && eventType !== "rebalance") {
            continue;
          }
        }
        if (eventType !== "rebalance" && field === "taxStatus") {
          continue;
        }
        validateRequired(newErrors, field, value);
      }
      else {
        // Distribution field is specific to eventType
        if (field === "expectedAnnualChange" && (eventType !== "income" && eventType !== "expense")) {
          continue;
        }
        validateDistribution(newErrors, field, value);
      }
    }
    if (distributions.startYear.type.includes("event") && distributions.startYear.event === undefined) {
      newErrors.startYearEvent = "This field is required";
    }
    // Percentage increase validation
    const pInc = formData.percentageIncrease;
    if (!pInc) {
      newErrors.percentageIncrease = "This field is required";
    } else if (pInc < 0 || pInc > 100) {
      newErrors.percentageIncrease = "Percentage must be between 0 and 100";
    }

    // TODO: pull marital status and hide this field if single
    // Spouse percentage increase validation
    const spInc = formData.spousePercentageIncrease;
    if (!spInc) {
      newErrors.spousePercentageIncrease = "This field is required";
    } else if (spInc < 0 || spInc > 100) {
      newErrors.percentageIncrease = "Percentage must be between 0 and 100";
    }

    // Validate investment/rebalance specific fields
    if (formData.eventType === "invest" || formData.eventType === "rebalance") {
      // Validate investment rows
      const invRows = formData.investmentRows;
      const allocMethod = formData.allocationMethod;
      let totalPercentage = 0;
      let totalInitialPercentage = 0;
      let totalFinalPercentage = 0;

      invRows.forEach((row) => {
        const fixedMethod = row.percentage === "";
        const glideMethod = row.initialPercentage === "" || row.finalPercentage === "";
        // Check if investment is set and if all fields are filled depending on allocationMethod
        if (!row.investment || (fixedMethod && allocMethod === "fixed") || (glideMethod && allocMethod === "glidePath")) {
          newErrors.investmentRow = "All row fields are required";
        } else if (allocMethod === "fixed") {
          if (row.percentage < 0 || row.percentage > 100) {
            newErrors.investmentRow = "All percentages must be between 0 and 100";
          }
          totalPercentage += row.percentage;
        } else if (allocMethod === "glidePath") {
          if ((row.initialPercentage < 0 || row.initialPercentage > 100) || (row.finalPercentage < 0 || row.finalPercentage > 100)) {
            newErrors.investmentRow = "All percentages must be between 0 and 100";
          }
          totalInitialPercentage += row.initialPercentage;
          totalFinalPercentage += row.finalPercentage;
        }
      });
      // Total the percentages
      if (allocMethod === "fixed" && totalPercentage !== 100) {
        newErrors.investmentRow = "Total percentage must be 100";
      } else if (allocMethod === "glidePath" && (totalInitialPercentage !== 100 || totalFinalPercentage !== 100)) {
        newErrors.investmentRow = "Total initial percentage and total final percentage must be 100 each";
      }
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = () => {
    if (!validateFields()) {
      return;
    }
    handleNavigate();
  };

  return (
    <div id={styles.newItemContainer}>
      <h2>New Event Series</h2>
      <form>
        <label>
          Event Series Name
          <input type="text" name="eventSeriesName" className={styles.newline} onChange={handleChange} />
          {errors.eventSeriesName && <span className={styles.error}>{errors.eventSeriesName}</span>}
        </label>
        <label>
          Description
          <textarea name="description" onChange={handleChange} />
        </label>
        <label>Start Year</label>
        <div className={styles.columns}>
          <Distributions
            options={["fixed", "uniform", "normal"]}
            name="startYear"
            defaultValue={distributions.startYear}
            onChange={handleDistributionsChange}
          />
          <div>
            <label>
              <input
                type="radio"
                name="startYear"
                value="eventStart"
                checked={distributions.startYear.type === "eventStart"}
                onChange={handleChange}
              />
              Same Year that Specified Event Starts
            </label>
            <br />
            <label>
              <input
                type="radio"
                name="startYear"
                value="eventEnd"
                checked={distributions.startYear.type === "eventEnd"}
                onChange={handleChange}
              />
              Year After Specified Event Ends
            </label>
            {distributions.startYear.type.includes("event") && <Select
              options={events}
              className={styles.select}
              onChange={(option) => handleSelectChange(option, "event")}
              value={events.find(opt => opt.value === distributions.startYear.event)}
            />}
            {errors.startYearEvent && <span className={styles.error}>{errors.startYearEvent}</span>}
          </div>
        </div>
        {errors.startYear && <span className={styles.error}>{errors.startYear}</span>}
        <label>Duration (in years)</label>
        <Distributions
          options={["fixed", "uniform", "normal"]}
          name="duration"
          defaultValue={distributions.duration}
          onChange={handleDistributionsChange}
        />
        {errors.duration && <span className={styles.error}>{errors.duration}</span>}
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
        {errors.eventType && <span className={styles.error}>{errors.eventType}</span>}
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
              {errors.initialValue && <span className={styles.error}>{errors.initialValue}</span>}
            </label>
            <label>Expected Annual Change</label>
            <Distributions
              options={["fixed", "uniform", "normal"]}
              name="expectedAnnualChange"
              requirePercentage={true}
              onChange={handleDistributionsChange}
              defaultValue={distributions.expectedAnnualChange}
            />
            {errors.expectedAnnualChange && <span className={styles.error}>{errors.expectedAnnualChange}</span>}
            <label>
              Specific Percentage Increase
            </label>
            <label className={styles.newline}>
              Your Increase
              <input type="number" name="percentageIncrease" onChange={handleChange} />
            </label>
            {errors.percentageIncrease && <span className={styles.error}>{errors.percentageIncrease}</span>}
            {/* TODO: show depending on marital status */}
            <label className={styles.newline}>
              Spouse&apos;s Increase
              <input type="number" name="spousePercentageIncrease" onChange={handleChange} />
            </label>
            {errors.spousePercentageIncrease && <span className={styles.error}>{errors.spousePercentageIncrease}</span>}
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
            {errors.allocationMethod && <span className={styles.error}>{errors.allocationMethod}</span>}

            {formData.eventType === "rebalance" && (
              <label className={styles.newline}>
                Tax Status
                <Select
                  options={taxStatuses}
                  className={styles.select}
                  onChange={(option) => handleSelectChange(option, "taxStatus")}
                  value={taxStatuses.find(opt => opt.value === formData.taxStatus)}
                />
                {errors.taxStatus && <span className={styles.error}>{errors.taxStatus}</span>}
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
                          />
                          {errors.investmentRows?.[index]?.percentage && (<span className={styles.error}>{errors.investmentRows[index].percentage}</span>)}
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
                {errors.investmentRow && (<span className={styles.error}>{errors.investmentRow}</span>)}
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
                {errors.investmentRow && (<span className={styles.error}>{errors.investmentRow}</span>)}
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
              {errors.maxCash && <span className={styles.error}>{errors.maxCash}</span>}
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