'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { linkify } from '@/lib/linkify'

type Meeting = {
  id: string
  title: string
  meeting_date: string
  location: string | null
  content: string | null
  food_name: string | null
  food_review: string | null
  total_cost: number | null
  ulj_attendees: { ulj_members: { id: string; name: string; gender: string | null } }[]
  ulj_photos: { url: string; type: string; order_index: number }[]
  ulj_moments: { content: string; member_id: string; ulj_members: { name: string } }[]
}

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMeetings = async () => {
      const { data } = await supabase
        .from('ulj_meetings')
        .select(`
          *,
          ulj_attendees ( ulj_members ( id, name, gender ) ),
          ulj_photos ( url, type, order_index ),
          ulj_moments ( content, member_id, ulj_members ( name ) )
        `)
        .order('meeting_date', { ascending: false })
      setMeetings((data as any) || [])
      setLoading(false)
    }
    fetchMeetings()
  }, [])

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
    })
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 text-white px-4 py-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">🏔 울진 모임</h1>
        <div className="flex gap-2">
          <Link href="/members" className="bg-blue-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600">
            👥 멤버
          </Link>
          <Link href="/meetings/new" className="bg-white text-blue-900 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50">
            ＋ 새 기록
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4">
        {loading ? (
          <p className="text-center text-slate-400 mt-16">불러오는 중...</p>
        ) : meetings.length === 0 ? (
          <div className="text-center text-slate-400 mt-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-medium text-slate-500">아직 모임 기록이 없습니다</p>
            <Link href="/meetings/new" className="text-blue-500 text-sm mt-2 block">첫 모임 기록하기</Link>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {meetings.map(m => (
              <MeetingCard key={m.id} meeting={m} formatDate={formatDate} onDeleted={() => {
                setMeetings(prev => prev.filter(x => x.id !== m.id))
              }} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function MeetingCard({ meeting: m, formatDate, onDeleted }: {
  meeting: Meeting
  formatDate: (d: string) => string
  onDeleted: () => void
}) {
  const foodPhotos = m.ulj_photos?.filter(p => p.type === 'food') || []
  const restaurantPhotos = m.ulj_photos?.filter(p => p.type === 'restaurant') || []
  const peoplePhotos = m.ulj_photos?.filter(p => p.type === 'people') || []

  const handleDelete = async () => {
    if (!confirm('이 기록을 삭제할까요?')) return
    await supabase.from('ulj_meetings').delete().eq('id', m.id)
    onDeleted()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 카드 헤더 */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-4 py-3">
        <div className="text-white font-bold">{formatDate(m.meeting_date)}</div>
        <div className="text-blue-200 text-sm mt-0.5">{m.title}</div>
        <div className="flex flex-wrap gap-1 mt-2">
          {m.ulj_attendees?.map((a: any) => (
            <span key={a.ulj_members.id} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
              {a.ulj_members.gender === '여' ? '👩' : '👨'} {a.ulj_members.name}
            </span>
          ))}
        </div>
      </div>

      {/* 카드 바디 */}
      <div className="p-4 space-y-3">
        {m.location && (
          <div className="flex gap-2 items-center">
            <span>📍</span>
            <span className="text-sm text-slate-600">{m.location}</span>
          </div>
        )}
        {m.content && (
          <p className="text-sm text-slate-500 whitespace-pre-wrap">{m.content}</p>
        )}
        {m.food_name && (
          <div className="flex gap-2">
            <span>🍽</span>
            <div>
              <div className="text-xs text-blue-700 font-medium">음식</div>
              <div className="font-medium text-sm">{m.food_name}</div>
              {m.food_review && <div className="text-xs text-slate-500 mt-0.5">{m.food_review}</div>}
            </div>
          </div>
        )}
        {m.total_cost && (
          <div className="flex gap-2 items-center">
            <span>💰</span>
            <div>
              <div className="text-xs text-blue-700 font-medium">비용</div>
              <div className="font-bold text-sm">{m.total_cost.toLocaleString()}원</div>
            </div>
          </div>
        )}
      </div>

      {/* 사진 */}
      {(foodPhotos.length > 0 || restaurantPhotos.length > 0 || peoplePhotos.length > 0) && (
        <div className="px-4 pb-2 space-y-3">
          {foodPhotos.length > 0 && (
            <div>
              <div className="text-xs text-blue-700 font-medium mb-1">📷 음식 사진</div>
              <div className="grid grid-cols-3 gap-1">
                {foodPhotos.map((p, i) => (
                  <img key={i} src={p.url} className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                    onClick={() => window.open(p.url, '_blank')} />
                ))}
              </div>
            </div>
          )}
          {restaurantPhotos.length > 0 && (
            <div>
              <div className="text-xs text-blue-700 font-medium mb-1">🏪 식당 외관</div>
              <div className="grid grid-cols-3 gap-1">
                {restaurantPhotos.map((p, i) => (
                  <img key={i} src={p.url} className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                    onClick={() => window.open(p.url, '_blank')} />
                ))}
              </div>
            </div>
          )}
          {peoplePhotos.length > 0 && (
            <div>
              <div className="text-xs text-blue-700 font-medium mb-1">🤳 단체 사진</div>
              <div className="grid grid-cols-3 gap-1">
                {peoplePhotos.map((p, i) => (
                  <img key={i} src={p.url} className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                    onClick={() => window.open(p.url, '_blank')} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 명언 */}
      {m.ulj_moments && m.ulj_moments.length > 0 && (
        <div className="px-4 pb-3">
          <div className="text-xs text-blue-700 font-medium mb-2">💬 오늘의 명언</div>
          <div className="space-y-2">
            {m.ulj_moments.map((moment: any, i: number) => (
              <div key={i} className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-3 py-2">
                <div className="text-xs font-bold text-amber-700 mb-1">{moment.ulj_members?.name}</div>
                <div className="text-sm text-slate-600">{linkify(moment.content)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 액션 */}
      <div className="px-4 pb-4 flex gap-2">
        <Link href={`/meetings/${m.id}/edit`}
          className="flex-1 text-center text-blue-700 text-sm border border-blue-200 py-2 rounded-lg hover:bg-blue-50">
          ✏️ 수정
        </Link>
        <button onClick={handleDelete}
          className="flex-1 text-red-400 text-sm border border-red-200 py-2 rounded-lg hover:bg-red-50">
          🗑 삭제
        </button>
      </div>
    </div>
  )
}