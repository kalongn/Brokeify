import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import Select from 'react-select';
import Axios from "axios";
import { clearErrors } from "../utils/ScenarioHelper";

import Layout from "../components/Layout";
import ErrorMessage from "../components/ErrorMessage";
import styles from "./Sharing.module.css";
import buttonStyles from './scenarioSections/Form.module.css';

const Sharing = () => {

  const { scenarioId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ownerEmail, setOwnerEmail] = useState("");

  // List of users added and shared to
  const [sharedUsers, setSharedUsers] = useState([]);

  // email and permissions states are for before a user is added
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState("Viewer");
  const [errors, setErrors] = useState("");

  const permissionOptions = [
    { value: 'Viewer', label: 'Viewer' },
    { value: 'Editor', label: 'Editor' },
  ];
   

  useEffect(() => {
    Axios.defaults.baseURL = import.meta.env.VITE_SERVER_ADDRESS;
    Axios.defaults.withCredentials = true;

    Axios.get(`/sharing/${scenarioId}`).then((response) => {
      const data = response.data;
      setOwnerEmail(data.ownerEmail);
      setSharedUsers(data.sharedUser || []);
      setLoading(false);
    }).catch((error) => {
      console.error("Error fetching sharing data:", error);
      if ([401, 403, 404].includes(error.response?.status)) {
        navigate(`/Scenario/${scenarioId}`);
      }
    });
  }, [navigate, scenarioId]);

  // For adding a new person with email
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    clearErrors(setErrors, "email");
  };

  // For changing an added user's permissions
  const handlePermissionsChange = async (targetUserEmail, newPermissions) => {
    const oldPermissions = sharedUsers.find((user) => user.email === targetUserEmail).permissions;
    if (newPermissions === oldPermissions) {
      return;
    }

    try {
      const reponse = await Axios.patch(`/sharing/${scenarioId}/update`, {
        email: targetUserEmail,
        oldPermissions: oldPermissions,
        newPermissions: newPermissions,
      });
      console.log(reponse.data);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      setErrors({ email: "An Unknown error occurred while updating the user permissions" });
      return;
    }

    setSharedUsers(sharedUsers.map((user) => {
      if (user.email === targetUserEmail) {
        return { ...user, permissions: newPermissions };
      }
      return user;
    }));
  }

  // For adding and removing a user to the scenario
  const addUser = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrors({ email: "Email cannot be empty" });
      return;
    }

    // Prompt to AI (Amazon Q): I want to validate inputs as email before setting state
    // The regex did not need any changes
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: "Invalid email format" });
      return;
    }

    const trimEmail = email.trim();

    if (trimEmail.toLowerCase() === ownerEmail.toLowerCase()) {
      setErrors({ email: "You cannot add yourself" });
      return;
    }

    if (sharedUsers.some((user) => {
      return user.email.toLowerCase() === trimEmail.toLowerCase();
    })) {
      setErrors({ email: "User already added" });
      return;
    }

    try {
      const response = await Axios.post(`/sharing/${scenarioId}/add`, {
        email: trimEmail,
        permissions: permissions,
      });

      console.log(response.data.status);
      const correctedEmail = response.data.email;
      setSharedUsers([...sharedUsers, { email: correctedEmail, permissions: permissions }]);
      setEmail("");
      clearErrors(setErrors, "email");
      e.target.form.querySelector('input[type="email"]').value = "";
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        setErrors({ email: "Input email incorrect or does not have an account" });
        return;
      }
      console.error("Error adding user:", error);
      setErrors({ email: "An Unknown error occurred while adding the user" });
    }
  };

  const removeUser = async (targetUserEmail) => {
    try {
      const response = await Axios.delete(`/sharing/${scenarioId}/remove`, {
        data: {
          email: targetUserEmail,
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error("Error removing user:", error);
      setErrors({ email: "An Unknown error occurred while removing the user" });
      return;
    }
    setSharedUsers(sharedUsers.filter((user) => user.email !== targetUserEmail));
  }

  return (
    <Layout>
      <div className={styles.sharingSettings}>
        {loading ?
          <p>Loading...</p>
          :
          <>
            <h2>Sharing Settings</h2>
            <p>
              Specify the users you would like to share this scenario with,
              and define their access to this scenario.
            </p>
            <ErrorMessage errors={errors} />
            <form id={styles.addEmailSection}>
              <input
                type="email"
                id="email"
                className={styles.email}
                placeholder="Enter email address"
                onChange={handleEmailChange}
              />
              <Select
                options={permissionOptions}
                defaultValue={permissionOptions[0]}
                onChange={(selectedOption) => setPermissions(selectedOption.value)}
                className="select"
                id={styles.selectPermissions}
              />
              <button id={styles.addButton} onClick={addUser}>
                Add
              </button>
            </form>
            <h3>People with access</h3>
            <div className={styles.usersList} >
              <table>
                <tbody>
                  <tr>
                    <td>{ownerEmail} (you)</td>
                    <td>Owner</td>
                    <td></td>
                  </tr>
                  {sharedUsers.map((user) => (
                    <tr key={user.email}>
                      <td style={{ padding: 0 }}>
                        <p style={{ margin: 0 }}>{user.email}</p>
                      </td>
                      <td>
                        <Select
                          options={permissionOptions}
                          onChange={(selectedOption) => handlePermissionsChange(user.email, selectedOption.value)}
                          defaultValue={permissionOptions.find((option) => option.value === user.permissions)}
                          className="select"
                        />
                      </td>
                      <td style={{ padding: 0, width: 1 }}>
                        <button
                          type="button"
                          onClick={() => removeUser(user.email)}
                          className={buttonStyles.tableButton}
                          style={{ margin: 0 }}
                        >
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        }
      </div>
    </Layout>
  );
};

export default Sharing;