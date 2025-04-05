import styles from "./Form.module.css";

import { useState } from "react";
import SortableList from "../../components/SortableList";

const ExpenseStrategy = () => {
  // TODO: pull from list of investments and reformat into below
  // withdrawals has name, value, expectedAnnualReturn, taxability
  // name and value are from investment while expectedAnnualReturn and taxability are from investment type
  // Keys must be named as id, amount, percentage, additional
  const withdrawals = [
    { id: "Investment 1", amount: `$100`, percentage: `1.9% return`, additional: `Taxable` },
    { id: "Investment 2", amount: `$5000`, percentage: `4% return`, additional: `Taxable` },
    { id: "Investment 3", amount: `$50`, percentage: `9% return`, additional: `Tax-exempt` },
    { id: "Investment 4", amount: `$400`, percentage: `8.4% return`, additional: `Taxable` }
  ];
  const [strategy, setStrategy] = useState([withdrawals]);
  const handleReorder = (list) => {
    setStrategy(list);
    if(!strategy) {
      console.log("no strategy");
    }
  };
  // TODO: save expense strategy to db

  return (
    <div>
      <h2 id={styles.heading}>Expense Withdrawal Strategy</h2>
      <p>
        Specify the order in which the set of investments should be
        sold when cash is insufficient.
      </p>
      <SortableList
        items={withdrawals}
        handleReorder={handleReorder}
      />
    </div>
  );
};

export default ExpenseStrategy;