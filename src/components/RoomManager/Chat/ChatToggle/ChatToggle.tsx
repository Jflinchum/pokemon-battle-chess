import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretUp, faCaretDown } from "@fortawesome/free-solid-svg-icons";
import ChatDisplay from "../ChatDisplay/ChatDisplay";
import "./ChatToggle.css";

interface ChatToggleProps {
  className?: string;
}

const ChatToggle = ({ className }: ChatToggleProps) => {
  const [open, setOpen] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState(0);
  const openRef = useRef(open);
  const inputRef = useRef<HTMLInputElement | null>(null);

  openRef.current = open;

  const handleMessage = () => {
    if (!openRef.current) {
      setNewMessageNotification((curr) => ++curr);
    }
  };

  useEffect(() => {
    if (open) {
      setNewMessageNotification(0);
      inputRef.current?.focus();
    }
  }, [open]);

  return (
    <div
      className={`chatToggleContainer ${open ? "chatOpen" : "chatClosed"} ${className}`}
    >
      <button onClick={() => setOpen(!open)} className={"chatToggleButton"}>
        <span>
          <FontAwesomeIcon icon={open ? faCaretDown : faCaretUp} /> Chat
        </span>
        {newMessageNotification !== 0 && (
          <span className="chatToggleNewMessageNum">
            {newMessageNotification}
          </span>
        )}
      </button>
      <ChatDisplay
        inputRef={inputRef}
        onMessage={handleMessage}
        className="chatActionDisplay"
      />
    </div>
  );
};

export default ChatToggle;
