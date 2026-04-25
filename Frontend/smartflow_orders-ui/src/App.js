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

  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const sendMessage = async () => {
    if (!input.trim() || isThinking) return;

    const userText = input.trim();
    const userMsg = { role: "user", text: userText, time: getTimestamp() };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch("http://localhost:5000/build-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          // KEY FIX: send current cart so backend keeps context on follow-ups
          // like "cheaper", "too expensive", "give me better ones"
          current_cart: bundle ? bundle.bundle : null,
        }),
      });

      const data = await res.json();

      if (data.cart && data.cart.length > 0) {
        setBundle({
          bundle: data.cart,
          total: data.total,
          status: data.status,
          reason: data.ai_explanation,
        });
      }
      // If cart is empty (not_found), keep the existing bundle visible
      // so the summary panel doesn't wipe to nothing

      const agentMsg = {
        role: "agent",
        text: data.ai_explanation || "No response from AI.",
        time: getTimestamp(),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "Connection error. Please check the backend is running.",
          time: getTimestamp(),
        },
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
          <div className="logo-mark">
            <img src="logo192.png" alt="SmartFlow Orders" />
          </div>
          <span className="title-main">SmartFlow Orders</span>
        </div>
        <div className="header-right">
          <button className="clear-btn" onClick={clearSession}>
            ↺ Clear
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="main">

        {/* LEFT — QUOTE SUMMARY */}
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
                    <div className="item-price">RM {item.price.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="summary-divider" />

              <div className="total-row">
                <span>Total</span>
                <span className="total-amount">RM {bundle.total.toLocaleString()}</span>
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
              <p>Describe your setup needs and I'll build you an optimized quote.</p>
              <div className="prompt-chips">
                {["Gaming PC build", "Home office setup", "Developer workstation", "Content creator setup"].map((p) => (
                  <button key={p} className="chip" onClick={() => setInput(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT — CHAT */}
        <section className="chat">
          <div className="chat-box" ref={chatBoxRef}>

            {messages.length === 0 && (
              <div className="chat-welcome">
                <img src="logo192.png" alt="SmartFlow" className="welcome-logo" />
                <h2>SmartFlow Orders AI Agent</h2>
                <p>Tell me what you need — I'll find the best bundle for your budget.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`message-wrap ${msg.role}`}>
                {msg.role === "agent" && (
                  <div className="avatar agent-avatar">SF</div>
                )}
                <div className="message-column">
                  <div className={`message ${msg.role}`}>
                    {msg.text.split("\n").map((line, j) => (
                      <span key={j}>
                        {line}
                        {j < msg.text.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                  <div className={`timestamp ${msg.role}`}>{msg.time}</div>
                </div>
                {msg.role === "user" && (
                  <div className="avatar user-avatar">You</div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="message-wrap agent">
                <div className="avatar agent-avatar">SF</div>
                <div className="message agent thinking-msg">
                  <span className="thinking-label">Thinking</span>
                  <span className="dots"></span>
                </div>
              </div>
            )}

          </div>
        </section>
      </div>

      {/* INPUT BAR */}
      <div className="input-bar">
        <div className="input-wrap">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your setup or say 'cheaper', 'upgrade', etc…"
            disabled={isThinking}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isThinking}
            className={isThinking ? "sending" : ""}
          >
            {isThinking ? "…" : "Send ↑"}
          </button>
        </div>
        <div className="input-hint">Enter to send · Shift+Enter for new line</div>
      </div>

    </div>
  );
}

export default App;