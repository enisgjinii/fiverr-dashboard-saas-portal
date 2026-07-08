export const SPRINT_START = '2026-07-07'
export const SPRINT_END = '2026-09-01'
export const SPRINT_TITLE = 'Fiverr Growth Sprint · Jul 7–Sep 1 2026'
export const STORAGE_KEY = 'fiverrGrowthSprintStore'

export type TaskPriority = 'P1' | 'P2' | 'P3' | 'P4'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'skipped'
export type SprintSectionId =
  | '00' | '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09'

export interface SprintSection {
  id: SprintSectionId
  label: string
  shortLabel: string
  phase: 'foundation' | 'build' | 'proof' | 'scale'
  color: string
}

export interface SprintPhase {
  id: SprintSection['phase']
  label: string
  start: string
  end: string
}

export const SPRINT_SECTIONS: SprintSection[] = [
  { id: '00', label: '00 · START HERE · Today Only', shortLabel: 'Start Here', phase: 'foundation', color: 'emerald' },
  { id: '01', label: '01 · Daily Habits / Recurring', shortLabel: 'Daily Habits', phase: 'foundation', color: 'teal' },
  { id: '02', label: '02 · Current Sprint · Profile Cleanup', shortLabel: 'Profile Cleanup', phase: 'foundation', color: 'green' },
  { id: '03', label: '03 · Next Sprint · Gig Rebuild', shortLabel: 'Gig Rebuild', phase: 'build', color: 'blue' },
  { id: '04', label: '04 · Offers + Thumbnails', shortLabel: 'Offers + Thumbnails', phase: 'build', color: 'sky' },
  { id: '05', label: '05 · Gallery + Video Proof', shortLabel: 'Gallery + Video', phase: 'proof', color: 'violet' },
  { id: '06', label: '06 · Demo Builds / Portfolio Proof', shortLabel: 'Demo Builds', phase: 'proof', color: 'purple' },
  { id: '07', label: '07 · SEO + Case Studies', shortLabel: 'SEO + Case Studies', phase: 'proof', color: 'fuchsia' },
  { id: '08', label: '08 · Buyer Messages + Closing', shortLabel: 'Buyer Messages', phase: 'scale', color: 'orange' },
  { id: '09', label: '09 · Analytics + September Scale', shortLabel: 'Analytics + Scale', phase: 'scale', color: 'amber' },
]

export const SPRINT_PHASES: SprintPhase[] = [
  { id: 'foundation', label: 'Foundation', start: '2026-07-07', end: '2026-07-13' },
  { id: 'build', label: 'Build', start: '2026-07-14', end: '2026-07-31' },
  { id: 'proof', label: 'Proof', start: '2026-08-01', end: '2026-08-18' },
  { id: 'scale', label: 'Scale', start: '2026-08-19', end: '2026-09-01' },
]

export interface SprintTask {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: TaskPriority
  section: SprintSectionId
  status: TaskStatus
  duration?: string
  estimatedMinutes?: number
  actualMinutes?: number
  labels?: string[]
  completedAt?: string
  notes?: string
  blockedReason?: string
  impact?: 'low' | 'medium' | 'high' | 'critical'
  effort?: 'xs' | 's' | 'm' | 'l' | 'xl'
  relatedGigId?: string
  checklist?: { id: string; text: string; done: boolean }[]
  todoistId?: string
  todoistSyncedAt?: string
  createdAt: string
  updatedAt: string
}

export type SkillAction = 'keep' | 'remove' | 'review'

export interface SkillItem {
  id: string
  name: string
  category: 'strong' | 'weak'
  action: SkillAction
}

export interface ProfileChanges {
  previousTitle: string
  newTitle: string
  previousDescription: string
  newDescription: string
  trustLine: string
  trustLineAdded: boolean
  weakServicesRemoved: boolean
  skillsUpdated: boolean
  beforeScreenshotUrl: string
  afterScreenshotUrl: string
  notes: string
  profileScore?: number
  lastAuditAt?: string
  updatedAt: string
}

export interface AnalyticsEntry {
  id: string
  date: string
  impressions?: number
  clicks?: number
  messages?: number
  orders?: number
  conversionRate?: number
  clickThroughRate?: number
  responseRate?: number
  bestGig?: string
  worstGig?: string
  changesMadeToday: string
  notes: string
  isBaseline?: boolean
}

export type GigStatus = 'not_started' | 'in_progress' | 'review' | 'live' | 'paused'
export type SubStatus = 'not_started' | 'in_progress' | 'done' | 'needs_revision'

export interface GigTrack {
  id: string
  lane: string
  gigTitle: string
  description: string
  status: GigStatus
  thumbnailStatus: SubStatus
  descriptionStatus: SubStatus
  packagesStatus: SubStatus
  faqStatus: SubStatus
  galleryStatus: SubStatus
  videoStatus: SubStatus
  seoKeywords: string
  targetKeywords: string[]
  priceBasic?: number
  priceStandard?: number
  pricePremium?: number
  readinessScore?: number
  notes: string
  nextAction: string
  lastUpdated: string
}

export interface HabitDefinition {
  id: string
  title: string
  description?: string
  frequency: 'daily' | 'weekly'
  weekday?: number
  section: '01'
  points: number
}

export interface HabitLog {
  date: string
  habitId: string
  completed: boolean
  notes?: string
  completedAt?: string
}

export type LeadStatus = 'new' | 'replied' | 'waiting' | 'warm' | 'closed' | 'lost'
export type LeadTemperature = 'cold' | 'warm' | 'hot'

export interface BuyerLead {
  id: string
  buyerName: string
  fiverrUsername: string
  projectType: string
  budget: string
  status: LeadStatus
  temperature: LeadTemperature
  source?: string
  lastMessageDate?: string
  nextFollowUpDate?: string
  notes: string
  customOfferSent: boolean
  orderCreated: boolean
  estimatedValue?: number
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface MessageTemplate {
  id: string
  title: string
  category: 'reply' | 'followup' | 'objection' | 'offer' | 'closing'
  body: string
  variables?: string[]
}

export type ProofAssetType =
  | 'profile_screenshot'
  | 'gig_screenshot'
  | 'demo_screenshot'
  | 'analytics_screenshot'
  | 'case_study'
  | 'video_proof'
  | 'thumbnail'
  | 'before_after'

export interface ProofAsset {
  id: string
  title: string
  type: ProofAssetType
  relatedGig: string
  date: string
  fileUrl: string
  notes: string
  tags?: string[]
}

export interface WeeklyReview {
  id: string
  weekStart: string
  weekEnd?: string
  improved: string
  gotClicks: string
  blocked: string
  fixNextWeek: string
  proofCreated: string
  focusNextWeek: string
  wins?: string
  metricsSnapshot?: string
  energyScore?: number
  createdAt: string
}

export interface SeptemberScalePlan {
  goals: string
  targetGigs: string
  pricingStrategy: string
  outreachPlan: string
  proofAssetsNeeded: string
  monthlyRevenueTarget?: number
  weeklyMessageTarget?: number
  weeklyOrderTarget?: number
  milestones: { id: string; title: string; dueDate: string; done: boolean }[]
  notes: string
  updatedAt: string
}

export type CompetitorThreat = 'low' | 'medium' | 'high'

export interface CompetitorWatch {
  id: string
  username: string
  niche: string
  strengths: string
  weaknesses: string
  priceRange: string
  notes: string
  lastChecked?: string
  rating?: number
  reviews?: number
  threatLevel?: CompetitorThreat
  thumbnailNotes?: string
}

export type SeoIntent = 'primary' | 'secondary' | 'longtail' | 'transactional' | 'commercial'

export interface SeoKeyword {
  id: string
  keyword: string
  gigId?: string
  gigLane?: string
  intent: SeoIntent
  status: 'research' | 'in_use' | 'ranking' | 'dropped' | 'targeting'
  difficulty?: number
  usedInTitle?: boolean
  usedInTags?: boolean
  usedInDescription?: boolean
  notes?: string
}

export interface ActivityEvent {
  id: string
  type: 'task' | 'habit' | 'lead' | 'analytics' | 'profile' | 'gig' | 'proof' | 'review' | 'note'
  title: string
  detail?: string
  at: string
}

export interface QuickNote {
  id: string
  text: string
  pinned: boolean
  createdAt: string
}

export interface SprintGoal {
  id: string
  title: string
  metric: string
  target: number
  current: number
  unit: string
  deadline?: string
}

export interface DailyJournalEntry {
  id: string
  date: string
  mood: number
  energy: number
  wins: string
  blockers: string
  tomorrowFocus: string
  notes: string
}

export interface SprintStore {
  version: 2
  tasks: SprintTask[]
  profile: ProfileChanges
  skills: SkillItem[]
  analytics: AnalyticsEntry[]
  gigs: GigTrack[]
  habitLogs: HabitLog[]
  habits: HabitDefinition[]
  leads: BuyerLead[]
  templates: MessageTemplate[]
  proofAssets: ProofAsset[]
  weeklyReviews: WeeklyReview[]
  septemberPlan: SeptemberScalePlan
  competitors: CompetitorWatch[]
  seoKeywords: SeoKeyword[]
  activity: ActivityEvent[]
  quickNotes: QuickNote[]
  goals: SprintGoal[]
  journal?: DailyJournalEntry[]
  lastUpdated: string
}

export type SprintDashboardView =
  | 'sprint-overview'
  | 'sprint-today'
  | 'sprint-board'
  | 'sprint-profile'
  | 'sprint-gigs'
  | 'sprint-analytics'
  | 'sprint-habits'
  | 'sprint-leads'
  | 'sprint-proof'
  | 'sprint-weekly'
  | 'sprint-september'
  | 'sprint-competitors'
  | 'sprint-seo'
  | 'sprint-command'
  | 'sprint-todoist'

export interface SprintStats {
  total: number
  completed: number
  remaining: number
  inProgress: number
  blocked: number
  percent: number
  today: SprintTask[]
  overdue: SprintTask[]
  thisWeek: SprintTask[]
  highPriority: SprintTask[]
  phase: string
  phaseProgress: number
  daysLeft: number
  daysElapsed: number
  dayNumber: number
  totalDays: number
  nextAction: SprintTask | null
  nextActionReason: string
  sectionProgress: Record<SprintSectionId, { total: number; done: number; percent: number }>
  habitStreak: number
  habitTodayDone: number
  habitTodayTotal: number
  leadPipeline: Record<LeadStatus, number>
  gigReadinessAvg: number
  profileScore: number
  analyticsDelta: {
    impressions: number | null
    clicks: number | null
    messages: number | null
    orders: number | null
  }
  healthScore: number
  momentumScore: number
  velocity7d: number
}
