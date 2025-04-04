import styles from "./Form.module.css";

import { useState } from "react";
import SortableList from "../../components/SortableList";

const RMDStrategy = () => {
  // TODO: pull from list of investments and reformat into below
  // investments has name, value, expectedAnnualReturn, taxability
  // name and value are from investment while expectedAnnualReturn and taxability are from investment type
  // Keys must be named as id, amount, percentage, additional
  const investments = [
    { id: "Investment Withdrawal 1", amount: `$100`, percentage: `1.9% return`, additional: `Taxable` },
    { id: "Investment Withdrawal 2", amount: `$5000`, percentage: `4% return`, additional: `Taxable` },
    { id: "Investment Withdrawal 3", amount: `$50`, percentage: `9% return`, additional: `Tax-exempt` },
  ];
  const [strategy, setStrategy] = useState([investments]);
  const handleReorder = (list) => {
    setStrategy(list);
    if(!strategy) {
      console.log("no strategy");
    }
  };
  // TODO: save rmd strategy to db

  return (
    <div>
      <h2 id={styles.heading}>Required Minimum Distribution Strategy</h2>
      <p>
        Specify the order in which investments should be transferred
        from pre-tax retirement accounts to non-retirement accounts
        when a Required Minimum Distribution (RMD) is triggered.
      </p>
      <SortableList
        items={investments}
        handleReorder={handleReorder}
      />
    </div>
  );
};

export default RMDStrategy;