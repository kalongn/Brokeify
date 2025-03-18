// import Navbar from "../components/Navbar";

import Layout from "../components/Layout";
import style from './Profile.module.css';
const Profile = () => {
  return (
    <Layout>
       <div className = {style.profileBackground}>

        <div className = {style.profile}>
            <div className= {style.profileInfo}>
            <h2>Your Information</h2>
            <p>Full Name</p>
            <p className = {style.infoInput}>Sharolette Webb</p>
            <p>Email</p>
            <p className = {style.infoInput}>sharolette.webb@gmail.com</p>
            <p>Birth Year</p>
            <p className = {style.infoInput}>2000</p>
           
            </div>  
            <div className= {style.fileInfo}>
            <h2>File Upload</h2>
            <p>Here you can upload a YAML file containing information about state income taxes and brackets. Note that without this data, the financial projection will ignore state income taxes not in the database.</p>
            <button>^ Upload YAML</button>

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
              <td><button>^</button><button>X</button></td>
              </tr>
              </tbody>
            </table>
            </div>  
        
        </div>   
      </div>
    </Layout>
  );
}

export default Profile;
