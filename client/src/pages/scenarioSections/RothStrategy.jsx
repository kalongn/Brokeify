import { useState, useEffect, useImperativeHandle } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import Axios from "axios";

import { distributionToString } from "../../utils/ScenarioHelper";
import SortableList from "../../components/SortableList";
import styles from "./Form.module.css";

const RothStrategy = () => {

  const { scenarioId } = useParams();
  const { childRef } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [optimized, setOptimized] = useState(false);
  const [strategy, setStrategy] = useState([]);
  const [formData, setFormData] = useState({
    startYearRothOptimizer: null,
    endYearRothOptimizer: null
  });
  const [userBirthYear, setUserBirthYear] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/roth-strategy/${scenarioId}`).then((response) => {
      const data = response.data;
      const startYear = data.startYearRothOptimizer;
      const endYear = data.endYearRothOptimizer;

      if (startYear && endYear) {
        setOptimized(true);
        setFormData((prev) => ({
          ...prev,
          startYearRothOptimizer: startYear,
          endYearRothOptimizer: endYear
        }));
      }

      const birthYear = data.userBirthYear;
      setUserBirthYear(birthYear);

      const rothStrategy = data.rothStrategy;
      const strategyData = rothStrategy.map((investment) => ({
        _id: investment.id,
        id: investment.type + " (" + investment.taxStatus + ")",
        amount: `$${investment.value}`,
        percentage: `${distributionToString(investment.expectedAnnualReturnDistribution)}`,
        additional: investment.taxability ? "Taxable" : "Tax-exempt",
      }));
      setStrategy(strategyData);
      setLoading(false);
    }).catch((error) => {
      console.error('Error fetching spending strategy:', error);
    });
  }, [scenarioId]);

  const handleReorder = (list) => {
    setStrategy(list);
    if (!strategy) {
      console.log("no strategy");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Check if name is a number field and parse if so
    let processedValue = value;
    if (name.includes("Year")) {
      processedValue = Number(value);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    // Clear errors when user makes changes
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateFields = () => {
    const newErrors = {};
    const birthYear = userBirthYear || new Date().getFullYear();
    const start = formData.startYearRothOptimizer;
    const end = formData.endYearRothOptimizer;
    if (optimized) {
      if (!start) {
        newErrors.startYearRothOptimizer = "This field is required";
      } else if (start < birthYear || start > birthYear + 122) {
        newErrors.startYearRothOptimizer = "Start year must be within your lifetime";
      }
      if (!end) {
        newErrors.endYearRothOptimizer = "This field is required";
      } else if (end < start || end > birthYear + 122) {
        newErrors.endYearRothOptimizer = "End year be within your lifetime";
      }
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };

  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));

  const uploadToBackend = async () => {
    const updatedStrategy = strategy.map((investment) => ({
      id: investment._id,
    }));
    const limits = {
      startYearRothOptimizer: formData.startYearRothOptimizer,
      endYearRothOptimizer: formData.endYearRothOptimizer,
    }

    try {
      // Send the limits data to the server
      const response = await Axios.post(`/roth-strategy/${scenarioId}`, {
        updatedStrategy,
        limits
      });
      console.log(response.data);
      return true;
    }
    catch (error) {
      console.error('Error saving limits:', error);
      return false
    }
  }

  const handleSubmit = async () => {
    if (!validateFields()) {
      return false;
    }
    return await uploadToBackend();
  };

  return (
    <div>
      <h2 id={styles.heading}>Roth Conversion Strategy & Optimizer</h2>
      <p>
        Specify the order in which investments should be transferred from
        pre-tax to after-tax retirement accounts when triggering a conversion.
        For each year in the specified range, the optimizer generates a withdrawal
        whose amount increases your income to the upper limit of your current
        federal income tax bracket.
      </p>
      {loading ?
        <p>Loading...</p>
        :
        <>
          <form>
            <label>
              <input
                type="checkbox"
                name="rothOptimizer"
                defaultChecked={optimized}
                onChange={() => {
                  setOptimized(!optimized);
                  setFormData((prev) => ({
                    ...prev,
                    startYearRothOptimizer: null,
                    endYearRothOptimizer: null
                  }));
                  setErrors({});
                  // TODO: turning off the optimizer should also empty the year fields, which currently it is not.
                }}
              />
              Enable Roth Conversion Optimizer
            </label>
            <div className={styles.columns}>
              <label>
                Start Year
                <br />
                <input
                  type="number"
                  name="startYearRothOptimizer"
                  defaultValue={formData.startYearRothOptimizer}
                  onChange={handleChange}
                  disabled={!optimized}
                />
                {errors.startYearRothOptimizer && (<span className={styles.error}>{errors.startYearRothOptimizer}</span>)}
              </label>
              <label>
                End Year
                <br />
                <input
                  type="number"
                  name="endYearRothOptimizer"
                  defaultValue={formData.endYearRothOptimizer}
                  onChange={handleChange}
                  disabled={!optimized}
                />
                {errors.endYearRothOptimizer && (<span className={styles.error}>{errors.endYearRothOptimizer}</span>)}
              </label>
            </div>

          </form>
          {optimized && <SortableList
            items={strategy}
            handleReorder={handleReorder}
          />}
        </>
      }
    </div>
  );
};

export default RothStrategy;