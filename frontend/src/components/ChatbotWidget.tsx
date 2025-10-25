// frontend/src/components/ChatbotWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { sendMessage } from '../services/api';
import { ChatMessage } from '../types';

// Theme interface
interface Theme {
  colors: {
    primary: string;
    secondary: string;
  };
}

// Keyframes for animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 5px ${(props: { theme: Theme }) => props.theme.colors.primary}90; }
  50% { transform: scale(1.05); box-shadow: 0 0 15px ${(props: { theme: Theme }) => props.theme.colors.primary}d0; }
  100% { transform: scale(1); box-shadow: 0 0 5px ${(props: { theme: Theme }) => props.theme.colors.primary}90; }
`;

// Styled Components
const WidgetContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 25px;
  right: 25px;
  z-index: 1000;
  transition: all 0.3s ease-in-out;
`;

const ChatIcon = styled.button<{ $isOpen: boolean }>`
  width: 65px;
  height: 65px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  color: white;
  border: none;
  font-size: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  animation: ${props => !props.$isOpen && css`${pulse} 2s infinite ease-in-out`};

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  }
`;

const ChatWindow = styled.div<{ $isOpen: boolean }>`
  display: ${props => (props.$isOpen ? 'flex' : 'none')};
  flex-direction: column;
  width: 380px;
  height: 500px;
  background-color: ${props => props.theme.cardBackground};
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  position: absolute;
  bottom: 80px; /* Position above the icon */
  right: 0;
  overflow: hidden;
  border: 1px solid ${props => props.theme.border};
  animation: ${slideIn} 0.3s ease-out forwards;
`;

const ChatHeader = styled.div`
  background: linear-gradient(90deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  color: white;
  padding: 15px 20px;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  line-height: 1;
  transition: transform 0.2s ease;

  &:hover {
    transform: rotate(90deg);
  }
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  background-color: ${props => props.theme.background}; /* Slightly different bg for contrast */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: ${props => props.theme.colors.primary} ${props => props.theme.background}; /* Firefox */

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.background};
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.primary};
    border-radius: 4px;
    border: 2px solid ${props => props.theme.background};
  }
`;

const MessageBubble = styled.div<{ sender: 'user' | 'bot' }>`
  max-width: 80%;
  padding: 12px 18px;
  border-radius: 20px;
  font-size: 0.95rem;
  line-height: 1.4;
  word-wrap: break-word;
  animation: ${fadeIn} 0.3s ease-out;

  ${props =>
    props.sender === 'user' &&
    css`
      background: linear-gradient(90deg, ${props.theme.colors.primary}, ${props.theme.colors.secondary});
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 5px;
      margin-left: auto;
    `}

  ${props =>
    props.sender === 'bot' &&
    css`
      background-color: ${props.theme.cardBackground};
      color: ${props.theme.text};
      border: 1px solid ${props.theme.border};
      align-self: flex-start;
      border-bottom-left-radius: 5px;
      margin-right: auto;
    `}

    /* Style links specifically */
    a {
      color: ${props => props.sender === 'user' ? '#ffffff' : props.theme.colors.primary};
      text-decoration: underline;
      &:hover {
        opacity: 0.8;
      }
    }

    /* Style code blocks */
    pre, code {
      font-family: 'Roboto Mono', monospace;
      background-color: ${props => props.sender === 'user' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'};
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 0.85em;
    }
    pre {
      padding: 10px;
      overflow-x: auto;
      margin: 10px 0;
    }
`;

const InputArea = styled.form`
  display: flex;
  padding: 15px;
  border-top: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.cardBackground};
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 12px 15px;
  border-radius: 25px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 1rem;
  margin-right: 10px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 10px ${props => props.theme.colors.primary}30;
  }
`;

const SendButton = styled.button`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 18px;
  border-radius: 20px;
  background-color: ${props => props.theme.cardBackground};
  border: 1px solid ${props => props.theme.border};
  align-self: flex-start;
  margin-right: auto;
  border-bottom-left-radius: 5px;
  animation: ${fadeIn} 0.3s ease-out;

  span {
    height: 8px;
    width: 8px;
    margin: 0 2px;
    background-color: ${props => props.theme.text}90;
    border-radius: 50%;
    display: inline-block;
    animation: ${keyframes`
      0% { opacity: 0.3; transform: translateY(0px); }
      50% { opacity: 1; transform: translateY(-3px); }
      100% { opacity: 0.3; transform: translateY(0px); }
    `} 1.4s infinite ease-in-out both;
  }

  span:nth-child(2) { animation-delay: 0.2s; }
  span:nth-child(3) { animation-delay: 0.4s; }
`;


const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: "Hello! Ask me about this neural network visualizer or general deep learning concepts.", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]); // Scroll on new messages or loading state change

  const toggleChat = () => setIsOpen(!isOpen);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const userMessageText = inputValue.trim();
    if (!userMessageText) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessage(userMessageText);
      let botReplyText = "Sorry, I couldn't get a response. Please check the backend connection or API token."; // Default error
      if (response.success && response.reply) {
         botReplyText = response.reply;
      } else if (response.message) {
         botReplyText = `Error: ${response.message}`; // Show backend error message
      }

      const newBotMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botReplyText,
        sender: 'bot',
      };
      setMessages(prev => [...prev, newBotMessage]);

    } catch (error) {
       console.error("Error sending message:", error);
       const errorBotMessage: ChatMessage = {
         id: (Date.now() + 1).toString(),
         text: "An unexpected error occurred while contacting the chatbot.",
         sender: 'bot',
       };
       setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <WidgetContainer $isOpen={isOpen}>
      <ChatWindow $isOpen={isOpen}>
        <ChatHeader>
          AI Assistant
          <CloseButton onClick={toggleChat}>×</CloseButton>
        </ChatHeader>
        <MessageList>
          {messages.map((msg) => (
             // Use dangerouslySetInnerHTML carefully if you trust the source
             // or sanitize the HTML. For simple text, just render msg.text
             <MessageBubble key={msg.id} sender={msg.sender}>
               {/* Basic markdown-like link rendering */}
               {msg.text.split(/(\[.*?\]\(.*?\))/g).map((part, index) => {
                 const match = part.match(/\[(.*?)\]\((.*?)\)/);
                 if (match) {
                   return <a key={index} href={match[2]} target="_blank" rel="noopener noreferrer">{match[1]}</a>;
                 }
                 return part; // Render plain text parts
               })}
             </MessageBubble>
             // Simple version: <MessageBubble key={msg.id} sender={msg.sender}>{msg.text}</MessageBubble>
          ))}
          {isLoading && (
            <TypingIndicator>
              <span></span><span></span><span></span>
            </TypingIndicator>
          )}
          <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
        </MessageList>
        <InputArea onSubmit={handleSendMessage}>
          <ChatInput
            type="text"
            placeholder="Ask something..."
            value={inputValue}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <SendButton type="submit" disabled={isLoading || !inputValue.trim()} aria-label="Send Message">
            ➤
          </SendButton>
        </InputArea>
      </ChatWindow>
      <ChatIcon onClick={toggleChat} $isOpen={isOpen} aria-label={isOpen ? "Close Chat" : "Open Chat"}>
        {isOpen ? '✕' : '💬'}
      </ChatIcon>
    </WidgetContainer>
  );
};

export default ChatbotWidget;