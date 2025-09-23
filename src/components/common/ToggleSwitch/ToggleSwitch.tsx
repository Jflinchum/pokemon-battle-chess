import { Input } from "../Input/Input";
import "./ToggleSwitch.css";

export const ToggleSwitch = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <label className="switch">
      <Input
        className={`checkbox ${className || ""}`}
        type="checkbox"
        {...props}
      />
      <span className="slider round"></span>
    </label>
  );
};
