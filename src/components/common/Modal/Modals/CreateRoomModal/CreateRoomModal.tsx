import { useModalState } from "../../../../../context/ModalStateContext";
import { useUserState } from "../../../../../context/UserStateContext";
import { useGameState } from "../../../../../context/GameStateContext";
import { createNewRoom } from "../../../../../service/lobby";
import CreateRoomForm from "./CreateRoomForm/CreateRoomForm";
import './CreateRoomModal.css';
import { useState } from "react";
import ErrorMessage from "../../../ErrorMessage/ErrorMessage";

const CreateRoomModal = () => {
  const { dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const { dispatch: dispatchGameState } = useGameState();

  const [errorText, setErrorText] = useState('');
  const [createRoomLoading, setCreateRoomLoading] = useState(false);

  const handleCreateRoom = async ({ password }: { password: string }) => {
    setErrorText('');
    setCreateRoomLoading(true);
    const response = await createNewRoom(userState.id, userState.name, password, userState.avatarId);
    if (response.status === 200) {
      const { data } = await response.json();
      userStateDispatch({ type: 'SET_ROOM', payload: { roomId: data.roomId, roomCode: password } });
      dispatchGameState({ type: 'CREATE_ROOM' });
      dispatch({ type: 'CLOSE_MODAL' });
    } else {
      setErrorText('Error while creating room.');
    }
    setCreateRoomLoading(false);
  }
  
  const handleCancelCreateRoom = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  return (
    <div className='createRoomModalContainer'>
      <h2 className='createRoomTitle'>Create Room</h2>
      <ErrorMessage>{errorText}</ErrorMessage>
      <CreateRoomForm createRoomLoading={createRoomLoading} handleCreateRoom={handleCreateRoom} handleCancelRoomCreation={handleCancelCreateRoom} />
    </div>
  )
};

export default CreateRoomModal;