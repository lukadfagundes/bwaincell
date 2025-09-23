# Bwaincell Bot Testing Checklist

## Pre-Testing Setup
- [ ] Bot is running (`npm start`)
- [ ] Commands deployed (`npm run deploy`)
- [ ] Bot is in Discord server
- [ ] Database file exists at `./data/bwaincell.sqlite`

---

## Command Testing

### 📋 Task Commands (`/task`)

#### Basic Functionality
- [ ] `/task add description:"Test task"` - Creates task
- [ ] `/task add description:"Test with due date" due_date:"2025-12-25 14:00"` - Creates with due date
- [ ] `/task list` - Shows all tasks
- [ ] `/task list filter:pending` - Shows only pending tasks
- [ ] `/task done task_id:1` - Marks task as complete
- [ ] `/task edit task_id:1 new_text:"Updated task"` - Edits task
- [ ] `/task delete task_id:1` - Deletes task

#### Autocomplete Testing
- [ ] Type `/task done` and start typing task_id - autocomplete shows pending tasks
- [ ] Type `/task edit` and start typing task_id - autocomplete shows all tasks
- [ ] Type `/task delete` and start typing task_id - autocomplete shows all tasks
- [ ] Autocomplete shows task status emoji (✅/⏳)
- [ ] Autocomplete shows due dates when present

#### Button Testing
- [ ] After `/task add` - Test "Mark as Done" button
- [ ] After `/task add` - Test "Edit Task" button
- [ ] After `/task add` - Test "View All Tasks" button
- [ ] After `/task list` - Test "Quick Complete" button (if pending tasks exist)
- [ ] After `/task list` - Test "Add New Task" button
- [ ] After `/task list` - Test "Refresh" button
- [ ] After `/task done` - Test "Add Another Task" button
- [ ] After `/task done` - Test "View Pending Tasks" button

#### Select Menu Testing
- [ ] After `/task list` with tasks - Select menu appears
- [ ] Selecting a task from menu shows task details with action buttons

#### Modal Testing
- [ ] Click "Add New Task" button - Modal form appears
- [ ] Submit modal with task description - Task created
- [ ] Submit modal with invalid due date - Error message
- [ ] Click "Edit Task" button - Modal form appears with current text

---

### 📝 List Commands (`/list`)

#### Basic Functionality
- [ ] `/list create name:"Shopping"` - Creates list
- [ ] `/list add list_name:"Shopping" item:"Milk"` - Adds item
- [ ] `/list show list_name:"Shopping"` - Shows list
- [ ] `/list toggle list_name:"Shopping" item:"Milk"` - Toggles item
- [ ] `/list remove list_name:"Shopping" item:"Milk"` - Removes item
- [ ] `/list clear list_name:"Shopping"` - Clears completed
- [ ] `/list all` - Shows all lists
- [ ] `/list delete list_name:"Shopping"` - Deletes list

#### Autocomplete Testing
- [ ] Type `/list add` and start typing list_name - autocomplete shows existing lists
- [ ] Type `/list show` and start typing list_name - autocomplete shows lists with item counts
- [ ] Type `/list toggle` - autocomplete shows lists and items
- [ ] Autocomplete updates as you type

#### Button Testing
- [ ] After `/list show` - Test "Add Item" button
- [ ] After `/list show` - Test "Clear Completed" button
- [ ] After `/list all` with ≤5 lists - Test clickable list buttons

---

### ⏰ Reminder Commands (`/remind`)

#### Basic Functionality
- [ ] `/remind me message:"Test" time:"14:30"` - Creates one-time reminder
- [ ] `/remind daily message:"Test" time:"08:00"` - Creates daily reminder
- [ ] `/remind weekly message:"Test" day:Tuesday time:"19:00"` - Creates weekly
- [ ] `/remind list` - Shows all reminders
- [ ] `/remind delete reminder_id:1` - Deletes reminder

#### Autocomplete Testing
- [ ] Type `/remind delete` and start typing reminder_id - autocomplete shows reminders
- [ ] Autocomplete shows reminder message, frequency, and time

#### Button Testing
- [ ] After creating reminder - Test "Cancel Reminder" button
- [ ] After creating reminder - Test "View All Reminders" button
- [ ] After creating reminder - Test "Add Another" button
- [ ] After `/remind list` - Test "Add New Reminder" button
- [ ] After `/remind list` - Test "Refresh" button

#### Select Menu Testing
- [ ] After `/remind list` - Select menu for quick deletion appears
- [ ] Selecting a reminder deletes it

---

### 🎲 Random Commands (`/random`)

#### Basic Functionality
- [ ] `/random dinner` - Shows dinner with image
- [ ] `/random movie` - Shows movie with IMDb link
- [ ] `/random date` - Shows date idea
- [ ] `/random question` - Shows conversation starter
- [ ] `/random choice options:"Pizza,Burgers,Tacos"` - Makes choice
- [ ] `/random number min:1 max:100` - Generates number
- [ ] `/random coin` - Flips coin
- [ ] `/random dice sides:6 count:2` - Rolls dice

#### Button Testing
- [ ] After `/random dinner` - Test "View Recipe" link button
- [ ] After `/random dinner` - Test "Pick Another" button
- [ ] After `/random dinner` - Test "Save to List" button
- [ ] After `/random movie` - Test "View on IMDb" link button
- [ ] After `/random movie` - Test "Pick Another" button
- [ ] After `/random date` - Test "Get Another Idea" button
- [ ] After `/random question` - Test "Next Question" button

#### Save to List Feature
- [ ] Click "Save to List" on dinner - Creates/adds to "Meal Ideas" list
- [ ] Verify item was added with `/list show list_name:"Meal Ideas"`

---

### 📊 Track Commands (`/track`)

#### Basic Functionality
- [ ] `/track add metric:"weight" value:150` - Logs data point
- [ ] `/track stats metric:"weight"` - Shows statistics
- [ ] `/track stats metric:"weight" period:month` - Shows monthly stats
- [ ] `/track list` - Shows all tracked metrics
- [ ] `/track delete metric:"weight"` - Deletes metric data

---

### 📅 Schedule Commands (`/schedule`)

#### Basic Functionality
- [ ] `/schedule add event:"Meeting" date:"2025-01-15" time:"14:30"` - Adds event
- [ ] `/schedule list` - Shows all events
- [ ] `/schedule list filter:upcoming` - Shows upcoming only
- [ ] `/schedule today` - Shows today's events
- [ ] `/schedule week` - Shows week's events
- [ ] `/schedule countdown event:"Meeting"` - Shows countdown
- [ ] `/schedule delete event_id:1` - Deletes event

---

### 💰 Budget Commands (`/budget`)

#### Basic Functionality
- [ ] `/budget add category:"Food" amount:50.00 description:"Groceries"` - Adds expense
- [ ] `/budget income amount:3000 description:"Salary"` - Adds income
- [ ] `/budget summary` - Shows current month summary
- [ ] `/budget summary month:11` - Shows specific month
- [ ] `/budget categories` - Shows spending by category
- [ ] `/budget recent limit:10` - Shows recent transactions
- [ ] `/budget trend months:6` - Shows 6-month trend

---

### 📓 Note Commands (`/note`)

#### Basic Functionality
- [ ] `/note add title:"Test" content:"Content" tags:"test,demo"` - Creates note
- [ ] `/note list` - Shows all notes
- [ ] `/note view note_id:1` - Views specific note
- [ ] `/note search keyword:"test"` - Searches notes
- [ ] `/note edit note_id:1 title:"New" content:"Updated"` - Edits note
- [ ] `/note tag tag:"test"` - Finds by tag
- [ ] `/note tags` - Shows all tags
- [ ] `/note delete note_id:1` - Deletes note

---

## Error Handling Testing

### Invalid Input
- [ ] Invalid date format shows error
- [ ] Invalid time format shows error
- [ ] Non-existent IDs show appropriate errors
- [ ] Empty lists/tasks show friendly messages

### Permission Testing
- [ ] Users can only see their own data
- [ ] Users cannot delete others' items

---

## Performance Testing

- [ ] Commands respond within 1 second
- [ ] Autocomplete updates smoothly
- [ ] Buttons respond immediately
- [ ] No lag with large data sets (25+ items)

---

## Edge Cases

- [ ] Create task with very long description (>200 chars)
- [ ] Create list with 50+ items
- [ ] Set reminder for past time
- [ ] Budget with negative amounts
- [ ] Note with multi-line content

---

## Issues Found

Document any bugs or issues here:

1. Issue: _______________
   - Command:
   - Expected:
   - Actual:
   - Priority: High/Medium/Low

2. Issue: _______________
   - Command:
   - Expected:
   - Actual:
   - Priority: High/Medium/Low

---

## Testing Status

- [ ] All basic commands work
- [ ] All autocomplete features work
- [ ] All buttons respond correctly
- [ ] All select menus function
- [ ] All modals submit properly
- [ ] Error handling is appropriate
- [ ] Performance is acceptable

**Testing Complete:** [ ] Yes / [ ] No
**Ready for Production:** [ ] Yes / [ ] No

---

## Notes

_Add any additional observations or recommendations here_