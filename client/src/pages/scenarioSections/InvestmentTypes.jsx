import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiDotsVertical } from 'react-icons/hi';
import styles from "./Form.module.css";

// This page does not submit any data, so childRef is not used
// TODO: update page to include childRef once investment type deletion is implemented
const InvestmentTypes = () => {
  // TODO: empty initial state (placeholder for testing)
  const [investmentTypes, setInvestmentTypes] = useState([
    { name: "Cash", taxability: "Taxable" }
  ]);
  // TODO: uncomment out and modify when route has been set up
  useEffect(() => {
    // TODO: remove superficial call to setInvestments (to satisfy ESLint for now)
    setInvestmentTypes([{ name: "Cash", taxability: "Taxable" }]);
    // IIFE
    // (async () => {
    //   try {
    //     const response = await fetch('/api/investment-types');
    //     const data = await response.json();

    //     const formattedTypes = data.map(type => ({
    //       name: type.name,
    //       taxability: type.name
    //     }));

    //     setInvestmentTypes(formattedTypes);
    //   } catch (error) {
    //     console.error('Error fetching investment types:', error);
    //   }
    // })();
  }, []);

  const navigate = useNavigate();
  const newInvestmentType = () => {
    navigate("/ScenarioForm/investment-types/new");
  }
  return (
    <div>
      <h2>Investment Types</h2>
      <p>
        Create investment types or view the default ones.
      </p>
      {/* TODO: fix global table styling */}
      <table id={styles.inputTable}>
        <thead>
          <tr>
            <th>Investment Type</th>
            <th>Taxability</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {investmentTypes.map((investmentType, index) => (
            <tr key={index}>
              <td>
                {investmentType.name}
              </td>
              <td>
                {investmentType.taxability}
              </td>
              <td>
                <button
                  className={styles.tableButton}
                  onClick={() => alert("NOT IMPLEMENTED YET")}
                >
                  <HiDotsVertical />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button id={styles.addButton} onClick={newInvestmentType}>
        Add New Investment Type
      </button>
    </div>
  );
};

export default InvestmentTypes;