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

  if (loading) return <div className="max-w-5xl mx-auto p-6 text-sm text-gray-600 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>Loading...</div>;
  if (error) return <div className="max-w-5xl mx-auto p-6 text-sm text-red-600 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>{error}</div>;
  if (!room) return null;

  return (
    <div className="h-full w-full max-w-5xl mx-auto p-6 flex flex-col overflow-hidden md:overflow-hidden overflow-y-auto md:overflow-y-hidden [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className="bg-white border rounded p-4 mb-4 flex-shrink-0 overflow-hidden">
        <h1 className="text-xl font-semibold break-words">{room.name}</h1>
        <p className="text-sm text-gray-600 break-words">{room.description || '—'}</p>
        <div className="text-xs text-gray-500 mt-1">Type: {room.room_type}</div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden md:overflow-hidden overflow-y-auto md:overflow-y-hidden [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:h-full min-h-0 min-w-0 md:overflow-hidden" style={{ gridAutoRows: '1fr' }}>
          <div className="min-h-0 min-w-0 flex flex-col md:overflow-hidden">
            <h2 className="font-medium mb-2 flex-shrink-0">Chat</h2>
            <div className="flex-1 min-h-0 md:overflow-hidden overflow-y-auto md:overflow-y-hidden min-h-[300px] md:min-h-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <ChatRoom roomId={roomId} token={access} />
            </div>
          </div>
          <div className="min-h-0 min-w-0 flex flex-col md:overflow-hidden">
            <h2 className="font-medium mb-2 flex-shrink-0">Video</h2>
            <div className="flex-1 min-h-0 md:overflow-hidden md:min-h-0">
              <VideoChat roomId={roomId} token={access} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
