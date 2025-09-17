"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function DoorPage() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    if (params.slug) {
      router.replace(`/?door=${params.slug}`)
    }
  }, [params.slug, router])

  return (
    <div className="min-h-screen bg-[#001327] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Türchen wird geladen...</p>
      </div>
    </div>
  )
}
