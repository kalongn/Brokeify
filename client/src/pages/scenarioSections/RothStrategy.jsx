import styles from "./Form.module.css";

import { useState, useImperativeHandle } from "react";
import { useOutletContext } from "react-router-dom";
import SortableList from "../../components/SortableList";
import styles from "./Form.module.css";

const RothStrategy = () => {
  // Get ref from the context 
  const { childRef } = useOutletContext();
  // Expose the validateFields function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));
  // For error validation
  const [errors, setErrors] = useState({});
  const [optimized, setOptimized] = useState(false);
  // TODO: should this be initialized as undefined?
  const [formData, setFormData] = useState({
    startYearRothOptimizer: null,
    endYearRothOptimizer: null
  });

  // TODO: pull from list of investments and reformat into below
  // investments has name, value, expectedAnnualReturn, taxability
  // name and value are from investment while expectedAnnualReturn and taxability are from investment type
  // Keys must be named as id, amount, percentage, additional
  const investments = [
    { id: "Investment 1", amount: `$100`, percentage: `1.9% return`, additional: `Taxable` },
    { id: "Investment 2", amount: `$5000`, percentage: `4% return`, additional: `Taxable` },
  ];
  const [strategy, setStrategy] = useState([investments]);
  const handleReorder = (list) => {
    setStrategy(list);
    if (!strategy) {
      console.log("no strategy");
    }
  };
  // TODO: save roth strategy to db

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
    // TODO: pull life expectancy and birth for optimization from db then remove currentYear
    const currentYear = new Date().getFullYear();
    const start = formData.startYearRothOptimizer;
    const end = formData.endYearRothOptimizer;
    if (optimized) {
      if (!start) {
        newErrors.startYearRothOptimizer = "This field is required";
      } else if (start < currentYear - 122 || start > currentYear + 122) {
        newErrors.startYearRothOptimizer = "Start year must be within your lifetime";
      }
      if (!end) {
        newErrors.endYearRothOptimizer = "This field is required";
      } else if (end < currentYear - 122 || end > currentYear + 122) {
        newErrors.endYearRothOptimizer = "End year be within your lifetime";
      }
    }

    // Set all errors at once
    setErrors(newErrors);
    // Everything is valid if there are no error messages
    return Object.keys(newErrors).length === 0;
  };
  console.log(errors);
  const handleSubmit = () => {
    return validateFields();
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
      <form>
        <label>
          <input
            type="checkbox"
            name="rothOptimizer"
            onChange={() => setOptimized(!optimized)}
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
              onChange={handleChange}
              disabled={!optimized}
            />
            {errors.endYearRothOptimizer && (<span className={styles.error}>{errors.endYearRothOptimizer}</span>)}
          </label>
        </div>
          
      </form>
      {optimized && <SortableList
        items={investments}
        handleReorder={handleReorder}
      />}
    </div>
  );
};

export default RothStrategy;