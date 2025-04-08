import ModalBase from "./ModalBase";

const ModalSharing = ({ isOpen, setIsOpen }) => {

  return (
  <ModalBase isOpen={isOpen} onClose={() => setIsOpen(false)}>
    <h1>sharinggg</h1>
  </ModalBase>
  );
}
ModalSharing.propTypes = {
  isOpen: Boolean,
  setIsOpen: Function,
}

export default ModalSharing;