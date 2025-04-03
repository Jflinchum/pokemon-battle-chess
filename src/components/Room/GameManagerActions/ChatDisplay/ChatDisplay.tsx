import { RefObject, useEffect, useRef, useState } from 'react';
import { socket } from '../../../../socket';
import './ChatDisplay.css';
import { useUserState } from '../../../../context/UserStateContext';

interface ChatDisplayProps {
  onMessage: (message: ChatMessage) => void;
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>
}

interface ChatMessage {
  playerName: string;
  message: string;
}

const ChatDisplay = ({ className, onMessage, inputRef }: ChatDisplayProps) => {
  const { userState } = useUserState();
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('chatMessage', (chatMessage: ChatMessage) => {
      setChatLog((curr) => [...curr, chatMessage]);
      onMessage(chatMessage);
    })

    return () => {
      socket.off('chatMessage');
    }
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [chatLog]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const userMessage = { playerName: userState.name, message: currentMessage };
      setChatLog((curr) => [...curr, userMessage]);
      socket.emit('sendChatMessage', { message: currentMessage, playerId: userState.id, roomId: userState.currentRoomId });
      setCurrentMessage('');
      onMessage(userMessage);
    }
  }

  return (
    <div className={`chatDisplayContainer ${className}`}>
      <div ref={containerRef} className='chatLog'>
        {
          chatLog.map((chat, index) => (
            <p key={index}><b>{chat.playerName}</b>: {chat.message}</p>
          ))
        }
      </div>
      <div className='chatLogActions'>
        <input ref={inputRef} placeholder="Send a message" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyDown={handleKeyDown} />
      </div>
    </div>
  );
};

export default ChatDisplay;