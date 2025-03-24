import { useState } from "react";

interface MenuOptionProps {
  onCreateRoom: () => void;
  onChangeName: (name: string) => void;
}

const MenuOptions = ({ onCreateRoom, onChangeName }: MenuOptionProps) => {
  const [name, setName] = useState('');

  return (
    <ul>
      <li>
        <button onClick={onCreateRoom}>Create New Room</button>
      </li>
      <li>
        <button onClick={() => onChangeName(name)}>Change Name</button>
        <input onChange={(e) => setName(e.target.value)} />
      </li>
    </ul>
  );
};


export default MenuOptions;