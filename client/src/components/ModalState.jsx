import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";

import ModalBase from "./ModalBase";
import styles from "./ModalImport.module.css";
import buttonStyles from "../pages/ScenarioForm.module.css";

const ModalState = ({ isOpen, onClose, uploadToBackend }) => {
  const { scenarioId } = useParams(); // Get the scenario ID from the URL params
  const navigate = useNavigate();
  const handleClose = () => {
    onClose(false);
  };
  const handleContinue = async (file) => {
    await uploadToBackend(file);
    navigate(`/ScenarioForm/${scenarioId}/investment-types`)
  };

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} id={styles.modal}>
      <h2 className={styles.title}>Your state of residence has an incomplete data file.</h2>
      <p style={{ whiteSpace: "pre-line" }}>
        State of residence is used to determine state income taxes, tax brackets, and standard deductions.
        You can upload a YAML file containing the appropriate information for your state.
        <br /><br />
        Without this data, the financial projection will <b>ignore state taxes</b>.
        If you receive social security benefits and live in a state that taxes them, the tax will be ignored for financial projections regardless.
        <br /><br />
        <i>Note: By default, files for NY, NJ, CT, and WA of year 2024 are provided.</i>
      </p>
      <div id={buttonStyles.navButtons}>
        <button onClick={handleContinue} className={buttonStyles.deemphasizedButton}>Ignore & Continue</button>
        <button onClick={() => navigate("/Profile")} className={`${buttonStyles.emphasizedButton} ${styles.uploadButton}`}>Upload in Profile</button>
      </div>
    </ModalBase>
  );
}

ModalState.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  uploadToBackend: PropTypes.func.isRequired
};

export default ModalState;