import Navbar from './Navbar';
import Header from './Header';
import style from './Layout.module.css';
import PropTypes from 'prop-types';

const Layout = ({ children, setVerified }) => {
  return (
    <div id={style.layout}>
      <Navbar />
      <div id={style.pageContent}>
        <Header setVerified={setVerified} />
        <main id={style.content}>{children}</main>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  setVerified: PropTypes.func,
};
export default Layout;

