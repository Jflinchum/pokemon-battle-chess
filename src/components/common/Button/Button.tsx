import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: 'primary' | 'secondary' | 'danger';
  highlighted?: boolean;
};

const Button = ({ children, highlighted, className = '', color = 'secondary', ...props }: ButtonProps) => {

  return (
    <>
      <button
        className={`button ${color} ${highlighted ? 'highlightedButton' : ''} ${className}`}
        {...props}
      >
        {children}
      </button>
    </>
  );
}

export default Button;