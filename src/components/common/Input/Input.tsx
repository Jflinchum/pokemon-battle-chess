import "./Input.css";

export const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  return <input className={`input ${className}`} {...props} />;
};
