import PropTypes from "prop-types";
import { useState } from "react";
import { useLocation } from "react-router-dom";

import ModalBase from "./ModalBase";

const ModalImport = ({ isOpen, onClose }) => {
  // Modal reused between scenario import and profile state tax upload
  const location = useLocation();
  const title = location.pathname === "/Home" ? "Import Scenario" : "Upload YAML file";
  const description = location.pathname === "/Home" ? "Import a scenario from a YAML file." : "Upload state taxes from a YAML file.";

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile( e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file) {
      try {
        // TODO: replace upload route with actual route
        const res = await fetch("/api/scenarios/import", {
          method: "POST",
          body: file,
        });
        const data = await res.json();
        console.log(data);
        setStatus("File upload successful");
      }
      catch(error) {
        console.error("Error uploading file:", error);
        setStatus("File upload failed");
      }
    }
  };
  const handleClose = () => {
    setStatus(null);
    setFile(null);
    onClose(false);
  };

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose}>
      <h2>{title}</h2>
      <p>{description}</p>
      <input type="file" accept=".yaml, .yml" onChange={handleFileChange} />
      {status && <p>{status}</p>}
      <button onClick={handleClose}>Close</button>
      <button onClick={handleUpload}>Upload File</button>
    </ModalBase>
  );
}

ModalImport.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ModalImport;