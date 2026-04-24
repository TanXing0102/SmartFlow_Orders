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
      const systemPrompt = `You are SmartFlow's AI procurement agent. When a user describes their equipment or setup needs, you:
1. Acknowledge and reason through their request briefly (2-3 sentences, show your thinking process)
2. Return a JSON bundle at the END of your response in this exact format:
<bundle>
{
  "bundle": [{"name": "Item Name", "price": 0000}],
  "total": 0000,
  "status": "Optimized",
  "reason": "Brief explanation of choices"
}
</bundle>

Always use Malaysian Ringgit (RM) prices. Be concise and helpful. Show thinking steps like checking compatibility, budget optimization, stock availability.`;

      const conversationHistory = messages
        .concat(userMsg)
        .map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: conversationHistory,
        }),
      });

      const data = await response.json();
      const fullText = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      const bundleMatch = fullText.match(/<bundle>([\s\S]*?)<\/bundle>/);
      let parsedBundle = null;
      let displayText = fullText;

      if (bundleMatch) {
        try {
          parsedBundle = JSON.parse(bundleMatch[1].trim());
          displayText = fullText.replace(/<bundle>[\s\S]*?<\/bundle>/, "").trim();
          setBundle(parsedBundle);
        } catch (_) {}
      }

      setMessages((prev) => [
        ...prev,
        { role: "agent", text: displayText, time: getTimestamp() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Connection error. Please try again.", time: getTimestamp() },
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
    // Shift+Enter: do nothing — textarea handles it naturally
  };

  const clearSession = () => {
    setMessages([]);
    setBundle(null);
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
          <div className="header-title">
            <span className="title-main">SmartFlow Orders</span>
          </div>
        </div>
        <div className="header-right">
          <button className="clear-btn" onClick={clearSession} title="Clear session">
            ↺ Clear
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="main">
        {/* SUMMARY PANEL LEFT */}
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
                {["Gaming PC build", "Home office setup", "Developer workstation"].map((p) => (
                  <button key={p} className="chip" onClick={() => setInput(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* CHAT PANEL RIGHT */}
        <section className="chat">
          <div className="chat-box" ref={chatBoxRef}>
            {messages.length === 0 && (
              <div className="chat-welcome">
                <div className="welcome-mark">
                  <img src="logo192.png" alt="SmartFlow Orders" />
                </div>
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

      {/* FIXED INPUT BAR */}
      <div className="input-bar">
        <div className="input-wrap">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your setup or requirements…"
            disabled={isThinking}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={isThinking || !input.trim()}
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