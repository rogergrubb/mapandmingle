// App-wide constants and configuration

export const APP_CONFIG = {
  name: 'Map Mingle',
  version: '1.0.0',
  description: 'Connect with people nearby',
  supportEmail: 'support@mapmingle.app',
  website: 'https://mapmingle.app',
  termsUrl: 'https://mapmingle.app/terms',
  privacyUrl: 'https://mapmingle.app/privacy',
};

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.mapmingle.app',
  timeout: 30000,
  retryAttempts: 3,
};

// WebSocket Configuration
export const WS_CONFIG = {
  url: process.env.EXPO_PUBLIC_WS_URL || 'wss://ws.mapmingle.app',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
};

// Map Configuration
export const MAP_CONFIG = {
  defaultLatitude: 37.78825,
  defaultLongitude: -122.4324,
  defaultLatitudeDelta: 0.01,
  defaultLongitudeDelta: 0.01,
  maxPinsPerView: 100,
  clusterRadius: 50, // pixels
  minClusterSize: 2,
};

// Theme Colors
export const COLORS = {
  primary: {
    50: '#FFF1F3',
    100: '#FFE0E6',
    200: '#FFC7D3',
    300: '#FFA3B5',
    400: '#FF7A93',
    500: '#FF6B9D', // Main primary
    600: '#E84D7C',
    700: '#C83761',
    800: '#A62D50',
    900: '#8A2744',
  },
  secondary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316', // Main secondary
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// Chat Readiness Options
export const CHAT_READINESS = {
  open: {
    label: 'Open to chat',
    description: 'I\'m happy to meet new people!',
    color: '#22C55E',
    icon: 'chatbubble',
  },
  maybe: {
    label: 'Maybe later',
    description: 'Depends on the vibe',
    color: '#F59E0B',
    icon: 'time',
  },
  busy: {
    label: 'Busy',
    description: 'Not looking to chat right now',
    color: '#EF4444',
    icon: 'close-circle',
  },
} as const;

// Activity Types
export const ACTIVITY_TYPES = {
  coffee: { label: 'Coffee', icon: 'cafe', color: '#8B4513' },
  lunch: { label: 'Lunch', icon: 'restaurant', color: '#F97316' },
  drinks: { label: 'Drinks', icon: 'beer', color: '#F59E0B' },
  walk: { label: 'Walk', icon: 'walk', color: '#22C55E' },
  workout: { label: 'Workout', icon: 'fitness', color: '#EF4444' },
  study: { label: 'Study', icon: 'book', color: '#3B82F6' },
  cowork: { label: 'Cowork', icon: 'laptop', color: '#8B5CF6' },
  explore: { label: 'Explore', icon: 'compass', color: '#06B6D4' },
  games: { label: 'Games', icon: 'game-controller', color: '#EC4899' },
  custom: { label: 'Custom', icon: 'sparkles', color: '#FF6B9D' },
} as const;

// Pin Categories
export const PIN_CATEGORIES = {
  social: { label: 'Social', icon: 'people', color: '#FF6B9D' },
  food: { label: 'Food', icon: 'restaurant', color: '#F97316' },
  sports: { label: 'Sports', icon: 'basketball', color: '#22C55E' },
  music: { label: 'Music', icon: 'musical-notes', color: '#8B5CF6' },
  travel: { label: 'Travel', icon: 'airplane', color: '#06B6D4' },
  gaming: { label: 'Gaming', icon: 'game-controller', color: '#EAB308' },
  art: { label: 'Art', icon: 'color-palette', color: '#EC4899' },
  study: { label: 'Study', icon: 'book', color: '#3B82F6' },
} as const;

// Interests (for onboarding and profile)
export const INTERESTS = [
  { id: 'coffee', label: 'Coffee ☕', category: 'food' },
  { id: 'hiking', label: 'Hiking 🥾', category: 'outdoors' },
  { id: 'photography', label: 'Photography 📷', category: 'creative' },
  { id: 'gaming', label: 'Gaming 🎮', category: 'entertainment' },
  { id: 'reading', label: 'Reading 📚', category: 'creative' },
  { id: 'music', label: 'Music 🎵', category: 'creative' },
  { id: 'movies', label: 'Movies 🎬', category: 'entertainment' },
  { id: 'cooking', label: 'Cooking 👨‍🍳', category: 'food' },
  { id: 'fitness', label: 'Fitness 💪', category: 'health' },
  { id: 'yoga', label: 'Yoga 🧘', category: 'health' },
  { id: 'travel', label: 'Travel ✈️', category: 'lifestyle' },
  { id: 'art', label: 'Art 🎨', category: 'creative' },
  { id: 'dogs', label: 'Dogs 🐕', category: 'pets' },
  { id: 'cats', label: 'Cats 🐱', category: 'pets' },
  { id: 'tech', label: 'Tech 💻', category: 'professional' },
  { id: 'startups', label: 'Startups 🚀', category: 'professional' },
  { id: 'foodie', label: 'Foodie 🍕', category: 'food' },
  { id: 'wine', label: 'Wine 🍷', category: 'food' },
  { id: 'craft_beer', label: 'Craft Beer 🍺', category: 'food' },
  { id: 'sports', label: 'Sports ⚽', category: 'outdoors' },
  { id: 'dancing', label: 'Dancing 💃', category: 'entertainment' },
  { id: 'concerts', label: 'Concerts 🎤', category: 'entertainment' },
  { id: 'board_games', label: 'Board Games 🎲', category: 'entertainment' },
  { id: 'languages', label: 'Languages 🌍', category: 'learning' },
  { id: 'meditation', label: 'Meditation 🧠', category: 'health' },
  { id: 'volunteering', label: 'Volunteering 🤝', category: 'social' },
  { id: 'networking', label: 'Networking 🤝', category: 'professional' },
  { id: 'writing', label: 'Writing ✍️', category: 'creative' },
  { id: 'podcasts', label: 'Podcasts 🎧', category: 'entertainment' },
  { id: 'running', label: 'Running 🏃', category: 'health' },
];

// Looking For Options
export const LOOKING_FOR = [
  { id: 'friends', label: 'New Friends', icon: 'people', color: '#FF6B9D' },
  { id: 'networking', label: 'Networking', icon: 'briefcase', color: '#3B82F6' },
  { id: 'dating', label: 'Dating', icon: 'heart', color: '#EF4444' },
  { id: 'activities', label: 'Activity Partners', icon: 'basketball', color: '#22C55E' },
  { id: 'coworking', label: 'Coworking', icon: 'laptop', color: '#8B5CF6' },
  { id: 'language', label: 'Language Exchange', icon: 'chatbubbles', color: '#F59E0B' },
];

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Ghost Mode',
      'See Who Viewed You',
      'Unlimited Likes',
      'Priority Support',
    ],
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly',
    price: 39.99,
    currency: 'USD',
    interval: 'year',
    savings: '33%',
    features: [
      'All Monthly Features',
      'Exclusive Badge',
      'Early Access to Features',
      'Profile Boost',
    ],
  },
};

// Streak Milestones
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

// Trust Score Levels
export const TRUST_LEVELS = {
  new: { min: 0, max: 25, label: 'New', color: '#9CA3AF' },
  starter: { min: 26, max: 50, label: 'Starter', color: '#F59E0B' },
  trusted: { min: 51, max: 75, label: 'Trusted', color: '#22C55E' },
  verified: { min: 76, max: 100, label: 'Verified', color: '#3B82F6' },
};

// Report Reasons
export const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or Bullying' },
  { id: 'inappropriate', label: 'Inappropriate Content' },
  { id: 'spam', label: 'Spam or Scam' },
  { id: 'impersonation', label: 'Impersonation' },
  { id: 'safety', label: 'Safety Concern' },
  { id: 'other', label: 'Other' },
];

// Forum Categories
export const FORUM_CATEGORIES = [
  { id: 'general', name: 'General', icon: 'chatbubbles', color: '#3B82F6' },
  { id: 'meetups', name: 'Meetups', icon: 'people', color: '#FF6B9D' },
  { id: 'events', name: 'Events', icon: 'calendar', color: '#F59E0B' },
  { id: 'places', name: 'Places', icon: 'location', color: '#22C55E' },
  { id: 'tips', name: 'Tips', icon: 'bulb', color: '#8B5CF6' },
  { id: 'questions', name: 'Q&A', icon: 'help-circle', color: '#06B6D4' },
];

// Animation Durations (in ms)
export const ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Storage Keys
export const STORAGE_KEYS = {
  authToken: '@mapmingle_auth_token',
  refreshToken: '@mapmingle_refresh_token',
  user: '@mapmingle_user',
  onboardingComplete: '@mapmingle_onboarding_complete',
  mapTutorialComplete: '@mapmingle_map_tutorial_complete',
  notificationSettings: '@mapmingle_notification_settings',
  recentSearches: '@mapmingle_recent_searches',
};

export default {
  APP_CONFIG,
  API_CONFIG,
  WS_CONFIG,
  MAP_CONFIG,
  COLORS,
  CHAT_READINESS,
  ACTIVITY_TYPES,
  PIN_CATEGORIES,
  INTERESTS,
  LOOKING_FOR,
  SUBSCRIPTION_PLANS,
  STREAK_MILESTONES,
  TRUST_LEVELS,
  REPORT_REASONS,
  FORUM_CATEGORIES,
  ANIMATIONS,
  STORAGE_KEYS,
};
