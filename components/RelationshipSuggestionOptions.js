'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

export default function RelationshipSuggestionOptions({ 
  suggestion, 
  user, 
  db, 
  partnerName = 'your partner',
  onClose,
  onTaskAdded
}) {
  const [adding, setAdding] = useState(null);

  const getOptionsForSuggestion = () => {
    const partner = partnerName || 'your partner';
    
    switch (suggestion.type) {
      case 'appreciation':
        return [
          { title: `Tell ${partner} one thing she&apos;s great at`, detail: 'Be specific and genuine' },
          { title: `Thank ${partner} for something she did today`, detail: 'Notice the small things' },
          { title: `Text ${partner} why you&apos;re grateful for her`, detail: 'Send during her busy day' },
          { title: `Compliment ${partner} on something non-physical`, detail: 'Her mind, heart, or skills' },
          { title: `Send ${partner} a photo that reminds you of her`, detail: 'Something meaningful' }
        ];
        
      case 'date':
        return [
          { title: 'Schedule a proper date night this weekend', detail: 'Plan something she&apos;d enjoy' },
          { title: 'Plan 30 minutes of phone-free time together', detail: 'Tonight after dinner' },
          { title: 'Suggest a walk together after dinner', detail: 'Just the two of you' },
          { title: 'Plan a weekend activity together', detail: 'Something fun and low-key' },
          { title: 'Set up a home date night', detail: 'Movie, takeout, no distractions' }
        ];
        
      case 'service':
        return [
          { title: 'Clean up after dinner without being asked', detail: 'Let her relax' },
          { title: 'Handle bedtime routine solo tonight', detail: 'Give her a break' },
          { title: 'Prep her morning coffee exactly how she likes it', detail: 'Small gesture, big impact' },
          { title: 'Take over a task from her mental list', detail: 'Ask what would help most' },
          { title: 'Do the dishes and wipe down counters', detail: 'Complete kitchen reset' }
        ];
        
      default:
        return [];
    }
  };

  const handleQuickAdd = async (option) => {
    if (!db || !user || adding === option.title) return;
    
    setAdding(option.title);
    
    try {
      const newTask = {
        title: option.title,
        detail: option.detail,
        category: 'relationship',
        priority: suggestion.urgency === 'high' ? 'high' : 'medium',
        userId: user.uid,
        createdAt: Timestamp.now(),
        source: 'relationship_suggestion',
        dismissed: false,
        deleted: false,
      };

      await addDoc(collection(db, 'tasks'), newTask);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 30, 10]);
      }
      
      if (onTaskAdded) onTaskAdded();
      onClose();
      
    } catch (error) {
      console.error('Error adding relationship task:', error);
    } finally {
      setAdding(null);
    }
  };

  const handleCustomAdd = () => {
    // Open the regular task form for custom entry
    if (onTaskAdded) {
      onTaskAdded({
        type: 'custom',
        category: 'relationship',
        title: suggestion.title,
        priority: suggestion.urgency === 'high' ? 'high' : 'medium'
      });
    }
    onClose();
  };

  const options = getOptionsForSuggestion();
  const getSuggestionTitle = () => {
    switch (suggestion.type) {
      case 'appreciation': return `💕 Show ${partnerName} Appreciation`;
      case 'date': return `❤️ Quality Time Ideas`;
      case 'service': return `🤲 Acts of Service`;
      default: return 'Relationship Tasks';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            {getSuggestionTitle()}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Choose a task to add, or create your own:
          </p>
          
          <div className="space-y-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleQuickAdd(option)}
                disabled={adding === option.title}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-pink-300 transition-colors disabled:opacity-50"
              >
                <div className="font-medium text-gray-800 mb-1">
                  {adding === option.title ? 'Adding...' : option.title}
                </div>
                <div className="text-sm text-gray-600">
                  {option.detail}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Add Option */}
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={handleCustomAdd}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors"
            >
              ✏️ Add custom relationship task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}