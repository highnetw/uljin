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
        <div className="min-h-screen flex flex-col bg-white">
            {/* 상단 이미지 */}
            <div
                className="w-full h-64 bg-cover bg-center"
                style={{ backgroundImage: "url('/bg.png')" }}
            />
            {/* 이미지 설명 */}
            <div className="px-6 pt-4 pb-2 text-center">
                <p className="text-gray-700 font-medium text-base">평화로운 고향 망양 앞바다^^</p>
                <p className="text-gray-400 text-sm mt-1">망양 응달 기와집(응달재집) 후손들입니다.</p>
                <p className="text-gray-400 text-sm mt-1">망양정이 최초에 이 동산에 있었다 합니다.</p>
            </div>

            {/* 하단 PIN 입력 */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">망양 모임</h1>
                <p className="text-gray-400 text-sm mb-8">PIN 번호를 입력하세요</p>

                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={input}
                    onChange={e => setInput(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full max-w-xs text-center text-3xl tracking-widest border-2 rounded-xl p-3 mb-3 focus:outline-none focus:border-blue-400"
                    placeholder="0000"
                    autoFocus
                />

                {error && (
                    <p className="text-red-500 text-sm mb-3">PIN이 올바르지 않습니다</p>
                )}

                <button
                    onClick={handleSubmit}
                    className="w-full max-w-xs bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                    들어오세요
                </button>
            </div>
        </div>
    )
}