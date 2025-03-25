import { useState, useEffect, useImperativeHandle } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import Select from "react-select";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";
import buttonStyles from "../ScenarioForm.module.css";

const EventSeriesForm = () => {
  // useOutletContext and useImperativeHandle were AI-generated solutions as stated in BasicInfo.jsx

  // Get ref from the context 
  const { childRef } = useOutletContext();
  // Expose the handleSubmit function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));
  // Add error state
  const [errors, setErrors] = useState({
  });
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

  // Below handler copied and pasted from AI code generation from BasicInfo.jsx
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
    investmentRows: [{ investment: "", percentage: "", initialPercentage: "", finalPercentage: "" }],
    maxCash: null
  });

  // Below handlers copied and pasted from AI code generation from BasicInfo.jsx
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Check if name is a number field and parse if so
    let processedValue = value;
    if (FIELD_TYPES.NUMBER.has(name)) {
      processedValue = Number(value);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, [name]: "" }));
  };
  const handleSelectChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, taxStatus: selectedOption.value }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, state: "" }));
  };

  const navigate = useNavigate();
  const handleNavigate = () => {
    navigate("/ScenarioForm/event-series");
  };
  const validateFields = () => {
    const newErrors = {};

    // Field validation from AI code generation using same prompt (and in-line help) as in BasicInfo.jsx
    // Further modifications were similarly necessary especially for the distributions

    // Validate required basic fields
    if (!formData.eventSeriesName?.trim()) {
      newErrors.eventSeriesName = "This field is required";
    }

    // Validate start year
    // TODO: must pull birth year and life expectancy to check validity
    const start = distributions.startYear;
    if (start.type === null) {
      newErrors.startYear = "This field is required";
    } else {
      if (start.type === "fixed") {
        if (!start.fixedValue && start.fixedValue !== 0) {
          newErrors.startYear = "This field is required";
        } else if (start.fixedValue < 0) {
          newErrors.startYear = "Value must be non-negative";
        }
      } else if (start.type === "uniform") {
        if ((!start.lowerBound || !start.upperBound) && (start.lowerBound !== 0) && (start.upperBound !== 0)) {
          newErrors.startYear = "Both lower and upper bounds are required";
        } else if (start.lowerBound < 0 || start.upperBound < 0) {
          newErrors.startYear = "Bounds must be non-negative";
        } else if (start.lowerBound > start.upperBound) {
          newErrors.startYear = "Lower bound must be less than or equal to upper bound";
        }
      } else if (start.type === "normal") {
        if (!start.mean || !start.stdDev) {
          newErrors.startYear = "Both mean and standard deviation are required";
        } else if (start.mean < 0) {
          newErrors.startYear = "Mean must be non-negative";
        } else if (start.stdDev < 0) {
          newErrors.startYear = "Standard deviation must be non-negative";
        }
      } else if (start.type === "eventStart" || start.type === "eventEnd") {
        if (!start.event) {
          newErrors.startYear = "This field is required";
        }
      }
    }

    // Validate duration
    const duration = distributions.duration;
    if (!duration.type) {
      newErrors.duration = "This field is required";
    } else {
      if (duration.type === "fixed") {
        if (!duration.fixedValue && duration.fixedValue !== 0) {
          newErrors.duration = "This field is required";
        } else if (duration.fixedValue < 0) {
          newErrors.duration = "Value must be non-negative";
        }
      } else if (duration.type === "uniform") {
        if ((!duration.lowerBound || !duration.upperBound) && (duration.lowerBound !== 0) && (duration.upperBound !== 0)) {
          newErrors.duration = "Both lower and upper bounds are required";
        } else if (duration.lowerBound < 0 || duration.upperBound < 0) {
          newErrors.duration = "Bounds must be non-negative";
        } else if (duration.lowerBound > duration.upperBound) {
          newErrors.duration = "Lower bound must be less than or equal to upper bound";
        }
      } else if (duration.type === "normal") {
        if (!duration.mean || !duration.stdDev) {
          newErrors.duration = "Both mean and standard deviation are required";
        } else if (duration.mean < 0) {
          newErrors.duration = "Mean duration must be non-negative";
        } else if (duration.stdDev < 0) {
          newErrors.duration = "Standard deviation must be non-negative";
        }
      }
    }

    if (!formData.eventType) {
      newErrors.eventType = "This field is required";
    }

    // Validate based on event type
    if (formData.eventType === "income" || formData.eventType === "expense") {
      // Validate initial value
      if (!formData.initialValue && formData.initialValue !== 0) {
        newErrors.initialValue = "This field is required";
      } else if (formData.initialValue < 0) {
        newErrors.initialValue = "Initial value must be non-negative";
      }

      // Validate expected annual change
      const expAnnual = distributions.expectedAnnualChange;
      if (!expAnnual.type) {
        newErrors.expectedAnnualChange = "This field is required";
      } else {
        // Only validate the specific distribution type if one is selected
        if (expAnnual.type === "fixed") {
          if (!expAnnual.fixedValue && expAnnual.fixedValue !== 0) {
            newErrors.expectedAnnualChange = "This field is required";
          } else if (expAnnual.fixedValue < 0) {
            newErrors.expectedAnnualChange = "Value must be non-negative";
          }
        } else if (expAnnual.type === "uniform") {
          if ((!expAnnual.lowerBound || !expAnnual.upperBound) && (expAnnual.lowerBound !== 0) && (expAnnual.upperBound !== 0)) {
            newErrors.expectedAnnualChange = "Both lower and upper bounds are required";
          } else if (expAnnual.lowerBound < 0 || expAnnual.upperBound < 0) {
            newErrors.expectedAnnualChange = "Bounds must be non-negative";
          } else if (expAnnual.lowerBound > expAnnual.upperBound) {
            newErrors.expectedAnnualChange = "Lower bound must be less than or equal to upper bound";
          }
        } else if (expAnnual.type === "normal") {
          if (!expAnnual.mean || !expAnnual.stdDev) {
            newErrors.expectedAnnualChange = "Both mean and standard deviation are required";
          } else if (expAnnual.mean < 0) {
            newErrors.expectedAnnualChange = "Mean must be non-negative";
          } else if (expAnnual.stdDev < 0) {
            newErrors.expectedAnnualChange = "Standard deviation must be non-negative";
          }
        }
      }

      // Percentage Increase validation
      const pInc = formData.percentageIncrease;
      if (!pInc) {
        newErrors.percentageIncrease = "This field is required";
      } else if (pInc < 0 || pInc > 100) {
        newErrors.percentageIncrease = "Percentage must be between 0 and 100";
      }

      // TODO: pull marital status and hide this field if single
      // Spouse Percentage Increase validation
      const spInc = formData.spousePercentageIncrease;
      if (!spInc) {
        newErrors.spousePercentageIncrease = "This field is required";
      } else if (spInc < 0 || spInc > 100) {
        newErrors.percentageIncrease = "Percentage must be between 0 and 100";
      }
    }

    // Validate investment/rebalance specific fields
    if (formData.eventType === "invest" || formData.eventType === "rebalance") {
      if (!formData.allocationMethod) {
        newErrors.allocationMethod = "This field is required";
      }

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
        } else if (allocMethod === "fixed")  {
          if (row.percentage < 0 || row.percentage > 100) {
            newErrors.investmentRow = "All percentages must be between 0 and 100";
          }
          totalPercentage += row.percentage;
        } else if (allocMethod === "glidePath")  {
          if ((row.initialPercentage < 0 || row.initialPercentage > 100) || (row.finalPercentage < 0 || row.finalPercentage > 100)) {
            newErrors.investmentRow = "All percentages must be between 0 and 100";
          }
          totalInitialPercentage += row.initialPercentage;
          totalFinalPercentage += row.finalPercentage;
        }
      });
      if(allocMethod === "fixed" && totalPercentage !== 100) {
        newErrors.investmentRow = "Total percentage must be 100";
      } else if (allocMethod === "glidePath" && (totalInitialPercentage !== 100 || totalFinalPercentage !== 100)) {
          newErrors.investmentRow = "Total initial percentage and total final percentage must be 100 each";
      }

      if (!formData.maxCash || formData.maxCash < 0) {
        newErrors.maxCash = "Maximum cash must be 0 or greater";
      }
    }
    if (formData.eventType === "rebalance" && !formData.taxStatus) {
      newErrors.taxStatus = "This field is required";
    }

    // Set all errors at once
    console.log(newErrors.investmentRow);
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    console.log(errors);
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
        <Distributions
          label="Start Year"
          options={["fixed", "uniform", "normal", "eventStart", "eventEnd"]}
          name="startYear"
          value={distributions.startYear.type}
          onChange={handleDistributionsChange}
        />
        {errors.startYear && <span className={styles.error}>{errors.startYear}</span>}
        <Distributions
          label="Duration (in years)"
          options={["fixed", "uniform", "normal"]}
          name="duration"
          value={distributions.duration.type}
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
            <Distributions
              label="Expected Annual Change"
              options={["fixed", "uniform", "normal"]}
              name="expectedAnnualChange"
              value={distributions.expectedAnnualChange.type}
              onChange={handleDistributionsChange}
              fixedLabel="Fixed Value or Percentage"
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
                  onChange={handleSelectChange}
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
                            min="0"
                            max="100"
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