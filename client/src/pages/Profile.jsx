import { useEffect, useState } from "react";
import Axios from "axios";

import Layout from "../components/Layout";

import { FaTrashAlt } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { FaUpload } from "react-icons/fa";

import style from './Profile.module.css';

//TODO: Tax YAML upload button, and file table buttons as well including the tax upload Date.
const Profile = () => {

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

  return (
    < Layout >
      <div className={style.profileBackground} >
        <div className={style.profile}>
          <img className={style.profileImage} src={user ? user.picture : "src/assets/sharlottePic.jpg"}></img>
          <div className={style.profileInfo}>
            <h2>Your Information</h2>
            <div>
              <div>Full Name</div>
              <div className={style.infoInput}>{user ? `${user.firstName} ${user.lastName}` : "Guest"}</div>
            </div>
            <div>
              <div>Email</div>
              <div className={style.infoInput}>{user ? user.email : "N/A"}</div>
            </div>
          </div>
        </div>
        <div className={style.fileInfo}>
          <h2>File Upload</h2>
          <div>Here you can upload a YAML file containing information about state income taxes and brackets. Note that without this data, the financial projection will ignore state income taxes not in the database.</div>
          <button className={style.uploadButton} onClick={() => alert("TODO: Feature not IMPLEMENT YET.")}> <FaUpload />  Upload YAML</button>
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
                    <td>{tax.name}</td>
                    <td>{tax.uploadDate}</td>
                    <td className={style.fileActions}><button onClick={() => alert("TODO: Feature not IMPLEMENT YET.")}><FaDownload /></button><button onClick={() => alert("TODO: Feature not IMPLEMENT YET.")}><FaTrashAlt /></button></td>
                  </tr>
                </tbody>
              )) : user && user.userSpecificTaxes && user.userSpecificTaxes.length === 0 ?
                <tbody><tr><td colSpan="3">No files uploaded yet.</td></tr></tbody>
                : <tbody><tr><td colSpan="3">Not Available.</td></tr></tbody>}
          </table>
        </div>
      </div>
    </Layout >
  );
}

export default Profile;