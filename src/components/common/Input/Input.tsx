import { RefObject, useEffect, useRef, useState } from "react";
import "./Input.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerType?: "bordered" | "underline";
  label?: string;
  ref?: RefObject<HTMLInputElement | null>;
  valid?: boolean;
}

const Input = ({
  containerType = "bordered",
  label,
  valid,
  children,
  className = "",
  ref,
  onFocus,
  onBlur,
  ...props
}: InputProps) => {
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;
  const [labelShifted, setLabelShifted] = useState(false);

  useEffect(() => {
    if (inputRef?.current?.value?.length || 0 > 0) {
      setLabelShifted(true);
    }
  }, [inputRef, setLabelShifted]);

  return (
    <div
      className={`inputContainer ${valid === false ? "invalidInput" : ""} ${containerType} ${className} ${labelShifted || inputRef?.current?.value?.length || 0 > 0 ? "focused" : ""}`}
      onClick={() => {
        inputRef.current?.focus();
      }}
    >
      <label className="inputLabel">
        <span className="inputLabelText">{label}</span>
        <input
          aria-invalid={`${valid === false ? "true" : "false"}`}
          className="input"
          onFocus={(e) => {
            setLabelShifted(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setLabelShifted(false);
            onBlur?.(e);
          }}
          ref={inputRef}
          {...props}
        />
      </label>
      {children}
    </div>
  );
};

export default Input;
