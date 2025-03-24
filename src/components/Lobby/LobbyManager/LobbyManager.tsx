import { useState } from "react";
import LobbyList from "../LobbyList/LobbyList";
import MenuOptions from "../MenuOptions/MenuOptions";
import CreateLobbyForm from "../CreateLobbyForm/CreateLobbyForm";

interface LobbyManagerProps {
  onStartGame: () => void;
}

const LobbyManager = ({ onStartGame }: LobbyManagerProps) => {
  const [creatingRoom, setCreatingRoom] = useState(false);

  const handleCreateLobby = () => {
    onStartGame();
  };

  return (
    <div>
      <MenuOptions onCreateRoom={() => { setCreatingRoom(true) }} onChangeName={() => {}} />
      <LobbyList availableLobbies={[]} />
      {
        creatingRoom ? (
          <CreateLobbyForm handleCreateLobby={handleCreateLobby} handleCancelLobbyCreation={() => setCreatingRoom(false)}/>
        ) : null
      }
    </div>
  );
};

export default LobbyManager;