import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    const userMsg = { role: "user", text: input };
    setMessages([...messages, userMsg, { role: "ai", text: "Thinking..." }]);

    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();

    const aiMsg = {
      role: "ai",
      text: JSON.stringify(data, null, 2)
    };

    setMessages(prev => [...prev.slice(0, -1), aiMsg]);
    setInput("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>SmartFlow Orders</h2>

      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <b>{msg.role}:</b>
            <pre>{msg.text}</pre>
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;