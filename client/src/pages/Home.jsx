import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Axios from "axios";

import Navbar from "../components/Navbar";
import style from './Home.module.css';
import Layout from "../components/Layout";
const Home = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get("/profile")
      .then((response) => {
        console.log("User Profile Data:", response.data);
        setUser(response.data);
      })
      .catch((error) => {
        console.error('Error fetching user session:', error);
      });

  }, []);

  return (
    <Layout>
        {/* TODO: remove when layout is finalized */}
        <div>
      <h1>Home Page</h1>
      <p>Welcome to the home page!</p>
      <Link to={`${import.meta.env.VITE_SERVER_ADDRESS}/logout`}>Go back to Login</Link>
      {user && (
        <div>
          <h2>User Profile</h2>
          <p>Name: {user.firstName} {user.lastName}</p>
          <p>Email: {user.email}</p>
          <img src={user.picture} alt="User Profile" />
        </div>
      )}
      {!user && <p>Please log in to see your profile.</p>}
    </div>   
    </Layout>
    
  );
}

export default Home;
