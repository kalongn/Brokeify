import { PropTypes } from 'prop-types';
import { MdError } from "react-icons/md";

import styles from './ErrorMessage.module.css'

const ErrorMessage = ({ errors }) => {
  console.log(errors);

  return (
    <div className={styles.errorBox}>
      <div className={styles.errorMessage}>
        <MdError size={24} />
        <span>There are some errors.</span>
      </div>
      <ul className={styles.errorList}>
        {Object.entries(errors).map(([key, value]) => (
          <li key={key}>
            <a href={`#${key}`}>{value}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

ErrorMessage.propTypes = {
  errors: PropTypes.object.isRequired,
};

export default ErrorMessage;