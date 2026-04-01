'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Member = {
  id: string
  name: string
  gender: string | null
  birth_year: number | null
  birth_date: string | null
  photo_url: string | null
  anniversary: string | null
  spouse_name: string | null
  is_deceased: boolean
  note: string | null
  active: boolean
}

const emptyForm = {
  name: '',
  gender: '남',
  birth_year: '',
  birth_date: '',
  photo_url: '',
  anniversary: '',
  spouse_name: '',
  is_deceased: false,
  note: '',
  active: true,
}

export default function Members() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('ulj_members')
      .select('*')
      .order('name')
    setMembers(data || [])
  }

  useEffect(() => { fetchMembers() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (m: Member) => {
    setEditing(m)
    setForm({
      name: m.name,
      gender: m.gender || '남',
      birth_year: m.birth_year?.toString() || '',
      birth_date: m.birth_date || '',
      photo_url: m.photo_url || '',
      anniversary: m.anniversary || '',
      spouse_name: m.spouse_name || '',
      is_deceased: m.is_deceased,
      note: m.note || '',
      active: m.active,
    })
    setShowForm(true)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('uljin-members')
      .upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('uljin-members').getPublicUrl(path)
      setForm(f => ({ ...f, photo_url: data.publicUrl }))
    }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.name) { alert('이름은 필수입니다'); return }
    setSaving(true)
    const payload = {
      name: form.name,
      gender: form.gender,
      birth_year: form.birth_year ? parseInt(form.birth_year) : null,
      birth_date: form.birth_date || null,
      photo_url: form.photo_url || null,
      anniversary: form.anniversary || null,
      spouse_name: form.spouse_name || null,
      is_deceased: form.is_deceased,
      note: form.note || null,
      active: form.active,
    }
    if (editing) {
      await supabase.from('ulj_members').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('ulj_members').insert(payload)
    }
    await fetchMembers()
    setShowForm(false)
    setSaving(false)
  }

  return (
    <div className="p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-blue-300 text-base">← 홈</button>
          <h1 className="text-xl font-bold">멤버 관리</h1>
        </div>
        <button
          onClick={openNew}
          className="bg-blue-500 text-white text-base px-3 py-1.5 rounded-lg hover:bg-blue-600"
        >
          + 멤버 추가
        </button>
      </div>

      {/* 멤버 목록 */}
      <div className="flex flex-col gap-3">
        {members.map(m => (
          <div
            key={m.id}
            onClick={() => openEdit(m)}
            className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 ${m.is_deceased ? 'opacity-50' : ''}`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {m.photo_url ? (
                <Image src={m.photo_url} alt={m.name} width={48} height={48} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  {m.gender === '여' ? '👩' : '👨'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{m.name}</span>
                {m.is_deceased && <span className="text-sm text-gray-400">고인</span>}
                {!m.active && <span className="text-sm text-red-400">비활성</span>}
              </div>
              {m.birth_year && <p className="text-base text-gray-400">{m.birth_year}년생</p>}
              {m.spouse_name && <p className="text-base text-gray-400">배우자: {m.spouse_name}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? '멤버 수정' : '멤버 추가'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>

            {/* 얼굴사진 */}
            <div className="flex justify-center mb-4">
              <label className="cursor-pointer">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {form.photo_url ? (
                    <img src={form.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{form.gender === '여' ? '👩' : '👨'}</span>
                  )}
                </div>
                <p className="text-sm text-center text-blue-500 mt-1">
                  {uploading ? '업로드 중...' : '사진 선택'}
                </p>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            <div className="flex flex-col gap-3">
              {/* 이름 */}
              <div>
                <label className="text-base text-gray-500">이름 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-xl p-3 mt-1 focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* 성별 */}
              <div>
                <label className="text-base text-gray-500">성별</label>
                <div className="flex gap-2 mt-1">
                  {['남', '여'].map(g => (
                    <button
                      key={g}
                      onClick={() => setForm({ ...form, gender: g })}
                      className={`flex-1 py-2 rounded-xl border text-base font-medium transition ${
                        form.gender === g ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700'
                      }`}
                    >
                      {g === '남' ? '👨 남' : '👩 여'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 생년 */}
              <div>
                <label className="text-base text-gray-500">생년</label>
                <input
                  type="number"
                  value={form.birth_year}
                  onChange={e => setForm({ ...form, birth_year: e.target.value })}
                  className="w-full border rounded-xl p-3 mt-1 focus:outline-none focus:border-blue-400"
                  placeholder="예: 1953"
                />
              </div>

              {/* 생일 */}
              <div>
                <label className="text-base text-gray-500">생일</label>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={e => setForm({ ...form, birth_date: e.target.value })}
                  className="w-full border rounded-xl p-3 mt-1 focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* 배우자 */}
              <div>
                <label className="text-base text-gray-500">배우자 이름</label>
                <input
                  type="text"
                  value={form.spouse_name}
                  onChange={e => setForm({ ...form, spouse_name: e.target.value })}
                  className="w-full border rounded-xl p-3 mt-1 focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* 결혼기념일 */}
              <div>
                <label className="text-base text-gray-500">결혼기념일</label>
                <input
                  type="date"
                  value={form.anniversary}
                  onChange={e => setForm({ ...form, anniversary: e.target.value })}
                  className="w-full border rounded-xl p-3 mt-1 focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* 메모 */}
              <div>
                <label className="text-base text-gray-500">메모</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  className="w-full border rounded-xl p-3 mt-1 focus:outline-none focus:border-blue-400 h-20 resize-none"
                />
              </div>

              {/* 토글들 */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_deceased}
                    onChange={e => setForm({ ...form, is_deceased: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-base text-gray-600">고인</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-base text-gray-600">활성</span>
                </label>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-50 mt-2"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}