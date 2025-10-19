import { faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect } from "react";
import {
  ModalName,
  useModalState,
} from "../../../context/ModalState/ModalStateContext";
import CreateRoomModal from "../../Modals/CreateRoomModal/CreateRoomModal";
import CreditsModal from "../../Modals/CreditsModal/CreditsModal";
import CustomizeModal from "../../Modals/CustomizeModal/CustomizeModal";
import EndGameModal from "../../Modals/EndGameModal/EndGameModal";
import GenericModal from "../../Modals/GenericModal/GenericModal";
import HowToPlayModal from "../../Modals/HowToPlayModal/HowToPlayModal";
import NameChangeModal from "../../Modals/NameChangeModal/NameChangeModal";
import OptionsModal from "../../Modals/OptionsModal/OptionsModal";
import QuickMatchModal from "../../Modals/QuickMatchModal/QuickMatchModal";
import RoomCodeModal from "../../Modals/RoomCodeModal/RoomCodeModal";
import "./Modal.css";

const renderModal = (currentModal: ModalName) => {
  switch (currentModal) {
    case "QUICK_MATCH":
      return <QuickMatchModal />;
    case "ROOM_CODE":
      return <RoomCodeModal />;
    case "OPTIONS":
      return <OptionsModal />;
    case "NAME_CHANGE":
      return <NameChangeModal />;
    case "CREATE_ROOM":
      return <CreateRoomModal />;
    case "HOW_TO_PLAY":
      return <HowToPlayModal />;
    case "END_GAME":
      return <EndGameModal />;
    case "CUSTOMIZE":
      return <CustomizeModal />;
    case "CREDITS":
      return <CreditsModal />;
    case "GENERIC":
      return <GenericModal />;
    default:
      <div>Not implemented</div>;
  }
};

const Modal = () => {
  const { dispatch, modalState } = useModalState();

  const handleCloseModal = useCallback(() => {
    if (!modalState.required) {
      dispatch({ type: "CLOSE_MODAL" });
    }
  }, [dispatch, modalState]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };

    document.addEventListener("keydown", listener);

    return () => document.removeEventListener("keydown", listener);
  }, [handleCloseModal]);

  return (
    <>
      {modalState.currentModal ? (
        <>
          <div className="modalBackdrop" onClick={handleCloseModal} />
          {
            <div className="modalContainer">
              {!modalState.required && (
                <div>
                  <button
                    onClick={handleCloseModal}
                    className="closeModalButton"
                    aria-label="Close Label"
                  >
                    <FontAwesomeIcon icon={faX} size="xl" />
                  </button>
                </div>
              )}
              {renderModal(modalState.currentModal)}
            </div>
          }
        </>
      ) : null}
    </>
  );
};

export default Modal;
