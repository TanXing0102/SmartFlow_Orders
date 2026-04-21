import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [bundle, setBundle] = useState(null);
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = () => {
    if (!input) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    setIsThinking(true);

    setTimeout(() => {
      const agentMsg = {
        role: "agent",
        text: `🧠 Understanding...\n⚙️ Checking stock...\n🔄 Optimizing...`
      };

      const fakeBundle = {
        bundle: [
          { name: "Laptop", price: 3000 },
          { name: "Mouse", price: 50 }
        ],
        total: 3050,
        status: "Optimized",
        reason: "Adjusted for stock and budget"
      };

      setMessages((prev) => [...prev, agentMsg]);
      setBundle(fakeBundle);
      setIsThinking(false);

    }, 1500);

    setInput("");
  };

  return (
    <div className="app">

      {/* HEADER */}
      <div className="header">
        SmartFlow Orders
      </div>

      {/* MAIN LAYOUT */}
      <div className="main">

        {/* SUMMARY LEFT */}
        <div className="summary">
          <h3>🛒 Summary</h3>

          {bundle ? (
            <>
              {bundle.bundle.map((item, i) => (
                <div key={i} className="item">
                  {item.name} — RM{item.price}
                </div>
              ))}

              <hr />

              <p>Total: RM {bundle.total}</p>
              <p>Status: {bundle.status}</p>

              <div className="reason">
                <b>Reason:</b>
                <p>{bundle.reason}</p>
              </div>
            </>
          ) : (
            <p>No bundle yet</p>
          )}
        </div>

        {/* CHAT RIGHT */}
        <div className="chat">

          <div className="chat-box">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message ${msg.role}`}
              >
                {msg.text}
              </div>
            ))}

            {isThinking && (
              <div className="message agent">
                Thinking<span className="dots"></span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* FIXED INPUT */}
      <div className="input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your setup..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>

    </div>
  );
}

export default App;