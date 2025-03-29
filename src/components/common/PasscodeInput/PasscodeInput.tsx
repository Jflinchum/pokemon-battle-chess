import { useState, forwardRef, Ref } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './PasscodeInput.css';

interface PasscodeInputProps {
  label: string;
  onFocus?: () => void;
}

const PasscodeInput = forwardRef(({ label, onFocus = () => {} }: PasscodeInputProps, ref: Ref<HTMLInputElement>) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className='passcodeInputContainer'>
      <label>{label}</label>
      <div className='passcodeInputWrapper'>
        <input maxLength={16} ref={ref} onFocus={onFocus} name='password' autoComplete="off" value={password} type={showPassword ? 'text' : 'password'} onChange={(e) => setPassword(e.target.value)} />
        <button type='button' onClick={() => setShowPassword(!showPassword)}>
          {
            showPassword ?
            (<FontAwesomeIcon icon={faEye} size='lg'/>) :
            (<FontAwesomeIcon icon={faEyeSlash} size='lg'/>)
          }
        </button>
      </div>
    </div>
  )
})

export default PasscodeInput;