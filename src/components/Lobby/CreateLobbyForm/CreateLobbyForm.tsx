import { useState } from "react";

interface CreateLobbyFormProps {
  handleCreateLobby: () => void;
  handleCancelLobbyCreation: () => void;
}

const CreateLobbyForm = ({ handleCreateLobby, handleCancelLobbyCreation }: CreateLobbyFormProps) => {
  const [roomPassword, setRoomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) =>{ 
    e.preventDefault();
    handleCreateLobby();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <span>Room Password: </span>
        <input value={roomPassword} type={`${showPassword ? 'text' : 'password'}`} onChange={(e) => setRoomPassword(e.target.value)} />
        <button onMouseLeave={() => setShowPassword(false)} onMouseUp={() => setShowPassword(false)} onMouseDown={() => setShowPassword(true)}>Show Password</button>
      </div>
      <div>
        <button onClick={handleCancelLobbyCreation}>Cancel</button>
        <button type='submit'>Create Room</button>
      </div>
    </form>
  );
};

export default CreateLobbyForm;