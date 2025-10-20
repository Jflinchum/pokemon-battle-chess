import { Input } from "../Input/Input";
import "./ToggleSwitch.css";

export const ToggleSwitch = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <>
      {/*
        This label is being styled as the toggle switch and needs to capture click events to toggle the input. However, we should not add an htmlFor here in order to prevent clashes with
        other label elements intended to be used for the input element.
      */}
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className="switch">
        <Input
          className={`checkbox ${className || ""}`}
          type="checkbox"
          role="switch"
          {...props}
        />
        <span className="slider round"></span>
      </label>
    </>
  );
};
