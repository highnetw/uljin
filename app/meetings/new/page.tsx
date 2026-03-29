'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Member = {
  id: string
  name: string
  gender: string | null
  is_deceased: boolean
}

export default function NewMeeting() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '',
    meeting_date: '',
    location: '',
    content: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('ulj_members')
        .select('id, name, gender, is_deceased')
        .eq('active', true)
        .order('name')
      setMembers(data || [])
    }
    fetchMembers()
  }, [])

  const toggleMember = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!form.title || !form.meeting_date) {
      alert('제목과 날짜는 필수입니다')
      return
    }
    setSaving(true)

    const { data: meeting, error } = await supabase
      .from('ulj_meetings')
      .insert(form)
      .select()
      .single()

    if (error || !meeting) {
      alert('저장 실패')
      setSaving(false)
      return
    }

    if (selected.length > 0) {
      await supabase.from('ulj_attendees').insert(
        selected.map(member_id => ({ meeting_id: meeting.id, member_id }))
      )
    }

    router.push(`/meetings/${meeting.id}`)
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
        <h1 className="text-xl font-bold">모임 기록</h1>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-gray-500 mb-1 block">제목 *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-xl p-3 focus:outline-none focus:border-blue-400"
            placeholder="예: 2024년 1월 정기모임"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">날짜 *</label>
          <input
            type="date"
            value={form.meeting_date}
            onChange={e => setForm({ ...form, meeting_date: e.target.value })}
            className="w-full border rounded-xl p-3 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">장소</label>
          <input
            type="text"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            className="w-full border rounded-xl p-3 focus:outline-none focus:border-blue-400"
            placeholder="예: 서울 강남구"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">내용</label>
          <textarea
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            className="w-full border rounded-xl p-3 focus:outline-none focus:border-blue-400 h-32 resize-none"
            placeholder="모임 내용을 입력하세요"
          />
        </div>

        {/* 참석자 선택 */}
        <div>
          <label className="text-sm text-gray-500 mb-2 block">
            참석자 ({selected.length}명 선택)
          </label>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 멤버가 없습니다</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition ${
                    selected.includes(m.id)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-200'
                  } ${m.is_deceased ? 'opacity-50' : ''}`}
                >
                  {m.gender === '여' ? '👩' : '👨'} {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-50 mt-2"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}