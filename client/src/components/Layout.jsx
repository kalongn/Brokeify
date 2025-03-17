import React from 'react';
import Navbar from './Navbar';
import Header from './Header';
import style from './Layout.module.css';

const Layout = ({children}) => {
    return (
      <>
        <Navbar/>
        <div id={style.layout}>
            <Header/>
            <main>{children}</main>
        </div>
      </>
    );
};
export default Layout;

