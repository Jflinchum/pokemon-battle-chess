import { useUserState } from "../../../../context/UserStateContext";
import Button from "../../../common/Button/Button";
import './RoomActions.css';

const RoomActions = () => {
  const { dispatch } = useUserState();

  const handleLeaveRoom = () => {
    dispatch({ type: 'LEAVE_ROOM' });
  };

  return (
    <div className='roomActionContainer'>
      <h3 className='roomActionHeader'>Pokemon Gambit</h3>
      <div className='roomActionRightActions'>
        <Button color='danger' onClick={() => handleLeaveRoom()}>Return to Main Menu</Button>
      </div>
    </div>
  )
};


export default RoomActions;