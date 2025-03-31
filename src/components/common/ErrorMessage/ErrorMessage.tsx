import { ReactNode } from 'react';
import './ErrorMessage.css'

interface ErrorMessageProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  display?: string
}

const ErrorMessage = ({ children, display = 'inline' }: ErrorMessageProps) => {
  return (
    <span style={{ display }} className='errorMessage'>{children}</span>
  );
};

export default ErrorMessage;