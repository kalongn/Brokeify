import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import Axios from "axios";
import ScenarioCard from "../components/ScenarioCard";
import style from './Home.module.css';
const Home = () => {

  const [scenarios, setScenarios] = useState([]);
  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get("/home")
      .then((response) => {
        console.log("User Scenarios:", response.data);
        setScenarios(response.data);
      })
      .catch((error) => {
        console.error('Error fetching user scenarios:', error);
      });
  }, []);

  return (
    <Layout>
      <div className={style.background}>
        {
          scenarios.length === 0 ?
            <>
              <h1>No Scenarios Found</h1>
            </>
            :
            scenarios.map((scenario, index) => (
              <ScenarioCard
                key={index}
                id={scenario.id}
                title={scenario.name}
                martialStatus={scenario.filingStatus}
                targetAmount={scenario.financialGoal}
                investments={scenario.investmentsLength}
                events={scenario.eventsLength}
              />
            ))
        }
      </div>
      <div className={style.background}>
      </div>
    </Layout>
  );
}

export default Home;
