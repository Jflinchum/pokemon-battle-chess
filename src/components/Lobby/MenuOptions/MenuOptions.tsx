import { useState } from "react";
import { useUserState } from "../../../context/UserStateContext";
import Button from "../../common/Button/Button";
import './MenuOptions.css';

interface MenuOptionProps {
  onCreateRoom: () => void;
}

const MenuOptions = ({ onCreateRoom }: MenuOptionProps) => {
  const { userState, dispatch } = useUserState();
  const [name, setName] = useState(userState.name);

  const handleChangeName = (name: string) => {
    dispatch({ type: 'SET_NAME', payload: name });
  }

  return (
    <ul className='menuOptions'>
      <li>
        <Button colorPrimary="purple" onClick={() => handleChangeName(name)}>Change Name</Button>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </li>
      <li>
        <Button colorPrimary="green" onClick={onCreateRoom}>Create New Room</Button>
      </li>
    </ul>
  );
};


export default MenuOptions;