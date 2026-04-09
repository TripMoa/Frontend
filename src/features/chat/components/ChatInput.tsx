// components/mate/chat/ChatInput.tsx

import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export default function ChatInput({ onSend, placeholder = "메시지를 입력하세요..." }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
      <button
        type="submit"
        disabled={!message.trim()}
        className="px-6 py-3 bg-yellow-400 border-2 border-black rounded-lg font-bold hover:translate-y-[-2px] active:translate-y-[0px] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        style={{ boxShadow: "3px 3px 0 0 black" }}
      >
        전송
      </button>
    </form>
  );
}