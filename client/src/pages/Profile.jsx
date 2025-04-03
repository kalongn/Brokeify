import { useEffect, useState } from "react";
import Axios from "axios";
import PropTypes from 'prop-types';

import { FaTrashAlt } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { FaUpload } from "react-icons/fa";

import Layout from "../components/Layout";
import style from './Profile.module.css';

//TODO: Tax YAML upload button, and file table buttons as well including the tax upload Date.
const Profile = ({ setVerified }) => {
  const [user, setUser] = useState(null);
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
    alert("TODO: Feature not IMPLEMENT YET.");
  };


  const downloadTax = (taxId) => {
    alert(`TDOO: export the YAML file of ${taxId} to the client.`);
  }

  const deleteTax = (taxId) => {
    alert(`TODO: delete the tax file with id ${taxId} from the database.`);
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
                    <td>{tax.state + "_" + tax.filingStatus}</td>
                    <td>{tax.dateCreated}</td>
                    <td className={style.fileActions}><button onClick={() => downloadTax(tax._id)}><FaDownload /></button><button onClick={() => deleteTax(tax._id)}><FaTrashAlt /></button></td>
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
