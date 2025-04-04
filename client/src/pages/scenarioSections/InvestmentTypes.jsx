import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaTimes } from 'react-icons/fa';
import { FaEdit } from "react-icons/fa";

import Axios from 'axios';

import styles from "./Form.module.css";

// This page does not submit any data, so childRef is not used
const InvestmentTypes = () => {

  const { scenarioId } = useParams(); // TODO: update page to include childRef once investment type deletion is implemented
  const [investmentTypes, setInvestmentTypes] = useState([]);
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
  

  return (
    <div>
      <h2 id={styles.heading}>Investment Types</h2>
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
                {investmentType.taxability ? "Taxable" : "Tax-Exempt"}
              </td>
              <td>
                <div className={styles.groupButtons}>
                  <button
                    className={styles.tableButton}
                    onClick={() => {
                      if (index === 0) return;
                      editInvestmentType(investmentType.id);
                      alert(investmentType.id);
                      console.log(investmentType);
                    }
                    }
                    style={{ opacity: index === 0 ? 0.2 : 1 }}
                    disabled={index === 0}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className={styles.tableButton}
                    onClick={() => {
                      if (index === 0) return;
                      alert("NOT IMPLEMENTED YET")
                    }
                    }
                    style={{ opacity: index === 0 ? 0.2 : 1 }}
                    disabled={index === 0}
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