import { Suspense } from "react"
import { CalendarPage } from "@/components/CalendarPage"

function CalendarPageWrapper() {
  return <CalendarPage />
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#001327] flex items-center justify-center">
          <div className="text-white text-xl">Kalender wird geladen...</div>
        </div>
      }
    >
      <CalendarPageWrapper />
    </Suspense>
  )
}
