# Bwain.app User Guide

Welcome to Bwain.app - your personal productivity companion! This guide will help you get the most out of the app.

## Table of Contents

1. [Installation](#installation)
2. [Features Overview](#features-overview)
3. [Getting Started](#getting-started)
4. [Tips and Tricks](#tips-and-tricks)
5. [Troubleshooting](#troubleshooting)

---

## Installation

### Installing on iOS (iPhone/iPad)

1. Open **Safari** and navigate to your Bwain.app URL
2. Tap the **Share** button (square with arrow pointing up) at the bottom of the screen
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired, then tap **"Add"**
5. The app icon will appear on your home screen
6. Tap the icon to launch Bwain.app as a standalone app!

**Note:** iOS Safari doesn't support all PWA features like push notifications, but you'll still get offline access and a native-like experience.

### Installing on Android

1. Open **Chrome** and navigate to your Bwain.app URL
2. Look for the **"Install"** button in the header or the install prompt
3. Alternatively, tap the three-dot menu (⋮) in the top-right corner
4. Select **"Add to Home Screen"** or **"Install app"**
5. Confirm the installation when prompted
6. The app will be added to your home screen and app drawer
7. Launch it like any other app!

**Benefits:** Full PWA support including offline mode, background sync, and install prompts.

### Installing on Desktop (Chrome/Edge)

1. Visit your Bwain.app URL in Chrome or Edge
2. Look for the **Install** button (⊕) in the address bar
3. Click it and confirm the installation
4. The app will open in its own window
5. Access it from your taskbar, dock, or start menu

---

## Features Overview

### 1. Tasks

- **Create tasks** with descriptions and optional due dates
- **Mark tasks as complete** with a single click
- **Filter tasks** by All, Pending, or Completed
- **Edit or delete** tasks as needed
- See **overdue warnings** for past-due tasks

### 2. Lists

- **Create custom lists** for shopping, packing, projects, etc.
- **Add items** to each list with checkboxes
- **Edit list titles** and item names
- **Delete lists** when you're done
- Track completion progress with item counts

### 3. Notes

- **Write and organize** your thoughts and ideas
- **Search notes** by title or content
- **Add tags** for easy categorization
- **Edit notes** with a rich text editor
- **Delete notes** you no longer need

### 4. Reminders

- **Set reminders** for important events and deadlines
- **Specify date and time** for each reminder
- **View upcoming reminders** in chronological order
- **Delete reminders** once completed

### 5. Budget

- **Track income and expenses** by category
- **View budget overview** with total income, expenses, and balance
- **See visual charts** showing spending by category
- **Add transactions** with amount, type, category, and description
- **Delete transactions** as needed

### 6. Schedule

- **Plan events** with titles, dates, times, and locations
- **View upcoming events** sorted chronologically
- **Edit event details** anytime
- **Delete events** when they're over or canceled

---

## Getting Started

### First Time Setup

1. **Log In:** Enter your username and password on the login page
2. **Explore Features:** Use the sidebar navigation to explore each feature
3. **Create Your First Item:** Try creating a task, note, or list to get familiar with the interface
4. **Install the App:** For the best experience, install the app on your device (see Installation above)

### Using Offline Mode

Bwain.app works offline! When you lose internet connection:

- A **yellow banner** will appear at the top indicating you're offline
- You can still **view cached data** from your last sync
- **Create, edit, and delete actions** will be disabled until you reconnect
- When you come back online, the app will automatically sync your data

### Syncing with Discord Bot

If you're using the Bwain Discord bot:

- All data syncs automatically between the PWA and Discord
- Changes made in the PWA appear in Discord, and vice versa
- Polling happens every **15 seconds** to keep everything up to date
- Both users can use the app simultaneously without conflicts

---

## Tips and Tricks

### Keyboard Navigation

- **Tab:** Navigate between interactive elements
- **Enter:** Activate buttons and links
- **Escape:** Close dialogs and modals
- **Space:** Toggle checkboxes

### Search and Filter

- Use the **search bar** in Notes to quickly find what you need
- Use **filter buttons** in Tasks to focus on Pending or Completed items
- Schedule events are **automatically sorted** by date

### Performance

- The app **caches data** for faster loading
- Heavy components like charts are **lazy loaded** to reduce initial bundle size
- Images and fonts are **optimized** for quick display

### Customization

- Create lists for any purpose: shopping, packing, checklists, etc.
- Use tags in Notes to organize by topic, project, or priority
- Categorize budget transactions to see where your money goes

---

## Troubleshooting

### Common Issues

#### "I can't log in"

- **Solution:** Double-check your username and password
- Make sure you have an active internet connection
- Contact your administrator if credentials aren't working

#### "My data isn't syncing"

- **Solution:** Check your internet connection
- Wait a few seconds for the next polling cycle (15 seconds)
- Refresh the page to force a re-sync
- Check if the backend API is running

#### "The app feels slow"

- **Solution:** Clear your browser cache and reload
- Close other tabs consuming resources
- Check your internet speed
- Try uninstalling and reinstalling the PWA

#### "I'm offline and can't make changes"

- **Solution:** This is expected behavior for data safety
- View your cached data while offline
- Reconnect to the internet to make changes
- The offline banner will disappear when you're back online

#### "The install prompt doesn't appear (Android)"

- **Solution:** Try visiting the app in Chrome (not other browsers)
- Make sure you're on HTTPS (not HTTP)
- Check if you've already installed the app
- Try clearing browser data and revisiting

#### "Add to Home Screen doesn't work (iOS)"

- **Solution:** You must use **Safari** (not Chrome or other browsers)
- Follow the iOS installation steps above carefully
- iOS requires manual Add to Home Screen (no automatic prompts)

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages
2. Try logging out and back in
3. Clear your browser cache and reload
4. Contact support with details about the issue

---

## Advanced Features

### PWA Benefits

- **Offline Access:** View cached data when offline
- **Fast Loading:** Service workers cache assets for instant loading
- **Native-like Experience:** Full-screen mode, app icon, splash screen
- **Data Persistence:** Your data is saved locally and synced to the server

### Browser Compatibility

- **Best Experience:** Chrome, Edge, Safari (iOS)
- **Full PWA Support:** Chrome, Edge, Samsung Internet
- **Limited PWA Support:** Safari (no push notifications)
- **Not Recommended:** Internet Explorer

---

## Frequently Asked Questions

**Q: Is my data secure?**
A: Yes! All communication uses HTTPS, and your data is stored securely.

**Q: Can multiple people use the app at the same time?**
A: Yes! The app syncs data every 15 seconds, so changes from one user appear for others quickly.

**Q: What happens if I accidentally delete something?**
A: Deletions are permanent. Always confirm deletion prompts carefully.

**Q: Can I use the app without internet?**
A: You can view cached data offline, but you need internet to make changes.

**Q: How do I uninstall the app?**
A:

- **iOS:** Long-press the app icon and select "Remove App"
- **Android:** Long-press the app icon and drag to "Uninstall" or go to Settings > Apps
- **Desktop:** Right-click the app icon and select "Uninstall"

---

## Contact & Support

For questions, feedback, or support:

- Check this guide first
- Review the troubleshooting section
- Contact your administrator

---

**Enjoy using Bwain.app!** We hope it helps you stay organized and productive.

_Last updated: 2025-10-07_
