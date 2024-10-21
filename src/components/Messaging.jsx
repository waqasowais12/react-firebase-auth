// src/components/Messaging.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, orderBy, where } from 'firebase/firestore';

const Messaging = ({ teamId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      const messagesCollection = collection(db, 'messages');
      const q = query(messagesCollection, where('teamId', '==', teamId), orderBy('timestamp'));
      onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
      });
    };

    fetchMessages();
  }, [teamId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (messageContent.trim() === '') return;

    try {
      await addDoc(collection(db, 'messages'), {
        teamId,
        senderId: currentUserId,
        content: messageContent,
        timestamp: new Date(),
      });
      setMessageContent('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <h4>Messages</h4>
      <div style={{ maxHeight: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}>
            <strong>{message.senderId}: </strong>{message.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Type a message..."
          required
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Messaging;
