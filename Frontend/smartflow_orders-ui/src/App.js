import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [bundle, setBundle] = useState(null);
  const [isThinking, setIsThinking] = useState(false);

  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const sendMessage = async () => {
    if (!input.trim() || isThinking) return;

    const userText = input.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText }
    ]);

    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch("http://localhost:5000/build-cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: userText
        })
      });

      const data = await res.json();

      // update bundle panel
      if (data.cart) {
        setBundle({
          bundle: data.cart,
          total: data.total,
          status: data.status,
          reason: data.ai_explanation
        });
      }

      // show AI message in chat
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: data.ai_explanation || "No response from AI"
        }
      ]);

    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "⚠️ Connection error. Please check backend."
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearSession = () => {
    setMessages([]);
    setBundle(null);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div className="logo-mark">SF</div>
          <div className="header-title">
            <span className="title-main">SmartFlow</span>
            <span className="title-sub">Orders</span>
          </div>
        </div>

        <div className="header-right">
          <div className="status-pill">
            <span className="status-dot"></span>
            AI Online
          </div>

          <button className="clear-btn" onClick={clearSession}>
            ↺ Clear
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="main">

        {/* LEFT SUMMARY */}
        <aside className="summary">
          <div className="summary-header">
            <span className="panel-label">QUOTE SUMMARY</span>
          </div>

          {bundle ? (
            <div className="bundle-content">

              <div className="items-list">
                {bundle.bundle.map((item, i) => (
                  <div key={i} className="item-row">
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">
                      RM {item.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-divider" />

              <div className="total-row">
                <span>Total</span>
                <span className="total-amount">
                  RM {bundle.total.toLocaleString()}
                </span>
              </div>

              <div className="status-badge">
                <span className="badge-dot"></span>
                {bundle.status}
              </div>

              <div className="reason-card">
                <div className="reason-label">AGENT NOTE</div>
                <p className="reason-text">{bundle.reason}</p>
              </div>

            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>Describe your setup and I’ll build a bundle.</p>
            </div>
          )}
        </aside>

        {/* CHAT */}
        <section className="chat">
          <div className="chat-box" ref={chatBoxRef}>

            {messages.length === 0 && (
              <div className="chat-welcome">
                <div className="welcome-icon">🤖</div>
                <h2>SmartFlow AI Agent</h2>
                <p>Tell me what you need.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`message-wrap ${msg.role}`}>
                <div className={`message ${msg.role}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="message-wrap agent">
                <div className="message agent">
                  Thinking...
                </div>
              </div>
            )}

          </div>
        </section>
      </div>

      {/* INPUT */}
      <div className="input-bar">
        <div className="input-wrap">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your setup..."
            disabled={isThinking}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || isThinking}
          >
            Send
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;