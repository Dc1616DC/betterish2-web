'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { canUseChat, incrementChatUsage } from '@/lib/subscription';

export default function SidekickChat({ task, isVisible, onClose, userTier = 'free', onUpgradeRequest }) {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState({ allowed: true, remaining: 'unlimited' });
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with task context when visible
  useEffect(() => {
    if (isVisible && task && messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: `Hey! I see you're working on "${task.title}". What can I help you figure out? I've got practical advice, product recommendations, and can point you to good tutorials.`
      };
      setMessages([welcomeMessage]);
    }
  }, [isVisible, task, messages.length]);

  // Check usage limits when component becomes visible
  useEffect(() => {
    if (isVisible && user) {
      checkUsageLimits();
    }
  }, [isVisible, user, userTier]);

  const checkUsageLimits = async () => {
    if (!user) return;
    
    try {
      const usage = await canUseChat(user.uid, userTier);
      setUsageInfo(usage);
    } catch (error) {
      console.error('Error checking usage limits:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !usageInfo.allowed) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('🚀 Sending chat request to /api/sidekick-chat');
      console.log('Request body:', {
        task: {
          id: task.id,
          title: task.title,
          detail: task.detail,
          category: task.category
        },
        message: inputMessage,
        userProfile: {
          id: user?.uid,
          tier: userTier
        }
      });
      
      const response = await fetch('/api/sidekick-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: {
            id: task.id,
            title: task.title,
            detail: task.detail,
            category: task.category
          },
          message: inputMessage,
          conversationHistory: messages,
          userProfile: {
            id: user?.uid,
            tier: userTier
          }
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.debugInfo) {
        console.error('🔍 Debug info:', data.debugInfo);
      }
      
      if (data.success) {
        const assistantMessage = { role: 'assistant', content: data.response };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Increment usage and refresh limits
        await incrementChatUsage(user.uid);
        await checkUsageLimits();
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: "Sorry dad, I'm having technical difficulties. Try the basic approach: break it into smaller steps, check YouTube for tutorials, or ask at the hardware store. You've got this!" 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-4 z-50 md:items-center">
      <div className="bg-white rounded-t-xl md:rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-blue-50 rounded-t-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Dad Sidekick</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-blue-600">
            💡 {task.title} - {task.detail}
          </div>
          {userTier === 'free' && (
            <div className="text-xs text-orange-600 mt-1">
              {usageInfo.remaining} free chats remaining this month
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg rounded-bl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          {!usageInfo.allowed ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                You've used your {usageInfo.limit} free chats this month
              </p>
              <button 
                onClick={() => onUpgradeRequest && onUpgradeRequest()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Upgrade to Pro - $9.99/month
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about this task..."
                className="flex-1 resize-none border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}