'use client'

import React from 'react'

export function linkify(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  const result: React.ReactNode[] = []

  parts.forEach((part, i) => {
    if (part.match(urlRegex)) {
      result.push(
        React.createElement('a', {
          key: i,
          href: part,
          target: '_blank',
          rel: 'noreferrer',
          className: 'text-blue-500 underline break-all',
          onClick: (e: React.MouseEvent) => e.stopPropagation(),
        }, part)
      )
    } else {
      result.push(React.createElement('span', { key: i }, part))
    }
  })

  return result
}