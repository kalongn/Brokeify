import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Axios from 'axios';
import './App.css'

import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import ScenarioForm from './pages/ScenarioForm.jsx';
import SharedScenarios from './pages/SharedScenarios.jsx';

// Sections for the scenario form
import BasicInfo1 from './pages/scenarioSections/BasicInfo1.jsx';
import BasicInfo2 from './pages/scenarioSections/BasicInfo2.jsx';
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
import Sharing from './pages/scenarioSections/Sharing.jsx';

const App = () => {
  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get('/')
      .then((response) => {
        console.log('User session:', response.data);
      })
      .catch((error) => {
        console.error('Error fetching user session:', error);
      });
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/ScenarioForm" element={<ScenarioForm />}>
          <Route path="basic-information" element={<BasicInfo1 />} />
          <Route path="basic-information-continued" element={<BasicInfo2 />} />
          <Route path="investment-types" element={<InvestmentTypes />} />
          <Route path="investment-types/new" element={<InvestmentTypesForm />} />
          <Route path="investments" element={<Investments />} />
          <Route path="event-series" element={<EventSeries />} />
          <Route path="event-series/new" element={<EventSeriesForm />} />
          <Route path="limits" element={<Limits />} />
          <Route path="spending-strategy" element={<SpendingStrategy />} />
          <Route path="expense-strategy" element={<ExpenseStrategy />} />
          <Route path="rmd-strategy" element={<RMDStrategy />} />
          <Route path="roth-strategy" element={<RothStrategy />} />
          <Route path="sharing" element={<Sharing />} />
        </Route>
        <Route path="/SharedScenarios" element={<SharedScenarios />} />
        <Route path="/Profile" element={<Profile />} />
      </Routes>
    </>
  )
}

//TODO: Add routing for the Pages through the Home Page (like redirection if the user already loggied in, or logged in with google OAuth, or continue with guest)

export default App
