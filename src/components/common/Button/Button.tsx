import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: 'primary' | 'secondary' | 'danger';
};

const Button = ({ children, className = '', color = 'secondary', ...props }: ButtonProps) => {

  return (
    <>
      <button
        className={`button ${color} ${className}`}
        {...props}
      >
        {children}
      </button>
    </>
  );
}

export default Button;