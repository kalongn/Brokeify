import Select from "react-select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Distributions from "../../components/Distributions";
import { FaTimes } from 'react-icons/fa';
import styles from "./Form.module.css";
import buttonStyles from "../ScenarioForm.module.css";

const EventSeriesForm = () => {
  const [eventType, setEventType] = useState("");
  // without initial state of fixed, table is missing and empty
  const [allocationMethod, setAllocationMethod] = useState("fixed");

  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    startYear: { type: "", fixedValue: "", lowerBound: "", upperBound: "", mean: "", stdDev: "", event: "" },
    duration: { type: "", fixedValue: "", lowerBound: "", upperBound: "", mean: "", stdDev: "" },
    expectedAnnualChange: { type: "", fixedValue: "", lowerBound: "", upperBound: "", mean: "", stdDev: "" },
  });

  const handleDistributionsChange = (name, field, value) => {
    setDistributions((prev) => {
      const updatedDistributions = { ...prev };
      updatedDistributions[name][field] = value;
      return updatedDistributions;
    });
  };

  // TODO: replace with investments from db
  const investments = [
    { value: "Stocks", label: "Stocks" },
    { value: "Bonds", label: "Bonds" },
    { value: "Real Estate", label: "Real Estate" },
    { value: "Cash", label: "Cash" },
    { value: "Mutual Funds", label: "Mutual Funds" },
  ];
  const taxStatuses = [
    { value: "Non-Retirement", label: "Non-Retirement" },
    { value: "Pre-Tax Retirement", label: "Pre-Tax Retirement" },
    { value: "After-Tax Retirement", label: "After-Tax Retirement" },
  ];

  // Below functions are for invest and rebalance types
  const [investmentRows, setInvestmentRows] = useState([
    { investment: "", initialPercentage: "", finalPercentage: "" },
  ]);
  const handleInvestmentChange = (index, field, value) => {
    const updatedRows = [...investmentRows];
    updatedRows[index][field] = value;
    setInvestmentRows(updatedRows);
  };
  const addInvestmentRow = () => {
    setInvestmentRows([
      ...investmentRows,
      { investment: "", initialPercentage: "", finalPercentage: "" },
    ]);
  };
  const removeInvestmentRow = (index) => {
    const updatedRows = investmentRows.filter((_, i) => i !== index);
    setInvestmentRows(updatedRows);
  };

  const navigate = useNavigate();
  // TODO: add handler function for creation
  const handleClick = () => {
    navigate("/ScenarioForm/event-series");
  };

  return (
    <div id={styles.newItemContainer}>
      <h2>New Event Series</h2>
      <form>
        <label>
          Event Series Name
          <input type="text" name="eventSeriesName" className={styles.newline} />
        </label>
        <label>
          Description
          <textarea name="description" />
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
            <input type="radio" name="type" value="income" onChange={(e) => setEventType(e.target.value)} />
            Income
          </label>
          <label className={styles.radioButton}>
            <input type="radio" name="type" value="expense" onChange={(e) => setEventType(e.target.value)} />
            Expense
          </label>
        </div>
        <div>
          <label className={styles.radioButton}>
            <input type="radio" name="type" value="invest" onChange={(e) => setEventType(e.target.value)} />
            Invest
          </label>
          <label className={styles.radioButton}>
            <input type="radio" name="type" value="rebalance" onChange={(e) => setEventType(e.target.value)} />
            Rebalance
          </label>
        </div>
        <hr />
        {(eventType === "income" || eventType === "expense") && (
          <div>
            {/* TODO: replace with toggle button */}
            {eventType === "income" && (
              <label>
                <input type="checkbox" name="socialSecurity" value="socialSecurity" />
                Social Security
              </label>
            )}
            {eventType === "expense" && (
              <label>
                <input type="checkbox" name="discretionary" value="discretionary" />
                Discretionary
              </label>
            )}
            <label className={styles.newline}>
              Initial Value
              <input type="number" name="initialValue" className={styles.newline} />
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
              <input type="number" name="percentageIncrease" />
            </label>
            {/* TODO: show depending on marital status */}
            <label className={styles.newline}>
              Spouse&apos;s Increase
              <input type="number" name="spousePercentageIncrease" />
            </label>
            <label>
              <input type="checkbox" name="adjustInflation" />
              Adjust for Inflation
            </label>
          </div>
        )}
        {(eventType === "invest" || eventType === "rebalance") && (
          <div>
            <label className={styles.newline}>
              Investment Allocation Method
            </label>
            <label className={styles.radioButton}>
              <input
                type="radio"
                name="allocationMethod"
                value="fixed"
                checked={allocationMethod === "fixed"}
                onChange={(e) => setAllocationMethod(e.target.value)}
              />
              Fixed Percentages
            </label>
            <label className={styles.radioButton}>
              <input
                type="radio"
                name="allocationMethod"
                value="glidePath"
                onChange={(e) => setAllocationMethod(e.target.value)}
              />
              Glide Path
            </label>
            {eventType === "rebalance" && (
              <label className={styles.newline}>
                Tax Status
                <Select options={taxStatuses} className={styles.select} />
              </label>
            )}
            {/* Render inputs based on the selected allocation method */}
            {allocationMethod === "fixed" && (
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
                    {investmentRows.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <Select
                            options={investments}
                            value={investments.find((option) => option.value === row.investment)}
                            onChange={(selectedOption) =>
                              handleInvestmentChange(index, "investment", selectedOption.value)
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
                              handleInvestmentChange(index, "percentage", e.target.value)
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

            {allocationMethod === "glidePath" && (
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
                    {investmentRows.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <Select
                            options={investments}
                            value={investments.find((option) => option.value === row.investment)}
                            onChange={(selectedOption) =>
                              handleInvestmentChange(index, "investment", selectedOption.value)
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
                              handleInvestmentChange(index, "initialPercentage", e.target.value)
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
                              handleInvestmentChange(index, "finalPercentage", e.target.value)
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
              <input type="number" name="maxCash" className={styles.newline} />
            </label>
          </div>
        )}
      </form>

      <div id={buttonStyles.navButtons} style={{ margin: "1rem 0" }}>
        <button
          onClick={handleClick}
          className={buttonStyles.deemphasizedButton}
        >
          Cancel
        </button>
        <button
          // type="submit"
          // TODO: remove handleClick here when submission is handled
          onClick={handleClick}
          className={buttonStyles.emphasizedButton}
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default EventSeriesForm;