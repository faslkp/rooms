import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [roomType, setRoomType] = useState('chat');
  const [createError, setCreateError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/rooms/');
      setRooms(res.data);
    } catch (err) {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const validateForm = () => {
    const errors = {};
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      errors.name = 'Room name is required';
    } else if (trimmedName.length < 3) {
      errors.name = 'Room name must be at least 3 characters';
    } else if (trimmedName.length > 100) {
      errors.name = 'Room name must be less than 100 characters';
    }
    
    if (description && description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    if (!roomType || !['chat', 'video'].includes(roomType)) {
      errors.roomType = 'Invalid room type';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setValidationErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setCreating(true);
    try {
      const res = await api.post('/api/rooms/', {
        name: name.trim(),
        description: description.trim(),
        room_type: roomType,
      });
      setName('');
      setDescription('');
      setRoomType('chat');
      setValidationErrors({});
      setRooms((prevRooms) => [res.data, ...prevRooms]);
    } catch (err) {
      const data = err?.response?.data;
      setCreateError(
        data?.detail || data?.name?.[0] || data?.room_type?.[0] || 'Failed to create room'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="max-w-5xl mx-auto p-6 w-full h-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <h1 className="text-2xl font-bold mb-4">Rooms</h1>

      <form onSubmit={onCreate} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 border rounded">
        <div className="md:col-span-1">
          <input
            type="text"
            className={`rounded border px-3 py-2 w-full focus:outline-none focus:ring-2 ${
              validationErrors.name 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-indigo-500'
            }`}
            placeholder="Room name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (validationErrors.name) {
                setValidationErrors((prev) => ({ ...prev, name: null }));
              }
            }}
          />
          {validationErrors.name && (
            <div className="text-xs text-red-600 mt-1">{validationErrors.name}</div>
          )}
        </div>
        <div className="md:col-span-1">
          <input
            type="text"
            className={`rounded border px-3 py-2 w-full focus:outline-none focus:ring-2 ${
              validationErrors.description 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-indigo-500'
            }`}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (validationErrors.description) {
                setValidationErrors((prev) => ({ ...prev, description: null }));
              }
            }}
          />
          {validationErrors.description && (
            <div className="text-xs text-red-600 mt-1">{validationErrors.description}</div>
          )}
        </div>
        <div className="md:col-span-1">
          <select
            className={`rounded border px-3 py-2 w-full focus:outline-none focus:ring-2 ${
              validationErrors.roomType 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-indigo-500'
            }`}
            value={roomType}
            onChange={(e) => {
              setRoomType(e.target.value);
              if (validationErrors.roomType) {
                setValidationErrors((prev) => ({ ...prev, roomType: null }));
              }
            }}
          >
            <option value="chat">Chat</option>
            <option value="video">Video</option>
          </select>
          {validationErrors.roomType && (
            <div className="text-xs text-red-600 mt-1">{validationErrors.roomType}</div>
          )}
        </div>
        <div className="md:col-span-1">
          <button
            type="submit"
            disabled={creating}
            className="rounded bg-indigo-600 text-white py-2 font-medium hover:bg-indigo-700 disabled:opacity-50 w-full"
          >
            {creating ? 'Creating...' : 'Create room'}
          </button>
        </div>
        {createError && (
          <div className="md:col-span-4 text-sm text-red-600">{createError}</div>
        )}
      </form>

      {loading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-gray-600">No rooms yet.</p>
      ) : (
        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-sm min-w-0">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Creator</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2 capitalize">{r.room_type}</td>
                  <td className="px-4 py-2">{r.creator?.email || '—'}</td>
                  <td className="px-4 py-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/rooms/${r.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      Enter
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
