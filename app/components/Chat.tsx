"use client";

import { useState, useRef, useEffect } from "react";
import { personas, Persona } from "@/app/lib/personas";
import { Send, User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  persona?: Persona;
  timestamp: Date;
  isStreaming?: boolean;
}

export default function Chat() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(personas[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [streamingMessageId, setStreamingMessageId] = useState<string>("");
  const [streamingContent, setStreamingContent] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Create a placeholder bot message for streaming
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      content: "",
      sender: "bot",
      persona: selectedPersona,
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, botMessage]);
    setStreamingMessageId(botMessageId);
    setStreamingContent(""); // Reset streaming content

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          personaId: selectedPersona.id,
          conversationId: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let finalResponse = "";
      let finalPersona = null;
      let finalConversationId = "";
      let buffer = ""; // Buffer for incomplete chunks

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk and add to buffer
          const chunk = new TextDecoder().decode(value);
          buffer += chunk;

          // Split by lines and process complete lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataContent = line.slice(6); // Remove 'data: ' prefix

              // Skip empty lines
              if (!dataContent.trim()) continue;

              try {
                const data = JSON.parse(dataContent);
                console.log("Received SSE data:", data);

                if (data.type === "step") {
                  // Handle step updates (optional - for debugging)
                  console.log("Step:", data.step, data.content);
                } else if (data.type === "complete") {
                  // Final response received
                  finalResponse = data.response;
                  finalPersona = data.persona;
                  finalConversationId = data.conversationId;

                  console.log("Final response received:", finalResponse);

                  // Update conversation ID
                  if (data.conversationId) {
                    setConversationId(data.conversationId);
                  }

                  // Simulate typing effect for the final content
                  await simulateTypingEffect(botMessageId, finalResponse);

                  // Mark message as complete and add final content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMessageId
                        ? { ...msg, content: finalResponse, isStreaming: false }
                        : msg
                    )
                  );

                  // Clear streaming content
                  setStreamingContent("");

                  break;
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.warn(
                  "Failed to parse SSE data:",
                  dataContent,
                  parseError
                );
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }

        // Process any remaining buffer content
        if (buffer.trim()) {
          console.log("Processing remaining buffer:", buffer);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
        persona: selectedPersona,
        timestamp: new Date(),
        isStreaming: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingMessageId("");
      setStreamingContent("");
    }
  };

  // Simulate typing effect with better performance
  const simulateTypingEffect = async (
    messageId: string,
    finalContent: string
  ) => {
    const words = finalContent.split(" ");
    let currentContent = "";

    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? " " : "") + words[i];

      // Update streaming content instead of messages array
      setStreamingContent(currentContent);

      // Faster typing speed - reduced delay between words
      const delay = Math.random() * 30 + 10; // 10-40ms (much faster!)
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId("");
    setStreamingMessageId("");
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Header */}
      <div className="glass-strong border-b border-slate-700/50 p-6 shadow-glow relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-2 tracking-tight">
            PersonaAI
          </h1>
          <p className="text-slate-300 text-lg font-medium">
            Chat with programming experts in their unique style
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-3 rounded-full"></div>
        </div>
      </div>

      {/* Persona Selection */}
      <div className="glass border-b border-slate-700/50 p-4 shadow-glow relative z-10">
        <div className="flex items-center justify-between">
          {/* Persona Tabs */}
          <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1 border border-slate-600/50">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => {
                  setSelectedPersona(persona);
                  clearConversation();
                }}
                className={`persona-tab tab-transition px-4 py-2 rounded-md text-sm font-medium ${
                  selectedPersona.id === persona.id
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-glow-indigo active-tab-indicator'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    selectedPersona.id === persona.id ? 'bg-white scale-110' : 'bg-slate-500'
                  }`}></div>
                  <span className="font-semibold">{persona.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="compact-card flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white rounded-md transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm font-medium">Clear</span>
            </button>
          )}
        </div>

      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent relative z-10">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-20 message-enter">
            <div className="text-8xl mb-6 float">👋</div>
            <h3 className="text-3xl font-bold mb-4 gradient-text">
              Welcome to PersonaAI!
            </h3>
            <p className="text-slate-300 text-lg mb-6 max-w-2xl mx-auto">
              Ask {selectedPersona.name} any programming question and get
              answers in their unique style.
            </p>
            <div className="glass p-6 rounded-2xl max-w-2xl mx-auto border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-3">
                💡 <strong className="gradient-text-gold">Pro Tip:</strong> You can ask about previous questions
                or responses using phrases like &quot;last question&quot;,
                &quot;what did you say earlier&quot;, etc.
              </div>
              <div className="text-sm text-slate-500">
                ✨ <strong className="gradient-text-gold">New:</strong> Watch responses appear with a realistic
                typing effect!
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            } message-enter items-end gap-3`}
            style={{ animationDelay: `${index * 50}ms` }}
            data-message-id={message.id}
          >
            {/* Bot Icon - Outside message bubble */}
            {message.sender === "bot" && message.persona && (
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center border-2 border-indigo-300/50 shadow-glow-indigo">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`max-w-4xl rounded-2xl p-4 transition-all duration-300 hover:shadow-glow-indigo-strong relative ${
                message.sender === "user"
                  ? "bg-gradient-to-r from-indigo-300 to-indigo-400 text-indigo-900 border border-indigo-200/50 shadow-glow-indigo"
                  : "glass text-slate-100 border border-slate-700/50 shadow-glow"
              }`}
            >
              <div className="flex-1 min-w-0">
                {message.sender === "bot" && message.persona && (
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-bold text-lg gradient-text">
                      {message.persona.name}
                    </span>
                    <span className="text-sm text-slate-400 font-medium px-3 py-1 bg-slate-800/50 rounded-full border border-slate-600/50">
                      {message.persona.title}
                    </span>
                    {message.isStreaming && (
                      <span className="text-xs text-blue-400 animate-pulse px-2 py-1 bg-blue-900/30 rounded-full border border-blue-700/50">
                        ✨ typing...
                      </span>
                    )}
                  </div>
                )}
                {message.sender === "user" ? (
                  <div className="whitespace-pre-wrap text-lg leading-relaxed">{message.content}</div>
                ) : (
                  <div className="prose prose-lg max-w-none prose-invert">
                    {message.isStreaming &&
                    streamingMessageId === message.id ? (
                      // Show streaming content with typing effect
                      <ReactMarkdown
                        components={{
                          // Custom code block styling
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <div className="my-4">
                                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-300 rounded-t-xl px-4 py-3 text-sm font-mono border border-slate-700/50 shadow-glow">
                                  <span className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="ml-2">{match[1]}</span>
                                  </span>
                                </div>
                                <pre className="bg-gradient-to-br from-slate-950 to-slate-900 text-slate-200 p-6 rounded-b-xl overflow-x-auto border border-slate-700/50 shadow-glow">
                                  <code className="text-sm leading-relaxed" {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            ) : (
                              <code
                                className="bg-slate-800/80 px-2 py-1 rounded-md text-sm border border-slate-600/50 font-medium"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          // Custom heading styling
                          h1: ({ children }) => (
                            <h1 className="text-3xl font-bold mt-6 mb-4 gradient-text">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-2xl font-bold mt-5 mb-3 text-slate-100">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xl font-bold mt-5 mb-2 text-slate-200">
                              {children}
                            </h3>
                          ),
                          // Custom paragraph styling
                          p: ({ children }) => (
                            <p className="mb-3 text-slate-200 leading-relaxed text-lg">{children}</p>
                          ),
                          // Custom list styling
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-3 space-y-2 text-slate-200">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-3 space-y-2 text-slate-200">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-slate-300 leading-relaxed">{children}</li>
                          ),
                          // Custom strong and emphasis styling
                          strong: ({ children }) => (
                            <strong className="font-bold text-white">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-slate-300">{children}</em>
                          ),
                        }}
                      >
                        {streamingContent}
                      </ReactMarkdown>
                    ) : message.content ? (
                      // Show completed message content
                      <ReactMarkdown
                        components={{
                          // Custom code block styling
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <div className="my-4">
                                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-300 rounded-t-xl px-4 py-3 text-sm font-mono border border-slate-700/50 shadow-glow">
                                  <span className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="ml-2">{match[1]}</span>
                                  </span>
                                </div>
                                <pre className="bg-gradient-to-br from-slate-950 to-slate-900 text-slate-200 p-6 rounded-b-xl overflow-x-auto border border-slate-700/50 shadow-glow">
                                  <code className="text-sm leading-relaxed" {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            ) : (
                              <code
                                className="bg-slate-800/80 px-2 py-1 rounded-md text-sm border border-slate-600/50 font-medium"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          // Custom heading styling
                          h1: ({ children }) => (
                            <h1 className="text-3xl font-bold mt-6 mb-4 gradient-text">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-2xl font-bold mt-5 mb-3 text-slate-100">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xl font-bold mt-5 mb-2 text-slate-200">
                              {children}
                            </h3>
                          ),
                          // Custom paragraph styling
                          p: ({ children }) => (
                            <p className="mb-3 text-slate-200 leading-relaxed text-lg">{children}</p>
                          ),
                          // Custom list styling
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-3 space-y-2 text-slate-200">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-3 space-y-2 text-slate-200">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-slate-300 leading-relaxed">{children}</li>
                          ),
                          // Custom strong and emphasis styling
                          strong: ({ children }) => (
                            <strong className="font-bold text-white">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-slate-300">{children}</em>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="flex items-center gap-3 text-slate-400 py-4">
                        <div className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <span className="ml-2 text-slate-500">Thinking...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp - Inside message bubble, bottom right */}
                <div className={`message-timestamp ${
                  message.sender === "user" ? "user-timestamp" : "bot-timestamp"
                }`}>
                  {message.timestamp.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* User Icon - Outside message bubble */}
            {message.sender === "user" && (
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center border-2 border-indigo-300/50 shadow-glow-indigo">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
  
        {isLoading && !streamingMessageId && (
          <div className="flex justify-start message-enter">
            <div className="glass rounded-2xl p-6 shadow-glow border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-full flex items-center justify-center border-2 border-blue-600/50 shadow-glow">
                  <Bot className="w-6 h-6 text-blue-300" />
                </div>
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <span className="text-slate-300 text-lg font-medium">
                    {selectedPersona.name} is thinking...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
  
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass-strong border-t border-slate-700/50 p-6 shadow-glow relative z-10">
        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <textarea
              name="inputMessage"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Ask ${selectedPersona.name} a programming question... (You can also ask about previous questions/responses)`}
              className="w-full resize-none border border-slate-600/50 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-slate-200 bg-slate-800/80 placeholder-slate-400 text-lg leading-relaxed shadow-glow transition-all duration-300 backdrop-blur-sm"
              rows={2}
              disabled={isLoading}
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-500">
              Press Enter to send
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="btn-cool px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 border border-blue-500/50 shadow-glow-strong transform hover:scale-105 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
            <span className="font-semibold">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
