"use client"

import Image from "next/image"
import { GlowEffect } from "./GlowEffect"

type SnowflakeState = "today" | "past" | "future"
type SnowflakeSize = "small" | "medium" | "large" | "xlarge"

interface SnowflakeProps {
  day: number
  state: SnowflakeState
  onClick: () => void
  size?: SnowflakeSize
}

export function Snowflake({ day, state, onClick, size = "medium" }: SnowflakeProps) {
  const getSnowflakeIcon = () => {
    switch (state) {
      case "today":
        return "/icons/flake-day.svg"
      case "past":
        return "/icons/flake-bright.svg"
      case "future":
        return "/icons/flake-dark.svg"
    }
  }

  const getOpacity = () => {
    switch (state) {
      case "today":
        return "opacity-100"
      case "past":
        return "opacity-60"
      case "future":
        return "opacity-25"
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-16 h-16 lg:w-20 lg:h-20"
      case "medium":
        return "w-24 h-24 lg:w-32 lg:h-32"
      case "large":
        return "w-32 h-32 lg:w-40 lg:h-40"
      case "xlarge":
        return "w-40 h-40 lg:w-48 lg:h-48"
    }
  }

  const getTextSize = () => {
    switch (size) {
      case "small":
        return "text-lg lg:text-xl"
      case "medium":
        return "text-2xl lg:text-3xl"
      case "large":
        return "text-3xl lg:text-4xl"
      case "xlarge":
        return "text-4xl lg:text-5xl"
    }
  }

  const getTextStyle = () => {
    switch (state) {
      case "today":
        return { color: "#0f172a" } // Dark slate for bright background
      case "past":
        return { color: "#ffffff" } // White for better contrast
      case "future":
        return { color: "#ffffff" } // White for better contrast
    }
  }

  const isClickable = () => {
    return state === "today" || state === "past"
  }

  const handleClick = () => {
    if (isClickable()) {
      onClick()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable()}
      className={`
        relative group transition-all duration-300
        ${isClickable() ? "cursor-pointer hover:scale-102 hover:brightness-110" : "cursor-not-allowed"}
        ${getOpacity()}
      `}
    >
      {state === "today" && <GlowEffect size={size} />}

      <div className={`relative ${getSizeClasses()} z-10`}>
        <Image src={getSnowflakeIcon() || "/placeholder.svg"} alt={`Tag ${day}`} fill className="object-contain" />

        {/* Day Number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${getTextSize()} font-bold drop-shadow-lg select-none`} style={getTextStyle()}>
            {day}
          </span>
        </div>
      </div>
    </button>
  )
}
