import { useState } from 'react'
import BattleChessManager from './components/BattleChessGame/BattleChessManager/BattleChessManager'
import LobbyManager from './components/Lobby/LobbyManager/LobbyManager'

function App() {
  const [inGame, setInGame] = useState(true);
  
  return (
    <div>
      {
        inGame ? (
          <BattleChessManager />
        ) : (
          <LobbyManager onStartGame={() => setInGame(true)} />
        )
      }
    </div>
  )
}

export default App
