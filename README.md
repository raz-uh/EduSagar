# EduSagar Nepal - AI-Powered E-Learning Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E.svg)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)](#-deployment)

> An intelligent, multilingual AI-powered learning platform with gamification, Web3 integration, and real-time progress tracking. Built for students in Nepal and beyond.

## 🌟 Features

### 🤖 AI-Powered Learning
- **Auto-generated courses** using Google Gemini API
- **Intelligent content** tailored to learning objectives  
- **Audio lessons** via text-to-speech technology
- **Smart Q&A** with contextual guru bot responses
- **Learning bridges** for error correction and concept reinforcement

### 🎮 Gamification System
- **Points & Badges** - Earn 40+ achievement badges
- **Weekly Rewards** - Bonus 50 points for 100+ weekly points
- **Monthly Challenges** - Extra 300 points for 500+ monthly points
- **Streak Tracking** - Daily learning multiplier (1.1x to 1.5x)
- **Live Leaderboard** - Compete with top 100 learners
- **Real-time Progress** - Visual progress bars and notifications

### 🔐 Authentication & Security
- **Secure Sign-up/Sign-in** - Email/password with hashing
- **Password Recovery** - Email-based account recovery
- **Session Management** - JWT tokens with automatic expiry
- **Profile Customization** - Name, avatar, language preferences
- **Multi-user Support** - Data isolation per user
- **Row-Level Security** - Database-enforced access control

### 🌍 Multilingual & Accessibility
- **English & Nepali** - Full i18n support
- **Responsive Design** - Mobile, tablet, desktop optimized
- **Low-Data Mode** - Optimized for slow connections
- **Offline Support** - Export courses for offline learning

### 🔗 Web3 Integration
- **Wallet Connection** - MetaMask and WalletConnect support
- **Soulbound Tokens** - Verifiable learning credentials
- **On-Chain Verification** - Immutable achievement records

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** or **yarn** package manager
- **Supabase** account (free tier available)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/edusagar.git
cd edusagar

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
```

### Configuration

**Get Supabase Credentials:**
1. Visit [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and anon key to `.env.local`

**Get Gemini API Key:**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key
3. Add to `.env.local`

### Running Locally

```bash
# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
edusagar/
├── src/
│   ├── App.tsx                      # Main app component (705 lines)
│   ├── index.tsx                    # React entry point
│   ├── translations.ts              # i18n (EN/NP)
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   ├── components/
│   │   ├── AuthPage.tsx             # Sign up/in UI (222 lines)
│   │   ├── ForgotPasswordPage.tsx    # Password recovery (130 lines)
│   │   └── ProfileEditPage.tsx       # Profile editor (200 lines)
│   └── services/
│       ├── authService.ts           # Authentication (183 lines)
│       ├── geminiService.ts          # AI integration (250 lines)
│       ├── rewardsService.ts         # Gamification (437 lines)
│       ├── supabaseService.ts        # Database (282 lines)
│       └── web3Service.ts            # Blockchain (95 lines)
├── public/                           # Static assets
├── dist/                             # Production build
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── vite.config.ts                    # Build configuration
├── index.html                        # HTML entry point
├── .env.local                        # Environment variables (git-ignored)
├── .env.local.example                # Example env file
├── .gitignore                        # Git ignore rules
├── LICENSE                           # MIT License
└── docs/                             # Documentation
```

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19.2, TypeScript 5.8 |
| **Build Tool** | Vite 6.4 |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Authentication** | Supabase Auth (JWT) |
| **Database** | PostgreSQL (via Supabase) |
| **AI** | Google Gemini API |
| **Web3** | ethers.js |
| **Hosting** | Vercel / Netlify (recommended) |

## 📊 Project Statistics

```
TypeScript Files:     12
Total Lines of Code:  ~3,500
Documentation Lines: ~8,000
TypeScript Errors:   0
Production Bundle:   175 KB (gzipped)
Build Time:          2.57 seconds
Features Implemented: 40+
```

## 🚀 Deployment

### Recommended: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Alternative: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Setup Database

1. Go to Supabase dashboard
2. Open SQL Editor
3. Run `supabase-schema-complete.sql`
4. Verify tables: users, courses, enrollments

See [FINAL_DEPLOYMENT_STATUS.md](docs/FINAL_DEPLOYMENT_STATUS.md) for detailed instructions.

## 📖 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design and workflows
- **[AUTHENTICATION.md](docs/AUTHENTICATION.md)** - Auth setup and flows
- **[REWARDS_SYSTEM.md](docs/REWARDS_SYSTEM.md)** - Gamification details
- **[FINAL_DEPLOYMENT_STATUS.md](docs/FINAL_DEPLOYMENT_STATUS.md)** - Deployment guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

### Quick Steps
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📋 Roadmap

### Phase 1: MVP ✅
- [x] Authentication system
- [x] Course creation & management
- [x] Lesson learning with quizzes
- [x] Points & rewards system
- [x] Leaderboard

### Phase 2: Enhancement (Upcoming)
- [ ] Email verification enforcement
- [ ] Advanced analytics dashboard
- [ ] Peer-to-peer learning features
- [ ] Course recommendations AI
- [ ] Community forum

## 🐛 Bug Reports & Feature Requests

Found a bug? Have an idea? [Open an issue](https://github.com/yourusername/edusagar/issues)

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**[Your Name]**
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- **Google** - Gemini API for AI capabilities
- **Supabase** - Backend and authentication
- **React & TypeScript** - Community and documentation
- **Nepal Community** - For inspiration and feedback

---

**Made with ❤️ for educational empowerment**
