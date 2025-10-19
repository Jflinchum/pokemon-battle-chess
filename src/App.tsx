import MainMenu from "./components/MainMenu/MainMenu";
import AudioProvider from "./context/AudioState/AudioProvider";
import GameStateProvider from "./context/GameState/GameStateProvider";
import ModalStateProvider from "./context/ModalState/ModalStateProvider";
import UserStateProvider from "./context/UserState/UserStateProvider";

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
  );
}

export default App;
