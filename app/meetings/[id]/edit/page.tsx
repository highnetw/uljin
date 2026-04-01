'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

type Member = {
  id: string
  name: string
  gender: string | null
}

type ExistingPhoto = {
  id: string
  url: string
  type: string
  order_index: number
}

export default function EditMeeting() {
  const router = useRouter()
  const { id } = useParams()
  const [members, setMembers] = useState<Member[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [date, setDate] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [content, setContent] = useState('')
  const [foodName, setFoodName] = useState('')
  const [foodReview, setFoodReview] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [attendees, setAttendees] = useState<string[]>([])
  const [moments, setMoments] = useState<{ memberId: string; content: string }[]>([])
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([])

  const [foodPhotos, setFoodPhotos] = useState<File[]>([])
  const [restaurantPhotos, setRestaurantPhotos] = useState<File[]>([])
  const [peoplePhotos, setPeoplePhotos] = useState<File[]>([])
  const [foodPreviews, setFoodPreviews] = useState<string[]>([])
  const [restaurantPreviews, setRestaurantPreviews] = useState<string[]>([])
  const [peoplePreviews, setPeoplePreviews] = useState<string[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      const { data: members } = await supabase
        .from('ulj_members')
        .select('id, name, gender')
        .eq('active', true)
        .eq('is_deceased', false)
        .order('name')
      setMembers(members || [])

      const { data: meeting } = await supabase
        .from('ulj_meetings')
        .select('*')
        .eq('id', id)
        .single()

      if (meeting) {
        setTitle(meeting.title)
        setDate(meeting.meeting_date)
        setLocation(meeting.location || '')
        setContent(meeting.content || '')
        setFoodName(meeting.food_name || '')
        setFoodReview(meeting.food_review || '')
        setTotalCost(meeting.total_cost?.toString() || '')
      }

      const { data: att } = await supabase
        .from('ulj_attendees')
        .select('member_id')
        .eq('meeting_id', id)
      setAttendees((att || []).map((a: any) => a.member_id))

      const { data: photos } = await supabase
        .from('ulj_photos')
        .select('*')
        .eq('meeting_id', id)
        .order('order_index')
      setExistingPhotos(photos || [])

      const { data: mom } = await supabase
        .from('ulj_moments')
        .select('content, member_id')
        .eq('meeting_id', id)
      setMoments(
        (mom || []).length > 0
          ? (mom || []).map((m: any) => ({ memberId: m.member_id, content: m.content }))
          : [{ memberId: '', content: '' }]
      )

      setLoading(false)
    }
    fetchAll()
  }, [id])

  const toggleAttendee = (mid: string) => {
    setAttendees(prev => prev.includes(mid) ? prev.filter(x => x !== mid) : [...prev, mid])
  }

  const addMoment = () => setMoments(prev => [...prev, { memberId: '', content: '' }])
  const removeMoment = (i: number) => setMoments(prev => prev.filter((_, idx) => idx !== i))
  const updateMoment = (i: number, field: 'memberId' | 'content', value: string) => {
    setMoments(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  const handlePhotoSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'food' | 'restaurant' | 'people',
    max: number
  ) => {
    const newFiles = Array.from(e.target.files || [])
    if (type === 'food') {
      const merged = [...foodPhotos, ...newFiles].slice(0, max)
      setFoodPhotos(merged)
      setFoodPreviews(merged.map(f => URL.createObjectURL(f)))
    }
    if (type === 'restaurant') {
      const merged = [...restaurantPhotos, ...newFiles].slice(0, max)
      setRestaurantPhotos(merged)
      setRestaurantPreviews(merged.map(f => URL.createObjectURL(f)))
    }
    if (type === 'people') {
      const merged = [...peoplePhotos, ...newFiles].slice(0, max)
      setPeoplePhotos(merged)
      setPeoplePreviews(merged.map(f => URL.createObjectURL(f)))
    }
    e.target.value = ''
  }

  const deleteExistingPhoto = async (photo: ExistingPhoto) => {
    if (!confirm('이 사진을 삭제할까요?')) return
    const path = photo.url.split('/uljin-photos/')[1]
    if (path) await supabase.storage.from('uljin-photos').remove([path])
    await supabase.from('ulj_photos').delete().eq('id', photo.id)
    setExistingPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  const uploadPhotos = async () => {
    const allPhotos = [
      ...foodPhotos.map(f => ({ file: f, type: 'food' })),
      ...restaurantPhotos.map(f => ({ file: f, type: 'restaurant' })),
      ...peoplePhotos.map(f => ({ file: f, type: 'people' })),
    ]
    for (let i = 0; i < allPhotos.length; i++) {
      const { file, type } = allPhotos[i]
      const ext = file.name.split('.').pop()
      const path = `${id}/${type}_${Date.now()}_${i}.${ext}`
      const { error } = await supabase.storage.from('uljin-photos').upload(path, file)
      if (!error) {
        const { data: urlData } = supabase.storage.from('uljin-photos').getPublicUrl(path)
        await supabase.from('ulj_photos').insert({
          meeting_id: id,
          url: urlData.publicUrl,
          type,
          order_index: i,
        })
      }
    }
  }

  const handleSave = async () => {
    if (!title || !date) { alert('제목과 날짜는 필수입니다'); return }
    setSaving(true)

    await supabase.from('ulj_meetings').update({
      title,
      meeting_date: date,
      location: location || null,
      content: content || null,
      food_name: foodName || null,
      food_review: foodReview || null,
      total_cost: totalCost ? parseInt(totalCost) : null,
    }).eq('id', id)

    await supabase.from('ulj_attendees').delete().eq('meeting_id', id)
    if (attendees.length > 0) {
      await supabase.from('ulj_attendees').insert(
        attendees.map(member_id => ({ meeting_id: id, member_id }))
      )
    }

    await supabase.from('ulj_moments').delete().eq('meeting_id', id)
    const validMoments = moments.filter(m => m.memberId && m.content.trim())
    if (validMoments.length > 0) {
      await supabase.from('ulj_moments').insert(
        validMoments.map(m => ({ meeting_id: id, member_id: m.memberId, content: m.content.trim() }))
      )
    }

    await uploadPhotos()

    router.push('/')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">불러오는 중...</p>
    </div>
  )

  const exFoodPhotos = existingPhotos.filter(p => p.type === 'food')
  const exRestaurantPhotos = existingPhotos.filter(p => p.type === 'restaurant')
  const exPeoplePhotos = existingPhotos.filter(p => p.type === 'people')

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 text-white px-4 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-300 text-base">← 뒤로</button>
        <h1 className="text-xl font-bold">✏️ 모임 수정</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">📌 모임 제목 *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-base outline-none focus:border-blue-500" />
        </div>

        {/* 날짜 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">📅 날짜 *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-base outline-none focus:border-blue-500" />
        </div>

        {/* 장소 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">📍 장소</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-base outline-none focus:border-blue-500" />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">📝 모임 내용</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={3}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-base outline-none focus:border-blue-500 resize-none" />
        </div>

        {/* 음식 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">🍽 음식</label>
          <input type="text" value={foodName} onChange={e => setFoodName(e.target.value)}
            placeholder="예: 삼겹살, 냉면"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-base outline-none focus:border-blue-500 mb-2" />
          <textarea value={foodReview} onChange={e => setFoodReview(e.target.value)}
            placeholder="맛과 분위기..." rows={2}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-base outline-none focus:border-blue-500 resize-none" />
        </div>

        {/* 비용 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">💰 비용</label>
          <input type="number" value={totalCost} onChange={e => setTotalCost(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-base outline-none focus:border-blue-500" />
        </div>

        {/* 참석자 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-2">
            👥 참석자 ({attendees.length}명 선택)
          </label>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <button key={m.id} onClick={() => toggleAttendee(m.id)}
                className={`px-3 py-1.5 rounded-full text-base border transition ${
                  attendees.includes(m.id)
                    ? 'bg-blue-800 text-white border-blue-800'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}>
                {m.gender === '여' ? '👩' : '👨'} {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* 기존 사진 관리 */}
        {existingPhotos.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="text-sm font-medium text-amber-700 mb-2">🗂 저장된 사진 (✕ 버튼으로 삭제)</div>
            {[
              { list: exFoodPhotos, label: '📷 음식' },
              { list: exRestaurantPhotos, label: '🏪 식당 외관' },
              { list: exPeoplePhotos, label: '🤳 단체' },
            ].filter(g => g.list.length > 0).map(g => (
              <div key={g.label} className="mb-2">
                <div className="text-sm text-slate-500 mb-1">{g.label}</div>
                <div className="grid grid-cols-3 gap-2">
                  {g.list.map((p, i) => (
                    <div key={i} className="relative">
                      <img src={p.url} className="w-full aspect-square object-cover rounded-lg" />
                      <button onClick={() => deleteExistingPhoto(p)}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 text-sm flex items-center justify-center">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 음식 사진 추가 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-2">📷 음식 사진 추가</label>
          <label className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition">
            <span className="text-slate-400 text-base">📷 갤러리에서 선택</span>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={e => handlePhotoSelect(e, 'food', 10)} />
          </label>
          {foodPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {foodPreviews.map((src, i) => <img key={i} src={src} className="w-full aspect-square object-cover rounded-lg" />)}
            </div>
          )}
        </div>

        {/* 식당 외관 사진 추가 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-2">🏪 식당 외관 사진 추가</label>
          <label className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition">
            <span className="text-slate-400 text-base">📷 갤러리에서 선택</span>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={e => handlePhotoSelect(e, 'restaurant', 3)} />
          </label>
          {restaurantPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {restaurantPreviews.map((src, i) => <img key={i} src={src} className="w-full aspect-square object-cover rounded-lg" />)}
            </div>
          )}
        </div>

        {/* 단체 사진 추가 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-2">🤳 단체 사진 추가</label>
          <label className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition">
            <span className="text-slate-400 text-base">📷 갤러리에서 선택</span>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={e => handlePhotoSelect(e, 'people', 10)} />
          </label>
          {peoplePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {peoplePreviews.map((src, i) => <img key={i} src={src} className="w-full aspect-square object-cover rounded-lg" />)}
            </div>
          )}
        </div>

        {/* 명언 */}
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-2">💬 오늘의 명언</label>
          {moments.map((m, i) => (
            <div key={i} className="mb-3 border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex justify-between items-center mb-2">
                <select value={m.memberId} onChange={e => updateMoment(i, 'memberId', e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-base outline-none focus:border-blue-500 bg-white">
                  <option value="">멤버 선택</option>
                  {members.map(mem => (
                    <option key={mem.id} value={mem.id}>{mem.name}</option>
                  ))}
                </select>
                <button onClick={() => removeMoment(i)}
                  className="text-red-400 border border-red-200 rounded-lg px-2 py-1.5 text-base hover:bg-red-50">✕</button>
              </div>
              <textarea value={m.content} onChange={e => updateMoment(i, 'content', e.target.value)}
                placeholder="기억에 남는 말..." rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-base outline-none focus:border-blue-500 resize-none bg-white" />
            </div>
          ))}
          <button onClick={addMoment}
            className="w-full border border-dashed border-slate-300 rounded-xl py-2 text-base text-slate-400 hover:border-blue-400 hover:text-blue-600 transition">
            ＋ 명언 추가
          </button>
        </div>

        {/* 저장 */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-blue-800 text-white py-3 rounded-xl font-bold text-base hover:bg-blue-700 disabled:opacity-50 mb-8">
          {saving ? '저장 중...' : '✨ 수정 저장'}
        </button>

      </div>
    </main>
  )
}