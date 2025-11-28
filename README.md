# Map Mingle 🗺️💬

A location-based social app for meeting new people and discovering activities nearby. Built with React Native (Expo) and Node.js.

## Features

### 🗺️ Map & Discovery
- **Interactive Map** - View pins, events, and people nearby
- **Pin Clustering** - Optimized performance with automatic clustering
- **Hotspots** - Discover popular areas with high activity
- **Real-time Updates** - See new pins and users as they appear
- **First-Time Tutorial** - Interactive walkthrough for new users

### 👥 Social Features
- **User Profiles** - Customizable profiles with interests and activity intent
- **Wave/Poke System** - Quick way to express interest
- **Proximity Alerts** - Get notified when interesting people are nearby
- **Icebreaker Suggestions** - AI-powered conversation starters
- **Chat Readiness** - Show your availability (Open, Maybe, Busy)
- **Trust Score** - Build reputation through positive interactions

### 📍 Pins & Activities
- **Drop Pins** - Share your location and what you're doing
- **Pin Categories** - Social, Food, Sports, Music, Travel, Gaming, Art, Study
- **Pin Interactions** - Like, comment, and save pins
- **Time Filters** - View pins from last 24h, week, or all time

### 📅 Events & Mingles
- **Create Events** - Plan and organize meetups
- **Mingles** - Spontaneous activities (Coffee, Lunch, Walk, etc.)
- **RSVP System** - Track attendees and manage capacity
- **Event Discovery** - Find events by category and location

### 💬 Messaging
- **Real-time Chat** - Instant messaging with WebSocket
- **Location Sharing** - Share current or live location
- **Video Calls** - Face-to-face communication
- **Icebreakers** - Contextual conversation starters

### 🏆 Gamification
- **Streak System** - Maintain daily activity streaks
- **Milestones** - Earn badges for achievements
- **Trust Score** - Build reputation over time
- **Celebrations** - Animated rewards for milestones

### 🔒 Safety & Privacy
- **Ghost Mode** - Browse invisibly (Premium)
- **Block/Report** - Safety tools for unwanted interactions
- **Privacy Controls** - Manage who can see your profile
- **Verified Badges** - Identity verification

### 💎 Premium Features
- Ghost Mode
- See Who Viewed You
- Unlimited Likes
- Profile Boost
- Priority Support
- Exclusive Badge

## Tech Stack

### Mobile App
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: Zustand
- **Maps**: react-native-maps
- **Real-time**: WebSocket
- **Animations**: React Native Animated API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js / Hono
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT with refresh tokens
- **Real-time**: WebSocket (ws)
- **Payments**: Stripe
- **Push Notifications**: Expo Notifications

## Project Structure

```
mapmingle/
├── apps/
│   ├── mobile/                 # React Native Expo app
│   │   ├── app/               # Expo Router screens
│   │   │   ├── (auth)/        # Authentication screens
│   │   │   ├── (tabs)/        # Main tab screens
│   │   │   ├── onboarding/    # Onboarding flow
│   │   │   ├── settings/      # Settings screens
│   │   │   ├── chat/          # Chat screens
│   │   │   ├── pin/           # Pin detail screens
│   │   │   ├── event/         # Event screens
│   │   │   ├── mingle/        # Mingle screens
│   │   │   ├── profile/       # Profile screens
│   │   │   ├── video-call/    # Video call UI
│   │   │   └── forums/        # Community forums
│   │   ├── src/
│   │   │   ├── components/    # Reusable components
│   │   │   ├── lib/           # Utilities & services
│   │   │   ├── stores/        # Zustand stores
│   │   │   └── constants/     # App constants
│   │   └── assets/            # Images, fonts, etc.
│   │
│   └── backend/               # Node.js API server
│       ├── src/
│       │   ├── routes/        # API routes
│       │   └── index.ts       # Entry point
│       └── prisma/            # Database schema
│
└── packages/
    └── contracts/             # Shared TypeScript types
```

## Complete Screen List

### Authentication (3 screens)
- Login
- Register  
- Forgot Password

### Onboarding (10 screens)
- Welcome
- Profile Basics
- Demographics
- Interests Selection
- Looking For
- Activity Intent
- Privacy Settings
- Permissions
- Complete
- Layout

### Main Tabs (5 screens)
- Map (Home)
- Events
- Activity Feed
- Messages
- Profile

### Settings (8 screens)
- Edit Profile
- Privacy & Safety
- Notifications
- Subscription/Premium
- Saved Pins
- Blocked Users
- Account
- Help & Support

### Feature Screens (15+ screens)
- Create Pin
- Create Event
- Create Mingle
- Pin Detail
- Event Detail
- Mingle Detail
- User Profile
- Chat Conversation
- Video Call
- User Search
- Community Forums (Index)
- Forum Post Detail
- Create Forum Post
- Splash

## Components (20+)

### Map Components
- `ClusteredMapView` - Map with automatic pin clustering
- `MapTutorialOverlay` - Interactive first-time user tutorial

### User Interaction
- `NearbyUsersSheet` - Draggable bottom sheet with nearby users
- `ProximityAlert` - Push-style notification for nearby users
- `WaveButton` - Animated wave/poke button
- `WaveReceivedToast` - Toast notification when receiving waves
- `QuickActionsMenu` - Context menu for user interactions
- `IcebreakerSuggestion` - Contextual conversation starters

### Communication
- `LocationShareModal` - Share current/live location
- `LocationMessage` - Location bubble in chat
- `ReportModal` - Report users or content

### Gamification
- `StreakBadge` - Visual streak counter with tiers
- `StreakModal` - Detailed streak information
- `StreakCelebration` - Full-screen milestone animation

### Utilities
- `HapticButton` - Button with haptic feedback
- `ImagePickerModal` - Camera/library photo picker
- `EditableAvatar` - Avatar with edit overlay

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mapmingle.git
cd mapmingle

# Install root dependencies
npm install

# Install mobile app dependencies
cd apps/mobile
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Running the App

```bash
# Start the backend server
cd apps/backend
npm run dev

# In a new terminal, start the mobile app
cd apps/mobile
npx expo start

# Press 'i' for iOS simulator or 'a' for Android emulator
```

### Environment Variables

**Mobile (`apps/mobile/.env`):**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
```

**Backend (`apps/backend/.env`):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mapmingle
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## API Overview

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/refresh` - Refresh JWT
- `POST /api/auth/logout` - Sign out
- `POST /api/auth/reset-password` - Password reset

### Users & Profiles
- `GET /api/profile` - Get own profile
- `PUT /api/profile` - Update profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/nearby` - Nearby users
- `GET /api/users/search` - Search users
- `POST /api/users/:id/wave` - Wave at user
- `POST /api/users/:id/block` - Block user

### Pins
- `GET /api/pins` - Get pins in viewport
- `POST /api/pins` - Create pin
- `GET /api/pins/:id` - Pin details
- `POST /api/pins/:id/like` - Like pin
- `POST /api/pins/:id/save` - Save pin
- `DELETE /api/pins/:id` - Delete pin

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Event details
- `POST /api/events/:id/rsvp` - RSVP

### Mingles
- `GET /api/mingles` - List mingles
- `POST /api/mingles` - Create mingle
- `POST /api/mingles/:id/join` - Join
- `POST /api/mingles/:id/leave` - Leave

### Conversations
- `GET /api/conversations` - List chats
- `POST /api/conversations` - Start chat
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message

### Forums
- `GET /api/forums/posts` - List posts
- `POST /api/forums/posts` - Create post
- `GET /api/forums/posts/:id` - Post detail
- `POST /api/forums/posts/:id/comments` - Comment
- `POST /api/forums/posts/:id/like` - Like post

### Other
- `GET /api/hotspots` - Popular areas
- `GET /api/streaks` - User streaks
- `POST /api/reports` - Report content
- `POST /api/notifications/register` - Push token
- `POST /api/subscription/checkout` - Stripe checkout

## Database Schema

Key models in Prisma schema:

- **User** - User accounts and profiles
- **Pin** - Location-based posts
- **Event** - Scheduled meetups
- **Mingle** - Spontaneous activities
- **Conversation** - Chat threads
- **Message** - Chat messages
- **ForumPost** - Community posts
- **Comment** - Post comments
- **Wave** - User interactions
- **Streak** - Activity streaks
- **Subscription** - Premium subscriptions

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) file

## Support

- 📧 Email: support@mapmingle.app
- 🌐 Website: https://mapmingle.app
- 🐦 Twitter: @mapmingle

---

Built with ❤️ for connecting people in the real world
