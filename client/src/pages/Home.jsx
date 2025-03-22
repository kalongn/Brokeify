import Layout from "../components/Layout";
/*
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Axios from "axios";
*/
import ScenarioCard from "../components/ScenarioCard";
import style from './Home.module.css';
const Home = () => {

  return (
    <Layout>
      <div className={style.background}>
      {/*To do: need to update this with scenario's actual names and details.
      Iterate through the list (map) and create a scenario card for each one.*/}
      {/* If no scenarios are present, we can either show a message that says "No scenarios 
      yet, create one!" Or create an empty scenario object that says
      "create scenario" on title only, which brings you to create scenario page if clicked*/}
      <ScenarioCard
        title="Retired at 50 with kids"
        martialStatus="Married"
        targetAmount={600000}
        investments={28}
        events={16}
      />
      <ScenarioCard
            title="Ideal Plan!!"
            martialStatus="Single"
            targetAmount={400000}
            investments={12}
            events={26}
      />
       <ScenarioCard
            title="Plan 3"
            martialStatus="Single"
            targetAmount={90000000}
            investments={120}
            events={206}
      />
       <ScenarioCard
            title="Ideal Plan 2!!"
            martialStatus="Single"
            targetAmount={400000}
            investments={10}
            events={20}
      />

   

      
    
   </div>
    </Layout>
  );
}

export default Home;
