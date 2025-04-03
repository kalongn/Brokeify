import styles from "./Form.module.css";

const Sharing = () => {
  return (
    <div>
      <h2 id={styles.heading}>Sharing Settings</h2>
      <p>
        Specify the users you would like to share this scenario with,
        and define their access to this scenario.
      </p>
      <h3>People with access</h3>
      {/* TODO: replace this with list of people with access*/}
      <div>list item 1</div>
    </div>
  );
};

export default Sharing;