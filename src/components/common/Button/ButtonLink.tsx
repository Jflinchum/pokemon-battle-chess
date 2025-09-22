import "./Button.css";

interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  color?: "primary" | "secondary" | "danger";
  highlighted?: boolean;
}

const ButtonLink = ({
  children,
  highlighted,
  className = "",
  color = "secondary",
  ...props
}: ButtonLinkProps) => {
  return (
    <a
      className={`button ${color} ${highlighted ? "highlightedButton" : ""} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
};

export default ButtonLink;
