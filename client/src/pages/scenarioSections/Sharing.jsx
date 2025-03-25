import Select from 'react-select';
import styles from "./Form.module.css";

const Sharing = () => {
  const permissions = [
    { value: 'Viewer', label: 'Viewer' },
    { value: 'Editor', label: 'Editor' },
  ];
  const users = [
    { value: 'William Shakespige', label: 'William Shakespige' },
    { value: 'EB White', label: 'EB White' },
  ];
  return (
    <div>
      <h2>Sharing Settings</h2>
      <p>
        Specify the users you would like to share this scenario with,
        and define their access to this scenario.
      </p>
      <h3>People with access</h3>
      <div id={styles.newItemContainer} style={{ backgroundColor: 'var(--color-white)' }} >
        <div className={styles.columns}>
          <p>Sharlotte Webb (you)</p>
          <p>Owner</p>
        </div>
        {users.map((user) => (
          <div key={user.value} className={styles.columns}>
            <p>{user.value}</p>
            <Select options={permissions} />
          </div>
        ))}
      </div>
      <button id={styles.addButton} onClick={() => alert("NOT IMPLEMENTED YET")}>
        Add with Email
      </button>
    </div>
  );
};

export default Sharing;