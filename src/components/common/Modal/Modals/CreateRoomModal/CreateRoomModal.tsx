import { useModalState } from "../../../../../context/ModalStateContext";
import { useUserState } from "../../../../../context/UserStateContext";
import { useGameState } from "../../../../../context/GameStateContext";
import { createNewRoom } from "../../../../../service/lobby";
import CreateRoomForm from "../../../../Lobby/CreateRoomForm/CreateRoomForm";
import './CreateRoomModal.css';
import { useState } from "react";

const CreateRoomModal = () => {
  const { dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const { dispatch: dispatchGameState } = useGameState();

  const [createRoomLoading, setCreateRoomLoading] = useState(false);

  const handleCreateRoom = async ({ password }: { password: string }) => {
    setCreateRoomLoading(true);
    const roomId = await createNewRoom(userState.id, userState.name, password);
    if (roomId) {
      userStateDispatch({ type: 'SET_ROOM', payload: { roomId: roomId, roomCode: password } });
      dispatchGameState({ type: 'CREATE_ROOM' });
      dispatch({ type: 'CLOSE_MODAL' });
    }
    setCreateRoomLoading(false);
  }
  
  const handleCancelCreateRoom = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  return (
    <div className='createRoomModalContainer'>
      <h2 className='createRoomTitle'>Create Room</h2>
      <CreateRoomForm createRoomLoading={createRoomLoading} handleCreateRoom={handleCreateRoom} handleCancelRoomCreation={handleCancelCreateRoom} />
    </div>
  )
};

export default CreateRoomModal;