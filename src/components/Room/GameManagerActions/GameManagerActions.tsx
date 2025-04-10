import { useUserState } from "../../../context/UserStateContext";
import Button from "../../common/Button/Button";
import './GameManagerActions.css';

const GameManagerActions = () => {
  const { dispatch } = useUserState();

  const handleLeaveRoom = () => {
    dispatch({ type: 'LEAVE_ROOM' });
  };

  return (
    <div className='gameManagerContainer'>
      <h3 className='gameManagerHeader'>Pokemon Chess Arena</h3>
      <Button className='gameManagerLeaveRoom' color='danger' onClick={() => handleLeaveRoom()}>Return to Main Menu</Button>
    </div>
  )
};


export default GameManagerActions;