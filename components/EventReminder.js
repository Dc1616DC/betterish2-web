'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarIcon, GiftIcon, CakeIcon, HeartIcon, PlusIcon } from '@heroicons/react/24/outline';
import { collection, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import PersonalEventsSetup from './PersonalEventsSetup';

const EVENT_TYPES = {
  birthday: { icon: CakeIcon, color: 'bg-pink-100 text-pink-800', emoji: '🎂' },
  anniversary: { icon: HeartIcon, color: 'bg-red-100 text-red-800', emoji: '💕' },
  holiday: { icon: GiftIcon, color: 'bg-green-100 text-green-800', emoji: '🎄' },
  appointment: { icon: CalendarIcon, color: 'bg-blue-100 text-blue-800', emoji: '📅' },
  school_event: { icon: CalendarIcon, color: 'bg-yellow-100 text-yellow-800', emoji: '🎓' }
};

const PLANNING_REMINDERS = [
  // Planning suggestions instead of fake events
  { type: 'birthday', name: 'Birthday planning', description: 'Plan upcoming family birthdays', urgency: 'medium' },
  { type: 'holiday', name: 'Holiday preparation', description: 'Get ahead on holiday planning', urgency: 'medium' },
  { type: 'appointment', name: 'Health appointments', description: 'Schedule routine checkups', urgency: 'high' },
  { type: 'school_event', name: 'School events', description: 'Check school calendar and activities', urgency: 'low' },
];

function getEventTasksForReal(event) {
  const tasks = [];
  const daysLeft = event.daysUntil || 30;
  
  switch (event.type) {
    case 'birthday':
      if (daysLeft <= 14) {
        tasks.push(
          { title: `Buy gift for ${event.name}`, detail: 'Think about what they would love', category: 'events', priority: 'high' },
          { title: `Plan ${event.name} celebration`, detail: 'Cake, dinner, party?', category: 'events', priority: 'high' }
        );
      } else {
        tasks.push(
          { title: `Start thinking about ${event.name} gift`, detail: 'Make a list of ideas', category: 'events', priority: 'medium' },
          { title: `Plan ${event.name} celebration`, detail: 'Reserve restaurant or plan party', category: 'events', priority: 'medium' }
        );
      }
      break;
      
    case 'anniversary':
      tasks.push(
        { title: 'Plan anniversary celebration', detail: 'Make reservations or plan special evening', category: 'events', priority: 'high' },
        { title: 'Get anniversary gift', detail: 'Something thoughtful', category: 'events', priority: 'high' },
        { title: 'Arrange babysitter', detail: 'For anniversary evening', category: 'events', priority: 'medium' }
      );
      break;
      
    default:
      tasks.push(
        { title: `Prepare for ${event.name}`, detail: 'Plan ahead', category: 'events', priority: 'medium' }
      );
  }
  
  return tasks;
}

function getPlanningTasks(reminder) {
  const tasks = [];
  
  switch (reminder.type) {
    case 'birthday':
      tasks.push(
        { title: 'Review family birthday calendar', detail: 'Mark important dates coming up', category: 'events', priority: 'medium' },
        { title: 'Start gift ideas list', detail: 'Think ahead for upcoming birthdays', category: 'events', priority: 'low' },
        { title: 'Plan birthday celebration', detail: 'For the next family birthday', category: 'events', priority: 'medium' }
      );
      break;
      
    case 'holiday':
      tasks.push(
        { title: 'Check holiday calendar', detail: 'What is coming up this season?', category: 'events', priority: 'medium' },
        { title: 'Start holiday shopping early', detail: 'Beat the rush and save money', category: 'events', priority: 'low' },
        { title: 'Plan holiday traditions', detail: 'Family activities and celebrations', category: 'events', priority: 'medium' },
        { title: 'Book holiday travel', detail: 'If visiting family', category: 'events', priority: 'high' }
      );
      break;
      
    case 'appointment':
      tasks.push(
        { title: 'Schedule annual physicals', detail: 'For you and partner', category: 'health', priority: 'medium' },
        { title: 'Book dental cleanings', detail: 'Family checkups every 6 months', category: 'health', priority: 'medium' },
        { title: 'Schedule pediatrician visit', detail: 'Kids wellness checkups', category: 'health', priority: 'high' },
        { title: 'Update medical insurance', detail: 'Check coverage and beneficiaries', category: 'health', priority: 'low' }
      );
      break;
      
    case 'school_event':
      tasks.push(
        { title: 'Check school calendar', detail: 'Upcoming events and holidays', category: 'events', priority: 'medium' },
        { title: 'Plan school pickup/dropoff', detail: 'Coordinate schedules', category: 'events', priority: 'low' },
        { title: 'Prepare for parent-teacher conferences', detail: 'Questions and schedule', category: 'events', priority: 'medium' }
      );
      break;
  }
  
  return tasks;
}

export default function EventReminder({ user, db, onTaskAdded, compact = false }) {
  const [personalEvents, setPersonalEvents] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [planningReminders, setPlanningReminders] = useState([]);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && db) {
      loadPersonalEvents();
    }
  }, [user, db, loadPersonalEvents]);

  const loadPersonalEvents = async () => {
    try {
      const eventsDoc = await getDoc(doc(db, 'personalEvents', user.uid));
      if (eventsDoc.exists()) {
        const data = eventsDoc.data();
        setPersonalEvents(data);
        calculateUpcomingEvents(data);
      } else {
        // No personal events set up yet
        setPlanningReminders(PLANNING_REMINDERS.slice(0, compact ? 2 : 4));
      }
    } catch (error) {
      console.error('Error loading personal events:', error);
    }
    setLoading(false);
  };

  const calculateUpcomingEvents = (eventsData) => {
    const today = new Date();
    const upcoming = [];
    
    // Calculate days until family events
    if (eventsData.familyEvents) {
      eventsData.familyEvents.forEach(event => {
        const [month, day] = event.date.split('-');
        const eventDate = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
        
        // If event already passed this year, calculate for next year
        if (eventDate < today) {
          eventDate.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 60) { // Show events within 60 days
          upcoming.push({
            ...event,
            daysUntil,
            eventDate: eventDate.toISOString().split('T')[0]
          });
        }
      });
    }
    
    // Sort by days until
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    setUpcomingEvents(upcoming.slice(0, compact ? 3 : 5));
    
    // Also show planning reminders if they have appointments set up
    if (eventsData.appointments && eventsData.appointments.length > 0) {
      const appointmentReminders = [{
        type: 'appointment',
        name: 'Appointment check',
        description: `${eventsData.appointments.length} recurring appointments to track`,
        urgency: 'medium'
      }];
      setPlanningReminders(appointmentReminders);
    }
  };

  const handleAddPlanningTask = async (task) => {
    if (!user || !db) return;
    
    try {
      const newTask = {
        ...task,
        userId: user.uid,
        createdAt: Timestamp.now(),
        source: 'planning_reminder',
        dismissed: false,
        deleted: false,
      };

      await addDoc(collection(db, 'tasks'), newTask);
      
      if (onTaskAdded) onTaskAdded();
    } catch (error) {
      console.error('Error adding planning task:', error);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysUntilText = (days) => {
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    return `${Math.floor(days / 30)} months`;
  };

  if (loading) return null;
  if (!personalEvents && planningReminders.length === 0) {
    // Show setup prompt if no events configured
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">Personal Events</h3>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            Set up
          </button>
        </div>
        <p className="text-sm text-purple-700 mt-2">
          Add birthdays, holidays, and appointments to get timely reminders.
        </p>
        
        {showSetup && (
          <PersonalEventsSetup
            user={user}
            db={db}
            isOpen={showSetup}
            onComplete={(data) => {
              setShowSetup(false);
              if (data) {
                setPersonalEvents(data);
                calculateUpcomingEvents(data);
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-800">
            {upcomingEvents.length > 0 ? 'Upcoming Events' : 'Planning Reminders'}
          </h3>
        </div>
        <button
          onClick={() => setShowSetup(true)}
          className="text-purple-500 hover:text-purple-600"
          title="Edit events"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {/* Show real upcoming events if available */}
        {upcomingEvents.length > 0 && upcomingEvents.map((event, index) => {
          const eventConfig = EVENT_TYPES[event.type] || EVENT_TYPES.birthday;
          
          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white bg-opacity-50 rounded-lg hover:bg-white hover:bg-opacity-70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{eventConfig.emoji}</span>
                <div>
                  <div className="font-medium text-gray-900">{event.name}</div>
                  <div className="text-sm text-gray-600">
                    {formatEventDate(event.eventDate)} • {getDaysUntilText(event.daysUntil)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${eventConfig.color}`}>
                  {event.type}
                </span>
                <button
                  onClick={() => setSelectedReminder({ ...event, isRealEvent: true })}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  title="Get task suggestions"
                >
                  Plan →
                </button>
              </div>
            </div>
          );
        })}
        
        {/* Show planning reminders */}
        {planningReminders.map((reminder, index) => {
          const reminderConfig = EVENT_TYPES[reminder.type];
          
          return (
            <div
              key={`reminder-${index}`}
              className="flex items-center justify-between p-3 bg-white bg-opacity-50 rounded-lg hover:bg-white hover:bg-opacity-70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{reminderConfig.emoji}</span>
                <div>
                  <div className="font-medium text-gray-900">{reminder.name}</div>
                  <div className="text-sm text-gray-600">
                    {reminder.description}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(reminder.urgency)}`}>
                  {reminder.urgency}
                </span>
                <button
                  onClick={() => setSelectedReminder(reminder)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  title="Get task suggestions for planning"
                >
                  Plan →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Planning Task Suggestions Modal */}
      {selectedReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-800 mb-2">
              {selectedReminder.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedReminder.description}
            </p>

            <div className="space-y-3 mb-4">
              <p className="text-sm font-medium text-gray-700">Suggested tasks:</p>
              {(selectedReminder.isRealEvent ? 
                getEventTasksForReal(selectedReminder) : 
                getPlanningTasks(selectedReminder)
              ).map((task, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-grow">
                    <div className="font-medium text-sm text-gray-900">{task.title}</div>
                    <div className="text-xs text-gray-600">{task.detail}</div>
                  </div>
                  <button
                    onClick={() => handleAddPlanningTask(task)}
                    className="ml-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedReminder(null)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const tasks = selectedReminder.isRealEvent ? 
                    getEventTasksForReal(selectedReminder) : 
                    getPlanningTasks(selectedReminder);
                  tasks.forEach(task => handleAddPlanningTask(task));
                  setSelectedReminder(null);
                }}
                className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add All Tasks
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Personal Events Setup Modal */}
      {showSetup && (
        <PersonalEventsSetup
          user={user}
          db={db}
          isOpen={showSetup}
          onComplete={(data) => {
            setShowSetup(false);
            if (data) {
              setPersonalEvents(data);
              calculateUpcomingEvents(data);
            }
          }}
        />
      )}
    </div>
  );
}