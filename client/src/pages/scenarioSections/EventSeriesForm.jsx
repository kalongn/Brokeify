import React from "react";
import Select from "react-select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";

const EventSeriesForm = () => {
    const [startYear, setStartYear] = useState("");
    const [duration, setDuration] = useState("");
    const [type, setType] = useState("");
    const [expectedAnnualChange, setExpectedAnnualChange] = useState("");
    // without initial state of fixed, table is missing and empty
    const [allocationMethod, setAllocationMethod] = useState("fixed");

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
    const handleClick = () => {
        navigate("/ScenarioForm/event-series");
    };
    return (
        <div>
            <h2>New Event Series</h2>
            <form>
                <label>
                    Event Series Name
                    <input type="text" name="event-series-name" className={styles.newline} />
                </label>
                <label>
                    Description
                    <input type="text" name="description" className={styles.newline} />
                </label>
                <Distributions 
                    label="Start Year"
                    options={["fixed", "uniform-dist", "normal-dist", "event-start", "event-end"]}
                    name="start-year"
                    value={startYear}
                    onChange={setStartYear}
                    calculatedLabel={"Calculated Start Year"}
                />
                <Distributions 
                    label="Duration (in years)"
                    options={["fixed", "uniform-dist", "normal-dist"]}
                    name="duration"
                    value={duration}
                    onChange={setDuration}
                    calculatedLabel={"Calculated Duration"}
                />
                <label className={styles.newline}>
                    Type
                </label>
                <div>
                    <label>
                        <input type="radio" name="type" value="income" onChange={(e) => setType(e.target.value)} />
                        Income
                    </label>
                    <label>
                        <input type="radio" name="type" value="expense" onChange={(e) => setType(e.target.value)} />
                        Expense
                    </label>
                </div>
                <div>
                    <label>
                        <input type="radio" name="type" value="invest" onChange={(e) => setType(e.target.value)} />
                        Invest
                    </label>
                    <label>
                        <input type="radio" name="type" value="rebalance" onChange={(e) => setType(e.target.value)} />
                        Rebalance
                    </label>
                </div>
                <hr />
                {(type === "income" || type === "expense") && (
                    <div>
                        {/* TODO: replace with toggle button */}
                        {type === "income" && (
                            <label>
                                <input type="checkbox" name="social-security" value="social-security" />
                                Social Security
                            </label>
                        )}
                        {type === "expense" && (
                            <label>
                                <input type="checkbox" name="discretionary" value="discretionary" />
                                Discretionary
                            </label>
                        )}
                        <label className={styles.newline}>
                            Initial Value
                            <input type="number" name="initial-value" className={styles.newline} />
                        </label>
                        <Distributions 
                            label="Expected Annual Change"
                            options={["fixed", "uniform-dist" , "normal-dist"]}
                            name="expected-annual-change"
                            value={expectedAnnualChange}
                            onChange={setExpectedAnnualChange}
                            fixedLabel="Fixed Value or Percentage"
                            calculatedLabel={"Calculated Annual Change"}
                        />
                        <label>
                            Specific Percentage Increase
                        </label>
                        <label className={styles.newline}>
                            Your Increase
                            <input type="number" name="percentage-increase" />
                        </label>
                        {/* TODO: show depending on marital status */}
                        <label className={styles.newline}>
                            Spouse's Increase
                            <input type="number" name="spouse-percentage-increase" />
                        </label>
                        <label>
                            <input type="checkbox" name="adjust-inflation" />
                            Adjust for Inflation
                        </label>
                    </div>
                )}
                {(type === "invest" || type === "rebalance") && (
                    <div>
                        <label className={styles.newline}>
                            Investment Allocation Method
                        </label>
                        <label>
                            <input 
                            type="radio" 
                            name="allocation-method" 
                            value="fixed" 
                            checked={allocationMethod === "fixed"}
                            onChange={(e) => setAllocationMethod(e.target.value)}
                            />
                            Fixed Percentages
                        </label>
                        <label>
                            <input 
                            type="radio" 
                            name="allocation-method" 
                            value="glide-path" 
                            onChange={(e) => setAllocationMethod(e.target.value)}
                            />
                            Glide Path
                        </label>
                        {type === "rebalance" && (
                            <label className={styles.newline}>
                                Tax Status
                                <Select options={taxStatuses} />
                            </label>
                        )}
                        {/* Render inputs based on the selected allocation method */}
                        {allocationMethod === "fixed" && (
                            <div>
                            <table>
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
                                                <button type="button" onClick={() => removeInvestmentRow(index)}>
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button type="button" onClick={addInvestmentRow}>
                                Add Investment
                            </button>
                            </div>
                        )}

                        {allocationMethod === "glide-path" && (
                            <div>
                            <table>
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
                                                <button type="button" onClick={() => removeInvestmentRow(index)}>
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button type="button" onClick={addInvestmentRow}>
                                Add Investment
                            </button>
                            </div>
                        )}
                        <label className={styles.newline}>
                            Maximum Cash (in pre-defined cash investment)
                            <input type="number" name="max-cash" className={styles.newline} />
                        </label>
                    </div>
                )}
            </form>

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={handleClick}
                style={{ marginRight: "10px" }}
              >
                  Cancel
              </button>
              <button
                // type="submit"
                // TODO: remove handleClick here when submission is handled
                onClick={handleClick}
              >
                  Create
              </button>
          </div>
        </div>
    );
};

export default EventSeriesForm;