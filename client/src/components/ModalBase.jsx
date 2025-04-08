import Modal from 'react-modal';
import PropTypes from 'prop-types';
import styles from './Modal.module.css';

// Prevent user or screen readers from accessing page content if modal is open
Modal.setAppElement('#root');

const ModalBase = ({ isOpen, onClose, children}) => {

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      preventScroll={true}
      contentLabel="Modal"
    >
      {children}
    </Modal>
  );
}
ModalBase.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
}

export default ModalBase;