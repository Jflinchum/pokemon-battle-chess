import { useModalState } from "../../../context/ModalStateContext";
import Button from "../../common/Button/Button";
import './MenuOptions.css';

interface MenuOptionProps {
  onCreateRoom: () => void;
}

const MenuOptions = ({ onCreateRoom }: MenuOptionProps) => {
  const { dispatch } = useModalState();

  const handleChangeName = () => {
    dispatch({ type: 'OPEN_NAME_MODAL', payload: {} });
  }

  return (
    <ul className='menuOptions'>
      <li>
        <Button colorPrimary="purple" onClick={() => handleChangeName()}>Change Name</Button>
      </li>
      <li>
        <Button colorPrimary="green" onClick={onCreateRoom}>Create New Room</Button>
      </li>
    </ul>
  );
};


export default MenuOptions;