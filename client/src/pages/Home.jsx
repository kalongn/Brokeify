import { useEffect } from "react";
import { Link } from "react-router-dom";

const Home = () => {
  useEffect(() => {
    // Placeholder for any setup or API calls when the Home component mounts
    // For example, you could fetch user data or settings here
    console.log("Home component mounted");
  }
  , []);

  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the home page!</p>
      <Link to={`${import.meta.env.VITE_SERVER_ADDRESS}/logout`}>Go back to Login</Link>
    </div>
  );
}

export default Home;