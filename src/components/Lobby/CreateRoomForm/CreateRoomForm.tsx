import { useState } from "react";
import Button from "../../common/Button/Button";
import './CreateRoomForm.css'

interface CreateRoomFormProps {
  handleCreateRoom: () => void;
  handleCancelRoomCreation: () => void;
}

const CreateRoomForm = ({ handleCreateRoom, handleCancelRoomCreation }: CreateRoomFormProps) => {
  const [roomPassword, setRoomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) =>{ 
    e.preventDefault();
    handleCreateRoom();
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit}>
      <div className='roomFormOptions'>
        <label htmlFor='password'>Room Password: </label>
        <input name='password' autoComplete="off" value={roomPassword} type={showPassword ? 'text' : 'password'} onChange={(e) => setRoomPassword(e.target.value)} />
        <button type='button' onMouseLeave={() => setShowPassword(false)} onMouseUp={() => setShowPassword(false)} onMouseDown={() => setShowPassword(true)}>Show Password</button>
      </div>
      <div className='roomFormActions'>
        <Button colorPrimary='brown' onClick={handleCancelRoomCreation}>Cancel</Button>
        <Button colorPrimary='green' type='submit'>Create Room</Button>
      </div>
    </form>
  );
};

export default CreateRoomForm;