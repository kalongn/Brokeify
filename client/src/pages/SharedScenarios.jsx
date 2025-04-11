// TODO: Make guest able to see this page but replace with a message that they need to create an account to use this.
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import Axios from "axios";
import ScenarioCard from "../components/ScenarioCard";
import style from './Home.module.css';


const SharedScenarios = () => {

  const [scenarios, setScenarios] = useState([]);
  const [isGuest, setGuest] = useState(true);

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;
    Axios.get("/sharedScenarios")
      .then((response) => {
        const reponseIsGuest = response.data.isGuest;
        if (reponseIsGuest) {
          setGuest(true);
          return;
        }
        setGuest(false);
        setScenarios(response.data);
      })
      .catch((error) => {
        console.error('Error fetching user scenarios:', error);
      });
  }, []);

  return (
    <Layout>
      <div className={style.background}>
        {isGuest ? (
          <p>Whoops...you don&apos;t have access as a guest. Please consider making an account to share scenarios. </p>
        ) : (
          scenarios.length === 0 ? (
            <h1>No Shared Scenarios Found</h1>
          ) : (
            scenarios.map((scenario, index) => (
              <ScenarioCard
                key={index}
                id={scenario.id}
                title={scenario.name}
                maritalStatus={scenario.ownerName}
                targetAmount={scenario.financialGoal}
                investments={scenario.investmentsLength}
                events={scenario.eventsLength}
              />
            ))
          )
        )}
      </div>
      <div className={style.background}>
      </div>
    </Layout>
  );
}

export default SharedScenarios;
