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

  const onCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await api.post('/api/rooms/', {
        name,
        description,
        room_type: roomType,
      });
      setName('');
      setDescription('');
      setRoomType('chat');
      await loadRooms();
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
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Rooms</h1>

      <form onSubmit={onCreate} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 border rounded">
        <input
          type="text"
          className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
        >
          <option value="chat">Chat</option>
          <option value="video">Video</option>
        </select>
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-indigo-600 text-white py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create room'}
        </button>
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
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
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
