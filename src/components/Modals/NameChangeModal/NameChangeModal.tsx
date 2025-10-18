import { useRef, useEffect } from "react";
import {
  NameModalProps,
  useModalState,
} from "../../../context/ModalState/ModalStateContext";
import { NameChangeForm } from "./components/NameChangeForm";
import "./NameChangeModal.css";

const NameChangeModal = () => {
  const { modalState } = useModalState();

  const modalProps = modalState.modalProps as NameModalProps;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="nameChangeModalContainer">
      {modalProps?.userFirstTime ? (
        <div className="nameChangeGreeting">
          <h2>Welcome to Pokémon Gambit!</h2>
          <h4>A mixture of Pokémon battling and Chess!</h4>
          <hr />
        </div>
      ) : null}
      <h2 className="nameChangeTitle">Enter Name</h2>
      {modalState.required && (
        <span className="nameChangeNotification">
          Before you can play any games, you need to enter a name! Don't worry,
          you can change this later.
        </span>
      )}
      <NameChangeForm closeModalOnSubmit />
    </div>
  );
};

export default NameChangeModal;
