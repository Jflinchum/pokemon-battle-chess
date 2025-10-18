import { useRef, useEffect } from "react";
import { useModalState } from "../../../context/ModalState/ModalStateContext";
import { NameChangeForm } from "./components/NameChangeForm";
import "./NameChangeModal.css";

const NameChangeModal = () => {
  const { modalState } = useModalState();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="nameChangeModalContainer">
      <h2 className="nameChangeTitle">Enter Name</h2>
      {modalState.required && (
        <span className="nameChangeNotification">
          Before you can play any games, you need to enter a name!
        </span>
      )}
      <NameChangeForm closeModalOnSubmit />
    </div>
  );
};

export default NameChangeModal;
