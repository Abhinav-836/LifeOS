## 📱 About LifeOS

LifeOS is a comprehensive productivity application designed to help you manage your daily tasks, build positive habits, track focus sessions, capture ideas, and gain insights into your productivity patterns. With a beautiful, modern UI and real-time synchronization, LifeOS is your companion for personal growth and productivity.

### ✨ Features

#### ✅ Task Management
- Create, edit, and delete tasks with priority levels (High/Medium/Low)
- Organize tasks by categories (Work, Personal, Shopping, Health, Other)
- Filter tasks by status (Active/Completed/All) and categories
- Swipe to edit or delete tasks
- Real-time task completion tracking

#### 🔄 Habit Tracking
- Build and track daily habits
- Visual weekly calendar with habit completion tracking
- Streak tracking (current and best streaks)
- Color-coded habits with custom icons
- Weekly progress charts

#### 🎯 Focus Timer
- Customizable timer (5, 15, 25, 45 minutes)
- Animated timer with visual feedback
- Session history tracking
- Daily and weekly focus statistics
- Focus tips to improve concentration

#### 💡 Idea Vault
- Capture ideas, thoughts, and notes
- Categorize ideas (Startup, Business, Thought, Note, Other)
- Favorite important ideas
- Share ideas with others
- Edit and delete ideas

#### 📊 Analytics & Insights
- Real-time productivity score (Tasks + Focus)
- Weekly habit completion charts
- Daily focus time tracking
- Tasks by priority visualization
- Personalized productivity insights

#### 👤 Profile & Settings
- View your productivity statistics
- Export/Import data functionality
- Clear all data option
- Dark/Light mode support (coming soon)

### 🚀 Quick Start

#### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Expo Go app on your phone (iOS/Android)

#### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/lifeos.git
cd lifeos
Install dependencies

bash
npm install
Start the development server

bash
npx expo start -c
Run on your device

Scan the QR code with Expo Go (Android)

Scan the QR code with Camera app (iOS)

Or press a for Android emulator, i for iOS simulator

📁 Project Structure
text
lifeos/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation
│   │   ├── index.tsx            # Dashboard
│   │   ├── tasks.tsx            # Tasks management
│   │   ├── habits.tsx           # Habits tracking
│   │   ├── focus.tsx            # Focus timer
│   │   ├── ideas.tsx            # Idea vault
│   │   ├── analytics.tsx        # Analytics & insights
│   │   └── profile.tsx          # User profile
│   ├── _layout.tsx              # Root layout
│   └── modal.tsx                # Modal screen
├── components/
│   ├── ui/
│   │   └── icon-symbol.tsx      # Icon mappings
│   ├── ErrorBoundary.tsx        # Error handling
│   └── Themed.tsx               # Themed components
├── constants/
│   └── theme.ts                 # Theme constants
├── context/
│   ├── ThemeContext.tsx         # Theme management
│   └── NotificationContext.tsx  # Notifications
├── hooks/
│   └── useThemeColor.ts         # Theme color hook
└── assets/                      # Images and sounds
🎨 Tech Stack
Technology	Purpose
React Native	Mobile app framework
Expo	Development platform
TypeScript	Type safety
React Navigation	Navigation
AsyncStorage	Local data persistence
Reanimated 3	Animations
React Native Chart Kit	Data visualization
date-fns	Date manipulation
Expo Haptics	Haptic feedback
Expo Router	File-based routing
🔧 Available Scripts
bash
# Start development server
npm start

# Start on Android
npm run android

# Start on iOS
npm run ios

# Start on Web
npm run web

# Run linting
npm run lint

# Reset project
npm run reset-project
📱 Key Features in Detail
Productivity Score
50% based on completed tasks

50% based on focus time (up to 10 hours)

Real-time updates

Daily Reset
Completed tasks are automatically cleaned up after 24 hours

Keeps your task list fresh and manageable

Data Persistence
All data is stored locally using AsyncStorage

No internet connection required

Export/Import backup functionality

🐛 Troubleshooting
Common Issues
Metro bundler errors

bash
npx expo start -c
Node modules issues

bash
rm -rf node_modules package-lock.json
npm install
iOS specific issues (Mac only)

bash
cd ios && pod install && cd ..
Clear all app data

Go to Profile → Clear All Data

📈 Roadmap
Cloud sync and backup

Push notifications for reminders

Widget support

More chart types and insights

Social sharing features

Custom themes

Voice input for ideas

Task collaboration

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.