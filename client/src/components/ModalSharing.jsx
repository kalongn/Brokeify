import ModalBase from "./ModalBase";

const ModalSharing = ({ isOpen, setIsOpen }) => {
  
  return (
  <ModalBase isOpen={isOpen} onClose={() => setIsOpen(false)}>
    <p>sharinggg</p>
  </ModalBase>
  );
}
ModalSharing.propTypes = {
  isOpen: Boolean,
  setIsOpen: Function,
}

export default ModalSharing;