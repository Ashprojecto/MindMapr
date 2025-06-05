"use client"

import { useState } from "react"

type NodeProps = {
  id: string
  x: number
  y: number
  text: string
  onDrag: (x: number, y: number) => void
  onTextChange: (text: string) => void
  onClick: () => void
  isSelected: boolean
  onDelete?: () => void
}

export default function Node({
  id,
  x,
  y,
  text,
  onDrag,
  onTextChange,
  onClick,
  isSelected,
  onDelete,
}: NodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempText, setTempText] = useState(text)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing) return // don't drag while editing
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const startNodeX = x
    const startNodeY = y

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      onDrag(startNodeX + deltaX, startNodeY + deltaY)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    onTextChange(tempText)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur()
    }
  }

  return (
    <div
      data-node
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onDoubleClick={handleDoubleClick}
      className={`absolute p-4 bg-white rounded-lg shadow-md border ${
        isSelected ? "border-blue-500" : "border-gray-300"
      } ${isEditing ? "" : "cursor-move"} max-w-[200px] w-[70vw] sm:w-[150px]`}
      style={{ top: y, left: x }}
    >
      {isSelected && onDelete && (
        <button
          className="absolute top-0 right-0 m-1 bg-red-500 text-white rounded px-1 text-xs z-20"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          🗑
        </button>
      )}

      {isEditing ? (
        <input
          className="w-full p-1 border rounded text-sm text-black"
          autoFocus
          value={tempText}
          onChange={(e) => setTempText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <p className="text-sm break-words whitespace-pre-wrap text-black">{text}</p>
      )}
    </div>
  )
}
