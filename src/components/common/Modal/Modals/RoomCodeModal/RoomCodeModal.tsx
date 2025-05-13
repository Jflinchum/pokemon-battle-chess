import { useEffect, useRef, useState } from "react";
import { RoomCodeModalProps, useModalState } from "../../../../../context/ModalStateContext";
import PasscodeInput from "../../../PasscodeInput/PasscodeInput";
import Button from "../../../Button/Button";
import { useUserState } from "../../../../../context/UserStateContext";
import { joinRoom } from "../../../../../service/lobby";
import './RoomCodeModal.css';
import ErrorMessage from "../../../ErrorMessage/ErrorMessage";

const RoomCodeModal = () => {
  const { modalState, dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorText, setErrorText] = useState('')

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    const roomId = (modalState.modalProps as RoomCodeModalProps)?.roomId;
    const roomCode = inputRef.current?.value || '';
    const response = await joinRoom(roomId, roomCode, userState.id, userState.name, userState.avatarId, userState.secretId);
    if (response.status === 401) {
      setErrorText('Invalid Password');
      return;
    } else if (response.status > 399) {
      setErrorText('Failed to join room.');
      return;
    }
    userStateDispatch({ type: 'JOIN_ROOM', payload: { roomId, roomCode } });
    dispatch({ type: 'CLOSE_MODAL' });
  }

  const handleCancelClick = () => {
    dispatch({ type:'CLOSE_MODAL' });
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className='roomCodeModalContainer'>
      <h2 className='roomCodeTitle'>Enter Room Code</h2>
      <ErrorMessage display='block'>{errorText}</ErrorMessage>
      <form onSubmit={handleJoinRoom} className='roomCodeForm'>
        <PasscodeInput label="Room Code" onFocus={() => errorText === 'Invalid Password' && setErrorText('')} ref={inputRef}/>
        <div className='roomCodeActions'>
          <Button type='button' onClick={handleCancelClick}>Cancel</Button>
          <Button type='submit' color='primary'>Submit</Button>
        </div>
      </form>
    </div>
  )
};

export default RoomCodeModal;