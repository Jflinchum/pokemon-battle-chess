import { RefObject, useEffect, useRef, useState } from "react";
import "./TextInput.css";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerType?: "bordered" | "underline";
  label?: string;
  ref?: RefObject<HTMLInputElement | null>;
  valid?: boolean;
}

const TextInput = ({
  containerType = "bordered",
  label,
  valid,
  children,
  className = "",
  ref,
  onFocus,
  onBlur,
  ...props
}: TextInputProps) => {
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;
  const [labelShifted, setLabelShifted] = useState(false);

  useEffect(() => {
    if (inputRef?.current?.value?.length || 0 > 0) {
      setLabelShifted(true);
    }
  }, [inputRef, setLabelShifted]);

  const getAriaInvalid = (valid?: boolean): "true" | "false" => {
    return valid === false ? "true" : "false";
  };

  return (
    <>
      {/* The <div> element is capturing events to help focus the input when the user clicks around the input */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className={`inputContainer ${valid === false ? "invalidInput" : ""} ${containerType} ${className} ${labelShifted || inputRef?.current?.value?.length || 0 > 0 ? "focused" : ""}`}
        onClick={() => {
          inputRef.current?.focus();
        }}
      >
        <label className="inputLabel">
          <span className="inputLabelText">{label}</span>
          <input
            aria-invalid={getAriaInvalid(valid)}
            className="textInput"
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
    </>
  );
};

export default TextInput;
