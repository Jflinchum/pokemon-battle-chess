import './NavOptionButton.css';

interface NavOptionButton extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const NavOptionButton = ({ children, className = '', ...props }: NavOptionButton) => {
  return (
    <button {...props} className={`navOptionButton ${className}`}>{children}</button>
  );
}