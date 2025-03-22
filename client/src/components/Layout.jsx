import Navbar from './Navbar';
import Header from './Header';
import style from './Layout.module.css';
import PropTypes from 'prop-types';

const Layout = ({ children }) => {
  return (
    <div id={style.layout}>
      <Navbar />
      <div id={style.pageContent}>
        <Header />
        <main id={style.content}>{children}</main>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
export default Layout;

