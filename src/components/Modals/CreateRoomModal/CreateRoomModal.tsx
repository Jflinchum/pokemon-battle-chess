import { useState } from "react";
import { toast } from "react-toastify";
import { useModalState } from "../../../context/ModalState/ModalStateContext";
import { useUserState } from "../../../context/UserState/UserStateContext";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { createNewRoom } from "../../../service/lobby";
import CreateRoomForm from "./CreateRoomForm/CreateRoomForm";
import "./CreateRoomModal.css";

const CreateRoomModal = () => {
  const { dispatch } = useModalState();
  const { userState, dispatch: userStateDispatch } = useUserState();
  const { dispatch: dispatchGameState } = useGameState();

  const [createRoomLoading, setCreateRoomLoading] = useState(false);

  const handleCreateRoom = async ({ password }: { password: string }) => {
    setCreateRoomLoading(true);
    const response = await createNewRoom(
      userState.id,
      userState.name,
      password,
      userState.avatarId,
      userState.secretId,
    );
    if (response.status === 200) {
      const { data } = await response.json();
      userStateDispatch({
        type: "SET_ROOM",
        payload: { roomId: data.roomId, roomCode: password },
      });
      dispatchGameState({ type: "CREATE_ROOM" });
      dispatch({ type: "CLOSE_MODAL" });
    } else {
      toast("Error: Could not create room.", { type: "error" });
    }
    setCreateRoomLoading(false);
  };

  const handleCancelCreateRoom = () => {
    dispatch({ type: "CLOSE_MODAL" });
  };

  return (
    <div className="createRoomModalContainer">
      <h2 className="createRoomTitle">Create Room</h2>
      <CreateRoomForm
        createRoomLoading={createRoomLoading}
        handleCreateRoom={handleCreateRoom}
        handleCancelRoomCreation={handleCancelCreateRoom}
      />
    </div>
  );
};

export default CreateRoomModal;
