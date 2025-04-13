import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import PropTypes from 'prop-types';

import { FaTrashAlt } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { FaUpload } from "react-icons/fa";

import Layout from "../components/Layout";
import ModalImport from "../components/ModalImport";
import style from './Profile.module.css';

const Profile = ({ setVerified }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get("/profile")
      .then((response) => {
        console.log("User Profile Data:", response.data);
        setUser(response.data);
      })
      .catch((error) => {
        console.error('Error fetching user session:', error);
      });

  }, []);

  const uploadTax = () => {
    setShowImportModal(true);
  };


  const downloadTax = async (taxId) => {
    try {


      const response = await Axios.get(`/stateTax/${taxId}/export`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/yaml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // AI Co-pilot, obtain the filename from the response headers
      const disposition = response.headers['content-disposition'];
      let filename = `${taxId}.yaml`; // fallback
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) {
          filename = match[1];
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      if (error.reponse?.status === 401) {
        alert("You are not authorized to download this file.");
      } else if (error.response?.status === 403) {
        alert("You cannot download someone else tax file.");
      } else {
        alert("Unknown error downloading the tax file.");
      }
    }
  }

  const deleteTax = (taxId) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }
    try {
      const reponse = Axios.delete(`/stateTax/${taxId}/delete`);
      console.log(reponse.data);
      navigate(0);
    } catch (error) {
      if (error.reponse?.status === 401) {
        alert("You are not authorized to download this file.");
      } else if (error.response?.status === 403) {
        alert("You cannot download someone else tax file.");
      } else {
        alert("Unknown error downloading the tax file.");
      }
      console.error('Error deleting tax file:', error);
    }
  }

  return (
    <Layout setVerified={setVerified}>
      <div className={style.profileBackground} >
        <div className={style.profile}>
          <img className={style.profileImage} src={user ? user.picture || "src/assets/sharlottePic.jpg" : "src/assets/sharlottePic.jpg"}></img>
          {/** Profile Info */}
          <div className={style.profileInfo}>
            <h2>Your Information</h2>
            <div>
              <div>Full Name</div>
              <div className={style.infoInput}>{user ? `${user.firstName} ${user.lastName}` : "Guest"}</div>
            </div>
            <div>
              <div>Email</div>
              <div className={style.infoInput}>{user ? user.email || "N/A" : "N/A"}</div>
            </div>
          </div>
        </div>
        {/** File Upload */}
        <div className={style.fileInfo}>
          <h2>File Upload</h2>
          <div>Here you can upload a YAML file containing information about state income taxes and brackets. Note that without this data, the financial projection will ignore state income taxes not in the database.</div>
          <button className={style.uploadButton} onClick={() => uploadTax()}> <FaUpload />  Upload YAML</button>
          <ModalImport isOpen={showImportModal} onClose={setShowImportModal} />
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Upload Date</th>
                <th> </th>
              </tr>
            </thead>
            {user && user.userSpecificTaxes && user.userSpecificTaxes.length > 0 ?
              user.userSpecificTaxes.map((tax, index) => (
                <tbody key={index}>
                  <tr>
                    <td>{tax.state + "_" + tax.filingStatus + "_" + tax.year}</td>
                    <td>{tax.dateCreated}</td>
                    <td className={style.fileActions}><button onClick={() => downloadTax(tax.id)}><FaDownload /></button><button onClick={() => deleteTax(tax.id)}><FaTrashAlt /></button></td>
                  </tr>
                </tbody>
              )) : user && user.userSpecificTaxes && user.userSpecificTaxes.length === 0 ?
                <tbody><tr><td colSpan="3">No files uploaded yet.</td></tr></tbody>
                : <tbody><tr><td colSpan="3">Not Available.</td></tr></tbody>}
          </table>
        </div>
      </div>
    </Layout>
  );
}
Profile.propTypes = {
  setVerified: PropTypes.func.isRequired,
};

export default Profile;
