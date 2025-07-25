"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Copy, ThumbsUp, ThumbsDown, Mic, MessageCircle, Palette, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Create a new file 'react-syntax-highlighter.d.ts' in the project root:
declare module 'react-syntax-highlighter';
declare module 'react-syntax-highlighter/dist/esm/styles/prism';

// TypeScript: Add missing types for SpeechRecognition API
// These types are not always present in the DOM lib, so we define them here

type SpeechRecognitionResultList = {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
};

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

// Minimal interface for SpeechRecognition instance
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: unknown;
    webkitSpeechRecognition: unknown;
  }
}

function Button({ children, className = '', ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) {
  return <button className={`transition-colors ${className}`} {...props}>{children}</button>
}

function Avatar({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`rounded-full flex items-center justify-center bg-[#2563eb] ${className}`}>{children}</div>
}
function AvatarFallback({ className = '', children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`bg-[#2563eb] text-white ${className}`}>{children}</div>
}

// Update Message interface to support images
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  files?: File[];
  images?: { page: number; index: number; ext: string; base64: string }[];
}

// Utility to split message into text and code blocks
function parseMessage(message: string) {
  const regex = /```([a-z]*)\n([\s\S]*?)```/g;
  const parts: Array<{ type: 'code' | 'text'; content: string; lang?: string }> = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: message.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[2], lang: match[1] || 'text' });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < message.length) {
    parts.push({ type: 'text', content: message.slice(lastIndex) });
  }
  return parts;
}

// Add the CodeBlockWithCopy component
function CodeBlockWithCopy({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const bg = '#232323';
  return (
    <div className="relative my-4 rounded-lg overflow-x-auto border border-[#232323]" style={{ background: bg }}>
      <button
        className="absolute top-2 right-2 p-1 text-xs text-gray-400 hover:text-white bg-transparent"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        title="Copy"
      >
        {copied ? 'Copied!' : <Copy className="w-4 h-4" />}
      </button>
      <SyntaxHighlighter language={lang} style={oneDark} customStyle={{ background: bg, fontSize: '1em', margin: 0, padding: '1em' }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Utility to render structured bot messages with headings and lists
function renderStructuredMessage(message: string) {
  // Split into code and text parts
  const parts = parseMessage(message);
  return parts.map((part, i) => {
    if (part.type === 'code') {
      return <CodeBlockWithCopy key={i} code={part.content} lang={part.lang} />;
    }
    // For text, parse for headings and lists, and remove all asterisks and hashes
    const lines = part.content.replace(/[\*#]/g, '').split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let list: string[] = [];
    let ordered = false;
    lines.forEach((line, idx) => {
      const h1 = /^#\s+(.+)/.exec(line);
      const h2 = /^##\s+(.+)/.exec(line);
      const h3 = /^###\s+(.+)/.exec(line);
      const ol = /^\s*\d+\.\s+(.+)/.exec(line);
      const ul = /^\s*[-•]\s+(.+)/.exec(line);
      if (h1) {
        if (list.length) {
          elements.push(ordered ? <ol key={idx+'ol'} className="list-decimal ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ol> : <ul key={idx+'ul'} className="list-disc ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ul>);
          list = [];
        }
        elements.push(<h1 key={idx+'h1'} className="text-2xl font-bold my-2">{h1[1]}</h1>);
      } else if (h2) {
        if (list.length) {
          elements.push(ordered ? <ol key={idx+'ol'} className="list-decimal ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ol> : <ul key={idx+'ul'} className="list-disc ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ul>);
          list = [];
        }
        elements.push(<h2 key={idx+'h2'} className="text-xl font-semibold my-2">{h2[1]}</h2>);
      } else if (h3) {
        if (list.length) {
          elements.push(ordered ? <ol key={idx+'ol'} className="list-decimal ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ol> : <ul key={idx+'ul'} className="list-disc ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ul>);
          list = [];
        }
        elements.push(<h3 key={idx+'h3'} className="text-lg font-semibold my-2">{h3[1]}</h3>);
      } else if (ol) {
        if (!ordered && list.length) {
          elements.push(<ul key={idx+'ul'} className="list-disc ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ul>);
          list = [];
        }
        ordered = true;
        list.push(ol[1]);
      } else if (ul) {
        if (ordered && list.length) {
          elements.push(<ol key={idx+'ol'} className="list-decimal ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ol>);
          list = [];
        }
        ordered = false;
        list.push(ul[1]);
      } else if (line.trim() === '') {
        if (list.length) {
          elements.push(ordered ? <ol key={idx+'ol'} className="list-decimal ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ol> : <ul key={idx+'ul'} className="list-disc ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ul>);
          list = [];
        }
        elements.push(<div key={idx+'br'} className="h-2" />);
      } else {
        if (list.length) {
          elements.push(ordered ? <ol key={idx+'ol'} className="list-decimal ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ol> : <ul key={idx+'ul'} className="list-disc ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ul>);
          list = [];
        }
        elements.push(<span key={idx+'txt'}>{line}</span>);
      }
    });
    if (list.length) {
      elements.push(ordered ? <ol key={'finalol'} className="list-decimal ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ol> : <ul key={'finalul'} className="list-disc ml-6 mb-2">{list.map((item, j) => <li key={j}>{item}</li>)}</ul>);
    }
    return elements;
  });
}

const FEATURE_CARDS = [
  {
    icon: <MessageCircle className="w-6 h-6 text-[#3b82f6]" />, title: 'Generate Social Media Posts',
    desc: 'Enter your command to instantly create engaging content.',
    prompt: 'Generate a social media post about AI in education.'
  },
  {
    icon: <Palette className="w-6 h-6 text-[#22d3ee]" />, title: 'UI/UX Copy and Design',
    desc: 'Provide your design goals, and IRIS will draft precise copy suggestions.',
    prompt: 'Suggest UI/UX copy for a finance dashboard.'
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-[#a3e635]" />, title: 'Marketing Strategy Creation',
    desc: 'Input your brief, and let the AI craft powerful marketing content.',
    prompt: 'Create a marketing strategy for a new SaaS product.'
  },
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [listening, setListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // For paste event

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Clipboard paste support for images
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              // Prevent duplicates by name+size
              setUploadedFiles(prev => {
                if (prev.some(f => f.name === file.name && f.size === file.size)) return prev;
                return [...prev, file];
              });
            }
          }
        }
      }
    };
    // Use a wrapper to ensure correct type
    const pasteListener = (e: Event) => handlePaste(e as ClipboardEvent);
    textarea.addEventListener('paste', pasteListener);
    return () => textarea.removeEventListener('paste', pasteListener);
  }, []);

  // 1. Update allowedExtensions to include images
  const allowedExtensions = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files)
        .filter(file => allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext)));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeUploadedFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : [],
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("message", inputValue);
      uploadedFiles.forEach((file) => formData.append("files", file));
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      // Use the streaming endpoint
      const res = await fetch(`${apiUrl}/chat-stream`, {
        method: "POST",
        body: formData,
      });
      // Try to parse images from the /chat endpoint if available
      let images: { page: number; index: number; ext: string; base64: string }[] = [];
      let responseText = "";
      if (res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        responseText = data.response;
        images = data.images || [];
      } else if (res.body) {
        // Fallback for streaming text
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let botMessage = "";
        let done = false;
        // Add a placeholder bot message
        const botMsgId = Date.now().toString() + Math.random();
        setMessages(prev => [
          ...prev,
          {
            id: botMsgId,
            content: "",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value);
            botMessage += chunk;
            setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: botMessage } : m));
          }
        }
        setUploadedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setLoading(false);
        return;
      }
      // Add bot message with images if present
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + Math.random(),
          content: responseText,
          isUser: false,
          timestamp: new Date(),
          images,
        },
      ]);
      setUploadedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + Math.random(),
          content: "Failed to get response. Please try again.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show feature cards if no messages and input is empty
  const showFeatureCards = messages.length === 0 && !inputValue.trim();

  return (
    <div className="w-full h-full flex flex-col bg-[hsl(220,13%,13%)] dark:bg-[#09090b]">
      <div className="flex flex-col w-full h-full max-w-4xl mx-auto bg-[hsl(220,13%,13%)] dark:bg-[#09090b]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 sm:gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!message.isUser && (
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 bg-[#2563eb] dark:bg-[#2563eb] flex-shrink-0">
                  <AvatarFallback className="bg-[#2563eb] dark:bg-[#2563eb] text-white text-xs sm:text-sm font-medium">
                    A
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 bg-[#18171c] text-white`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.isUser ? message.content : renderStructuredMessage(message.content)}
                </div>
                {/* Display attached files */}
                {message.files && message.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.files.map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center gap-2 p-2 bg-[#18171c] text-white rounded-lg border border-[#232323] max-w-xs sm:max-w-sm w-full overflow-x-auto"
                      >
                        <FileText className="w-4 h-4 text-[#2563eb] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Display images returned from the backend */}
                {message.images && message.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={`data:image/${img.ext};base64,${img.base64}`}
                        alt={`PDF image page ${img.page} #${img.index}`}
                        className="max-w-xs max-h-48 rounded border border-gray-700"
                        style={{ background: '#232323' }}
                      />
                    ))}
                  </div>
                )}
                {/* Add a copy/like/dislike row below each bot message */}
                {!message.isUser && (
                  <div className="flex justify-end mt-2 mr-2">
                    <div className="flex gap-2">
                      <button
                        className="p-1 rounded transition-colors"
                        title="Copy"
                        onClick={() => navigator.clipboard.writeText(message.content || '')}
                      >
                        <Copy className="w-4 h-4 text-[#888] hover:text-[#fff]" />
                      </button>
                      <button
                        className="p-1 rounded transition-colors"
                        title="Like"
                      >
                        <ThumbsUp className="w-4 h-4 text-[#888] hover:text-[#fff]" />
                      </button>
                      <button
                        className="p-1 rounded transition-colors"
                        title="Dislike"
                      >
                        <ThumbsDown className="w-4 h-4 text-[#888] hover:text-[#fff]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {message.isUser && (
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 bg-[#2563eb] dark:bg-[#2563eb] flex-shrink-0">
                  <AvatarFallback className="bg-[#2563eb] dark:bg-[#2563eb] text-white text-xs sm:text-sm font-medium">
                    U
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {/* Simple loading indicator */}
          {loading && (
            <div className="flex gap-2 sm:gap-3 justify-start mt-2">
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 bg-[#2563eb] dark:bg-[#2563eb] flex-shrink-0">
                <AvatarFallback className="bg-[#2563eb] dark:bg-[#2563eb] text-white text-xs sm:text-sm font-medium">
                  A
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 bg-[#18171c] text-white">
                <span className="inline-block animate-pulse">Thinking<span className="inline-block w-2">.</span><span className="inline-block w-2">.</span><span className="inline-block w-2">.</span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Feature cards above input */}
        {showFeatureCards && (
          <>
            <div className="w-full flex flex-col items-center justify-center mt-6 mb-6 px-2 sm:px-0">
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="rounded-full p-3 shadow-lg flex items-center justify-center">
                  <Image src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80" alt="IRIS Logo" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                </div>
                <div className="text-[#b3b3b3] text-base font-medium mt-2">Hi, IRIS User!</div>
              </div>
              <h2 className="text-2xl xs:text-3xl sm:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500  font-extrabold text-center mb-2 leading-tight" style={{lineHeight:'1.1'}}>How can we help you today?</h2>
              <p className="text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500  max-w-xs sm:max-w-xl mb-6 text-sm sm:text-base">Let&apos;s get started! In a few simple steps, we&apos;ll show you how to use IRIS to unlock your productivity.</p>
            </div>
            <div className="w-full justify-center mb-6 px-2 sm:px-0 hidden sm:flex">
              <div className="grid sm:grid-cols-3 gap-4 w-full max-w-3xl">
                {FEATURE_CARDS.map(card => (
                  <button
                    key={card.title}
                    className="pointer-events-auto bg-[#18171c] border border-[#232323] rounded-2xl p-4 sm:p-5 flex flex-col items-start gap-3 shadow hover:border-[#22d3ee] transition-all text-left w-full min-w-0"
                    onClick={() => setInputValue(card.prompt)}
                  >
                    <div>{card.icon}</div>
                    <div className="text-lg font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500">{card.title}</div>
                    <div className="text-[#b3b3b3] text-sm">{card.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Add a persistent file preview area above the input field */}
        {uploadedFiles.length > 0 && (
          <div className="w-full px-3 sm:px-4 pt-2 pb-1 border-b border-[hsl(220,13%,23%)] dark:border-[hsl(217.2,32.6%,17.5%)] bg-[hsl(220,13%,15%)] dark:bg-[#09090b]">
            <div className="text-xs text-[hsl(220,9%,46%)] dark:text-[hsl(215,20.2%,65.1%)] mb-2">Uploaded files (used for all questions):</div>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file) => {
                const isImage = file.type.startsWith('image/');
                return (
                  <div
                    key={file.name}
                    className="flex items-center gap-2 p-2 bg-[#18171c] text-white rounded-lg border border-[#232323] max-w-xs sm:max-w-sm w-full overflow-x-auto"
                  >
                    {isImage ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-8 h-8 object-cover rounded border border-gray-700 flex-shrink-0"
                        style={{ background: '#232323' }}
                        onLoad={e => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                      />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                    <Button
                      onClick={() => removeUploadedFile(file.name)}
                      className="w-5 h-5 sm:w-6 sm:h-6 p-0 text-[hsl(220,9%,46%)] dark:text-[hsl(215,20.2%,65.1%)] hover:text-[hsl(0,0%,95%)] dark:hover:text-[hsl(210,40%,98%)] flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 sm:p-4 border-t border-[hsl(220,13%,23%)] dark:border-[hsl(217.2,32.6%,17.5%)] bg-[hsl(220,13%,13%)] dark:bg-[#09090b] sticky bottom-0 z-10">
          <div className="relative">
            <div className="flex items-center gap-2 bg-[hsl(220,13%,16%)] dark:bg-[#18171c] rounded-2xl p-2 sm:p-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.bmp,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* In the input area, use flex-col: textarea on top, icons below */}
              <div className="flex flex-col gap-2 w-full">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="What's on your mind?"
                  className="flex-1 border-none focus:border-none focus:outline-none bg-transparent focus:bg-transparent resize-none text-[hsl(0,0%,95%)] dark:text-[hsl(210,40%,98%)] placeholder:text-[hsl(220,9%,46%)] dark:placeholder:text-[hsl(215,20.2%,65.1%)] focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base disabled:opacity-60 disabled:pointer-events-none min-h-[2.5rem] sm:min-h-[3.5rem] max-h-32 pt-2 pb-1"
                  disabled={loading}
                  rows={1}
                />
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center text-[hsl(220,9%,46%)] hover:text-white rounded-full"
                    >
                      <Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        // Voice recognition code remains the same...
                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                        if (!SpeechRecognition) {
                          alert("Voice recognition not supported in this browser.");
                          return;
                        }
                        const recognition = new (SpeechRecognition as { new(): ISpeechRecognition })();
                        recognition.lang = "en-US";
                        recognition.interimResults = true;
                        recognition.maxAlternatives = 1;

                        recognition.onstart = () => setListening(true);
                        recognition.onend = () => setListening(false);
                        recognition.onerror = () => setListening(false);

                        recognition.onresult = (event: SpeechRecognitionEvent) => {
                          const transcript = Array.from(event.results)
                            .map((result) => (result as SpeechRecognitionResult)[0].transcript)
                            .join('');
                          if (event.results[0].isFinal) {
                            setInputValue(transcript);
                          }
                        };

                        recognition.start();
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center rounded-full ${listening ? 'bg-blue-700 text-white' : 'text-[hsl(220,9%,46%)] hover:text-white'}`}
                      aria-label="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() && uploadedFiles.length === 0 || loading}
                    className="w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center bg-[#2563eb] hover:bg-[#3b82f6] text-white disabled:opacity-50 disabled:pointer-events-none rounded-full flex-shrink-0"
                  >
                    <Send className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;