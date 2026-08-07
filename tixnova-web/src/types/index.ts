export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  email_verified_at?: string;
  is_active: boolean;
  last_login_at?: string;
  referral_code?: string;
  tenant_id?: number;
  tenant?: Tenant;
  roles: string[];
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logo?: string;
  description?: string;
  status: "pending" | "active" | "suspended" | "rejected";
  plan: "free" | "starter" | "professional" | "enterprise";
  commission: number;
  domain?: string;
  settings?: Record<string, unknown>;
  approved_at?: string;
  approved_by?: number;
  created_at: string;
  updated_at: string;
  users_count?: number;
  events_count?: number;
  orders_count?: number;
  total_revenue?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  type: "event" | "blog";
  icon?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  events_count?: number;
  blogs_count?: number;
}

export interface Event {
  id: number;
  tenant_id: number;
  user_id: number;
  category_id?: number;
  title: string;
  slug: string;
  description?: string;
  short_desc?: string;
  venue: string;
  venue_detail?: string;
  city: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  start_date: string;
  end_date: string;
  banner?: string;
  poster?: string;
  status: "draft" | "pending" | "approved" | "rejected" | "ongoing" | "completed" | "cancelled";
  is_featured: boolean;
  is_free: boolean;
  min_age: number;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  approved_at?: string;
  approved_by?: number;
  reject_reason?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  user?: User;
  category?: Category;
  tickets?: Ticket[];
  tickets_count?: number;
  min_price?: number;
  max_price?: number;
  seatMap?: SeatMap;
}

export interface SeatMap {
  id: number;
  name: string;
  is_published: boolean;
  locked_at?: string;
  seats: Seat[];
}

export interface Seat {
  id: number;
  ticket_id: number;
  section: string;
  row_label: string;
  number: number;
  label: string;
  status: "available" | "held" | "sold" | "blocked";
}

export interface Ticket {
  id: number;
  event_id: number;
  name: string;
  type: "regular" | "vip" | "early_bird" | "free";
  description?: string;
  price: number;
  quota: number;
  sold: number;
  min_purchase: number;
  max_purchase: number;
  sale_start?: string;
  sale_end?: string;
  includes?: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  available: number;
  is_on_sale: boolean;
}

export interface Order {
  id: number;
  order_code: string;
  user_id: number;
  event_id: number;
  tenant_id: number;
  voucher_id?: number;
  referral_code?: string;
  subtotal: number;
  discount: number;
  admin_fee: number;
  commission_fee: number;
  total: number;
  status: "pending" | "paid" | "cancelled" | "refunded" | "expired";
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  notes?: string;
  expired_at?: string;
  paid_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  event?: Event;
  tenant?: Tenant;
  voucher?: Voucher;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  ticket_id: number;
  quantity: number;
  price: number;
  seat_number?: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  qr_code: string;
  qr_used: boolean;
  qr_used_at?: string;
  eticket_sent: boolean;
  eticket_sent_at?: string;
  created_at: string;
  ticket?: Ticket;
}

export interface Payment {
  id: number;
  order_id: number;
  method: "bank_transfer" | "ewallet" | "qris" | "credit_card" | "va" | "stripe";
  provider: "midtrans" | "xendit" | "manual" | "stripe";
  external_id?: string;
  payment_url?: string;
  amount: number;
  status: "pending" | "success" | "failed" | "expired" | "refunded";
  payload_raw?: Record<string, unknown>;
  paid_at?: string;
  expired_at?: string;
  refund_amount?: number;
  refund_at?: string;
  refund_reason?: string;
  created_at: string;
  updated_at: string;
  order?: Order;
}

export interface Voucher {
  id: number;
  tenant_id: number;
  event_id?: number;
  code: string;
  type: "percentage" | "fixed" | "buy_x_get_y";
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase?: number;
  max_use: number;
  used_count: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  event?: Event;
}

export interface Blog {
  id: number;
  tenant_id: number;
  user_id: number;
  category_id?: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  banner?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  status: "draft" | "published";
  is_featured: boolean;
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author?: User;
  category?: Category;
  tenant?: Tenant;
}

export interface ScanLog {
  id: number;
  order_item_id: number;
  event_id: number;
  scanned_by: number;
  scan_status: "valid" | "invalid" | "already_used" | "expired" | "wrong_event";
  device_info?: Record<string, unknown>;
  location?: string;
  scanned_at: string;
  order_item?: OrderItem;
}

export interface DashboardStats {
  total_tenants: number;
  active_tenants: number;
  pending_tenants: number;
  total_events: number;
  pending_events: number;
  approved_events: number;
  total_users: number;
  total_orders: number;
  paid_orders: number;
  total_revenue: number;
  platform_commission: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  commission: number;
  count: number;
}

export interface TopTenant {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  orders_count: number;
  orders_sum_total: number;
}

export interface CommunityMember {
  id: number;
  user_id: number;
  role: string;
  name?: string;
  email?: string;
  avatar?: string;
  joined_at: string;
}

export interface CommunityEventItem {
  id: number;
  community_id: number;
  event_id: number;
  revenue_share_pct: number;
  event: {
    id: number;
    title: string;
    slug: string;
    start_date: string;
    city: string;
  } | null;
}

export interface Community {
  id: number;
  tenant_id: number;
  name: string;
  slug: string;
  code: string;
  type: string;
  description?: string;
  avatar?: string;
  status: string;
  is_member?: boolean;
  members_count?: number;
  members?: CommunityMember[];
  events?: CommunityEventItem[];
  created_by?: number;
  created_at: string;
  updated_at: string;
}