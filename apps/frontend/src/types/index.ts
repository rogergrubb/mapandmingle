// Core Types for MapMingle Web
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
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
  // Campus Layer fields
  primarySchool?: string;
  schoolRole?: 'student' | 'faculty' | 'staff' | 'alum' | 'parent';
  gradYear?: number;
  schoolVerified?: boolean;
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
  address?: string;
  tags?: string[];
  image?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isActive?: boolean;      // true if user active within 24h
  lastActiveAt?: string;   // ISO timestamp of last activity
  arrivalTime?: string;    // ISO timestamp for "Where I'll Be" pins
  pinType?: 'current' | 'future';  // current = "Where I'm At", future = "Where I'll Be"
  createdAt: string;
  expiresAt?: string;
  createdBy?: {            // Populated user info for pin creator
    id: string;
    name: string;
    avatar?: string;
  };
}

export type PinCategory = 
  | 'social'
  | 'food'
  | 'entertainment'
  | 'outdoors'
  | 'sports'
  | 'music'
  | 'culture'
  | 'nightlife'
  | 'shopping'
  | 'community'
  | 'travel'
  | 'gaming'
  | 'art'
  | 'study'
  | 'other';

export interface Event {
  id: string;
  userId: string;
  user?: User;
  host: User;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  location: string;
  address?: string;
  date: Date;
  time: string;
  startTime: string;
  endTime?: string;
  maxAttendees?: number;
  capacity?: number;
  attendeeCount: number;
  attendees: number;
  isAttending?: boolean;
  isPublic: boolean;
  image?: string;
  schoolAffiliation?: string;  // Campus Layer
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
  createdAt: Date;
  read: boolean;
  isRead: boolean;
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
