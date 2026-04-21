// Shared API types — mirrors backend DB types without any Node.js dependencies.

export type PacketStatus = 'received' | 'processing' | 'completed'

export interface SdPacket {
  id: number
  team_name: string
  factory: string
  date_received: string
  sd_card_count: number
  notes?: string
  photo_url?: string | null
  status: PacketStatus
  entered_by: string
  poc_emails: string
  created_at: string
}

export interface IngestionRecord {
  id: number
  packet_id: number
  team_name: string
  industry: string
  actual_count: number
  missing_count: number
  extra_count: number
  red_cards_count: number
  ingested_by: string
  deployment_date: string
  notes?: string
  created_at: string
}
