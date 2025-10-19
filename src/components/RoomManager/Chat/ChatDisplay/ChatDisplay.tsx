import { RefObject, useEffect, useRef, useState } from "react";
import { cleanString } from "../../../../../shared/util/profanityFilter";
import { useUserState } from "../../../../context/UserState/UserStateContext";
import { socket } from "../../../../socket";
import { useSocketRequests } from "../../../../util/useSocketRequests";
import "./ChatDisplay.css";

interface ChatDisplayProps {
  onMessage?: (message: ChatMessage) => void;
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export interface ChatMessage {
  playerName: string;
  message: string;
}

const ChatDisplay = ({
  className = "",
  onMessage = () => {},
  inputRef,
}: ChatDisplayProps) => {
  const { userState, dispatch } = useUserState();
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [chatLog, setChatLog] = useState<ChatMessage[]>(userState.chatHistory);
  const { sendChatMessage } = useSocketRequests();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("chatMessage", (chatMessage: ChatMessage) => {
      setChatLog((curr) => [...curr, chatMessage]);
      dispatch({ type: "PUSH_CHAT_HISTORY", payload: chatMessage });
      onMessage(chatMessage);
    });

    return () => {
      socket.off("chatMessage");
    };
  }, [onMessage, dispatch]);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [chatLog]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const userMessage = {
        playerName: userState.name,
        message: cleanString(currentMessage),
      };
      setChatLog((curr) => [...curr, userMessage]);
      dispatch({ type: "PUSH_CHAT_HISTORY", payload: userMessage });
      sendChatMessage(currentMessage);
      setCurrentMessage("");
      onMessage(userMessage);
    }
  };

  return (
    <div className={`chatDisplayContainer ${className}`}>
      <div ref={containerRef} className="chatLog">
        {chatLog.map((chat, index) => (
          <p key={index}>
            <b>{chat.playerName}</b>: {chat.message}
          </p>
        ))}
      </div>
      <div className="chatLogActions">
        <input
          ref={inputRef}
          placeholder="Send a message"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};

export default ChatDisplay;
