import { useState, forwardRef, Ref } from "react";

interface PasscodeInputProps {
  label: string;
  onFocus?: () => void;
}

const PasscodeInput = forwardRef(({ label, onFocus = () => {} }: PasscodeInputProps, ref: Ref<HTMLInputElement>) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <label>{label}</label>
      <input ref={ref} onFocus={onFocus} name='password' autoComplete="off" value={password} type={showPassword ? 'text' : 'password'} onChange={(e) => setPassword(e.target.value)} />
      <button type='button' onMouseLeave={() => setShowPassword(false)} onMouseUp={() => setShowPassword(false)} onMouseDown={() => setShowPassword(true)}>Show Password</button>
    </>
  )
})

export default PasscodeInput;