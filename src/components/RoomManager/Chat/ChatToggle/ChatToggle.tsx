import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import ChatDisplay from "../ChatDisplay/ChatDisplay";
import "./ChatToggle.css";

interface ChatToggleProps {
  className?: string;
}

const ChatToggle = ({ className }: ChatToggleProps) => {
  const [open, setOpen] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleNewMessage = () => {
    if (!open) {
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
        onMessage={handleNewMessage}
        className="chatActionDisplay"
      />
    </div>
  );
};

export default ChatToggle;
