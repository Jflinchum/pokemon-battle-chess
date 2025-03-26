import UserStateProvider from './context/UserStateContext'
import GameStateProvider from './context/GameStateContext'
import MainMenu from './components/MainMenu/MainMenu';

function App() {
  return (
    <UserStateProvider>
      <GameStateProvider>
        <MainMenu />
      </GameStateProvider>
    </UserStateProvider>
  )
}

export default App
