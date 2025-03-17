import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Axios from 'axios';
import './App.css'

import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

const App = () => {
  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    // TODO: The Backend needs to be implemented to handle the session
    // This is a placeholder for checking if the user is logged in
    // Uncomment this when the backend is ready to handle sessions

    // Axios.get('/')
    //   .then((response) => {
    //     console.log('User session:', response.data);
    //   })
    //   .catch((error) => {
    //     console.error('Error fetching user session:', error);
    //   });
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/ProfilePage" element={<ProfilePage />} />
      </Routes>
    </>
  )
}

//TODO: Add routing for the Pages through the Home Page (like redirection if the user already loggied in, or logged in with google OAuth, or continue with guest)

export default App
