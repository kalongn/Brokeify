import { useState, useEffect, useImperativeHandle } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import Axios from "axios";

import SortableList from "../../components/SortableList";
import styles from "./Form.module.css";

const ExpenseStrategy = () => {

  const { scenarioId } = useParams();
  const { childRef } = useOutletContext();

  const [strategy, setStrategy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    // Fetch the existing spending strategy data from the server
    Axios.get(`/expense-withdrawal-strategy/${scenarioId}`).then((response) => {
      const expenseStrategy = response.data;
      const strategyData = expenseStrategy.map((investment) => ({
        _id: investment.id,
        id: investment.type + " (" + investment.taxStatus + ")",
        amount: `$${investment.value}`,
        percentage: investment.expectedAnnualReturnDistribution,
        additional: investment.taxability ? "Taxable" : "Tax-exempt",
      }));
      setStrategy(strategyData);
      setLoading(false);
    }).catch((error) => {
      console.error('Error fetching Expense Withdrawal strategy:', error);
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
    const updatedStrategy = strategy.map((investment) => ({
      id: investment._id,
    }));

    try {
      const response = await Axios.post(`/expense-withdrawal-strategy/${scenarioId}`, updatedStrategy);
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
      <h2 id={styles.heading}>Expense Withdrawal Strategy</h2>
      <p>
        Specify the order in which the set of investments should be
        sold when cash is insufficient.
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

export default ExpenseStrategy;