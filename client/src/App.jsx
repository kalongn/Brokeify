import { useEffect } from 'react';
import { Route, Routes } from "react-router-dom";
import Axios from 'axios';

import './App.css'

import Home from './pages/Home.jsx';

function App() {

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    // Check if user is logged in
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
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  )
}

export default App
