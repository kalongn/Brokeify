import Modal from 'react-modal';
import PropTypes from 'prop-types';
import { FaTimes } from 'react-icons/fa';
import styles from './Modal.module.css';
import buttonStyles from '../pages/scenarioSections/Form.module.css';

// Prevent user or screen readers from accessing page content if modal is open
Modal.setAppElement('#root');

const ModalBase = ({ isOpen, onClose, children }) => {

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      contentLabel="Modal"
    >
      <button
        id={styles.closeModalIcon}
        className={buttonStyles.tableButton}
        onClick={onClose}
      >
        <FaTimes />
      </button>
      {children}
    </Modal>
  );
}

// AI-generated (Amazon Q) Auto-complete
ModalBase.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
}

export default ModalBase;