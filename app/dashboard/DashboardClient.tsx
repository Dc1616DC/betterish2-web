'use client';

import { useState, useEffect } from 'react';
import { db, Task, User } from '@/lib/instantdb';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const CATEGORIES = [
  '👶 Dad & Kids',
  '🏠 Home & Maintenance',
  '❤️ Partner & Relationship',
  '💪 Personal Care',
  '💼 Work',
  '🏡 Household',
  '🎉 Events',
  '🏥 Health',
];

const PRIORITIES = ['low', 'medium', 'high'] as const;

export default function DashboardClient() {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: '💪 Personal Care',
    priority: 'medium' as typeof PRIORITIES[number],
  });

  const { showToast } = useToast();
  const router = useRouter();
  const { user } = db.useAuth();

  // Query user profile
  const { data: userData } = db.useQuery(
    user ? { users: { $: { where: { id: user.id } } } } : null
  );

  const userProfile = userData?.users?.[0];

  // Query tasks
  const { data: tasksData, isLoading: tasksLoading } = db.useQuery(
    user
      ? {
          tasks: {
            $: {
              where: {
                userId: user.id,
                completed: false,
              },
            },
          },
        }
      : null
  );

  const tasks = tasksData?.tasks || [];

  // Add task
  const handleAddTask = async (taskData: any) => {
    if (!user) return;

    try {
      const task = {
        id: uuidv4(),
        userId: user.id,
        title: taskData.title,
        description: taskData.description || '',
        category: taskData.category,
        priority: taskData.priority,
        completed: false,
        source: taskData.aiGenerated ? 'ai_mentor' : 'manual',
        aiGenerated: taskData.aiGenerated || false,
        aiContext: taskData.aiContext || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.transact([db.tx.tasks[task.id].update(task)]);

      showToast(`Task "${taskData.title}" added!`, 'success');
      setShowTaskForm(false);
      setNewTask({ title: '', description: '', category: '💪 Personal Care', priority: 'medium' });
    } catch (error) {
      console.error('Failed to add task:', error);
      showToast('Failed to add task', 'error');
    }
  };

  // Complete task
  const handleCompleteTask = async (taskId: string) => {
    try {
      await db.transact([
        db.tx.tasks[taskId].update({
          completed: true,
          completedAt: Date.now(),
          updatedAt: Date.now(),
        }),
      ]);

      showToast('Task completed!', 'success');
    } catch (error) {
      console.error('Failed to complete task:', error);
      showToast('Failed to complete task', 'error');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await db.transact([db.tx.tasks[taskId].delete()]);
      showToast('Task deleted', 'info');
    } catch (error) {
      console.error('Failed to delete task:', error);
      showToast('Failed to delete task', 'error');
    }
  };

  // Get AI suggestions
  const handleGetAISuggestions = async () => {
    setIsLoadingAI(true);
    setShowAISuggestions(true);

    try {
      const response = await fetch('/api/ai/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      setAiSuggestions(data.tasks);
    } catch (error: any) {
      console.error('AI suggestions error:', error);
      showToast(error.message || 'Failed to get AI suggestions', 'error');
      setShowAISuggestions(false);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Add AI suggestion as task
  const handleAddAISuggestion = async (suggestion: any) => {
    await handleAddTask({
      ...suggestion,
      aiGenerated: true,
      aiContext: { reasoning: suggestion.reasoning },
    });

    // Remove from suggestions
    setAiSuggestions((prev) => prev.filter((s) => s.title !== suggestion.title));
  };

  // Open chat for task
  const handleOpenChat = (task: Task) => {
    setSelectedTask(task);
    setChatMessages(task.chatHistory || []);
  };

  // Send chat message
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !selectedTask) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    // Add user message to UI
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];
    setChatMessages(newMessages);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: selectedTask,
          userProfile,
          userMessage,
          chatHistory: chatMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Add AI response to messages
      const updatedMessages = [...newMessages, { role: 'assistant' as const, content: data.message }];
      setChatMessages(updatedMessages);

      // Save chat history to task
      await db.transact([
        db.tx.tasks[selectedTask.id].update({
          chatHistory: updatedMessages,
          updatedAt: Date.now(),
        }),
      ]);
    } catch (error: any) {
      console.error('Chat error:', error);
      showToast(error.message || 'Failed to get AI response', 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await db.auth.signOut();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Hey {userProfile?.name || 'Dad'}!</h1>
              <p className="text-blue-100 text-sm mt-1">Let&apos;s keep things betterish today</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-100 hover:text-white underline"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowTaskForm(true)}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            + Add Task
          </button>
          <button
            onClick={handleGetAISuggestions}
            disabled={isLoadingAI}
            className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition"
          >
            {isLoadingAI ? 'Thinking...' : '🤖 Get AI Suggestions'}
          </button>
        </div>

        {/* AI Suggestions */}
        {showAISuggestions && aiSuggestions.length > 0 && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-4">AI Suggestions for You</h3>
            <div className="space-y-4">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                  <p className="text-xs text-purple-700 italic mb-3">{suggestion.reasoning}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddAISuggestion(suggestion)}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded hover:bg-purple-700 transition"
                    >
                      + Add This Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAISuggestions(false)}
              className="mt-4 text-sm text-purple-700 hover:text-purple-900 underline"
            >
              Close Suggestions
            </button>
          </div>
        )}

        {/* Tasks list */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Tasks ({tasks.length})</h2>

          {tasksLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">No tasks yet. Add one or get AI suggestions!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleCompleteTask(task.id)}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {task.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {task.priority}
                        </span>
                        {task.aiGenerated && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            AI
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenChat(task)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Get Help"
                      >
                        💬
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Add details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setNewTask({ ...newTask, priority })}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition ${
                        newTask.priority === priority
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowTaskForm(false);
                    setNewTask({ title: '', description: '', category: '💪 Personal Care', priority: 'medium' });
                  }}
                  className="flex-1 py-2 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddTask(newTask)}
                  disabled={!newTask.title.trim()}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Chat header */}
          <div className="bg-blue-600 text-white p-4 flex items-center gap-3">
            <button onClick={() => setSelectedTask(null)} className="text-2xl">
              ←
            </button>
            <div className="flex-1">
              <h2 className="font-semibold">{selectedTask.title}</h2>
              <p className="text-sm text-blue-100">Ask anything about this task</p>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No messages yet. Ask me anything!</p>
                <p className="text-sm mt-2">I know about your child&apos;s age and your situation.</p>
              </div>
            )}
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()}
                placeholder="Ask for help..."
                disabled={isChatLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleSendChatMessage}
                disabled={!chatInput.trim() || isChatLoading}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
