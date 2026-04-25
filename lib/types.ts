// Shared API types — mirrors backend DB types without any Node.js dependencies.

export type PacketStatus =
  | 'received'
  | 'processing'
  | 'completed'
  | 'received_at_hq'
  | 'counted_and_repacked'
  | 'collected_for_ingestion'

export interface SdPacket {
  id: number
  team_name: string
  factory: string
  date_received: string
  sd_card_count: number
  num_packages?: number
  deployment_date?: string | null
  notes?: string | null
  photo_url?: string | null
  photo_urls?: string | null
  repack_photo_urls?: string | null
  factory_entries?: string | null   // JSON array of {factory_name, deployment_date} objects
  status: PacketStatus
  entered_by: string
  counted_by?: string | null
  collected_by?: string | null
  assigned_to?: string | null
  poc_emails: string
  poc_phones?: string | null
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
