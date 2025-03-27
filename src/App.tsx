import UserStateProvider from './context/UserStateContext';
import GameStateProvider from './context/GameStateContext';
import ModalStateProvider from './context/ModalStateContext';
import MainMenu from './components/MainMenu/MainMenu';

function App() {
  return (
    <UserStateProvider>
      <GameStateProvider>
        <ModalStateProvider>
          <MainMenu />
        </ModalStateProvider>
      </GameStateProvider>
    </UserStateProvider>
  )
}

export default App
