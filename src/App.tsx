import UserStateProvider from './context/UserStateContext';
import GameStateProvider from './context/GameStateContext';
import ModalStateProvider from './context/ModalStateContext';
import AudioProvider from './context/AudioContext';
import MainMenu from './components/MainMenu/MainMenu';

function App() {
  return (
    <UserStateProvider>
      <GameStateProvider>
        <ModalStateProvider>
          <AudioProvider>
            <MainMenu />
          </AudioProvider>
        </ModalStateProvider>
      </GameStateProvider>
    </UserStateProvider>
  )
}

export default App;
