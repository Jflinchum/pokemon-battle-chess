import { useEffect, useRef } from "react";
import Button from "../../../../Button/Button";
import './CreateRoomForm.css'
import PasscodeInput from "../../../../PasscodeInput/PasscodeInput";

interface CreateRoomFormProps {
  createRoomLoading: boolean;
  handleCreateRoom: ({ password }: { password: string }) => void;
  handleCancelRoomCreation: () => void;
}

const CreateRoomForm = ({ handleCreateRoom, handleCancelRoomCreation, createRoomLoading }: CreateRoomFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) =>{ 
    e.preventDefault();
    console.log(e);
    console.log(inputRef?.current?.value);
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
        <Button type='button' colorPrimary='brown' onClick={handleCancelRoomCreation}>Cancel</Button>
        <Button disabled={createRoomLoading} colorPrimary='green' type='submit'>Create Room</Button>
      </div>
    </form>
  );
};

export default CreateRoomForm;