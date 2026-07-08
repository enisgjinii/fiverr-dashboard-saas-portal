export interface Transaction {
  id: string
  activity: string
  amount: number
  date: string
  from: string
  to: string
  service: string
  orderableItem: string
  order: { encryptedId: string }
  withdrawalStatus: string
  status: string
  type: string
}

export interface Counter {
  activity: string
  count: number
}

export interface EarningsData {
  data?: {
    transactions: Transaction[]
    countersPerActivity: Counter[]
    pagesLoaded: number
    totalCount?: number
  }
  message?: string
}

export interface OrdersData {
  derivedFrom?: string
  transactions: Transaction[]
  pagesLoaded?: number
  message?: string
}

export interface Review {
  id: string
  buyer_username: string
  seller_username: string
  text: string
  rating: number
  created_at: string
  order_id: string
  [key: string]: any
}

export interface BreakdownItem {
  count: number
  average_valuation_value: number
  percentage: number
}

export interface ReviewsData {
  selling_reviews?: { reviews: Review[]; total_count: number; average_valuation: number; breakdown: BreakdownItem[] }
  buying_reviews?: { reviews: Review[]; total_count: number; average_valuation: number; breakdown: BreakdownItem[] }
  reviews?: Review[]
  total_count?: number
  average_valuation?: number
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  createdAt: string
  read: boolean
  link: string
  [key: string]: any
}

export interface NotificationsData {
  notifications: Notification[]
  unreadCount: number
  message?: string
}

export interface Conversation {
  id: string
  username: string
  lastMessage: string
  lastDate: string
  unread: boolean
  [key: string]: any
}

export interface Contact {
  username: string
  name: string
  lastMessage: string
  timestamp: string
  [key: string]: any
}
