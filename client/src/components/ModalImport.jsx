import PropTypes from "prop-types";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Axios from "axios";

import ModalBase from "./ModalBase";
import styles from "./ModalImport.module.css";
import buttonStyles from "../pages/ScenarioForm.module.css";

const ModalImport = ({ isOpen, onClose }) => {
  // Modal reused between scenario import and profile state tax upload
  const location = useLocation();
  const navigate = useNavigate();
  const title = location.pathname === "/Home" ? "Import Scenario" : "Upload YAML file";
  const description = location.pathname === "/Home" ? "Import a scenario from a YAML file." : "Upload state taxes from a YAML file.";

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file) {
      try {
        Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
        Axios.defaults.withCredentials = true;
        const formData = new FormData();
        formData.append("file", file);
        const response = await Axios.post(
          location.pathname === "/Home" ? `/scenario/import` : `/stateTax/import`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        console.log(response.data);
        if (location.pathname === "/Home") {
          // Redirect to the scenario simulation page
          const scenarioId = response.data.scenarioId;
          navigate(`/Scenario/${scenarioId}`);
        } else if (location.pathname === "/Profile") {
          handleClose();
        } else {
          throw new Error("Unknown path");
        }
      } catch (error) {
        if (location.pathname === "/Profile" && error.response?.status === 409) {
          setStatus("A tax of the same state, same year, same filing status already exists.");
        } else {
          setStatus("File upload failed");
        }
        console.error("Error uploading file:", error);
      }
    }
  };
  const handleClose = () => {
    setStatus(null);
    setFile(null);
    onClose(false);
  };

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} id={styles.modal}>
      <h2 className={styles.title}>{title}</h2>
      <p>{description}</p>
      <input type="file" accept=".yaml, .yml" onChange={handleFileChange} />
      {status && <p>{status}</p>}
      <div id={buttonStyles.navButtons}>
        <button onClick={handleClose} className={buttonStyles.deemphasizedButton}>Cancel</button>
        <button onClick={handleUpload} className={buttonStyles.emphasizedButton}>Upload File</button>
      </div>
    </ModalBase>
  );
}

ModalImport.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ModalImport;