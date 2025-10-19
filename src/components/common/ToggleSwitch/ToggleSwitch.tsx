import { Input } from "../Input/Input";
import "./ToggleSwitch.css";

export const ToggleSwitch = ({
  className,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <label className="switch" htmlFor={id}>
      <Input
        className={`checkbox ${className || ""}`}
        type="checkbox"
        {...props}
      />
      <span className="slider round"></span>
    </label>
  );
};
