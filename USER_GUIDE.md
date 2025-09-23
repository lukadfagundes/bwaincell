# Bwaincell Bot User Guide

Welcome to Bwaincell - Your Personal Discord Assistant! 🧅⚔️

## Getting Started

All commands start with `/` - just type `/` in Discord and you'll see all available commands!

### ✨ New Interactive Features

Bwaincell now includes rich interactive elements for a premium experience:
- **Autocomplete** - Start typing and see suggestions for lists, tasks, and reminders
- **Buttons** - Quick actions without typing new commands
- **Dropdown Menus** - Select from your items easily
- **Forms** - Add tasks and items through pop-up forms
- **Visual Feedback** - Emojis and colors show status at a glance

---

## 📋 Task Management (`/task`)

Keep track of your to-dos with the task system.

### Commands:
- **`/task add`** - Create a new task
  - Example: `/task add description:"Buy groceries" due_date:"2025-12-25 14:00"`
  - Due date is optional
  - 🆕 After creating, use buttons to mark done, edit, or view all tasks

- **`/task list`** - View your tasks
  - Options: All, Pending, or Completed
  - Example: `/task list filter:pending`
  - 🆕 Quick Complete button for marking tasks done
  - 🆕 Dropdown menu to select and manage specific tasks

- **`/task done`** - Mark a task as complete
  - Example: `/task done task_id:1`
  - 🆕 Autocomplete shows your pending tasks as you type

- **`/task edit`** - Change a task description
  - Example: `/task edit task_id:1 new_text:"Buy organic groceries"`
  - 🆕 Autocomplete helps you find the right task
  - 🆕 Edit button opens a form for easy changes

- **`/task delete`** - Remove a task
  - Example: `/task delete task_id:1`
  - 🆕 Autocomplete shows all your tasks

### Interactive Features:
- ✨ **Autocomplete** - When typing task IDs, see your tasks with status emojis (✅ done, ⏳ pending)
- 🔘 **Quick Actions** - Buttons appear after commands for common next steps
- 📝 **Forms** - Click "Add New Task" button to open a form instead of typing commands
- 📋 **Select Menu** - Pick a task from a dropdown to view details and actions

### Tips:
- Tasks are numbered with IDs (#1, #2, etc.)
- Due dates help you stay organized
- Use the "Refresh" button to update your task list
- The dropdown menu is perfect for managing multiple tasks quickly

---

## 📝 List Management (`/list`)

Create and manage multiple lists for shopping, movies to watch, or anything else!

### Commands:
- **`/list create`** - Make a new list
  - Example: `/list create name:"Shopping"`
  - Each list needs a unique name

- **`/list add`** - Add items to a list
  - Example: `/list add list_name:"Shopping" item:"Milk"`
  - 🆕 **Autocomplete** - Start typing and your lists appear!
  - 🆕 Shows item count next to each list name

- **`/list show`** - Display a list
  - Example: `/list show list_name:"Shopping"`
  - Shows checkboxes for completed items (☑️ done, ⬜ pending)
  - 🆕 **Add Item** button opens a form to quickly add items
  - 🆕 **Clear Completed** button removes finished items
  - 🆕 Autocomplete helps you find lists quickly

- **`/list toggle`** - Check/uncheck items
  - Example: `/list toggle list_name:"Shopping" item:"Milk"`
  - 🆕 Autocomplete shows both lists and their items
  - Marks items as completed without removing them

- **`/list remove`** - Delete an item from a list
  - Example: `/list remove list_name:"Shopping" item:"Milk"`
  - 🆕 Autocomplete for both list and item selection

- **`/list clear`** - Remove all completed items
  - Example: `/list clear list_name:"Shopping"`
  - 🆕 Button available directly in list view

- **`/list all`** - See all your lists
  - Shows how many items are in each list
  - 🆕 If you have 5 or fewer lists, click buttons to view them instantly
  - 🆕 Dropdown menu for quick list selection

- **`/list delete`** - Delete an entire list
  - Example: `/list delete list_name:"Shopping"`
  - 🆕 Confirmation through buttons

### Interactive Features:
- ✨ **Smart Autocomplete** - Shows list names with item counts (e.g., "Shopping (5 items)")
- 🔘 **Quick Buttons** - Add items, clear completed, or delete without new commands
- 📝 **Item Forms** - Click "Add Item" to use a pop-up form
- 📋 **List Selector** - Dropdown menu in `/list all` for quick access

### Tips:
- Use lists for shopping, movies to watch, books to read, gift ideas, etc.
- The autocomplete feature makes it easy to select from existing lists
- The "Save to List" button in `/random dinner` automatically creates a "Meal Ideas" list

---

## ⏰ Reminder System (`/remind`)

Never forget important things with automated reminders.

### Commands:
- **`/remind me`** - One-time reminder
  - Example: `/remind me message:"Take medication" time:"14:30"`
  - Uses 24-hour time format (14:30 = 2:30 PM)
  - 🆕 Buttons to cancel, view all, or add another reminder

- **`/remind daily`** - Repeating daily reminder
  - Example: `/remind daily message:"Walk the dog" time:"08:00"`
  - Fires every day at the same time
  - 🆕 Quick management buttons after creation

- **`/remind weekly`** - Weekly recurring reminder
  - Example: `/remind weekly message:"Trash day" day:Tuesday time:"19:00"`
  - Choose any day of the week
  - 🆕 Visual day selector in the command

- **`/remind list`** - View all active reminders
  - Shows reminder IDs and next trigger times
  - 🆕 Dropdown menu to select and manage reminders
  - 🆕 Emojis show frequency type (⏰ once, 📅 daily, 📆 weekly)
  - 🆕 "Add New Reminder" and "Refresh" buttons

- **`/remind delete`** - Cancel a reminder
  - Example: `/remind delete reminder_id:3`
  - 🆕 Autocomplete shows all your reminders with details

### Interactive Features:
- ✨ **Smart Autocomplete** - See reminder messages, frequency, and times while typing
- 🔘 **Quick Cancel** - Delete button appears with each reminder
- 📋 **Reminder Selector** - Dropdown menu for managing multiple reminders
- 🔄 **Refresh** - Update your reminder list with one click

### Tips:
- All times are in 24-hour format (00:00 to 23:59)
- Daily reminders are great for medications or routines
- Weekly reminders perfect for trash day, meetings, etc.
- The bot will ping you when reminders trigger
- Use the dropdown menu in `/remind list` for quick management

---

## 🎲 Random Generators (`/random`)

Fun randomizers for decisions and entertainment.

### Commands:
- **`/random dinner`** - Get dinner suggestion with recipe
  - 🖼️ Shows actual food photos
  - ⏱️ Displays prep time and difficulty
  - 🔘 **"View Recipe"** - Opens full recipe in browser
  - 🔘 **"Pick Another"** - Instant new suggestion
  - 🔘 **"Save to List"** - Auto-creates "Meal Ideas" list

- **`/random movie`** - Pick a movie to watch
  - Shows year, genre, and IMDb rating (⭐)
  - 🔘 **"View on IMDb"** - Direct link to movie page
  - 🔘 **"Pick Another"** - Reroll without new command
  - Features classics and modern favorites

- **`/random date`** - Date night ideas
  - Romantic activity suggestions
  - 🔘 **"Get Another Idea"** - Keep browsing ideas
  - 💡 Tips for personalizing each idea

- **`/random question`** - Conversation starters
  - Great for dinner conversations
  - 🔘 **"Next Question"** - Instant new question
  - Deep and fun questions included

- **`/random choice`** - Pick from your options
  - Example: `/random choice options:"Pizza,Chinese,Mexican"`
  - Comma-separated list
  - Shows all options before revealing choice

- **`/random number`** - Random number generator
  - Example: `/random number min:1 max:100`
  - Perfect for raffles or decisions

- **`/random coin`** - Flip a coin
  - Simple heads (👑) or tails (⚡)
  - Instant result with emoji

- **`/random dice`** - Roll dice
  - Example: `/random dice sides:6 count:2`
  - Customize number of sides and dice
  - Shows individual rolls and total

### Interactive Features:
- 🖼️ **Rich Media** - Dinner suggestions include appetizing photos
- 🔗 **Direct Links** - Recipe and IMDb links open in browser
- 💾 **Smart Saving** - "Save to List" creates lists automatically
- 🎲 **Instant Rerolls** - All random commands have "Pick Another" buttons

### Tips:
- Dinner suggestions include real recipes from popular food sites
- The "Save to List" button automatically manages your "Meal Ideas" list
- Movie selections include IMDb ratings to help you choose
- Use the reroll buttons to quickly browse through options

---

## 📊 Tracking (`/track`)

Track any metric over time - weight, mood, hours slept, etc.

### Commands:
- **`/track add`** - Log a data point
  - Example: `/track add metric:"weight" value:150`
  - Can track any number-based metric

- **`/track stats`** - View statistics
  - Example: `/track stats metric:"weight" period:month`
  - Shows average, min, max, and trends
  - Periods: day, week, month, year, or all time

- **`/track list`** - See all tracked metrics
  - Shows what you're currently tracking

- **`/track delete`** - Remove metric data
  - Example: `/track delete metric:"weight"`
  - Deletes all data for that metric

### Tips:
- Track weight, mood (1-10), hours slept, water intake, etc.
- Check weekly or monthly trends
- Great for health and fitness goals
- View statistics with colorful embeds showing averages and trends

---

## 📅 Schedule Management (`/schedule`)

Keep track of events and appointments.

### Commands:
- **`/schedule add`** - Add an event
  - Example: `/schedule add event:"Doctor appointment" date:"2025-01-15" time:"14:30" description:"Annual checkup"`

- **`/schedule list`** - View events
  - Options: upcoming, past, or all
  - Example: `/schedule list filter:upcoming`

- **`/schedule today`** - See today's events
  - Quick view of what's happening today

- **`/schedule week`** - This week's events
  - See the next 7 days at a glance

- **`/schedule countdown`** - Time until event
  - Example: `/schedule countdown event:"Birthday"`
  - Shows days/hours until the event

- **`/schedule delete`** - Remove an event
  - Example: `/schedule delete event_id:2`

### Tips:
- Add doctor appointments, birthdays, meetings
- Use countdown for exciting events
- Check `/schedule today` each morning
- Events display with calendar emojis (📅) for easy scanning

---

## 💰 Budget Tracking (`/budget`)

Track income and expenses to manage your finances.

### Commands:
- **`/budget add`** - Record an expense
  - Example: `/budget add category:"Groceries" amount:87.50 description:"Weekly shopping"`

- **`/budget income`** - Add income
  - Example: `/budget income amount:3000 description:"Monthly salary"`

- **`/budget summary`** - Monthly overview
  - Example: `/budget summary month:11`
  - Shows income, expenses, and balance
  - Leave month empty for current month

- **`/budget categories`** - Spending by category
  - See where your money goes
  - Sorted by highest spending

- **`/budget recent`** - Recent transactions
  - Example: `/budget recent limit:10`
  - Quick view of latest activity

- **`/budget trend`** - Monthly spending trends
  - Example: `/budget trend months:6`
  - See patterns over time

### Tips:
- Categories help you understand spending habits
- Check summary at month end
- Track trends to spot problem areas
- Monthly summaries show income vs expenses with color coding

---

## 📓 Notes (`/note`)

Store important information and thoughts.

### Commands:
- **`/note add`** - Create a note
  - Example: `/note add title:"Recipe ideas" content:"Lasagna, Tacos, Stir-fry" tags:"cooking,dinner"`

- **`/note list`** - See all notes
  - Shows note IDs and titles

- **`/note view`** - Read a specific note
  - Example: `/note view note_id:1`

- **`/note search`** - Find notes by keyword
  - Example: `/note search keyword:"recipe"`

- **`/note edit`** - Modify a note
  - Example: `/note edit note_id:1 title:"Dinner recipes" content:"Updated content"`

- **`/note tag`** - Find notes by tag
  - Example: `/note tag tag:"cooking"`

- **`/note tags`** - See all your tags
  - Lists all tags you've used

- **`/note delete`** - Remove a note
  - Example: `/note delete note_id:1`

### Tips:
- Use tags to organize notes (recipes, ideas, passwords, etc.)
- Search makes finding old notes easy
- Great for storing recipes, gift ideas, important info
- Notes display with formatting preserved

---

## 🎯 Pro Tips

### General Usage:
1. **Autocomplete is your friend** - Start typing and see suggestions with helpful details
2. **Buttons save time** - Use quick action buttons instead of typing new commands
3. **Forms are easier** - Click "Add New" buttons to use pop-up forms
4. **Dropdowns for selection** - Pick from lists and items using menu selections
5. **IDs are automated** - Autocomplete shows IDs so you don't need to remember them
6. **24-hour time** - Use military time (14:00 instead of 2:00 PM)
7. **Dates format** - YYYY-MM-DD (2025-01-15 for January 15, 2025)

### Best Practices:
- **Daily Routine**: Check `/task list filter:pending` and use Quick Complete button
- **Weekly Planning**: Use `/schedule week` with interactive event cards
- **Shopping**: Create lists with autocomplete, toggle items as you shop
- **Movies/Shows**: Use `/random movie` and save favorites with one click
- **Meal Planning**: `/random dinner` + "Save to List" button = instant meal plan
- **Budgeting**: Log expenses immediately, use category buttons for quick entry
- **Reminders**: Set with autocomplete, manage with dropdown menus
- **Quick Actions**: Always look for buttons after commands - they're shortcuts!

### Quick Start Suggestions:
1. Create your first list: `/list create name:"Shopping"` - then use buttons to add items
2. Add a task: `/task add description:"Learn Bwaincell commands"` - try the buttons that appear!
3. Set a daily reminder: `/remind daily message:"Check tasks" time:"09:00"` - manage with dropdown
4. Try the dinner picker: `/random dinner` - use "Save to List" to build a meal plan
5. Start tracking something: `/track add metric:"mood" value:7` - view stats with graphs

### Troubleshooting:
- **Autocomplete not showing?** Start typing - it appears after 1-2 characters
- **Buttons not working?** Make sure the bot is online and has permissions
- **Forms not opening?** Check if Discord is up to date
- **Can't see dropdowns?** They appear when you have items to select from
- If a command doesn't work, check your spelling and format
- Times must be in 24-hour format (HH:MM)
- Dates must be YYYY-MM-DD format
- Use quotation marks for text with spaces: `name:"My Shopping List"`

---

## 🆘 Need Help?

- All commands show hints as you type them
- Autocomplete guides you to valid options
- Buttons provide next steps without guessing commands
- Error messages explain what went wrong
- The bot will suggest the correct format if you make a mistake
- Check this guide anytime for examples

Remember: Bwaincell is here to help make your daily life easier! Start with one or two features and gradually explore more as you get comfortable.

---

## ⚠️ Development Notice

**This bot is still in active development!** Features may change, improve, or be added rapidly. If something doesn't work as expected or you have ideas for new features, let me know!

---

*Bwaincell - Your Onion Knight Assistant* 🧅⚔️