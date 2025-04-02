import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { HiDotsVertical } from 'react-icons/hi';
import Axios from 'axios';

import styles from "./Form.module.css";

// This page does not submit any data, so childRef is not used
const InvestmentTypes = () => {

  const { scenarioId } = useOutletContext(); // TODO: update page to include childRef once investment type deletion is implemented
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