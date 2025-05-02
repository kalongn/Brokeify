import { useEffect, useState } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Axios from 'axios';
import './App.css'

import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import ScenarioForm from './pages/ScenarioForm.jsx';
import SharedScenarios from './pages/SharedScenarios.jsx';

// Sections for the scenario form
import NewScenario from './pages/NewScenario.jsx';
import BasicInfo from './pages/scenarioSections/BasicInfo.jsx';
import InvestmentTypes from './pages/scenarioSections/InvestmentTypes.jsx';
import InvestmentTypesForm from './pages/scenarioSections/InvestmentTypesForm.jsx';
import Investments from './pages/scenarioSections/Investments.jsx';
import EventSeries from './pages/scenarioSections/EventSeries.jsx';
import EventSeriesForm from './pages/scenarioSections/EventSeriesForm.jsx';
import Limits from './pages/scenarioSections/Limits.jsx';
import SpendingStrategy from './pages/scenarioSections/SpendingStrategy.jsx';
import ExpenseStrategy from './pages/scenarioSections/ExpenseStrategy.jsx';
import RMDStrategy from './pages/scenarioSections/RMDStrategy.jsx';
import RothStrategy from './pages/scenarioSections/RothStrategy.jsx';
import Charts from './pages/visualizations/Charts.jsx';
import OneD from './pages/visualizations/OneD.jsx';
import RouteTesting from './pages/RouteTesting.jsx';
import ScenarioSimulation from './pages/ScenarioSimulation.jsx';
import ViewScenario from './pages/ViewScenario.jsx';
import Sharing from './pages/Sharing.jsx';
import SimulationPage from './pages/SimulationPage.jsx';
import TwoD from './pages/visualizations/TwoD.jsx';
const App = () => {
  console.log('COVERAGE OBJECT:', window.__coverage__);

  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get('/')
      .then((response) => {
        if (response.status === 200) {
          console.log('User is logged in.');
          setVerified(true);
        }
        else {
          console.log('User is not logged in.');
          navigate('/');
        }
      })
      .catch((error) => {
        console.error('Error fetching user session:', error);
      });
  }, [navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login verified={verified} />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/NewScenario" element={<NewScenario />} />

        <Route path="/ScenarioForm/:scenarioId" element={<ScenarioForm />}>
          {/* 
            Prompt to AI (Copilot): How do I redirect /ScenarioForm/ to the first section /basic-information
            Worked without any further changes.
           */}
          {/* Redirect /ScenarioForm to /ScenarioForm/basic-information */}
          <Route index element={<Navigate to="basic-information" replace />} />
          <Route path="basic-information" element={<BasicInfo />} />
          <Route path="investment-types" element={<InvestmentTypes />} />
          <Route path="investment-types/new" element={<InvestmentTypesForm />} />
          <Route path="investment-types/edit/:id" element={<InvestmentTypesForm />} />

          <Route path="investments" element={<Investments />} />
          <Route path="event-series" element={<EventSeries />} />
          <Route path="event-series/new" element={<EventSeriesForm />} />
          <Route path="event-series/edit/:id" element={<EventSeriesForm />} />
  
          <Route path="limits" element={<Limits />} />
          <Route path="spending-strategy" element={<SpendingStrategy />} />
          <Route path="expense-strategy" element={<ExpenseStrategy />} />
          <Route path="rmd-strategy" element={<RMDStrategy />} />
          <Route path="roth-strategy" element={<RothStrategy />} />
        </Route>
        <Route path="/SharedScenarios" element={<SharedScenarios />} />
        <Route path="/Profile" element={<Profile setVerified={setVerified} />} />
        <Route path="/Scenario/:scenarioId" element={<ScenarioSimulation />} />
        <Route path="/ViewScenario/:scenarioId" element={<ViewScenario />} ></Route>
        <Route path ="/Sharing/:scenarioId" element={<Sharing />} ></Route>
        <Route path="/Simulation" element={<SimulationPage />} />
        
        <Route path="/RouteTesting" element={<RouteTesting />} />
        <Route path="/Visualizations/Charts/:simulationId" element={<Charts />} />
        
        <Route path="/Visualizations/OneDimensional/:simulationId" element={<OneD />} />  
        
        <Route path="/Visualizations/TwoDimensional/:simulationId" element={<TwoD />} />               
      </Routes>
    </>
  )
}

//TODO: Add routing for the Pages through the Home Page (like redirection if the user already loggied in, or logged in with google OAuth, or continue with guest)

export default App
