import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { ModalName, useModalState } from "../../../context/ModalStateContext";
import RoomCodeModal from "./Modals/RoomCodeModal/RoomCodeModal";
import NameChangeModal from "./Modals/NameChangeModal/NameChangeModal";
import CreateRoomModal from "./Modals/CreateRoomModal/CreateRoomModal";
import EndGameModal from "./Modals/EndGameModal/EndGameModal";
import HowToPlayModal from "./Modals/HowToPlayModal/HowToPlayModal";
import OptionsModal from "./Modals/OptionsModal/OptionsModal";
import CustomizeModal from "./Modals/CustomizeModal/CustomizeModal";
import './Modal.css';
import GenericModal from "./Modals/GenericModal/GenericModal";

const renderModal = (currentModal: ModalName) => {
  switch (currentModal) {
    case 'ROOM_CODE':
      return (<RoomCodeModal />);
    case 'OPTIONS':
      return (<OptionsModal />);
    case 'NAME_CHANGE':
      return (<NameChangeModal />);
    case 'CREATE_ROOM':
        return (<CreateRoomModal />);
    case 'HOW_TO_PLAY':
        return (<HowToPlayModal />);
    case 'END_GAME':
        return (<EndGameModal />);
    case 'CUSTOMIZE':
        return (<CustomizeModal />);
    case 'GENERIC':
        return (<GenericModal />);
    default:
      <div>Not implemented</div>
  }
};

const Modal = () => {
  const { dispatch, modalState } = useModalState();

  const handleCloseModal = () => {
    if (!modalState.required) {
      dispatch({ type: 'CLOSE_MODAL' });
    }
  };

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', listener);

    return () => document.removeEventListener('keydown', listener);
  }, []);

  return (
    <>
      {
        modalState.currentModal ? (
          <>
          <div className='modalBackdrop' onClick={handleCloseModal} />
            {
              <div className='modalContainer'>
                {
                  !modalState.required && (
                    <div>
                      <button onClick={handleCloseModal} className='closeModalButton' aria-label='Close Label'>
                        <FontAwesomeIcon icon={faX} size='xl'/>
                      </button>
                    </div>
                  )
                }
                {renderModal(modalState.currentModal)}
              </div>
            }
          </>
        ) : null
      }
    </>
  );
}

export default Modal;