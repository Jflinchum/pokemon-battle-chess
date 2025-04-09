import { useEffect, useRef } from "react";
import Button from "../../../../Button/Button";
import PasscodeInput from "../../../../PasscodeInput/PasscodeInput";
import './CreateRoomForm.css'

interface CreateRoomFormProps {
  createRoomLoading: boolean;
  handleCreateRoom: ({ password }: { password: string }) => void;
  handleCancelRoomCreation: () => void;
}

const CreateRoomForm = ({ handleCreateRoom, handleCancelRoomCreation, createRoomLoading }: CreateRoomFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) =>{ 
    e.preventDefault();
    handleCreateRoom({ password: inputRef?.current?.value || '' });
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form autoComplete="off" onSubmit={handleSubmit}>
      <div className='roomFormOptions'>
        <PasscodeInput label="Room Code" ref={inputRef} />
      </div>
      <div className='roomFormActions'>
        <Button  type='button' onClick={handleCancelRoomCreation}>Cancel</Button>
        <Button disabled={createRoomLoading} type='submit' color='primary'>Create Room</Button>
      </div>
    </form>
  );
};

export default CreateRoomForm;