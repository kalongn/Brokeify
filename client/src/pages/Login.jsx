import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

import styles from './Login.module.css';

const Login = ({ verified }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (verified) {
      navigate('/Home');
    }
  }, [navigate, verified]);

  return (
    <div id={styles.login}>
      <div className={styles.left}>
        <div className={styles.title}>
          <div className={styles.icon}>
            <img src='/icon.svg'></img>
            <h2>Brokeify</h2>
          </div>
          <div className={styles.subtitle}>
            <h1>Your Future,</h1>
            <h1>Your Plan,</h1>
            <h1 className={styles.important}>Our Guidance</h1>
          </div>
        </div>
        <div className={styles.buttons}>
          <Link className={`${styles.button} ${styles.googleButton}`} to={`${import.meta.env.VITE_SERVER_ADDRESS}/auth/google`} onClick={() => { console.log('Login Button') }}>
            <img src='/src/assets/google.svg' alt='Google Icon' />
            Login with Google
          </Link>
          <Link className={styles.button} to={`${import.meta.env.VITE_SERVER_ADDRESS}/auth/guest`} onClick={() => { console.log('Continue as Guest') }}>
            Continue as Guest
          </Link>
        </div>
      </div>
      <div className={styles.right}>
        <img src="/src/assets/3d-piggy-bank.svg" alt="3D Piggy Bank Rendering" />
      </div>
    </div>
  )
}
Login.propTypes = {
  verified: PropTypes.bool.isRequired,
};

export default Login;