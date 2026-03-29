'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

type Meeting = {
  id: string
  title: string
  meeting_date: string
  location: string | null
  content: string | null
}

type Member = {
  id: string
  name: string
  gender: string | null
}

type Photo = {
  id: string
  url: string
  caption: string | null
}

export default function MeetingDetail() {
  const router = useRouter()
  const { id } = useParams()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [attendees, setAttendees] = useState<Member[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      const { data: m } = await supabase
        .from('ulj_meetings')
        .select('*')
        .eq('id', id)
        .single()
      setMeeting(m)

      const { data: a } = await supabase
        .from('ulj_attendees')
        .select('ulj_members(id, name, gender)')
        .eq('meeting_id', id)
      setAttendees((a || []).map((x: any) => x.ulj_members))

      const { data: p } = await supabase
        .from('ulj_photos')
        .select('*')
        .eq('meeting_id', id)
        .order('created_at')
      setPhotos(p || [])
    }
    fetchAll()
  }, [id])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('uljin-photos')
        .upload(path, file)
      if (upErr) continue

      const { data: urlData } = supabase.storage
        .from('uljin-photos')
        .getPublicUrl(path)

      await supabase.from('ulj_photos').insert({
        meeting_id: id,
        url: urlData.publicUrl,
      })
    }

    // 새로고침
    const { data: p } = await supabase
      .from('ulj_photos')
      .select('*')
      .eq('meeting_id', id)
      .order('created_at')
    setPhotos(p || [])
    setUploading(false)
  }

  if (!meeting) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">불러오는 중...</p>
    </div>
  )

  return (
    <div className="p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
        <h1 className="text-xl font-bold">{meeting.title}</h1>
      </div>

      {/* 모임 정보 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-500">📅 {meeting.meeting_date}</p>
        {meeting.location && (
          <p className="text-sm text-gray-500 mt-1">📍 {meeting.location}</p>
        )}
        {meeting.content && (
          <p className="text-gray-700 mt-3 whitespace-pre-wrap">{meeting.content}</p>
        )}
      </div>

      {/* 참석자 */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">참석자 {attendees.length}명</h2>
        {attendees.length === 0 ? (
          <p className="text-sm text-gray-400">참석자 없음</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attendees.map(m => (
              <span
                key={m.id}
                className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
              >
                {m.gender === '여' ? '👩' : '👨'} {m.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 사진 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">사진 {photos.length}장</h2>
          <label className="text-sm bg-blue-500 text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-blue-600">
            {uploading ? '업로드 중...' : '+ 사진 추가'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
        {photos.length === 0 ? (
          <p className="text-sm text-gray-400">사진이 없습니다</p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {photos.map(p => (
              <div
                key={p.id}
                className="aspect-square relative cursor-pointer"
                onClick={() => setLightbox(p.url)}
              >
                <Image
                  src={p.url}
                  alt={p.caption || ''}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  )
}