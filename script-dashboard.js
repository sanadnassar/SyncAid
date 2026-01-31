// Calendar functionality
let currentDate = new Date();

const monthYear = document.getElementById('monthYear');
const calendarGrid = document.getElementById('calendarGrid');
const timeColumn = document.getElementById('timeColumn');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayDateDisplay = document.getElementById('todayDate');
const viewButtons = document.querySelectorAll('.view-btn');
const calendarContainer = document.querySelector('.calendar');
const calendarBody = document.querySelector('.calendar-body');

let currentView = 'month';

// Month names
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Initialize dashboard
function initDashboard() {
    renderCalendar();
    updateTodayDate();
    attachEventListeners();
    animateStats(); // Add animation to numbers
}

// Render calendar
function renderCalendar() {
    // Add fade out effect
    calendarBody.classList.add('fade-out');

    // Wait for fade out to finish (200ms matches CSS transition)
    setTimeout(() => {
        calendarGrid.innerHTML = '';
        timeColumn.innerHTML = '';
        calendarGrid.classList.remove('view-week');
        calendarContainer.classList.remove('mode-week');

        if (currentView === 'week') {
            calendarGrid.classList.add('view-week');
            calendarContainer.classList.add('mode-week');
            renderWeekView();
        } else {
            renderMonthView();
        }

        // Fade back in
        calendarBody.classList.remove('fade-out');
    }, 200);
}

// Create day element
function createDayElement(day, className) {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${className}`;
    
    // Staggered animation delay based on day number for subtle flow
    // (Optional: if it causes performance issues, remove the style attribute)
    dayElement.style.animationDelay = `${day * 0.01}s`;
    
    dayElement.innerHTML = `<span class="day-number">${day}</span>`;
    calendarGrid.appendChild(dayElement);
    return dayElement;
}

// Select date
function selectDate(dayElement) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Don't allow selecting other month's days
    if (!dayElement.classList.contains('other-month')) {
        dayElement.classList.add('selected');
    }
}

// Update today's date display
function updateTodayDate() {
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
    // We will animate this text in animateStats if it was a number, 
    // but since it's text, we set it directly.
    todayDateDisplay.textContent = dateString;
}

// Animate Stats Numbers
function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    
    stats.forEach(stat => {
        // If it's the date (text), skip number animation
        if(stat.id === 'todayDate') return;

        const target = parseInt(stat.innerText) || 0; // Use 0 if text is empty
        // For demo purposes, let's pretend we have data coming in
        // If the HTML says "0", let's animate to a mock number like 5 or 12 
        // just to show the effect, OR keep it 0 if you want strict logic.
        // Let's assume the HTML "0" is the starting point.
        
        // Example: If you had real data, you'd pass the target number here.
        // Since the HTML is static "0", let's animate 0 to 0 (no visible change)
        // OR animate from 0 to the value in HTML.
        
        let start = 0;
        const duration = 1500;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quart formula
            const ease = 1 - Math.pow(1 - progress, 4);
            
            const current = Math.floor(start + (target - start) * ease);
            stat.innerText = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    });
}

// Attach event listeners
function attachEventListeners() {
    prevMonthBtn.addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() - 7);
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() + 7);
        }
        renderCalendar();
    });

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const view = button.getAttribute('data-view');
            // Only update if view actually changes
            if (currentView !== view) {
                setView(view);
            }
        });
    });
}

function setView(view) {
    currentView = view;
    viewButtons.forEach(button => {
        button.classList.toggle('is-active', button.getAttribute('data-view') === view);
    });
    renderCalendar();
}

function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        createDayElement(day, 'other-month');
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createDayElement(day, '');

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            dayElement.classList.add('today');
        }

        dayElement.addEventListener('click', () => selectDate(dayElement));
    }

    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        createDayElement(day, 'other-month');
    }
}

function renderWeekView() {
    const weekStart = getStartOfWeek(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startLabel = weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
    const endLabel = weekEnd.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
    const yearLabel = weekEnd.getFullYear();
    monthYear.textContent = `${startLabel} – ${endLabel}, ${yearLabel}`;

    const hours = Array.from({ length: 10 }, (_, index) => index + 8);
    hours.forEach(hour => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        const displayHour = hour > 12 ? hour - 12 : hour;
        const meridiem = hour >= 12 ? 'PM' : 'AM';
        timeSlot.textContent = `${displayHour}${meridiem}`;
        timeColumn.appendChild(timeSlot);
    });

    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);

        const dayElement = createDayElement(dayDate.getDate(), 'week-slot');

        if (
            dayDate.getDate() === today.getDate() &&
            dayDate.getMonth() === today.getMonth() &&
            dayDate.getFullYear() === today.getFullYear()
        ) {
            dayElement.classList.add('today');
        }

        dayElement.addEventListener('click', () => selectDate(dayElement));
    }
}

function getStartOfWeek(date) {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);