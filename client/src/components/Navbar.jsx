// TODO: to be actually implement then random stuff here

import style from './Navbar.module.css';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
    <div className = {style.navbar}>
        <h2>Brokeify</h2>

        <button > Create Scenario </button>
   
       
            <div className={style.navLinks}>
                <Link to='/Home' className={style.navLink} onClick={() => { console.log('My Scenarios Page') }}>My Scenarios</Link>

                <Link to='/Home'  className={style.navLink}  onClick={() => { console.log('Shared Scenarios Page') }}>Shared Scenarios</Link>
            </div>

            <div className={style.profileLink}>
                
                <Link to='/Home' className={style.profileLink} onClick={() => { console.log('Profile Page') }}>
                    My Profile
                </Link>
            
        </div>
    </div>
    );
}

export default Navbar;