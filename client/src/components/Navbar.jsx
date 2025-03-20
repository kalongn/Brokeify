// TODO: to be actually implement then random stuff here

import style from './NavBar.module.css';
import iconStyle from '../pages/Login.module.css';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
    <div className = {style.navbar}>
        <div className={`${iconStyle.icon} ${style.navIcon}`}>
            <img src='/icon.svg'></img>
            <h2 id={style.appName}>Brokeify</h2>
        </div>
        <button> Create Scenario </button>
            <div className={style.navLinks}>
                <Link to='/Home' className={style.navLink} onClick={() => { console.log('My Scenarios Page') }}>My Scenarios</Link>

                <Link to='/Home'  className={style.navLink}  onClick={() => { console.log('Shared Scenarios Page') }}>Shared Scenarios</Link>
            </div>

            <div className={style.profileLink}>
                
                <Link to='/Profile' className={`${style.profileLink} ${style.navLink}`} onClick={() => { console.log('Profile Page') }}>
                    My Profile
                </Link>
            
        </div>
    </div>
    );
}

export default Navbar;