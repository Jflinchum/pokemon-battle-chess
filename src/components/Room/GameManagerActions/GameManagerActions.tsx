import { useGameState } from "../../../context/GameStateContext";
import { useUserState } from "../../../context/UserStateContext";
import PokemonMoveButton from "../../common/PokemonMoveButton/PokemonMoveButton";
import ChatToggle from "./ChatToggle/ChatToggle";
import './GameManagerActions.css';

const GameManagerActions = () => {
  const { gameState } = useGameState();
  const { dispatch } = useUserState();

  const handleLeaveRoom = () => {
    dispatch({ type: 'LEAVE_ROOM' });
  };

  return (
    <div className='gameManagerBottomActions'>
      {
        gameState.matchStarted && (
          <PokemonMoveButton className='gameManagerLeaveRoom' colorPrimary="brown" onClick={() => handleLeaveRoom()}>Return to Main Menu</PokemonMoveButton>
        )
      }
      <div className='gameManagerChatContainer'>
        <ChatToggle className='chatToggleAction' />
      </div>
    </div>
  )
};


export default GameManagerActions;