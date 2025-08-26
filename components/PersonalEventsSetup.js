'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

const HOLIDAY_OPTIONS = [
  { id: 'christmas', name: 'Christmas', date: '12-25' },
  { id: 'hanukkah', name: 'Hanukkah', date: 'varies' }, // Varies each year
  { id: 'easter', name: 'Easter', date: 'varies' },
  { id: 'passover', name: 'Passover', date: 'varies' },
  { id: 'thanksgiving', name: 'Thanksgiving (US)', date: '11-fourth-thursday' },
  { id: 'halloween', name: 'Halloween', date: '10-31' },
  { id: 'new_year', name: "New Year's Day", date: '01-01' },
  { id: 'july_4', name: 'Fourth of July', date: '07-04' },
  { id: 'valentines', name: "Valentine's Day", date: '02-14' },
  { id: 'mothers_day', name: "Mother's Day", date: '05-second-sunday' },
  { id: 'fathers_day', name: "Father's Day", date: '06-third-sunday' },
  { id: 'memorial_day', name: 'Memorial Day', date: '05-last-monday' },
  { id: 'labor_day', name: 'Labor Day', date: '09-first-monday' },
];

const APPOINTMENT_TYPES = [
  { id: 'dentist', name: 'Dentist cleaning', defaultInterval: 6 },
  { id: 'physical', name: 'Annual physical', defaultInterval: 12 },
  { id: 'eye_exam', name: 'Eye exam', defaultInterval: 12 },
  { id: 'pediatrician', name: 'Pediatrician checkup', defaultInterval: 6 },
  { id: 'ob_gyn', name: 'OB/GYN annual', defaultInterval: 12 },
  { id: 'dermatologist', name: 'Skin check', defaultInterval: 12 },
];

export default function PersonalEventsSetup({ user, db, onComplete, isOpen = false }) {
  const [selectedHolidays, setSelectedHolidays] = useState([]);
  const [familyEvents, setFamilyEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customHoliday, setCustomHoliday] = useState('');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ type: 'birthday', name: '', month: '', day: '' });
  const [loading, setLoading] = useState(false);
  const [savedEvents, setSavedEvents] = useState(null);

  useEffect(() => {
    if (user && db) {
      loadExistingEvents();
    }
  }, [user, db]);

  const loadExistingEvents = async () => {
    try {
      const eventsDoc = await getDoc(doc(db, 'personalEvents', user.uid));
      if (eventsDoc.exists()) {
        const data = eventsDoc.data();
        setSavedEvents(data);
        setSelectedHolidays(data.holidays || []);
        setFamilyEvents(data.familyEvents || []);
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error loading personal events:', error);
    }
  };

  const toggleHoliday = (holidayId) => {
    setSelectedHolidays(prev => 
      prev.includes(holidayId) 
        ? prev.filter(h => h !== holidayId)
        : [...prev, holidayId]
    );
  };

  const addCustomHoliday = () => {
    if (customHoliday.trim()) {
      const customId = `custom_${Date.now()}`;
      setSelectedHolidays(prev => [...prev, customId]);
      HOLIDAY_OPTIONS.push({ id: customId, name: customHoliday, date: 'custom' });
      setCustomHoliday('');
    }
  };

  const addFamilyEvent = () => {
    if (newEvent.name && newEvent.month && newEvent.day) {
      const event = {
        id: `event_${Date.now()}`,
        ...newEvent,
        date: `${newEvent.month.padStart(2, '0')}-${newEvent.day.padStart(2, '0')}`
      };
      setFamilyEvents(prev => [...prev, event]);
      setNewEvent({ type: 'birthday', name: '', month: '', day: '' });
      setShowAddEvent(false);
    }
  };

  const removeFamilyEvent = (eventId) => {
    setFamilyEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const toggleAppointment = (appointmentId) => {
    const appointment = APPOINTMENT_TYPES.find(a => a.id === appointmentId);
    setAppointments(prev => {
      const existing = prev.find(a => a.id === appointmentId);
      if (existing) {
        return prev.filter(a => a.id !== appointmentId);
      } else {
        return [...prev, {
          id: appointmentId,
          name: appointment.name,
          intervalMonths: appointment.defaultInterval,
          lastDate: null
        }];
      }
    });
  };

  const saveEvents = async () => {
    if (!user || !db) return;
    
    setLoading(true);
    try {
      const eventsData = {
        holidays: selectedHolidays,
        familyEvents,
        appointments,
        updatedAt: Timestamp.now(),
        userId: user.uid
      };

      await setDoc(doc(db, 'personalEvents', user.uid), eventsData);
      setSavedEvents(eventsData);
      if (onComplete) onComplete(eventsData);
    } catch (error) {
      console.error('Error saving personal events:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Personalize Your Planning Reminders</h2>
          <button onClick={() => onComplete(savedEvents)} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Holidays Section */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 mb-3">Which holidays would you like reminders for?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HOLIDAY_OPTIONS.map(holiday => (
              <label
                key={holiday.id}
                className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedHolidays.includes(holiday.id)}
                  onChange={() => toggleHoliday(holiday.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">{holiday.name}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Add custom holiday..."
              value={customHoliday}
              onChange={(e) => setCustomHoliday(e.target.value)}
              className="flex-grow p-2 border rounded-lg text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addCustomHoliday()}
            />
            <button
              onClick={addCustomHoliday}
              disabled={!customHoliday.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Family Events Section */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 mb-3">Add your important family dates</h3>
          <div className="space-y-2 mb-3">
            {familyEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{event.name}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({event.type} - {event.month}/{event.day})
                  </span>
                </div>
                <button
                  onClick={() => removeFamilyEvent(event.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          
          {showAddEvent ? (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                  className="p-2 border rounded-lg"
                >
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Name (e.g., Mom)"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                  className="p-2 border rounded-lg"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="MM"
                    min="1"
                    max="12"
                    value={newEvent.month}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, month: e.target.value }))}
                    className="w-16 p-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="DD"
                    min="1"
                    max="31"
                    value={newEvent.day}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, day: e.target.value }))}
                    className="w-16 p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addFamilyEvent}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddEvent(true)}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <PlusIcon className="w-5 h-5" />
              Add family event
            </button>
          )}
        </div>

        {/* Appointments Section */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 mb-3">Set up appointment reminders</h3>
          <div className="grid grid-cols-2 gap-3">
            {APPOINTMENT_TYPES.map(apt => (
              <label
                key={apt.id}
                className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={appointments.some(a => a.id === apt.id)}
                  onChange={() => toggleAppointment(apt.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">
                  {apt.name}
                  <span className="text-gray-500 ml-1">
                    (every {apt.defaultInterval} months)
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={saveEvents}
            disabled={loading}
            className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-5 h-5" />
                <span>Save Events</span>
              </>
            )}
          </button>
          <button
            onClick={() => onComplete(savedEvents)}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}