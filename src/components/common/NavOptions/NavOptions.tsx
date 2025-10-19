import { faBars, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import "./NavOptions.css";

interface NavOptionsProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  minimal?: boolean;
}

const NavOptions = ({
  children,
  className = "",
  minimal,
  ...props
}: NavOptionsProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${className}`} {...props}>
      {open && <div className="navBackdrop" onClick={() => setOpen(false)} />}
      <div className="navMobileNav">
        <button
          aria-label="Main Options"
          onClick={() => setOpen(!open)}
          className="navMobileButton"
        >
          <span>
            <FontAwesomeIcon size="2x" icon={open ? faX : faBars} />
          </span>
        </button>
      </div>
      <div
        className={`navOptions ${minimal ? "navMinimal" : ""} ${open ? "navOptionsOpen" : "navOptionsClose"}`}
      >
        {children}
      </div>
    </div>
  );
};

export default NavOptions;
