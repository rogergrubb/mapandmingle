import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const GenderEnum = z.enum(['male', 'female', 'nonbinary', 'prefer_not']);
export const RelationshipStatusEnum = z.enum(['single', 'dating', 'committed', 'married', 'open', 'complicated', 'prefer_not']);
export const OpennessEnum = z.enum(['monogamous', 'open', 'flexible', 'exploring', 'prefer_not']);
export const ChatReadinessEnum = z.enum(['open_to_chat', 'open_to_meet', 'browsing_only', 'busy']);
export const VisibilityModeEnum = z.enum(['public', 'friends_only', 'hidden']);
export const BadgeColorEnum = z.enum(['gold', 'blue', 'purple', 'none']);
export const TrustLevelEnum = z.enum(['new', 'trusted', 'verified', 'vip', 'flagged', 'restricted']);
export const SubscriptionStatusEnum = z.enum(['trial', 'active', 'expired', 'canceled']);
export const MessagePrivacyEnum = z.enum(['everyone', 'verified', 'none']);
export const PinVisibilityEnum = z.enum(['everyone', 'connections', 'none']);

// ============================================================================
// USER & PROFILE SCHEMAS
// ============================================================================

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const profileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  handle: z.string().nullable(),
  displayName: z.string().nullable(),
  bio: z.string().max(300).nullable(),
  avatar: z.string().nullable(),
  
  // Demographics
  age: z.number().min(18).max(99).nullable(),
  gender: GenderEnum.nullable(),
  relationshipStatus: RelationshipStatusEnum.nullable(),
  openness: OpennessEnum.nullable(),
  
  // Interests & Preferences
  interests: z.array(z.string()).max(15),
  lookingFor: z.string().nullable(),
  chatReadiness: ChatReadinessEnum.nullable(),
  activityIntent: z.string().nullable(),
  activityIntentActive: z.boolean(),
  
  // Location
  currentLocationLat: z.number().nullable(),
  currentLocationLng: z.number().nullable(),
  
  // Matching Preferences
  preferredAgeMin: z.number().min(18).max(99).nullable(),
  preferredAgeMax: z.number().min(18).max(99).nullable(),
  preferredDistanceKm: z.number().min(1).max(500).nullable(),
  maxDistance: z.number().nullable(),
  minAge: z.number().nullable(),
  maxAge: z.number().nullable(),
  
  // Privacy Settings
  visibilityMode: VisibilityModeEnum,
  whoCanMessage: MessagePrivacyEnum,
  whoCanSeePins: PinVisibilityEnum,
  whoCanSeeProfile: PinVisibilityEnum,
  showActivityStatus: z.boolean(),
  hideLastOnline: z.boolean(),
  
  // Premium Privacy (Ghost Mode)
  ghostMode: z.boolean(),
  incognitoMode: z.boolean(),
  showAvailability: z.boolean(),
  
  // Selective Visibility
  selectiveVisibilityEnabled: z.boolean(),
  visibilityMinAge: z.number().nullable(),
  visibilityMaxAge: z.number().nullable(),
  visibilityRequireInterests: z.boolean(),
  visibilityMinSharedInterests: z.number().nullable(),
  visibilityMaxDistance: z.number().nullable(),
  visibilityMinReputation: z.number().nullable(),
  visibilityPremiumOnly: z.boolean(),
  visibilityHideFromBlocked: z.boolean(),
  
  // Trust & Reputation
  trustScore: z.number().min(0).max(100),
  trustLevel: TrustLevelEnum,
  positiveInteractions: z.number(),
  negativeInteractions: z.number(),
  spamReports: z.number(),
  behaviorFlags: z.number(),
  
  // Subscription
  subscriptionStatus: SubscriptionStatusEnum,
  subscriptionStartedAt: z.string().nullable(),
  subscriptionExpiresAt: z.string().nullable(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  
  // Boost & Features
  boostActive: z.boolean(),
  boostExpiresAt: z.string().nullable(),
  featuredBadgeColor: BadgeColorEnum,
  
  // Activity
  lastActiveAt: z.string().nullable(),
  lastSeenAt: z.string().nullable(),
  
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const updateProfileRequestSchema = z.object({
  handle: z.string().optional(),
  displayName: z.string().optional(),
  bio: z.string().max(300).optional(),
  avatar: z.string().optional(),
  age: z.number().min(18).max(99).optional(),
  gender: GenderEnum.optional(),
  relationshipStatus: RelationshipStatusEnum.optional(),
  openness: OpennessEnum.optional(),
  interests: z.array(z.string()).max(15).optional(),
  lookingFor: z.string().optional(),
  chatReadiness: ChatReadinessEnum.optional(),
  activityIntent: z.string().optional(),
  activityIntentActive: z.boolean().optional(),
  currentLocationLat: z.number().optional(),
  currentLocationLng: z.number().optional(),
  preferredAgeMin: z.number().min(18).max(99).optional(),
  preferredAgeMax: z.number().min(18).max(99).optional(),
  preferredDistanceKm: z.number().min(1).max(500).optional(),
  visibilityMode: VisibilityModeEnum.optional(),
  whoCanMessage: MessagePrivacyEnum.optional(),
  whoCanSeePins: PinVisibilityEnum.optional(),
  whoCanSeeProfile: PinVisibilityEnum.optional(),
  showActivityStatus: z.boolean().optional(),
  hideLastOnline: z.boolean().optional(),
  ghostMode: z.boolean().optional(),
  incognitoMode: z.boolean().optional(),
  selectiveVisibilityEnabled: z.boolean().optional(),
  visibilityMinAge: z.number().optional(),
  visibilityMaxAge: z.number().optional(),
  visibilityRequireInterests: z.boolean().optional(),
  visibilityMinSharedInterests: z.number().optional(),
  visibilityMaxDistance: z.number().optional(),
  visibilityMinReputation: z.number().optional(),
  visibilityPremiumOnly: z.boolean().optional(),
  visibilityHideFromBlocked: z.boolean().optional(),
});

// ============================================================================
// PIN SCHEMAS
// ============================================================================

export const pinSchema = z.object({
  id: z.string(),
  userId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  description: z.string(),
  image: z.string().nullable(),
  likesCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
    avatar: z.string().nullable(),
  }),
});

export const createPinRequestSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  description: z.string().min(1).max(500),
  image: z.string().optional(),
});

export const getPinsRequestSchema = z.object({
  north: z.number(),
  south: z.number(),
  east: z.number(),
  west: z.number(),
  filter: z.enum(['all', '24h', 'week']).optional(),
});

// ============================================================================
// CONVERSATION & MESSAGE SCHEMAS
// ============================================================================

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
  sender: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
    avatar: z.string().nullable(),
  }),
});

export const conversationSchema = z.object({
  id: z.string(),
  participants: z.array(z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
    avatar: z.string().nullable(),
  })),
  lastMessage: messageSchema.nullable(),
  unreadCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const sendMessageRequestSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const createConversationRequestSchema = z.object({
  participantId: z.string(),
  message: z.string().optional(),
});

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const EventCategoryEnum = z.enum(['social', 'dating', 'networking', 'activity', 'other']);

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: EventCategoryEnum,
  image: z.string().nullable(),
  venueName: z.string(),
  venueAddress: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  maxAttendees: z.number().nullable(),
  attendeeCount: z.number(),
  hostId: z.string(),
  host: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createEventRequestSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  category: EventCategoryEnum,
  image: z.string().optional(),
  venueName: z.string().min(1),
  venueAddress: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  startTime: z.string(),
  endTime: z.string().optional(),
  maxAttendees: z.number().min(2).max(500).optional(),
});

export const rsvpRequestSchema = z.object({
  status: z.enum(['going', 'maybe', 'not_going']),
});

// ============================================================================
// FORUM SCHEMAS
// ============================================================================

export const forumThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  venueName: z.string(),
  venueType: z.string().nullable(),
  postCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
});

export const forumPostSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
});

export const createForumThreadRequestSchema = z.object({
  title: z.string().min(1).max(200),
  venueName: z.string().min(1),
  venueType: z.string().optional(),
  initialPost: z.string().min(1).max(2000),
});

export const createForumPostRequestSchema = z.object({
  content: z.string().min(1).max(2000),
});

// ============================================================================
// MINGLE (PLANNED MEETUP) SCHEMAS
// ============================================================================

export const MingleStatusEnum = z.enum(['scheduled', 'live', 'ended', 'cancelled']);

export const mingleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  intentCard: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  locationName: z.string().nullable(),
  radius: z.number(),
  startTime: z.string(),
  duration: z.number(),
  endTime: z.string(),
  status: MingleStatusEnum,
  maxParticipants: z.number().nullable(),
  participantCount: z.number(),
  isRecurring: z.boolean(),
  isPremiumOnly: z.boolean(),
  viewCount: z.number(),
  hostId: z.string(),
  host: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
  createdAt: z.string(),
});

export const createMingleRequestSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  intentCard: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  locationName: z.string().optional(),
  radius: z.number().min(50).max(5000),
  startTime: z.string(),
  duration: z.number().min(15).max(90),
  maxParticipants: z.number().min(2).max(50).optional(),
  isRecurring: z.boolean().optional(),
  isPremiumOnly: z.boolean().optional(),
});

export const mingleRsvpRequestSchema = z.object({
  status: z.enum(['interested', 'confirmed', 'declined']),
});

// ============================================================================
// MATCHING SCHEMAS
// ============================================================================

export const smartMatchSchema = z.object({
  pin: pinSchema,
  matchScore: z.number(),
  commonInterests: z.array(z.string()),
  distance: z.number().nullable(),
});

export const matchingPreferencesSchema = z.object({
  maxDistance: z.number().min(1).max(500),
  minAge: z.number().min(18).max(99).nullable(),
  maxAge: z.number().min(18).max(99).nullable(),
});

// ============================================================================
// VIDEO CALL SCHEMAS
// ============================================================================

export const VideoCallStatusEnum = z.enum(['pending', 'active', 'ended', 'missed', 'declined']);

export const videoCallSchema = z.object({
  id: z.string(),
  callerId: z.string(),
  receiverId: z.string(),
  status: VideoCallStatusEnum,
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  duration: z.number().nullable(),
  createdAt: z.string(),
});

export const initiateCallRequestSchema = z.object({
  receiverId: z.string(),
});

// ============================================================================
// VIDEO ROOM (GROUP CALL) SCHEMAS
// ============================================================================

export const VideoRoomStatusEnum = z.enum(['waiting', 'active', 'ended']);

export const videoRoomSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  hostId: z.string(),
  status: VideoRoomStatusEnum,
  maxParticipants: z.number(),
  participantCount: z.number(),
  isPremiumOnly: z.boolean(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: z.string(),
});

export const createVideoRoomRequestSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  maxParticipants: z.number().min(2).max(10),
  isPremiumOnly: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// ============================================================================
// STREAK & GAMIFICATION SCHEMAS
// ============================================================================

export const streakSchema = z.object({
  id: z.string(),
  streakType: z.enum(['login', 'social', 'explorer', 'event']),
  currentStreak: z.number(),
  longestStreak: z.number(),
  lastActivityDate: z.string().nullable(),
  totalActivities: z.number(),
});

export const streaksResponseSchema = z.object({
  streaks: z.array(streakSchema),
  totalScore: z.number(),
  bestStreak: z.number(),
});

// ============================================================================
// TRUST SCORE SCHEMAS
// ============================================================================

export const trustScoreSchema = z.object({
  trustScore: z.number(),
  trustLevel: TrustLevelEnum,
  positiveInteractions: z.number(),
  negativeInteractions: z.number(),
  spamReports: z.number(),
  behaviorFlags: z.number(),
  benefits: z.object({
    visibilityMultiplier: z.number(),
    priorityPlacement: z.boolean(),
    featuresAccess: z.array(z.string()),
  }),
});

// ============================================================================
// HOTSPOT SCHEMAS
// ============================================================================

export const hotspotSchema = z.object({
  id: z.string(),
  geohash: z.string(),
  centerLat: z.number(),
  centerLng: z.number(),
  activeUsers: z.number(),
  totalActivity: z.number(),
  trendScore: z.number(),
  peakHour: z.number().nullable(),
  lastUpdated: z.string(),
});

export const getHotspotsRequestSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radiusKm: z.number().min(1).max(50).optional(),
  timeWindow: z.enum(['1h', '6h', '24h', '7d', '30d']).optional(),
});

// ============================================================================
// PROXIMITY ALERT SCHEMAS
// ============================================================================

export const proximityAlertSchema = z.object({
  id: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  radiusMeters: z.number(),
  isActive: z.boolean(),
  minAge: z.number().nullable(),
  maxAge: z.number().nullable(),
  gender: GenderEnum.nullable(),
  interests: z.array(z.string()),
  activityIntent: z.string().nullable(),
  minTrustScore: z.number().nullable(),
  cooldownMinutes: z.number(),
  maxAlertsPerDay: z.number(),
  alertsToday: z.number(),
  lastTriggeredAt: z.string().nullable(),
  createdAt: z.string(),
});

export const createProximityAlertRequestSchema = z.object({
  name: z.string().min(1).max(50),
  latitude: z.number(),
  longitude: z.number(),
  radiusMeters: z.number().min(100).max(5000),
  minAge: z.number().min(18).max(99).optional(),
  maxAge: z.number().min(18).max(99).optional(),
  gender: GenderEnum.optional(),
  interests: z.array(z.string()).max(5).optional(),
  activityIntent: z.string().optional(),
  minTrustScore: z.number().min(0).max(100).optional(),
  cooldownMinutes: z.number().min(15).max(1440).optional(),
  maxAlertsPerDay: z.number().min(1).max(50).optional(),
});

// ============================================================================
// ICEBREAKER SCHEMAS
// ============================================================================

export const icebreakerRequestSchema = z.object({
  targetUserId: z.string(),
  context: z.object({
    location: z.string().optional(),
    activityIntent: z.string().optional(),
  }).optional(),
});

export const icebreakerResponseSchema = z.object({
  icebreaker: z.string(),
  commonInterests: z.array(z.string()),
  isLocationAware: z.boolean(),
  isPersonalized: z.boolean(),
});

// ============================================================================
// SUBSCRIPTION SCHEMAS
// ============================================================================

export const subscriptionStatusResponseSchema = z.object({
  status: SubscriptionStatusEnum,
  trialDaysRemaining: z.number().nullable(),
  expiresAt: z.string().nullable(),
  features: z.array(z.string()),
});

export const checkoutSessionResponseSchema = z.object({
  checkoutUrl: z.string(),
  sessionId: z.string(),
});

// ============================================================================
// SAFETY SCHEMAS
// ============================================================================

export const blockUserRequestSchema = z.object({
  reason: z.string().optional(),
});

export const reportUserRequestSchema = z.object({
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'fake', 'other']),
  description: z.string().max(500).optional(),
});

export const blockedUserSchema = z.object({
  id: z.string(),
  blockedUserId: z.string(),
  blockedUser: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
  blockedAt: z.string(),
});

// ============================================================================
// ACTIVITY INTENT OPTIONS
// ============================================================================

export const ACTIVITY_INTENTS = [
  { id: 'walk_and_talk', label: 'Walk and talk', emoji: '🚶' },
  { id: 'dog_owners', label: 'Dog owners welcome', emoji: '🐕' },
  { id: 'coffee_chat', label: 'Coffee chat', emoji: '☕' },
  { id: 'workout_buddy', label: 'Workout buddy', emoji: '💪' },
  { id: 'brainstorm', label: 'Brainstorm session', emoji: '💡' },
  { id: 'deep_conversation', label: 'Deep conversation only', emoji: '🧠' },
  { id: 'casual_hangout', label: 'Casual hangout', emoji: '😎' },
  { id: 'food', label: 'Looking for food', emoji: '🍕' },
  { id: 'study', label: 'Study session', emoji: '📚' },
  { id: 'photography', label: 'Photography walk', emoji: '📷' },
  { id: 'music', label: 'Live music', emoji: '🎵' },
  { id: 'bar_hopping', label: 'Bar hopping', emoji: '🍻' },
  { id: 'creative', label: 'Creative collaboration', emoji: '🎨' },
  { id: 'exploring', label: 'Just exploring', emoji: '🗺️' },
  { id: 'networking', label: 'Professional networking', emoji: '💼' },
  { id: 'language', label: 'Language exchange', emoji: '🗣️' },
  { id: 'gaming', label: 'Gaming meetup', emoji: '🎮' },
  { id: 'art_culture', label: 'Art and culture', emoji: '🏛️' },
] as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = z.infer<typeof userSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type Pin = z.infer<typeof pinSchema>;
export type CreatePinRequest = z.infer<typeof createPinRequestSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;
export type Event = z.infer<typeof eventSchema>;
export type CreateEventRequest = z.infer<typeof createEventRequestSchema>;
export type ForumThread = z.infer<typeof forumThreadSchema>;
export type ForumPost = z.infer<typeof forumPostSchema>;
export type Mingle = z.infer<typeof mingleSchema>;
export type CreateMingleRequest = z.infer<typeof createMingleRequestSchema>;
export type SmartMatch = z.infer<typeof smartMatchSchema>;
export type VideoCall = z.infer<typeof videoCallSchema>;
export type VideoRoom = z.infer<typeof videoRoomSchema>;
export type Streak = z.infer<typeof streakSchema>;
export type TrustScore = z.infer<typeof trustScoreSchema>;
export type Hotspot = z.infer<typeof hotspotSchema>;
export type ProximityAlert = z.infer<typeof proximityAlertSchema>;
export type IcebreakerRequest = z.infer<typeof icebreakerRequestSchema>;
export type IcebreakerResponse = z.infer<typeof icebreakerResponseSchema>;
export type SubscriptionStatusResponse = z.infer<typeof subscriptionStatusResponseSchema>;
export type BlockedUser = z.infer<typeof blockedUserSchema>;
export type Gender = z.infer<typeof GenderEnum>;
export type RelationshipStatus = z.infer<typeof RelationshipStatusEnum>;
export type Openness = z.infer<typeof OpennessEnum>;
export type ChatReadiness = z.infer<typeof ChatReadinessEnum>;
export type VisibilityMode = z.infer<typeof VisibilityModeEnum>;
export type TrustLevel = z.infer<typeof TrustLevelEnum>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;
export type EventCategory = z.infer<typeof EventCategoryEnum>;
export type MingleStatus = z.infer<typeof MingleStatusEnum>;
export type VideoCallStatus = z.infer<typeof VideoCallStatusEnum>;
export type VideoRoomStatus = z.infer<typeof VideoRoomStatusEnum>;
