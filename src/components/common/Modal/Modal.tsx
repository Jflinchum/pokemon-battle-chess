import { useModalState } from "../../../context/ModalStateContext";
import RoomCodeModal from "./Modals/RoomCodeModal";
import './Modal.css';

const renderModal = (currentModal: string) => {
  switch (currentModal) {
    case 'ROOM_CODE':
      return (<RoomCodeModal />)
    default:
      <div>Not implemented</div>
  }
};

const Modal = () => {
  const { dispatch, modalState } = useModalState();

  const handleCloseModal = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  };

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
                      <button onClick={handleCloseModal} className='closeModalButton' aria-label='Close Label'>x</button>
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