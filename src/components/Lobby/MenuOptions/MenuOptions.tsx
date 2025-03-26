import { useState } from "react";
import { useUserState } from "../../../context/UserStateContext";

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
    <ul>
      <li>
        <button onClick={onCreateRoom}>Create New Room</button>
      </li>
      <li>
        <button onClick={() => handleChangeName(name)}>Change Name</button>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </li>
    </ul>
  );
};


export default MenuOptions;