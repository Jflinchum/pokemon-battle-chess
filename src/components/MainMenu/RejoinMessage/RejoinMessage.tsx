import { useState } from "react";
import { toast } from "react-toastify";
import { useUserState } from "../../../context/UserStateContext";
import { joinRoom } from "../../../service/lobby";
import { clearMostRecentRoom } from "../../../util/localWebData";
import Button from "../../common/Button/Button";
import './RejoinMessage.css';
import Spinner from "../../common/Spinner/Spinner";

export const RejoinMessage = ({ data, closeToast }: { data: { roomId: string; roomCode: string; }, closeToast: () => void }) => {
  const [loading, setLoading] = useState(false);
  const { userState, dispatch } = useUserState();

  const handleNoClick = () => {
    clearMostRecentRoom();
    closeToast();
  };

  const handleYesClick = async () => {
    setLoading(true);
    const response = await joinRoom(data.roomId, data.roomCode, userState.id, userState.name, userState.avatarId, userState.secretId);
    closeToast();

    if (response.status === 200) {
      dispatch({ type: 'JOIN_ROOM', payload: { roomId: data.roomId, roomCode: data.roomCode } });
    } else {
      toast('Error: Failed to join room.', { type: 'error' });
    }
  };

  return (
    <div>
      <span>It looks like your most recent game is still on-going. Would you like to re-join?</span>
      <div className='rejoinButtonContainer'>
        <Button onClick={handleNoClick}>No</Button>
        <Button onClick={handleYesClick} color='primary' className='rejoinSubmit'>
          {
            loading ? (<Spinner className='rejoinSpinner' />) : null
          }
          Yes
        </Button>
      </div>
    </div>
  );
}