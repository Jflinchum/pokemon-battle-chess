import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  RoomCodeModalProps,
  useModalState,
} from "../../../context/ModalState/ModalStateContext";
import { useUserState } from "../../../context/UserState/UserStateContext";
import { joinRoom } from "../../../service/lobby";
import {
  FAILED_TO_JOIN_ROOM_ERROR,
  INVALID_PASSWORD_ERROR,
} from "../../../util/errorMessages";
import Button from "../../common/Button/Button";
import PasscodeInput from "../../common/PasscodeInput/PasscodeInput";
import "./RoomCodeModal.css";

const RoomCodeModal = () => {
  const { modalState, dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = (modalState.modalProps as RoomCodeModalProps)?.roomId;
    const roomCode = inputRef.current?.value || "";
    try {
      const response = await joinRoom(
        roomId,
        roomCode,
        userState.id,
        userState.name,
        userState.avatarId,
        userState.secretId,
      );
      if (response.status === 401) {
        toast(INVALID_PASSWORD_ERROR, { type: "error" });
        return;
      } else if (response.status > 399) {
        toast(FAILED_TO_JOIN_ROOM_ERROR, { type: "error" });
        return;
      }
      userStateDispatch({ type: "JOIN_ROOM", payload: { roomId, roomCode } });
      dispatch({ type: "CLOSE_MODAL" });
    } catch (err) {
      toast(FAILED_TO_JOIN_ROOM_ERROR, { type: "error" });
      console.error(err);
    }
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
