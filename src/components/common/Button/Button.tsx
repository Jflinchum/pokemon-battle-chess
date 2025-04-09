import { ReactNode } from "react";
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  toolTip?: ReactNode;
  color?: 'primary' | 'secondary'
};

const Button = ({ children, toolTip, className = '', color, ...props }: ButtonProps) => {

  return (
    <button
      className={`button ${color} ${className}`}
      {...props}
    >
      {children}
      {
        toolTip && (
          <div className='tooltip'>
            {toolTip}
          </div>
        )
      }
    </button>
  );
}

export default Button;