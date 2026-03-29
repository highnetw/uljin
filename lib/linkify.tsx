import React from 'react'

export function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 underline break-all"
          onClick={e => e.stopPropagation()}
        >
          {part}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}