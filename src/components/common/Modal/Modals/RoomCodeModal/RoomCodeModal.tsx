import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  RoomCodeModalProps,
  useModalState,
} from "../../../../../context/ModalState/ModalStateContext";
import PasscodeInput from "../../../PasscodeInput/PasscodeInput";
import Button from "../../../Button/Button";
import { useUserState } from "../../../../../context/UserState/UserStateContext";
import { joinRoom } from "../../../../../service/lobby";
import "./RoomCodeModal.css";

const RoomCodeModal = () => {
  const { modalState, dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = (modalState.modalProps as RoomCodeModalProps)?.roomId;
    const roomCode = inputRef.current?.value || "";
    const response = await joinRoom(
      roomId,
      roomCode,
      userState.id,
      userState.name,
      userState.avatarId,
      userState.secretId,
    );
    if (response.status === 401) {
      toast("Incorrect Password", { type: "error" });
      return;
    } else if (response.status > 399) {
      toast("Error: Failed to join room.", { type: "error" });
      return;
    }
    userStateDispatch({ type: "JOIN_ROOM", payload: { roomId, roomCode } });
    dispatch({ type: "CLOSE_MODAL" });
  };

  const handleCancelClick = () => {
    dispatch({ type: "CLOSE_MODAL" });
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="roomCodeModalContainer">
      <h2 className="roomCodeTitle">Enter Room Code</h2>
      <form onSubmit={handleJoinRoom} className="roomCodeForm">
        <PasscodeInput label="Room Code" ref={inputRef} />
        <div className="roomCodeActions">
          <Button type="button" onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button type="submit" color="primary">
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoomCodeModal;
