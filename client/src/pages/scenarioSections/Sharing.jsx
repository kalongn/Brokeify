import { useState } from 'react';
import Select from 'react-select';
import { FaTimes } from 'react-icons/fa';
import styles from "./Form.module.css";

const Sharing = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState("");
  console.log(email);

  const permissions = [
    { value: 'Viewer', label: 'Viewer' },
    { value: 'Editor', label: 'Editor' },
  ];
  const users = [
    { value: 'William Shakespige', label: 'William Shakespige' },
    { value: 'EB White', label: 'EB White' },
  ];

  const handleEmailChange = (e) => {
    const value = e.target.value;
    // Prompt to AI (Amazon Q): I want to validate inputs as email before setting state
    // The regex did not need any changes
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) {
      setEmail(value);
    } 
    else {
      setErrors("Invalid email");
    }
    // Clear errors when user makes changes
    setErrors("");
  };
  const handleAddEmail = (e) => {
    e.preventDefault();
    if (email) {
      alert("NOT IMPLEMENTED YET");
      // TODO: clear input field
      setEmail("");
    }
    else {
      setErrors("Invalid email");
    }
  };

  return (
    <div>
      <h2>Sharing Settings</h2>
      <p>
        Specify the users you would like to share this scenario with,
        and define their access to this scenario.
      </p>
      <h3>People with access</h3>
      <div id={styles.newItemContainer} style={{ backgroundColor: 'var(--color-white)' }} >
        <table>
          <tbody>
            <tr>
              {/* TODO: replace with user's name */}
              <td>Sharlotte Webb (you)</td>
              <td>Owner</td>
              <td></td>
            </tr>
            {users.map((user) => (
              <tr key={user.value}>
                <td style={{ padding: 0 }}>
                  <p style={{ margin: 0 }}>{user.value}</p>
                </td>
                <td>
                  <Select options={permissions} />
                </td>
                <td style={{ padding: 0, width: 1 }}>
                  <button
                    type="button"
                    onClick={() => alert("NOT IMPLEMENTED YET")}
                    className={styles.tableButton}
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
      <form>
        <label>
          <input type="email" placeholder="Enter email address" onChange={handleEmailChange} />
        </label>
        <button id={styles.addButton} style={{ width: "10%" }} onClick={handleAddEmail}>
          Add
        </button>
        {errors && <span className={styles.error}>{errors}</span>}
      </form>
    </div>
  );
};

export default Sharing;