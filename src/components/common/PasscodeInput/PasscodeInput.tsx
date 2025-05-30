import { useState, RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Input from "../Input/Input";
import "./PasscodeInput.css";

interface PasscodeInputProps {
  label: string;
  onFocus?: () => void;
  ref?: RefObject<HTMLInputElement | null>;
}

const PasscodeInput = ({
  label,
  onFocus = () => {},
  ref,
}: PasscodeInputProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="passcodeInputContainer">
      <div className="passcodeInputWrapper">
        <Input
          label={label}
          maxLength={16}
          ref={ref}
          onFocus={onFocus}
          name="password"
          autoComplete="off"
          value={password}
          type={showPassword ? "text" : "password"}
          onChange={(e) => setPassword(e.target.value)}
        >
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <FontAwesomeIcon icon={faEye} size="lg" />
            ) : (
              <FontAwesomeIcon icon={faEyeSlash} size="lg" />
            )}
          </button>
        </Input>
      </div>
    </div>
  );
};

export default PasscodeInput;
