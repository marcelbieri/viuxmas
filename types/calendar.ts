export interface CalendarDoor {
  day: number
  title: string
  subtitle?: string
  image?: {
    filename: string
    alt: string
  }
  body?: any // Richtext content
  cta_primary?: {
    url: string
    label: string
  }
  cta_secondary?: {
    url: string
    label: string
  }
  reveal_at?: string
}
