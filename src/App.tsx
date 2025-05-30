import UserStateProvider from "./context/UserState/UserStateProvider";
import GameStateProvider from "./context/GameState/GameStateProvider";
import ModalStateProvider from "./context/ModalState/ModalStateProvider";
import AudioProvider from "./context/AudioState/AudioProvider";
import MainMenu from "./components/MainMenu/MainMenu";

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
