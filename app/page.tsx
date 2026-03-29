'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Meeting = {
  id: string
  title: string
  meeting_date: string
  location: string | null
}

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('ulj_meetings')
        .select('id, title, meeting_date, location')
        .order('meeting_date', { ascending: false })
      setMeetings(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div className="p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">울진 모임</h1>
        <div className="flex gap-2">
          <Link
            href="/members"
            className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-200"
          >
            멤버
          </Link>
          <Link
            href="/meetings/new"
            className="text-sm bg-blue-500 px-3 py-1.5 rounded-lg text-white hover:bg-blue-600"
          >
            + 모임
          </Link>
        </div>
      </div>

      {/* 모임 목록 */}
      {loading ? (
        <p className="text-center text-gray-400 mt-20">불러오는 중...</p>
      ) : meetings.length === 0 ? (
        <div className="text-center text-gray-400 mt-20">
          <p className="text-4xl mb-3">📋</p>
          <p>아직 모임 기록이 없습니다</p>
          <Link href="/meetings/new" className="text-blue-500 text-sm mt-2 block">
            첫 모임 기록하기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map((m) => (
            <Link key={m.id} href={`/meetings/${m.id}`}>
              <div className="border rounded-xl p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">{m.title}</h2>
                  <span className="text-xs text-gray-400">
                    {m.meeting_date}
                  </span>
                </div>
                {m.location && (
                  <p className="text-sm text-gray-500 mt-1">📍 {m.location}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}