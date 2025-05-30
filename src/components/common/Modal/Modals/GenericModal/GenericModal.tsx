import {
  GenericModalProps,
  useModalState,
} from "../../../../../context/ModalState/ModalStateContext";
import "./GenericModal.css";

const GenericModal = () => {
  const { modalState } = useModalState();
  const { title, body } = modalState.modalProps as GenericModalProps;
  return (
    <div className="genericModalContainer">
      <h2 className="genericModalTitle">{title}</h2>
      <div>{body}</div>
    </div>
  );
};

export default GenericModal;
