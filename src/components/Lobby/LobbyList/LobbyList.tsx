import LobbyListItem from "./LobbyListItem";

interface LobbyListProps {
  availableLobbies: Lobby[]
}

const LobbyList = ({ availableLobbies }: LobbyListProps) => {

  return (
    <div>
      <p>Lobbies:</p>
      <ul>
        {
          availableLobbies.map((lobby) => (
            <LobbyListItem />
          ))
        } 
      </ul>
    </div>
  );
};

export default LobbyList;