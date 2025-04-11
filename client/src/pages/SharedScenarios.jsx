// TODO: Make guest able to see this page but replace with a message that they need to create an account to use this.
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import Axios from "axios";
import ScenarioCard from "../components/ScenarioCard";
import style from './Home.module.css';
const SharedScenarios = () => {

  const [scenarios, setScenarios] = useState([]);
  const [isGuest, setGuest] = useState(true);

  //TODO: Get user logged In/isGuest 

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;
    //TODO: Update with route to get shared Scenarios only 
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
      {isGuest ? (
          <p>Whoops...you don't have access as a guest. Please consider making an account to share scenarios. </p>
        ) : (
          scenarios.length === 0 ? (
            <h1>No Scenarios Found</h1>
          ) : (
            scenarios.map((scenario, index) => (
              <ScenarioCard
                key={index}
                id={scenario.id}
                title={scenario.name}
                maritalStatus={scenario.ownerEmail}
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
