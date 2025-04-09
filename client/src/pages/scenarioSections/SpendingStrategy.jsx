import { useState, useEffect, useImperativeHandle } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import Axios from "axios";

import SortableList from "../../components/SortableList";
import styles from "./Form.module.css";

const SpendingStrategy = () => {

  const { scenarioId } = useParams();
  const { childRef } = useOutletContext();

  const [strategy, setStrategy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    // Fetch the existing spending strategy data from the server
    Axios.get(`/spending-strategy/${scenarioId}`).then((response) => {
      const spendingStrategy = response.data;
      const strategy = spendingStrategy.map((expense) => ({
        _id: expense.id,
        id: expense.name,
        amount: `$${expense.amount}`,
        percentage: expense.expectedAnnualChangeDistribution,
        additional: expense.isinflationAdjusted ? "Affected by inflation" : "Not affected by inflation",
      }));
      setStrategy(strategy);
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

  // Expose the handleSubmit function to the parent component
  useImperativeHandle(childRef, () => ({
    handleSubmit,
  }));

  const uploadToBackend = async () => {
    const updatedStrategy = strategy.map((event) => ({
      id: event._id,
    }));

    try {
      const response = await Axios.post(`/spending-strategy/${scenarioId}`, updatedStrategy);
      console.log(response.data);
      return true;
    }
    catch (error) {
      console.error("Error uploading spending strategy:", error);
      return false
    }
  }
  const handleSubmit = async () => {
    return await uploadToBackend();
  };

  return (
    <div>
      <h2 id={styles.heading}>Spending Strategy</h2>
      <p>
        Specify the order of discretionary expenses to be paid as cash allows.
      </p>
      {loading ?
        <p>Loading...</p>
        :
        <SortableList
          items={strategy}
          handleReorder={handleReorder}
        />}
    </div>
  );
};

export default SpendingStrategy;