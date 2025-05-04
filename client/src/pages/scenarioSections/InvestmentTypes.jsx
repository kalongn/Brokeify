import { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import { FaEdit } from "react-icons/fa";
import ErrorMessage from "../../components/ErrorMessage";

import Axios from 'axios';

import styles from "./Form.module.css";

// This page does not submit any data, so childRef is not used
const InvestmentTypes = () => {
  const { scenarioId } = useParams();
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [errors, setErrors] = useState({});

  const { scenarioHash, fetchScenarioHash } = useOutletContext();

  useEffect(() => {

    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/investmentTypes/${scenarioId}`).then((response) => {
      setInvestmentTypes(response.data);
    }
    ).catch((error) => {
      console.error('Error fetching investment types:', error);
    });
  }, [scenarioId]);

  const navigate = useNavigate();
  const newInvestmentType = () => {
    navigate(`/ScenarioForm/${scenarioId}/investment-types/new`);
  }
  //New route to update scenario
  const editInvestmentType = (id) => {
    navigate(`/ScenarioForm/${scenarioId}/investment-types/edit/${id}`);
  };

  const removeInvestmentType = async (id) => {
    if (!confirm("Are you sure you want to delete this investment type?")) {
      return;
    }

    try {
      const currentHash = await Axios.get(`/concurrency/${scenarioId}`);
      if (currentHash.data !== scenarioHash) {
        alert("This scenario has been modified by you or another tab or another user. Please refresh the page.");
        return;
      }

      const response = await Axios.delete(`/investmentType/${scenarioId}/${id}`);
      console.log(response.data);
      const updatedInvestmentTypes = investmentTypes.filter((invType) => invType.id !== id);
      setInvestmentTypes(updatedInvestmentTypes);
      setErrors({});
    } catch (error) {
      if (error.response.status === 409) {
        setErrors({ investmentType: "The selected investment type is being used in an investment. Remove it from the investment before deleting." });
      } else {
        setErrors({ investmentType: "There was an error deleting the investment type. Please try again." });
      }
      console.error('Error deleting investment type:', error);
    } finally {
      await fetchScenarioHash();
    }
  }

  return (
    <div>
      <h2 id={styles.heading}>Investment Types</h2>
      <p>
        Create investment types or view the default ones.
      </p>
      <ErrorMessage errors={errors} />
      <table id={styles.inputTable}>
        <thead>
          <tr>
            <th>Investment Type</th>
            <th>Taxability</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="investmentType">
          {investmentTypes.map((investmentType, index) => (
            <tr key={investmentType.id}>
              <td>
                {investmentType.name}
              </td>
              <td>
                {investmentType.taxability ? "Taxable" : "Tax-Exempt"}
              </td>
              <td>
                <div className={styles.groupButtons}>
                  <button
                    className={index === 0
                      ? `${styles.tableButton} ${styles.disabledButton}`
                      : styles.tableButton}
                    onClick={() => {
                      if (index === 0) return;
                      editInvestmentType(investmentType.id);
                    }
                    }
                    style={{ opacity: index === 0 ? 0.2 : 1 }}
                    disabled={index === 0}
                    data-testid={`edit-${investmentType.name}`}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className={index === 0
                      ? `${styles.tableButton} ${styles.disabledButton}`
                      : styles.tableButton}
                    onClick={() => {
                      if (index === 0) return;
                      removeInvestmentType(investmentType.id);
                    }
                    }
                    style={{ opacity: index === 0 ? 0.2 : 1 }}
                    disabled={index === 0}
                    data-testid={`delete-${investmentType.name}`}
                  >
                    <FaTimes />
                  </button>

                </div>
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