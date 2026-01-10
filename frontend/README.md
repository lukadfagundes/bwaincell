# Bwain.app - Your Personal Productivity Companion

A modern Progressive Web App (PWA) for managing your daily productivity. Built with Next.js 14, React 18, and TypeScript, featuring Google OAuth 2.0 authentication.

**Live App:** [https://bwain-app.vercel.app](https://bwain-app.vercel.app)

_Same Fweak, Same Bwaincell_ ✨

---

## Features

**_A note before you begin_**

The Bwaincell-pwa is a companion app to the Bwaincell Discord bot I built, I'll provide the link to it below. The bot and app were developed for personal use for me and my wife and my iteration of it won't be available to access publically, however, feel free to tinker and make it your own!

https://github.com/lukadfagundes/bwaincell

### Core Productivity Tools

- **Tasks** - Create, manage, and track your to-do items with due dates
- **Lists** - Organize items into custom lists and collections
- **Notes** - Take rich-text notes with tags and search (press Enter to search)
- **Reminders** - Set one-time, daily, or weekly reminders
- **Budget** - Track expenses and income with visual charts

### PWA Capabilities

- **Installable** - Add to home screen on mobile and desktop
- **Offline Support** - Continue working without internet connection
- **Fast Loading** - Optimized performance with service worker caching
- **Push Notifications** - Get notified of important events (coming soon)
- **Dark Mode** - Eye-friendly theme for night usage
- **Cross-Platform** - Works on iOS, Android, Windows, macOS, Linux

---

## Tech Stack

| Category             | Technology                     |
| -------------------- | ------------------------------ |
| **Framework**        | Next.js 14 (App Router)        |
| **Language**         | TypeScript 5.9                 |
| **UI Library**       | React 18                       |
| **Styling**          | Tailwind CSS 3.4               |
| **Components**       | Radix UI + shadcn/ui           |
| **State Management** | TanStack Query                 |
| **Authentication**   | NextAuth.js + Google OAuth 2.0 |
| **Data Fetching**    | TanStack Query (React Query)   |
| **Icons**            | Lucide React                   |
| **Charts**           | Recharts                       |
| **PWA**              | next-pwa (Workbox)             |
| **Deployment**       | Vercel                         |
| **Backend API**      | Fly.io (Node.js)               |

---

## Design System

Inspired by the anime film "Your Name" (Kimi no Na wa), the app features three thematic color palettes:

- **Twilight** - Pink/Magenta tones (#e84d8a) - Primary brand color
- **Dusk** - Purple/Indigo tones (#6366f1) - Secondary accents
- **Dawn** - Yellow/Orange tones (#f59e0b) - Call-to-action elements

---

## Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Google OAuth 2.0 Credentials** ([Google Cloud Console](https://console.cloud.google.com))
- **Backend API** running at https://bwaincell.fly.dev

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bwaincell-pwa.git
cd bwaincell-pwa

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your credentials
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
# Development: http://localhost:3000
# Production: https://bwaincell.fly.dev
NEXT_PUBLIC_API_URL=http://localhost:3000

# NextAuth Configuration
# Development: http://localhost:3001
# Production: https://bwain-app.vercel.app
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

# Google OAuth 2.0 Credentials
# Must match the credentials used in Bwaincell backend
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3001
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel deploy --prod
```

---

## Project Structure

```
bwaincell-pwa/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── api/
│   │   └── auth/[...nextauth]/ # NextAuth OAuth routes
│   └── dashboard/               # Protected routes
│       ├── layout.tsx          # Dashboard layout with sidebar
│       ├── page.tsx            # Dashboard home
│       ├── tasks/              # Tasks feature
│       ├── lists/              # Lists feature
│       ├── notes/              # Notes feature
│       ├── reminders/          # Reminders feature
│       └── budget/             # Budget feature
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Layout components (Sidebar, MobileNav)
│   ├── common/                  # Shared components
│   ├── tasks/                   # Task-specific components
│   ├── lists/                   # List-specific components
│   ├── notes/                   # Note-specific components
│   ├── reminders/               # Reminder-specific components
│   └── budget/                  # Budget-specific components
├── contexts/
│   └── AuthContext.tsx          # Authentication context
├── hooks/
│   ├── useTasks.ts             # Tasks data hook
│   ├── useLists.ts             # Lists data hook
│   ├── useNotes.ts             # Notes data hook
│   ├── useReminders.ts         # Reminders data hook
│   └── useBudget.ts            # Budget data hook
├── lib/
│   ├── api.ts                   # API client with Bearer token auth
│   └── utils.ts                 # Utility functions
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── icon-192.png            # App icon (192x192)
│   ├── icon-512.png            # App icon (512x512)
│   └── sw.js                    # Service worker (auto-generated)
└── styles/
    └── globals.css             # Global styles
```

---

## Authentication

The app uses **Google OAuth 2.0** via NextAuth.js for secure authentication.

**Login Flow:**

1. Click "Sign in with Google"
2. Authenticate with Google account
3. Backend verifies Google ID token
4. Backend generates JWT access token
5. JWT stored in NextAuth session
6. Bearer token sent with every API request

**Security Features:**

- Google OAuth 2.0 authentication
- JWT bearer tokens for API requests
- Automatic token refresh
- Email whitelist on backend
- Session-based state management
- HTTPS enforced for production

**Supported Browsers:**

- ✅ Chrome/Edge (Windows, macOS)
- ✅ Safari (macOS, iOS PWA)
- ✅ Firefox (Windows, macOS)

---

## PWA Installation

### iOS (Safari)

1. Open [https://bwain-app.vercel.app](https://bwain-app.vercel.app) in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. The app icon will appear on your home screen
6. Sign in with Google - authentication works in PWA mode!

### Android (Chrome)

1. Open [https://bwain-app.vercel.app](https://bwain-app.vercel.app) in Chrome
2. Tap the **Menu** button (three dots)
3. Tap **"Install app"** or **"Add to Home screen"**
4. Tap **"Install"**
5. The app will be added to your app drawer

### Desktop (Chrome/Edge)

1. Open [https://bwain-app.vercel.app](https://bwain-app.vercel.app)
2. Click the **Install** button in the address bar
3. Or go to Menu → "Install Bwain.app..."
4. The app will open in its own window

---

## Available Scripts

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start development server on port 3001 |
| `npm run build` | Build optimized production bundle     |
| `npm start`     | Start production server               |
| `npm run lint`  | Run ESLint code quality checks        |

---

## Features Roadmap

### V1.0 (Current)

- [x] Google OAuth 2.0 authentication
- [x] Tasks CRUD operations with completion toggle
- [x] Lists CRUD operations
- [x] Notes CRUD with Enter-to-search
- [x] Reminders (one-time, daily, weekly)
- [x] Budget tracking with charts
- [x] PWA installation support
- [x] Offline static asset caching
- [x] Dark mode
- [x] Responsive design
- [x] Safari iOS PWA compatibility

### V1.1 (Next)

- [ ] Push notifications for reminders
- [ ] Background sync for offline actions
- [ ] Export data (JSON/CSV)
- [ ] Biometric authentication
- [ ] Task categories and tags
- [ ] Advanced search functionality
- [ ] Keyboard shortcuts

### V2.0 (Future)

- [ ] Collaboration features
- [ ] File attachments
- [ ] Voice notes
- [ ] AI-powered insights
- [ ] Multi-language support
- [ ] Custom themes
- [ ] Widget support
- [ ] Desktop notifications

---

## Browser Support

| Browser    | Version | Status             | Notes             |
| ---------- | ------- | ------------------ | ----------------- |
| Chrome     | 90+     | ✅ Fully Supported | Desktop & Android |
| Safari     | 14+     | ✅ Fully Supported | macOS             |
| Safari iOS | 14+     | ✅ Fully Supported | PWA mode tested   |
| Edge       | 90+     | ✅ Fully Supported | Desktop           |
| Firefox    | 88+     | ✅ Fully Supported | Desktop           |
| Opera      | 76+     | ✅ Supported       | Desktop           |

**OAuth Compatibility:**

- All browsers support Google OAuth 2.0
- Safari iOS works in both browser and PWA mode
- Session persistence across app restarts

---

## Performance

- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices, SEO)
- **PWA Score:** 100/100
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.0s
- **Bundle Size:** ~250KB gzipped

**Optimizations:**

- Service worker caching for instant page loads
- Image optimization with next/image (WebP/AVIF)
- Code splitting and lazy loading
- React Query with stale-time caching
- Tailwind CSS purging for minimal CSS bundle
- Debounced search inputs to prevent excessive API calls

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

### Quick Start

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

**Code Standards:**

- TypeScript strict mode
- ESLint rules compliance
- Component-level documentation
- Accessibility (WCAG 2.1 AA)
- Responsive design (mobile-first)

---

## Troubleshooting

### App won't install on iOS

- Ensure you're using Safari (not Chrome/Firefox)
- Check that the site is served over HTTPS
- Verify manifest.json is accessible
- Try clearing Safari cache

### OAuth authentication failing

- Verify Google OAuth credentials are correct
- Check that redirect URIs are configured in Google Cloud Console
- Ensure `NEXTAUTH_URL` matches your deployment URL
- Check browser console for detailed error messages

### API requests failing

- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify backend is running at https://bwaincell.fly.dev
- Check Network tab in DevTools for error details
- Ensure you're signed in with a whitelisted email

### Search not working in Notes

- Type your search query
- **Press Enter** to execute the search
- Backspace works normally, search resets when input is empty

### Database errors ("undefined user_id")

- Sign out and sign in again
- This typically happens after backend updates
- The OAuth flow will recreate your user record

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Design inspired by "Your Name" (Kimi no Na wa) by Makoto Shinkai
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Hosted on [Vercel](https://vercel.com/)
- Backend API on [Fly.io](https://fly.io/)
- Authentication by [NextAuth.js](https://next-auth.js.org/) + [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

---

**Version:** 1.0.0
**Status:** Production Ready
**Last Updated:** 2025-10-09
**Maintained by:** Bwain.app team

---

**Built with love by the Bwaincell team**

_Same Fweak, Same Bwaincell_ ✨

## 🔱 Trinity Method

This project uses the **Trinity Method** - an investigation-first development methodology powered by AI agents.

### Quick Commands

#### Leadership Team

- **Aly (CTO)** - Strategic planning and work order creation

  ```bash
  /trinity-aly
  ```

- **AJ (Implementation Lead)** - Code execution and implementation
  ```bash
  /trinity-aj
  ```

#### Deployment Team

- **TAN (Structure Specialist)** - Directory architecture and organization

  ```bash
  /trinity-tan
  ```

- **ZEN (Knowledge Specialist)** - Documentation and knowledge base

  ```bash
  /trinity-zen
  ```

- **INO (Context Specialist)** - Codebase analysis and context building

  ```bash
  /trinity-ino
  ```

- **Ein (CI/CD Specialist)** - Continuous integration and deployment automation
  ```bash
  /trinity-ein
  ```

#### Audit Team

- **JUNO (Auditor)** - Quality assurance and comprehensive auditing
  ```bash
  /trinity-juno
  ```

### Documentation

All project knowledge is maintained in `trinity/knowledge-base/`:

- **ARCHITECTURE.md** - System design and technical decisions
- **ISSUES.md** - Known problems and their status
- **To-do.md** - Task tracking and priorities
- **Technical-Debt.md** - Debt management and refactoring plans
- **Trinity.md** - Trinity Method guidelines and protocols

### Session Management

Trinity Method uses investigation-first approach:

1. **Assess** - Understand current state
2. **Investigate** - Deep dive into root causes
3. **Plan** - Create comprehensive strategy
4. **Execute** - Implement with precision
5. **Verify** - Confirm success criteria met

Session archives are stored in `trinity/sessions/` for historical reference.

### Project Info

- **Framework:** React
- **Trinity Version:** 1.0.0
- **Agent Configuration:** `.claude/`
- **Knowledge Base:** `trinity/knowledge-base/`

### Getting Started

1. Review the [Employee Directory](.claude/EMPLOYEE-DIRECTORY.md) for agent details
2. Check [Trinity.md](trinity/knowledge-base/Trinity.md) for methodology guidelines
3. Open Claude Code and invoke agents as needed
4. Agents automatically access project context and documentation

---

_Deployed with Trinity Method SDK v1.0.0_
