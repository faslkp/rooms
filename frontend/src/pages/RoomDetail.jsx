import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatRoom from '../components/ChatRoom';
import VideoChat from '../components/VideoChat';

export default function RoomDetail() {
  const { id } = useParams();
  const roomId = Number(id);
  const { access } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/rooms/${roomId}/`);
        if (mounted) setRoom(res.data);
      } catch (e) {
        setError('Failed to load room');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [roomId]);

  if (loading) return <div className="max-w-5xl mx-auto p-6 text-sm text-gray-600">Loading...</div>;
  if (error) return <div className="max-w-5xl mx-auto p-6 text-sm text-red-600">{error}</div>;
  if (!room) return null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="bg-white border rounded p-4">
        <h1 className="text-xl font-semibold">{room.name}</h1>
        <p className="text-sm text-gray-600">{room.description || '—'}</p>
        <div className="text-xs text-gray-500 mt-1">Type: {room.room_type}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-96">
          <h2 className="font-medium mb-2">Chat</h2>
          <ChatRoom roomId={roomId} token={access} />
        </div>
        <div className="h-96">
          <h2 className="font-medium mb-2">Video</h2>
          <VideoChat roomId={roomId} token={access} />
        </div>
      </div>
    </div>
  );
}
