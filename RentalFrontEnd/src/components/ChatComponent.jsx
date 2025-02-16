// ChatApp.js

import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000"); // Your backend server URL

const ChatApp = () => {
  const [chatId, setChatId] = useState("");
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    // Listen for incoming messages from the server
    socket.on("receiveMessage", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  const handleJoinChat = () => {
    if (chatId && userId) {
      socket.emit("joinChat", { chatId, userId });
      setIsJoined(true);
    }
  };

  const handleSendMessage = () => {
    // console
    if (message && chatId && userId) {
      const newMessage = { chatId, senderId: userId, message };
      socket.emit("sendMessage", newMessage);
      setMessage(""); // Clear input after sending
    }
  };

  return (
    <div>
      <h1>Chat App</h1>

      {!isJoined ? (
        <div>
          <div>
            <label>Chat ID:</label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
            />
          </div>
          <div>
            <label>User ID:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <button onClick={handleJoinChat}>Join Chat</button>
        </div>
      ) : (
        <div>
          <div style={{ height: "200px", overflowY: "scroll" }}>
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.senderId}</strong>: {msg.message}
              </div>
            ))}
          </div>

          <div>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
