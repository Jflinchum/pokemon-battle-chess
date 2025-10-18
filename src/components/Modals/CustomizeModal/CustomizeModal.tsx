import { Menu } from "../../common/Menu/Menu";
import { NameChangeForm } from "../NameChangeModal/components/NameChangeForm";
import { ChangeAvatar } from "./components/ChangeAvatar/ChangeAvatar";
import "./CustomizeModal.css";

const CustomizeModal = () => {
  return (
    <div className="customizeModalContainer">
      <h2 className="customizeTitle">Customize</h2>
      <Menu
        navLabels={["Change Name", "Change Avatar"]}
        menuScreens={[<NameChangeForm />, <ChangeAvatar />]}
      />
    </div>
  );
};

export default CustomizeModal;
