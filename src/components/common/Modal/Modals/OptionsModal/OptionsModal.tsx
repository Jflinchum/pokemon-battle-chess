import { Menu } from "../../../Menu/Menu";
import { GameSettings } from "./components/GameSettings";
import { SoundSettings } from "./components/SoundSettings";
import "./OptionsModal.css";

const OptionsModal = () => {
  return (
    <div className="optionsModalContainer">
      <h2 className="optionsTitle">Options</h2>
      <Menu
        navLabels={["Game Settings", "Sound"]}
        menuScreens={[<GameSettings />, <SoundSettings />]}
      />
    </div>
  );
};

export default OptionsModal;
