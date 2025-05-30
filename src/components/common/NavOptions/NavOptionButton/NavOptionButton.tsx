import "./NavOptionButton.css";

export const NavOptionButton = ({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button {...props} className={`navOptionButton ${className}`}>
      {children}
    </button>
  );
};
