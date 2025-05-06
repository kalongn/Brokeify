import { useState, useEffect, useImperativeHandle } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import Select from "react-select";
import ErrorMessage from "../../components/ErrorMessage";
import Axios from "axios";

import { validateRequired, validateDistribution, clearErrors } from "../../utils/ScenarioHelper";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";
import buttonStyles from "../ScenarioForm.module.css";
import errorStyles from "../../components/ErrorMessage.module.css";
import Tooltip from "../../components/Tooltip";
const EventSeriesForm = () => {
  const navigate = useNavigate();

  // useOutletContext and useImperativeHandle were AI-generated solutions as stated in BasicInfo.jsx
  // Get ref from the context 
  const { childRef, scenarioHash, fetchScenarioHash } = useOutletContext();
  const { scenarioId, id } = useParams();

  const [allInvestments, setAllInvestments] = useState([]); // as needed to populate the actual investments option differently
  const [birthYear, setBirthYear] = useState(null);
  const [lifeExpectancy, setLifeExpectancy] = useState(null);
  const [maritalStatus, setMaritalStatus] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [events, setEvents] = useState([]);

  // General form data
  const [formData, setFormData] = useState({ name: null, description: null });
  // Event type specific form data
  const [eventType, setEventType] = useState(null);
  const [typeFormData, setTypeFormData] = useState([]);
  const [distributions, setDistributions] = useState({
    startYear: { type: "" },
    duration: { type: "" },
    expectedAnnualChange: { type: "" },
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [erroneousInvRows, setErroneousInvRows] = useState([]);

  const taxStatuses = [
    { value: "Non-Retirement", label: "Non-Retirement" },
    { value: "Pre-Tax Retirement", label: "Pre-Tax Retirement" },
    { value: "After-Tax Retirement", label: "After-Tax Retirement" },
  ];

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    const fetchScenarioData = async () => {
      try {
        const response = await Axios.get(`/event/${scenarioId}`);
        const scenarioData = response.data.scenario;
        setBirthYear(scenarioData.birthYear);
        setLifeExpectancy(scenarioData.lifeExpectancy);
        setMaritalStatus(scenarioData.maritalStatus);
        const eventsData = response.data.events;
        const investmentsData = response.data.investments;
        // Prompt to AI (Amazon Q): If eventsData is the same as the current event, skip it
        // Had to edit the if-statement conditional
        const eventOptions = eventsData.map((event) => {
          if (id !== undefined && event.id === id) {
            return null;
          }
          return { value: event.id, label: event.name };
        }).filter(Boolean);

        setEvents(eventOptions);
        setAllInvestments(investmentsData);

        if (id) {
          const eventResponse = await Axios.get(`/event/${scenarioId}/${id}`);
          const eventData = eventResponse.data;
          setFormData({
            name: eventData.name,
            description: eventData.description,
          });
          setDistributions((prev) => ({
            ...prev,
            startYear: eventData.startYearTypeDistribution,
            duration: eventData.durationTypeDistribution,
            expectedAnnualChange: eventData.expectedAnnualChangeDistribution || { type: "" },
          }));
          setEventType(eventData.eventType);

          switch (eventData.eventType) {
            case "income":
              setTypeFormData({
                type: "income",
                isSocialSecurity: eventData.isSocialSecurity,
                initialValue: eventData.initialValue,
                percentageIncrease: eventData.percentageIncrease,
                isAdjustInflation: eventData.isAdjustInflation,
              });
              break;
            case "expense":
              setTypeFormData({
                type: "expense",
                isDiscretionary: eventData.isDiscretionary,
                initialValue: eventData.initialValue,
                percentageIncrease: eventData.percentageIncrease,
                isAdjustInflation: eventData.isAdjustInflation,
              });
              break;
            case "invest":
              setTypeFormData({
                type: "invest",
                allocationMethod: eventData.allocationMethod,
                maximumCash: eventData.maximumCash,
                investmentRows: eventData.investmentRows,
              });
              break;
            case "rebalance":
              setTypeFormData({
                type: "rebalance",
                allocationMethod: eventData.allocationMethod,
                investmentRows: eventData.investmentRows,
                taxStatus: eventData.taxStatus,
              });
              break;
            default:
              // Should not happen
              break;
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event series:', error);
      }
    };

    fetchScenarioData();
  }, [scenarioId, id]);

  useEffect(() => {
    switch (eventType) {
      case "invest": {
        const relevantInvestments = allInvestments.filter((investment) => investment.taxStatus !== "Pre-Tax Retirement" && investment.taxStatus !== "Cash");
        const investmentOptions = relevantInvestments.map((investment) => {
          return { value: investment.id, label: investment.label + "\n(" + investment.taxStatus + ")" };
        });
        setInvestments(investmentOptions);
        break;
      }
      case "rebalance": {
        const rebalanceInvestments = allInvestments.filter((investment) => investment.taxStatus === typeFormData.taxStatus);
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
  }, [allInvestments, eventType, typeFormData.taxStatus]);

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
      } else if (field === "event") {
        updatedDistributions[name].event = value;
      } else {
        const processedValue = value === "" ? null : Number(value);
        updatedDistributions[name][field] = processedValue;
      }
      return updatedDistributions;
    });
    // Clear errors when user makes changes
    clearErrors(setErrors, name);
  };

  // Prompt for AI (Amazon Q): I have a table with 3 or 4 input fields when 
  // add button is clicked a new row with all the input fields should be added to the table.
  // The number of input fields are dependent on the allocation method.
  // There were no changes needed for the generated code.

  // InvestmentRow functions are for invest and rebalance types
  const handleInvestmentRowChange = (index, field, value) => {
    let prevInvestment = typeFormData.investmentRows[index].investment;
    prevInvestment = prevInvestment !== "" ? prevInvestment : null;
    const updatedInvestmentRows = [...typeFormData.investmentRows];

    // Check if name is a number field and parse if so
    let processedValue = value;
    if (field !== "investment" && value.length > 0) {
      processedValue = Number(value);
    }
    updatedInvestmentRows[index] = {
      ...updatedInvestmentRows[index],
      [field]: processedValue
    };
    setTypeFormData(prev => ({ ...prev, investmentRows: updatedInvestmentRows }));
    // Prevent duplicate investment selection handling if the input is not a Select
    if (field !== "investment" && value.length > 0) {
      return;
    }

    // Prevent duplicate investment selections by removing the current and adding the previous
    setInvestments(investments.filter(investment => investment.value !== value));
    if (prevInvestment !== null) {
      prevInvestment = allInvestments.find(investment => investment.id === prevInvestment);
      setInvestments(prev => [...prev, { value: prevInvestment.id, label: prevInvestment.label + "\n(" + prevInvestment.taxStatus + ")" }]);
    }
  };

  const addInvestmentRow = () => {
    const newRow = typeFormData.allocationMethod === "fixed"
      ? { investment: "", percentage: "" }
      : { investment: "", initialPercentage: "", finalPercentage: "" };

    setTypeFormData(prev => ({
      ...prev,
      investmentRows: [...(prev.investmentRows || []), newRow]
    }));
  };

  const removeInvestmentRow = (index) => {
    setTypeFormData(prev => ({
      ...prev,
      investmentRows: prev.investmentRows.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "startYear" && value.includes("event")) {
      handleDistributionsChange(name, "type", value);
    }
    else if (name === "eventType") {
      setEventType(value);
      // Clear distribution's inputs
      setDistributions((prev) => ({ ...prev, expectedAnnualChange: { type: "" } }));

      switch (value) {
        case "income":
          setTypeFormData({ type: value, isSocialSecurity: false, initialValue: "", percentageIncrease: "", isAdjustInflation: false });
          break;
        case "expense":
          setTypeFormData({ type: value, isDiscretionary: false, initialValue: "", percentageIncrease: "", isAdjustInflation: false });
          break;
        case "invest":
          setTypeFormData({ type: value, allocationMethod: "", maximumCash: "", investmentRows: [{ investment: "", percentage: "", initialPercentage: "", finalPercentage: "" }] });
          break;
        case "rebalance":
          setTypeFormData({ type: value, taxStatus: null, allocationMethod: "", investmentRows: [{ investment: "", percentage: "", initialPercentage: "", finalPercentage: "" }] });
          break;
        default:
          // Should not happen
          break;
      }
      // Clear event-specific errors when switching event types
      // Prompt to AI (Amazon Q): I want to keep errors on name, startYear, and duration and clear the rest
      // The code snippet did not need any change to work
      setErrors(prev => {
        const { name, startYear, duration, startYearEvent } = prev;
        return {
          ...(name && { name }),
          ...(startYear && { startYear }),
          ...(duration && { duration }),
          ...(startYearEvent && { startYearEvent })
        };
      });
    }
    else {
      // Set general form data or event specific form data
      if (name === "name" || name === "description") {
        setFormData((prev) => ({ ...prev, [name]: value }));
      } else if (name === "isAdjustInflation" || name === "isDiscretionary" || name === "isSocialSecurity") {
        setTypeFormData((prev) => ({ ...prev, [name]: e.target.checked }));
      } else {
        setTypeFormData((prev) => ({ ...prev, [name]: value }))
      }
      // Clear errors when user makes changes
      clearErrors(setErrors, name);
    }
  };
  const handleSelectChange = (selectedOption, field) => {
    // For start year's event options
    if (field === "event") {
      handleDistributionsChange("startYear", "event", selectedOption.value);
    }
    else {
      setTypeFormData((prev) => ({ ...prev, [field]: selectedOption.value }));
    }
  };

  const handleNavigate = async () => {
    await fetchScenarioHash();
    navigate(`/ScenarioForm/${scenarioId}/event-series`);
  };

  const validateFields = () => {
    const newErrors = {};
    // Validate general form for name input
    validateRequired(newErrors, "name", formData.name);
    // Validate distributions
    for (const [field, value] of Object.entries(distributions)) {
      // expectedAnnualChange distribution is specific to income and expense event types
      if (field === "expectedAnnualChange") {
        if (eventType === "income" || eventType === "expense") {
          validateDistribution(newErrors, field, value, true);
        }
        continue;
      }
      validateDistribution(newErrors, field, value);
    }

    // Validate start year and duration are within lifetime
    let deathYear = birthYear + lifeExpectancy.value;
    // Account for normal distribution life expectancy
    if (lifeExpectancy.value === undefined) {
      deathYear = birthYear + lifeExpectancy.mean;
    }

    const start = distributions.startYear;
    switch (start.type) {
      case "fixed":
        if (start.value < birthYear || start.value > deathYear) {
          newErrors.startYear = `Start year must be within your lifetime (${birthYear} - ${deathYear})`;
        }
        break;
      case "uniform":
        if (start.lowerBound < birthYear || start.upperBound > deathYear) {
          newErrors.startYear = `Start year must be within your lifetime (${birthYear} - ${deathYear})`;
        }
        break;
      case "normal":
        if (start.mean < birthYear || start.mean > deathYear) {
          newErrors.startYear = `Start year must be within your lifetime (${birthYear} - ${deathYear})`;
        }
        break;
      default:
        // Should not happen
        break;
    }

    // Validate event type
    validateRequired(newErrors, "eventType", eventType);

    // Validate event-specific inputs
    for (const [field, value] of Object.entries(typeFormData)) {
      // Adjust inflation, discretionary expense, and social security are optional
      if (field === "isAdjustInflation" || field === "isDiscretionary" || field === "isSocialSecurity" || (field === "percentageIncrease" && maritalStatus !== "MARRIEDJOINT")) {
        continue;
      }
      if ((eventType === "income" || eventType === "expense") && maritalStatus === "MARRIEDJOINT") {
        // Percentage increase validation
        const pInc = typeFormData.percentageIncrease;
        if (!pInc) {
          newErrors.percentageIncrease = "Specific Percentage Increase field is required";
        } else if (pInc < 0 || pInc > 100) {
          newErrors.percentageIncrease = "Specific Percentage Increase field must be between 0 and 100";
        }
      }
      validateRequired(newErrors, field, value);
    }
    if (distributions.startYear.type.includes("event") && distributions.startYear.event === null) {
      newErrors.startYearEvent = "Event field is required";
    }

    // Validate investment/rebalance specific fields
    const allocMethod = typeFormData.allocationMethod;
    if (allocMethod && (eventType === "invest" || eventType === "rebalance")) {
      // Validate investment rows
      const invRows = typeFormData.investmentRows;
      let totalPercentage = 0;
      let totalInitialPercentage = 0;
      let totalFinalPercentage = 0;
      setErroneousInvRows([]);

      invRows?.forEach((row) => {
        const fixedMethod = row.percentage === "";
        const glideMethod = row.initialPercentage === "" || row.finalPercentage === "";
        // Check if investment is set and if all fields are filled depending on allocationMethod
        if (!row.investment || (fixedMethod && allocMethod === "fixed") || (glideMethod && allocMethod === "glidePath")) {
          newErrors.investmentRow = "Investment Allocation's row fields are all required";
          setErroneousInvRows(prev => [...prev, row]);
        } else if (allocMethod === "fixed") {
          if (row.percentage < 0 || row.percentage > 100) {
            newErrors.investmentRow = "Investment Allocation's percentages must be between 0 and 100";
          }
          totalPercentage += row.percentage;
        } else if (allocMethod === "glidePath") {
          if ((row.initialPercentage < 0 || row.initialPercentage > 100) || (row.finalPercentage < 0 || row.finalPercentage > 100)) {
            newErrors.investmentRow = "Investment Allocation's percentages must be between 0 and 100";
          }
          totalInitialPercentage += row.initialPercentage;
          totalFinalPercentage += row.finalPercentage;
        }
      });
      // Total the percentages only if all row fields are filled
      if (newErrors.investmentRow === undefined) {
        if (allocMethod === "fixed" && totalPercentage !== 100) {
          newErrors.investmentRow = "Investment Allocation's total percentage must be 100";
        } else if (allocMethod === "glidePath" && (totalInitialPercentage !== 100 || totalFinalPercentage !== 100)) {
          newErrors.investmentRow = "Investment Allocation's initial and final percentage must sum to 100 each";
        }
      }
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };

  const uploadToBackend = async () => {
    let event = null;
    switch (eventType) {
      case "income":
        event = {
          eventType: eventType.toUpperCase(),
          name: formData.name,
          description: formData.description,
          durationTypeDistribution: distributions.duration,
          startYearTypeDistribution: distributions.startYear,
          initialValue: typeFormData.initialValue,
          expectedAnnualChangeDistribution: distributions.expectedAnnualChange,
          isAdjustInflation: typeFormData.isAdjustInflation,
          percentageIncrease: typeFormData.percentageIncrease,
          isSocialSecurity: typeFormData.isSocialSecurity,
        };
        break;
      case "expense":
        event = {
          eventType: eventType.toUpperCase(),
          name: formData.name,
          description: formData.description,
          durationTypeDistribution: distributions.duration,
          startYearTypeDistribution: distributions.startYear,
          initialValue: typeFormData.initialValue,
          expectedAnnualChangeDistribution: distributions.expectedAnnualChange,
          isAdjustInflation: typeFormData.isAdjustInflation,
          percentageIncrease: typeFormData.percentageIncrease,
          isDiscretionary: typeFormData.isDiscretionary,
        };
        break;
      case "invest":
        event = {
          eventType: eventType.toUpperCase(),
          name: formData.name,
          description: formData.description,
          durationTypeDistribution: distributions.duration,
          startYearTypeDistribution: distributions.startYear,
          maximumCash: typeFormData.maximumCash,
          allocationMethod: typeFormData.allocationMethod,
          investmentRows: typeFormData.investmentRows,
        };
        break;
      case "rebalance":
        event = {
          eventType: eventType.toUpperCase(),
          name: formData.name,
          description: formData.description,
          durationTypeDistribution: distributions.duration,
          startYearTypeDistribution: distributions.startYear,
          allocationMethod: typeFormData.allocationMethod,
          investmentRows: typeFormData.investmentRows,
          taxStatus: typeFormData.taxStatus,
        };
        break;
      default:
        // Should not happen
        break;
    }
    event.name = event.name.trim();
    try {
      let response = null;
      if (id) {
        const currentHash = await Axios.get(`/concurrency/${scenarioId}`);
        if (currentHash.data !== scenarioHash) {
          alert("This scenario has been modified by you on another tab or another user. Redirecting to the event series page...");
          handleNavigate();
          return;
        }
        response = await Axios.put(`/event/${scenarioId}/${id}`, event);
      } else {
        response = await Axios.post(`/event/${scenarioId}`, event);
      }
      console.log(response.data);
      handleNavigate();
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors({ name: "Event series name already exists" });
      } else {
        setErrors({ name: "An unknown error occurred" });
      }
      console.error("Error creating event series:", error);
      return false;
    } finally {
      await fetchScenarioHash();
    }
  }


  const handleSubmit = async () => {
    if (!validateFields()) {
      // Scroll to the top to show the error message
      window.scrollTo(0, 0);
      return;
    }
    await uploadToBackend();
  };

  return (
    <div id={styles.newItemContainer}>
      {loading ?
        <p>Loading...</p>
        :
        <>
          <h2>New Event Series</h2>
          <ErrorMessage errors={errors} />
          <form>
            <label>
              Event Series Name
              <input
                type="text"
                name="name"
                defaultValue={formData.name}
                id="name"
                className={`${styles.newline} ${errors.name ? errorStyles.errorInput : ""}`}
                onChange={handleChange}
              />
            </label>
            <label>
              Description
              <textarea name="description" defaultValue={formData.description} onChange={handleChange} />
            </label>
            <label id="startYear">Start Year</label>
            <div className={`${styles.columns} ${errors.startYear ? errorStyles.highlight : ""}`}>
              <Distributions
                options={["fixed", "uniform", "normal"]}
                name="startYear"
                defaultValue={distributions.startYear}
                onChange={handleDistributionsChange}
              />
              <div id="startYearEvent" className={errors.startYearEvent ? errorStyles.highlight : ""}>
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
                  className="select"
                  onChange={(option) => handleSelectChange(option, "event")}
                  value={events.find(opt => opt.value === distributions.startYear.event)}
                />}
              </div>
            </div>

            <label id="duration">Duration (in years)</label>
            <Distributions
              options={["fixed", "uniform", "normal"]}
              name="duration"
              defaultValue={distributions.duration}
              onChange={handleDistributionsChange}
              className={errors.duration ? errorStyles.highlight : ""}
            />
            <label id="eventType" className={styles.newline}>
              Type <Tooltip text="Income refers to money received, such as dividends or interest. Expense is money spent, including fees, taxes, or withdrawals. Invest involves allocating funds to assets like stocks or bonds to earn returns. 
              Rebalance means adjusting your portfolio to maintain the desired mix of assets." />
            </label>
            <div>
              <label className={`${styles.radioButton} ${errors.eventType ? errorStyles.highlight : ""}`}>
                <input type="radio" name="eventType" value="income" defaultChecked={eventType === "income"} onChange={handleChange} />
                Income
              </label>
              <label className={`${styles.radioButton} ${errors.eventType ? errorStyles.highlight : ""}`}>
                <input type="radio" name="eventType" value="expense" defaultChecked={eventType === "expense"} onChange={handleChange} />
                Expense
              </label>
            </div>
            <div>
              <label className={`${styles.radioButton} ${errors.eventType ? errorStyles.highlight : ""}`}>
                <input type="radio" name="eventType" value="invest" defaultChecked={eventType === "invest"} onChange={handleChange} />
                Invest
              </label>
              <label className={`${styles.radioButton} ${errors.eventType ? errorStyles.highlight : ""}`}>
                <input type="radio" name="eventType" value="rebalance" defaultChecked={eventType === "rebalance"} onChange={handleChange} />
                Rebalance
              </label>
            </div>
            <hr />

            {(eventType === "income" || eventType === "expense") && (
              <div>
                {/* TODO: replace with toggle button */}
                {eventType === "income" && (
                  <label>
                    <input type="checkbox" name="isSocialSecurity" defaultChecked={typeFormData.isSocialSecurity} onChange={handleChange} />
                    Social Security
                  </label>
                )}
                {eventType === "expense" && (
                  <label>
                    <input type="checkbox" name="isDiscretionary" defaultChecked={typeFormData.isDiscretionary} onChange={handleChange} />
                    Discretionary
                  </label>
                )}
                <label className={styles.newline}>
                  Initial Value <Tooltip text="This is the starting value of this income/expense event type" />
                  <input
                    type="number"
                    name="initialValue"
                    id="initialValue"
                    className={`${styles.newline} ${errors.initialValue ? errorStyles.errorInput : ""}`}
                    onChange={handleChange}
                    value={typeFormData.initialValue}
                  />
                </label>
                <label id="expectedAnnualChange">Expected Annual Change <Tooltip text="This is the anticipated yearly increase or decrease in value" /></label>
                <Distributions
                  options={["fixed", "uniform", "normal"]}
                  name="expectedAnnualChange"
                  requirePercentage={true}
                  onChange={handleDistributionsChange}
                  defaultValue={distributions.expectedAnnualChange}
                  className={errors.expectedAnnualChange ? errorStyles.highlight : ""}
                />
                {maritalStatus === "MARRIEDJOINT" && <label>
                  Specific Percentage Increase <Tooltip text="This is the portion of income/expense attributed to the user when married. When single or when spouse reaches life expectancy, this is assumed to be 100%. Please input a number between 0-100." />
                  <input
                    type="number"
                    name="percentageIncrease"
                    id="percentageIncrease"
                    className={`${styles.newline} ${errors.percentageIncrease ? errorStyles.errorInput : ""}`}
                    onChange={handleChange}
                    value={typeFormData.percentageIncrease}
                  />
                </label>}
                <label>
                  <input type="checkbox" name="isAdjustInflation" defaultChecked={typeFormData.isAdjustInflation} onChange={handleChange} />
                  Adjust for Inflation
                </label>
              </div>
            )}
            {(eventType === "invest" || eventType === "rebalance") && (
              <div>
                <label id="allocationMethod" className={styles.newline}>
                  Investment Allocation Method <Tooltip text="Fixed percentages maintain a constant allocation across asset classes without adjustments. In contrast, a glide path gradually shifts the allocation to more conservative investments (ex: more bonds, fewer stocks) as the target date nears (ex: retirement)." />
                </label>
                <label className={`${styles.radioButton} ${errors.allocationMethod ? errorStyles.highlight : ""}`}>
                  <input
                    type="radio"
                    name="allocationMethod"
                    value="fixed"
                    checked={typeFormData.allocationMethod === "fixed"}
                    onChange={handleChange}
                    className={errors.allocationMethod ? errorStyles.highlight : ""}
                  />
                  Fixed Percentages
                </label>
                <label className={`${styles.radioButton} ${errors.allocationMethod ? errorStyles.highlight : ""}`}>
                  <input
                    type="radio"
                    name="allocationMethod"
                    value="glidePath"
                    checked={typeFormData.allocationMethod === "glidePath"}
                    onChange={handleChange}
                  />
                  Glide Path
                </label>

                {eventType === "rebalance" && (
                  <label className={styles.newline}>
                    Tax Status
                    <Select
                      options={taxStatuses}
                      id="taxStatus"
                      className={`select ${errors.taxStatus ? errorStyles.errorInput : ""}`}
                      onChange={(option) => handleSelectChange(option, "taxStatus")}
                      value={taxStatuses.find(opt => opt.value === typeFormData.taxStatus)}
                    />
                  </label>
                )}

                {/* Render inputs based on the selected allocation method */}
                {typeFormData.allocationMethod === "fixed" && (
                  <div id={styles.inputTable}>
                    <table id={styles.inputTable}>
                      <thead id="investmentRow">
                        <tr>
                          <th>Investment</th>
                          <th>Percentage</th>
                          {/* To account for remove button */}
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {typeFormData.investmentRows?.map((row, index) => (
                          <tr
                            key={index}
                            className={erroneousInvRows.includes(row) ? errorStyles.highlight : ""}
                          >
                            <td>
                              <Select
                                options={investments}
                                value={investments.find((option) => option.value === row.investment)}
                                onChange={(selectedOption) =>
                                  handleInvestmentRowChange(index, "investment", selectedOption.value)
                                }
                                placeholder="Select Investment"
                                className="select"
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

                {typeFormData.allocationMethod === "glidePath" && (
                  <div>
                    <table id={styles.inputTable}>
                      <thead id="investmentRow">
                        <tr>
                          <th>Investment</th>
                          <th>Initial Percentage</th>
                          <th>Final Percentage</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {typeFormData.investmentRows?.map((row, index) => (
                          <tr
                            key={index}
                            className={erroneousInvRows.includes(row) ? errorStyles.highlight : ""}
                          >
                            <td>
                              <Select
                                options={investments}
                                value={investments.find((option) => option.value === row.investment)}
                                onChange={(selectedOption) =>
                                  handleInvestmentRowChange(index, "investment", selectedOption.value)
                                }
                                placeholder="Select Investment"
                                className="select"
                                id="selectInvestment"
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
                {eventType === "invest" && (
                  <label className={styles.newline}>
                    Maximum Cash (in pre-defined cash investment)
                    <Tooltip text="This is a limit on the amount of cash in a portfolio to prevent excessive holdings in low-return cash investments as part of a predefined strategy." />
                    <input
                      type="number"
                      name="maximumCash"
                      defaultValue={typeFormData.maximumCash}
                      onChange={handleChange}
                      id="maximumCash"
                      className={`${styles.newline} ${errors.maximumCash ? errorStyles.errorInput : ""}`}
                    />
                  </label>
                )}
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
              {id ? "Update" : "Create"}
            </button>
          </div>
        </>
      }
    </div>
  );
};

export default EventSeriesForm;