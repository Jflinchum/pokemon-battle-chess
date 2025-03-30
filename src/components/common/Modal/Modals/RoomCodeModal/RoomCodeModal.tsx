import { useRef, useState } from "react";
import { RoomCodeModalProps, useModalState } from "../../../../../context/ModalStateContext";
import PasscodeInput from "../../../PasscodeInput/PasscodeInput";
import Button from "../../../Button/Button";
import { useUserState } from "../../../../../context/UserStateContext";
import { joinRoom } from "../../../../../service/lobby";
import './RoomCodeModal.css';

const RoomCodeModal = () => {
  const { modalState, dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [invalidPassword, setInvalidPassword] = useState(false)

  const handleJoinRoomClick = async () => {
    const roomId = (modalState.modalProps as RoomCodeModalProps)?.roomId;
    const roomCode = inputRef.current?.value || '';
    const response = await joinRoom(roomId, roomCode, userState.id, userState.name, userState.avatarId);
    if (response.status !== 200) {
      setInvalidPassword(true);
      return;
    }
    userStateDispatch({ type: 'JOIN_ROOM', payload: { roomId, roomCode } });
    dispatch({ type: 'CLOSE_MODAL' });
  }

  return (
    <div className='roomCodeModalContainer'>
      <h2 className='roomCodeTitle'>Enter Room Code</h2>
      {invalidPassword && <span>Invalid Password</span>}
      <PasscodeInput label="Room Code: " onFocus={() => setInvalidPassword(false)} ref={inputRef}/>
      <Button colorPrimary="green" onClick={handleJoinRoomClick}>Submit</Button>
    </div>
  )
};

export default RoomCodeModal;