'use client'

import { useEffect, useState } from 'react'

const PIN = '7777'

export default function PinGuard({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const saved = sessionStorage.getItem('ulj_pin')
    if (saved === PIN) setUnlocked(true)
    setChecking(false)
  }, [])

  const handleSubmit = () => {
    console.log('입력값:', input, '길이:', input.length)
    if (input.trim() === PIN) {
      sessionStorage.setItem('ulj_pin', PIN)
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setInput('')
    }
  }

  if (checking) return null
  if (unlocked) return <>{children}</>

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-80 text-center">
        <h1 className="text-2xl font-bold mb-2">울진 모임</h1>
        <p className="text-gray-500 text-sm mb-6">PIN 번호를 입력하세요</p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={input}
          onChange={e => {
            const val = e.target.value.replace(/[^0-9]/g, '')
            setInput(val)
          }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full text-center text-2xl tracking-widest border-2 rounded-xl p-3 mb-3 focus:outline-none focus:border-blue-400"
          placeholder="0000"
          autoFocus
        />
        {error && (
          <p className="text-red-500 text-sm mb-3">PIN이 올바르지 않습니다</p>
        )}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition"
        >
          입장
        </button>
      </div>
    </div>
  )
}