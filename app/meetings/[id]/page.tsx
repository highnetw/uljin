'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
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
}

type Member = {
    id: string
    name: string
    gender: string | null
}

type Photo = {
    id: string
    url: string
    type: string
}

type Moment = {
    id: string
    content: string
    member_id: string
    ulj_members: { name: string }
}

export default function MeetingDetail() {
    const router = useRouter()
    const { id } = useParams()
    const [meeting, setMeeting] = useState<Meeting | null>(null)
    const [attendees, setAttendees] = useState<Member[]>([])
    const [photos, setPhotos] = useState<Photo[]>([])
    const [moments, setMoments] = useState<Moment[]>([])
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
                .order('order_index')
            setPhotos(p || [])

            const { data: mo } = await supabase
                .from('ulj_moments')
                .select('*, ulj_members(name)')
                .eq('meeting_id', id)
            setMoments(mo || [])
        }
        fetchAll()
    }, [id])

    if (!meeting) return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-400">불러오는 중...</p>
        </div>
    )

    const foodPhotos = photos.filter(p => p.type === 'food')
    const restaurantPhotos = photos.filter(p => p.type === 'restaurant')
    const peoplePhotos = photos.filter(p => p.type === 'people')

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="bg-blue-900 text-white px-4 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-blue-300 text-sm">← 뒤로</button>
                    <h1 className="text-xl font-bold">{meeting.title}</h1>
                </div>
                <button
                    onClick={() => router.push(`/meetings/${id}/edit`)}
                    className="bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-600"
                >
                    ✏️ 수정
                </button>
            </header>

            <div className="max-w-lg mx-auto p-4 space-y-4">

                {/* 기본 정보 */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
                    <p className="text-sm text-slate-500">📅 {meeting.meeting_date}</p>
                    {meeting.location && (
                        <p className="text-sm text-slate-500">📍 {meeting.location}</p>
                    )}
                    {meeting.content && (
                        <p className="text-slate-700 text-sm whitespace-pre-wrap">{meeting.content}</p>
                    )}
                    {meeting.food_name && (
                        <div>
                            <p className="text-sm font-medium text-blue-700">🍽 {meeting.food_name}</p>
                            {meeting.food_review && (
                                <p className="text-xs text-slate-500 mt-0.5">{meeting.food_review}</p>
                            )}
                        </div>
                    )}
                    {meeting.total_cost && (
                        <p className="text-sm font-bold text-slate-700">
                            💰 {meeting.total_cost.toLocaleString()}원
                        </p>
                    )}
                </div>

                {/* 참석자 */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <h2 className="font-semibold mb-2 text-sm text-blue-700">👥 참석자 {attendees.length}명</h2>
                    <div className="flex flex-wrap gap-2">
                        {attendees.map(m => (
                            <span key={m.id} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                                {m.gender === '여' ? '👩' : '👨'} {m.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 사진 */}
                {photos.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
                        {foodPhotos.length > 0 && (
                            <div>
                                <p className="text-xs text-blue-700 font-medium mb-1">📷 음식 사진</p>
                                <div className="grid grid-cols-3 gap-1">
                                    {foodPhotos.map(p => (
                                        <img key={p.id} src={p.url} onClick={() => setLightbox(p.url)}
                                            className="w-full aspect-square object-cover rounded-lg cursor-pointer" />
                                    ))}
                                </div>
                            </div>
                        )}
                        {restaurantPhotos.length > 0 && (
                            <div>
                                <p className="text-xs text-blue-700 font-medium mb-1">🏪 식당 외관</p>
                                <div className="grid grid-cols-3 gap-1">
                                    {restaurantPhotos.map(p => (
                                        <img key={p.id} src={p.url} onClick={() => setLightbox(p.url)}
                                            className="w-full aspect-square object-cover rounded-lg cursor-pointer" />
                                    ))}
                                </div>
                            </div>
                        )}
                        {peoplePhotos.length > 0 && (
                            <div>
                                <p className="text-xs text-blue-700 font-medium mb-1">🤳 단체 사진</p>
                                <div className="grid grid-cols-3 gap-1">
                                    {peoplePhotos.map(p => (
                                        <img key={p.id} src={p.url} onClick={() => setLightbox(p.url)}
                                            className="w-full aspect-square object-cover rounded-lg cursor-pointer" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 명언 */}
                {moments.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-slate-200">
                        <p className="text-xs text-blue-700 font-medium mb-2">💬 오늘의 명언</p>
                        <div className="space-y-2">
                            {moments.map((m, i) => (
                                <div key={i} className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-3 py-2">
                                    <p className="text-xs font-bold text-amber-700 mb-1">{m.ulj_members?.name}</p>
                                    <p className="text-sm text-slate-600">{linkify(m.content)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* 라이트박스 */}
            {lightbox && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
                    onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
                </div>
            )}
        </main>
    )
}