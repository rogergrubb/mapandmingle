// Core Types for MapMingle Web
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  interests: string[];
  activityIntent?: string;
  lookingFor: string[];
  chatReadiness: 'open' | 'maybe' | 'busy';
  trustScore: number;
  isPremium: boolean;
  isVerified: boolean;
  streak: number;
  createdAt: string;
  lastActive: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Pin {
  id: string;
  userId: string;
  user?: User;
  latitude: number;
  longitude: number;
  category: PinCategory;
  title: string;
  description?: string;
  image?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
  expiresAt?: string;
}

export type PinCategory = 
  | 'social'
  | 'food'
  | 'sports'
  | 'music'
  | 'travel'
  | 'gaming'
  | 'art'
  | 'study';

export interface Event {
  id: string;
  userId: string;
  user?: User;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  startTime: string;
  endTime?: string;
  capacity?: number;
  attendees: number;
  isAttending?: boolean;
  image?: string;
  createdAt: string;
}

export interface Mingle {
  id: string;
  userId: string;
  user?: User;
  type: 'coffee' | 'lunch' | 'walk' | 'workout' | 'study' | 'other';
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  when: 'now' | 'soon' | 'later';
  participants: number;
  maxParticipants?: number;
  isJoined?: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  type: 'text' | 'location' | 'image';
  metadata?: {
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
  };
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface ForumPost {
  id: string;
  userId: string;
  user?: User;
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface Hotspot {
  latitude: number;
  longitude: number;
  intensity: number;
  radius: number;
}

export interface Notification {
  id: string;
  type: 'wave' | 'proximity' | 'message' | 'event' | 'milestone';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface Milestone {
  id: string;
  type: 'streak' | 'pins' | 'events' | 'connections';
  title: string;
  description: string;
  icon: string;
  achieved: boolean;
  progress: number;
  target: number;
}
