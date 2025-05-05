import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";

import ModalBase from "./ModalBase";
import styles from "./ModalImport.module.css";
import buttonStyles from "../pages/ScenarioForm.module.css";

const ModalState = ({ isOpen, onClose }) => {
  const { scenarioId } = useParams(); // Get the scenario ID from the URL params
  const navigate = useNavigate();
  const handleClose = () => {
    onClose(false);
  };

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} id={styles.modal}>
      <h2 className={styles.title}>Your state of residence has an incomplete data file.</h2>
      <p style={{ whiteSpace: "pre-line" }}>
        State of residence is used to determine state income taxes, tax brackets, and standard deductions.
        You can upload a YAML file containing the appropriate information for your state.
        Note that without this data, the financial projection will ignore state taxes.
        If you receive social security benefits and live in a state that taxes them, the tax will be ignored for financial projections regardless.
      </p>
      <div id={buttonStyles.navButtons}>
          <button onClick={() => navigate(`/ScenarioForm/${scenarioId}/investment-types`)} className={buttonStyles.deemphasizedButton}>Ignore & Continue</button>
        <button onClick={() => navigate("/Profile")} className={`${buttonStyles.emphasizedButton} ${styles.uploadButton}`}>Upload in Profile</button>
      </div>
    </ModalBase>
  );
}

ModalState.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ModalState;