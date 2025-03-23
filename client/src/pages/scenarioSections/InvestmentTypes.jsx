import { useNavigate } from "react-router-dom";
import { HiDotsVertical } from 'react-icons/hi';
import styles from "./Form.module.css";

const InvestmentTypes = () => {
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
          <tr>
            <td>Cash</td>
            <td>Taxable</td>
            <td>
              <button
                className={styles.tableButton}
                onClick={() => alert("NOT IMPLEMENTED YET")}
              >
                <HiDotsVertical />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <button id={styles.addButton} onClick={newInvestmentType}>
        Add New Investment Type
      </button>
    </div>
  );
};

export default InvestmentTypes;