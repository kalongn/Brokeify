import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Axios from 'axios';
import './App.css'

import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import ScenarioForm from './pages/ScenarioForm.jsx';
import SharedScenarios from './pages/SharedScenarios.jsx';

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
        <Route path="/ScenarioForm" element={<ScenarioForm />} />
        <Route path="/SharedScenarios" element={<SharedScenarios />} />
        <Route path="/Profile" element={<Profile />} />
      </Routes>
    </>
  )
}

//TODO: Add routing for the Pages through the Home Page (like redirection if the user already loggied in, or logged in with google OAuth, or continue with guest)

export default App
