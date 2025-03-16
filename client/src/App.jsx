import { useEffect } from 'react';
import Axios from 'axios';

import './App.css'
import styles from './App.module.css';

// import Home from './pages/Home.jsx';

function App() {

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
      <div className={styles.left}>
        <div className={styles.title}>
          <div className={styles.icon}>
            <img src='/icon.svg'></img>
            <h2>Brokeify</h2>
          </div>
          <div className={styles.subtitle}>
            <h1>Your Future,</h1>
            <h1>Your Plan,</h1>
            <h1 className={styles.important}>Our Guidence</h1>
          </div>
        </div>
        <div className={styles.buttons}>
          <button className={`${styles.button} ${styles.googleButton}`} onClick={() => { console.log('Login Button') }}>
            <img src='/src/assets/google.svg' alt='Google Icon' />
            Login with Google
          </button>
          <button className={styles.button} onClick={() => { console.log('Register Button') }}>
            Continue as Guest
          </button>
        </div>
      </div>
      <div className={styles.right}>
        <img src="/src/assets/3d-piggy-bank.svg" alt="3D Piggy Bank Rendering" />
      </div>
    </>
  )
}

//TODO: Add routing for the Pages through the Home Page (like redirection if the user already loggied in, or logged in with google OAuth, or continue with guest)

export default App
