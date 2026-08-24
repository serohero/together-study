'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface StudyRoom {
  id: number;
  title: string;
  description: string;
  industry_1: string;
  industry_2: string;
  study_type: string;
  communication: string;
  location_type: string;
  location_city: string | null;
  schedule: string;
  current_members: number;
  max_members: number;
  contact_link: string;
}

export default function Home() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [selectedComm, setSelectedComm] = useState<string>('All');

  useEffect(() => {
    async function fetchRooms() {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRooms(data);
      }
      setLoading(false);
    }

    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter((room) => {
    const matchIndustry = selectedIndustry === 'All' || room.industry_1 === selectedIndustry;
    const matchComm = selectedComm === 'All' || room.communication === selectedComm;
    return matchIndustry && matchComm;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Together Study
          </h1>
          <p className="text-slate-400 mt-2">
            Find your dedicated study crew, track weekly progress, and build together.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-slate-900/80 rounded-xl border border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Industry
            </span>
            <div className="flex gap-2">
              {['All', 'Tech', 'Business'].map((ind) => (
                <button
                  key={ind}
                  onClick={() => setSelectedIndustry(ind)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedIndustry === ind
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div className="h-auto w-px bg-slate-800 mx-2 hidden md:block" />

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Style
            </span>
            <div className="flex gap-2">
              {['All', 'Interactive', 'Silent'].map((comm) => (
                <button
                  key={comm}
                  onClick={() => setSelectedComm(comm)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedComm === comm
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {comm}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Study Cards Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading study rooms...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No study groups match your filter.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {room.industry_1} · {room.industry_2}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {room.communication}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {room.location_type} {room.location_city ? `(${room.location_city})` : ''}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-100 mb-2">{room.title}</h2>
                  <p className="text-sm text-slate-400 line-clamp-3 mb-4">{room.description}</p>
                </div>

                <div className="border-t border-slate-800/80 pt-4 mt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-4">
                    <span>📅 {room.schedule}</span>
                    <span>
                      👥 {room.current_members} / {room.max_members} members
                    </span>
                  </div>

                  <a
                    href={room.contact_link}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
                  >
                    Join Study Group
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}