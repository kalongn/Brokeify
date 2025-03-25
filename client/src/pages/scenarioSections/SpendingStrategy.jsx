import { useState } from "react";
import SortableList from "../../components/SortableList";

const SpendingStrategy = () => {
  // TODO: pull from list of discretionary expenses and reformat into below
  // expenses has name, amount, userContributions, spouseContributions
  // Keys must be named as id, amount, percentage, additional
  const expenses = [
    { id: "Discretionary Expense 1", amount: `$100`, percentage: `1.9% increase`, additional: `0% increase` },
    { id: "Discretionary Expense 2", amount: `$5000`, percentage: `4% increase`, additional: `3% increase` },
    { id: "Discretionary Expense 3", amount: `$50`, percentage: `9% increase`, additional: `5% increase` },
    { id: "Discretionary Expense 4", amount: `$400`, percentage: `8.4% increase`, additional: `3.7% increase` },
    { id: "Discretionary Expense 5", amount: `$899`, percentage: `0% increase`, additional: `1.4% increase` },
  ];
  const [strategy, setStrategy] = useState([expenses]);
  const handleReorder = (list) => {
    setStrategy(list);
    if(!strategy) {
      console.log("no strategy");
    }
  };
  // TODO: save spending strategy to db

  return (
    <div>
      <h2>Spending Strategy</h2>
      <p>
        Specify the order of discretionary expenses to be paid as cash allows.
      </p>
      <SortableList
        items={expenses}
        handleReorder={handleReorder}
      />
    </div>
  );
};

export default SpendingStrategy;