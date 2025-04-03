import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { useModalState } from "../../../context/ModalStateContext";
import RoomCodeModal from "./Modals/RoomCodeModal/RoomCodeModal";
import NameChangeModal from "./Modals/NameChangeModal/NameChangeModal";
import AvatarChangeModal from "./Modals/AvatarChangeModal/AvatarChangeModal";
import CreateRoomModal from "./Modals/CreateRoomModal/CreateRoomModal";
import EndGameModal from "./Modals/EndGameModal/EndGameModal";
import './Modal.css';
import { useEffect } from "react";

const renderModal = (currentModal: string) => {
  switch (currentModal) {
    case 'ROOM_CODE':
      return (<RoomCodeModal />);
    case 'NAME_CHANGE':
      return (<NameChangeModal />);
    case 'AVATAR_CHANGE':
      return (<AvatarChangeModal />);
    case 'CREATE_ROOM':
        return (<CreateRoomModal />)
    case 'END_GAME':
        return (<EndGameModal />)
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