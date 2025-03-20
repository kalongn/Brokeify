// import Navbar from "../components/Navbar";

import Layout from "../components/Layout";
import style from './Profile.module.css';
import { FaTrashAlt } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { FaUpload } from "react-icons/fa";

//I temporarily threw in text for the buttons, ^ means upload
//X means trash, I will update them with the correct icons later
const Profile = () => {
  return (
    <Layout>
      <div className={style.profileBackground} >
        <div className={style.profile}>
          <img className={style.profileImage} src="src/assets\sharlottePic.jpg"></img>
          <div className={style.profileInfo}>
            <h2>Your Information</h2>
            <div>
              <div>Full Name</div>
              <div className={style.infoInput}>Sharolette Webb</div>
            </div>
            <div>
              <div>Email</div>
              <div className={style.infoInput}>sharolette.webb@gmail.com</div>
            </div>
            <div>
              <div>Birth Year</div>
              <div className={style.infoInput}>2000</div>
            </div>
          </div>
        </div>
        <div className={style.fileInfo}>
          <h2>File Upload</h2>
          <div>Here you can upload a YAML file containing information about state income taxes and brackets. Note that without this data, the financial projection will ignore state income taxes not in the database.</div>
          <button className={style.uploadButton}> <FaUpload />  Upload YAML</button>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Upload Date</th>
                <th> </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Temporary Name</td>
                <td> Temporary Date</td>
                <td className={style.fileActions}><button><FaDownload /></button><button><FaTrashAlt /></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default Profile;
