import { useState } from "react";
import Distributions from "../../components/Distributions";
import styles from "./Form.module.css";

// TODO: add further number range validation

const BasicInfo2 = () => {
  // Determine if spouse fields are shown
  const [maritalStatus, setMaritalStatus] = useState("");
  // Determine if what distribution fields are shown and contain values for backend
  // Based on the type field, only the relevant fields should be read
  const [distributions, setDistributions] = useState({
    lifeExpectancy: { type: "", fixedValue: "", mean: "", stdDev: "" },
    spouseLifeExpectancy: { type: "", fixedValue: "", mean: "", stdDev: "" },
  });

  const handleDistributionsChange = (name, field, value) => {
    setDistributions((prev) => {
      const updatedDistributions = { ...prev };
      updatedDistributions[name][field] = value;
      return updatedDistributions;
    });
  };

  // const handleSubmit = async () => {
  //     try {
  //         const response = await Axios.post("/api/event-series", distributions);
  //         console.log("Data saved successfully:", response.data);
  //     } catch (error) {
  //         console.error("Error saving data:", error);
  //     }
  // };

  return (
    <div>
      <h2>Basic Information Continued</h2>
      <form>
        <label className={styles.newline}>
          Martial Status
        </label>  
        <div className={styles.radioButtonContainer}>
        <label className={styles.radioButton}>
          <input
            type="radio"
            name="maritalStatus"
            value="single"
            onChange={(e) => setMaritalStatus(e.target.value)}
          />
          Single
        </label>
        <label className={styles.radioButton}>
          <input
            type="radio"
            name="maritalStatus"
            value="married"
            onChange={(e) => setMaritalStatus(e.target.value)}
          />
          Married
        </label>
        </div>
        <div className={styles.columns}>
          <div>
          <label className={styles.newline}>
            Your Birth Year
            <input type="number" name="birthYear" />
          </label>
          <Distributions
            label="Your Life Expectancy"
            options={["fixed", "normal"]}
            name="lifeExpectancy"
            value={distributions.lifeExpectancy.type}
            onChange={handleDistributionsChange}
            calculatedLabel={"Calculated Life Expectancy"}
          />
          </div>
          {maritalStatus === "married" && <div>
            <label className={styles.newline}>
              Spouse Birth Year
              <input type="number" name="spouseBirthYear" min="1" />
            </label>
            <Distributions
              label="Spouse Life Expectancy"
              options={["fixed", "normal"]}
              name="spouseLifeExpectancy"
              value={distributions.spouseLifeExpectancy.type}
              onChange={handleDistributionsChange}
              fixedLabel={"Fixed Value"}
              calculatedLabel={"Calculated Life Expectancy"}
            />
          </div>
          }
        </div>
        <br />
      </form>
    </div>
  );
};

export default BasicInfo2;