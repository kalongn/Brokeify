import React from 'react';
import Navbar from './Navbar';
import Header from './Header';
import style from './Layout.module.css';

const Layout = ({children}) => {
    return (
      <div id={style.layout}>
        <Navbar/>
        <div id={style.pageContent}>
            <Header/>
            <main>{children}</main>
        </div>
      </div>
    );
};
export default Layout;

