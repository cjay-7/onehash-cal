type UserSuccessResponse = {
  resource: {
    uri: string;
    name: string;
    slug: string;
    email: string;
    scheduling_url: string;
    timezone: string;
    avatar_url: string;
    created_at: string;
    updated_at: string;
    current_organization: string;
    resource_type: "User";
  };
};

type ErrorResponse = {
  title: string;
  message: string;
  details?: {
    parameter: string;
    message: string;
  }[];
};
type UserErrorResponse = ErrorResponse;
// calendly-oauth-provider.ts
type AccessTokenSuccessResponse = {
  token_type: string;
  expires_in: number;
  created_at: number;
  refresh_token: string;
  access_token: string;
  scope: string;
  owner: string;
  organization: string;
};

type AccessTokenErrorResponse = {
  error: string;
  error_description: string;
};

//Types for user event types

type EventTypeCustomQuestion = {
  name: string;
  type: "string" | "text" | "single_select" | "multi_select" | "phone_number";
  position: number;
  enabled: boolean;
  required: boolean;
  answer_choices: string[];
  include_other: boolean;
};

type EventTypeProfile = {
  type: string;
  name: string;
  owner: string;
};

type CalendlyEventType = {
  uri: string;
  name: string;
  active: boolean;
  booking_method: string;
  slug: string;
  scheduling_url: string;
  duration: number;
  kind: string;
  pooling_type: string;
  type: string;
  color: string;
  created_at: string;
  updated_at: string;
  internal_note: string;
  description_plain: string;
  description_html: string;
  profile: EventTypeProfile;
  secret: boolean;
  deleted_at: string | null;
  admin_managed: boolean;
  custom_questions: EventTypeCustomQuestion[];
};

type Pagination = {
  count?: number | null;
  next_page?: string | null;
  previous_page?: string | null;
  next_page_token?: string | null;
  previous_page_token?: string | null;
};

type EventTypePagination = Pagination;

type CalendlyEventTypeSuccessResponse = {
  collection: CalendlyEventType[];
  pagination: EventTypePagination;
};

type CalendlyEventTypeErrorResponse = ErrorResponse;

//Types for user scheduled event
type ScheduledEventLocation = {
  type?: string | null;
  location?: string | null;
  join_url?: string | null;
};

type ScheduledEventInviteesCounter = {
  total?: number | null;
  active?: number | null;
  limit?: number | null;
};

type ScheduledEventMembership = {
  user?: string | null;
  user_email: string;
  user_name: string;
};

type ScheduledEventGuest = {
  email: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type ScheduledEventCalendar = {
  kind?: string | null;
  external_id?: string | null;
};

type CalendlyScheduledEventCancellation = {
  canceled_by: string;
  reason: string;
  canceler_type: string;
  created_at: string;
};

type CalendlyScheduledEvent = {
  uri: string;
  name?: string | null;
  status: string;
  start_time: string;
  end_time: string;
  event_type?: string | null;
  location: ScheduledEventLocation;
  invitees_counter?: ScheduledEventInviteesCounter | null;
  created_at: string;
  updated_at: string;
  event_memberships: ScheduledEventMembership[];
  event_guests?: ScheduledEventGuest[] | null;
  cancellation: CalendlyScheduledEventCancellation | null;
  calendar_event?: ScheduledEventCalendar | null;
};

type ScheduledEventPagination = Pagination;

type CalendlyScheduledEventSuccessResponse = {
  collection: CalendlyScheduledEvent[];
  pagination: ScheduledEventPagination;
};

type CalendlyScheduledEventErrorResponse = ErrorResponse;

//Types for scheduled event invitees
type QuestionAndAnswer = {
  answer?: string | null;
  position?: number | null;
  question?: string | null;
};

type Tracking = {
  utm_campaign?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  salesforce_uuid?: string | null;
};

type Payment = {
  external_id?: string | null;
  provider?: string | null;
  amount?: number | null;
  currency?: string | null;
  terms?: string | null;
  successful?: boolean | null;
};

type Reconfirmation = {
  created_at?: string | null;
  confirmed_at?: string | null;
};

type CalendlyScheduledEventInvitee = {
  cancel_url?: string | null;
  created_at?: string | null;
  email?: string | null;
  event?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  new_invitee?: unknown | null; // Assuming it could be of any type, adjust accordingly
  old_invitee?: unknown | null; // Assuming it could be of any type, adjust accordingly
  questions_and_answers?: QuestionAndAnswer[] | null;
  reschedule_url?: string | null;
  rescheduled?: boolean | null;
  status?: string | null;
  text_reminder_number?: string | null;
  timezone?: string | null;
  tracking?: Tracking | null;
  updated_at?: string | null;
  uri?: string | null;
  routing_form_submission?: string | null;
  payment?: Payment | null;
  no_show?: unknown | null; // Assuming it could be of any type, adjust accordingly
  reconfirmation?: Reconfirmation | null;
  scheduling_method?: unknown | null; // Assuming it could be of any type, adjust accordingly
  invitee_scheduled_by?: unknown | null; // Assuming it could be of any type, adjust accordingly
};

type ScheduledEventInviteePagination = Pagination;

type CalendlyScheduledEventInviteeSuccessResponse = {
  collection: CalendlyScheduledEventInvitee[];
  pagination: ScheduledEventInviteePagination;
};
type CalendlyScheduledEventInviteeErrorResponse = ErrorResponse;

//types for user availability schedules

type CalendlyUserAvailabilityRules = {
  type: "wday" | "date";
  intervals?: {
    from: string;
    to: string;
  }[];
  wday?: wday;
  date?: string;
};

type CalendlyUserAvailabilitySchedules = {
  uri: string;
  default: boolean;
  name: string;
  user: string;
  timezone: string;
  rules: CalendlyUserAvailabilityRules[];
};

type CalendlyUserAvailabilitySchedulesSuccessResponse = {
  collection: CalendlyUserAvailabilitySchedules[];
};

type CalendlyUserAvailabilitySchedulesErrorResponse = ErrorResponse;

export type {
  UserSuccessResponse,
  UserErrorResponse,
  AccessTokenSuccessResponse,
  AccessTokenErrorResponse,
  CalendlyEventType,
  CalendlyEventTypeSuccessResponse,
  CalendlyEventTypeErrorResponse,
  CalendlyScheduledEvent,
  CalendlyScheduledEventSuccessResponse,
  CalendlyScheduledEventErrorResponse,
  CalendlyScheduledEventInvitee,
  CalendlyScheduledEventInviteeSuccessResponse,
  CalendlyScheduledEventInviteeErrorResponse,
  CalendlyUserAvailabilityRules,
  CalendlyUserAvailabilitySchedules,
  CalendlyUserAvailabilitySchedulesSuccessResponse,
  CalendlyUserAvailabilitySchedulesErrorResponse,
};
