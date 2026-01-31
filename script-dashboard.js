// Calendar functionality
let currentDate = new Date();

const monthYear = document.getElementById('monthYear');
const calendarGrid = document.getElementById('calendarGrid');
const timeColumn = document.getElementById('timeColumn');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayDateDisplay = document.getElementById('todayDate');
const upcomingCountDisplay = document.getElementById('upcomingCount');
const monthCountDisplay = document.getElementById('monthCount');
const viewButtons = document.querySelectorAll('.view-btn');
const calendarContainer = document.querySelector('.calendar');
const calendarBody = document.querySelector('.calendar-body');

let currentView = 'month';
let selectedAppointment = null;
const WEEK_START_HOUR = 8;
const WEEK_END_HOUR = 18;
const WEEK_VIEW_HEIGHT = 990;
const WEEK_VIEW_PADDING_TOP = 28;
const WEEK_VIEW_PADDING_BOTTOM = 8;
const appointmentsCache = new Map();

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
    updateStats();
    animateStats(); // Add animation to numbers
    initIcons();
    initAOS();
    initRiskChart();
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
        updateStats();
    }, 200);
}

// Create day element
function createDayElement(day, className) {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${className}`;
    
    // Staggered animation delay based on day number for subtle flow
    // (Optional: if it causes performance issues, remove the style attribute)
    dayElement.style.animationDelay = `${day * 0.01}s`;
    
    dayElement.innerHTML = `<span class="day-number">${day}</span><div class="appointments"></div>`;
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

function selectAppointment(appointmentEl) {
    if (selectedAppointment) {
        selectedAppointment.classList.remove('is-selected');
    }
    selectedAppointment = appointmentEl;
    selectedAppointment.classList.add('is-selected');
}

function addAppointmentBlocks(dayElement, appointments = [], variant = 'month') {
    if (!appointments.length) return;
    const container = dayElement.querySelector('.appointments');
    const isWeekView = variant === 'week';
    const totalMinutes = (WEEK_END_HOUR - WEEK_START_HOUR) * 60;
    const availableHeight = WEEK_VIEW_HEIGHT - WEEK_VIEW_PADDING_TOP - WEEK_VIEW_PADDING_BOTTOM;

    appointments.forEach(appointment => {
        const appointmentEl = document.createElement('button');
        appointmentEl.type = 'button';
        appointmentEl.className = 'appointment-block';
        appointmentEl.dataset.risk = appointment.risk;
        appointmentEl.style.background = '#ECF4F3';
        appointmentEl.style.setProperty('--risk-color', appointment.color);
        if (isWeekView) {
            appointmentEl.classList.add('appointment-block--week');
            appointmentEl.innerHTML = `
                <span class="appt-time">${appointment.timeLabel}</span>
                <span class="appt-patient">${appointment.patient}</span>
            `;
        } else {
            appointmentEl.textContent = `${appointment.initials} · ${appointment.timeLabel}`;
        }

        if (isWeekView) {
            const startMinutes = appointment.startMinutes - WEEK_START_HOUR * 60;
            const top = Math.max(0, (startMinutes / totalMinutes) * availableHeight);
            const height = Math.max(42, (appointment.duration / totalMinutes) * availableHeight);
            appointmentEl.style.top = `${top}px`;
            appointmentEl.style.height = `${height}px`;
            appointmentEl.style.maxHeight = `${availableHeight - top}px`;
        }

        appointmentEl.addEventListener('click', (event) => {
            event.stopPropagation();
            selectAppointment(appointmentEl);
        });
        container.appendChild(appointmentEl);
    });
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

function updateStats() {
    const viewYear = currentDate.getFullYear();
    const viewMonth = currentDate.getMonth();
    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

    if (!appointmentsCache.has(monthKey)) {
        appointmentsCache.set(monthKey, generateAppointmentsForMonth(viewYear, viewMonth));
    }
    const monthAppointments = appointmentsCache.get(monthKey);

    let monthTotal = 0;
    let upcomingTotal = 0;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

    Object.keys(monthAppointments).forEach(dateKey => {
        const dayAppointments = monthAppointments[dateKey] || [];
        monthTotal += dayAppointments.length;

        if (!isCurrentMonth) {
            upcomingTotal += dayAppointments.length;
            return;
        }

        const dayNumber = parseInt(dateKey.slice(-2), 10);
        if (dayNumber >= today.getDate()) {
            upcomingTotal += dayAppointments.length;
        }
    });

    if (monthCountDisplay) monthCountDisplay.textContent = `${monthTotal}`;
    if (upcomingCountDisplay) upcomingCountDisplay.textContent = `${upcomingTotal}`;
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
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (!appointmentsCache.has(monthKey)) {
        appointmentsCache.set(monthKey, generateAppointmentsForMonth(year, month));
    }
    const monthAppointments = appointmentsCache.get(monthKey);

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

        const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
        addAppointmentBlocks(dayElement, monthAppointments[dateKey], 'month');
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
    const monthKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
    if (!appointmentsCache.has(monthKey)) {
        appointmentsCache.set(monthKey, generateAppointmentsForMonth(weekStart.getFullYear(), weekStart.getMonth()));
    }
    const monthAppointments = appointmentsCache.get(monthKey);

    const weekEndMonthKey = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}`;
    if (weekEndMonthKey !== monthKey && !appointmentsCache.has(weekEndMonthKey)) {
        appointmentsCache.set(weekEndMonthKey, generateAppointmentsForMonth(weekEnd.getFullYear(), weekEnd.getMonth()));
    }
    const nextMonthAppointments = appointmentsCache.get(weekEndMonthKey);

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
        const dateKey = getDateKey(dayDate);
        const dayElement = createDayElement(dayDate.getDate(), 'week-slot');

        if (
            dayDate.getDate() === today.getDate() &&
            dayDate.getMonth() === today.getMonth() &&
            dayDate.getFullYear() === today.getFullYear()
        ) {
            dayElement.classList.add('today');
        }

        const appointmentSource = weekEndMonthKey === monthKey
            ? monthAppointments
            : (dateKey.startsWith(monthKey) ? monthAppointments : nextMonthAppointments);
        addAppointmentBlocks(dayElement, appointmentSource[dateKey], 'week');
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

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateAppointmentsForMonth(year, month) {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rng = mulberry32(hashString(monthKey));
    const doctors = ['Dr. Rana', 'Dr. Lynn', 'Dr. Ito'];
    const patients = [
        { name: 'Frank Harrison', risk: 78 },
        { name: 'Maria Lopez', risk: 64 },
        { name: 'Daniel Whitmore', risk: 52 },
        { name: 'Evelyn Brooks', risk: 81 },
        { name: "James O'Connell", risk: 69 },
        { name: 'Aisha Rahman', risk: 47 },
        { name: 'Robert Jenkins', risk: 73 },
        { name: 'Linda Matthews', risk: 58 },
        { name: 'Thomas Caldwell', risk: 66 },
        { name: 'Priya Patel', risk: 41 },
        { name: 'Harold Simmons', risk: 84 },
        { name: 'Naomi Chen', risk: 36 },
        { name: 'William Foster', risk: 71 },
        { name: 'Rosa Martinez', risk: 62 },
        { name: 'Michael Turner', risk: 55 },
        { name: 'Fatima Hassan', risk: 49 },
        { name: 'George Whitfield', risk: 77 },
        { name: 'Emily Sanders', risk: 34 },
        { name: 'Samuel Greene', risk: 68 },
        { name: 'Nora Klein', risk: 59 },
        { name: 'Paul Anderson', risk: 63 },
        { name: 'Yvonne Dubois', risk: 72 },
        { name: 'Kevin Morales', risk: 46 },
        { name: 'Margaret Liu', risk: 80 },
        { name: 'Jonathan Price', risk: 57 },
        { name: 'Sofia Alvarez', risk: 39 },
        { name: 'Dennis Porter', risk: 74 },
        { name: 'Hannah Rosen', risk: 44 },
        { name: 'Victor Nguyen', risk: 61 },
        { name: 'Carol Bennett', risk: 83 }
    ];
    const schedule = {};

    for (let day = 1; day <= daysInMonth; day++) {
        let count = 1 + Math.floor(rng() * 2);
        if (day <= 5) {
            count = day === 1 ? 2 : 1;
        }
        const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
        schedule[dateKey] = [];
        for (let i = 0; i < count; i++) {
            const startHour = WEEK_START_HOUR + Math.floor(rng() * (WEEK_END_HOUR - WEEK_START_HOUR - 1));
            const startMinute = rng() > 0.5 ? 0 : 30;
            const duration = 30 + Math.floor(rng() * 4) * 15;
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = startMinutes + duration;
            const doctor = doctors[(day + i) % doctors.length];
            const patientEntry = patients[Math.floor(rng() * patients.length)];
            const patient = patientEntry.name;
            const risk = patientEntry.risk;

            const initials = patient
                .split(' ')
                .map(part => part[0])
                .join('')
                .toUpperCase();

            schedule[dateKey].push({
                doctor,
                patient,
                initials,
                risk,
                duration,
                startMinutes,
                color: riskToColor(risk),
                timeLabel: `${formatTime(startMinutes)}–${formatTime(endMinutes)}`
            });
        }
    }

    if (month === 0) {
        const nextMonthKey = `${year}-02`;
        if (!appointmentsCache.has(nextMonthKey)) {
            const nextMonthSchedule = {};
            const nextRng = mulberry32(hashString(nextMonthKey));
            for (let day = 1; day <= 10; day++) {
                const dateKey = `${nextMonthKey}-${String(day).padStart(2, '0')}`;
                nextMonthSchedule[dateKey] = [];
                const count = 2 + Math.floor(nextRng() * 2);
                for (let i = 0; i < count; i++) {
                    const startHour = WEEK_START_HOUR + Math.floor(nextRng() * (WEEK_END_HOUR - WEEK_START_HOUR - 1));
                    const startMinute = nextRng() > 0.5 ? 0 : 30;
                    const duration = 30 + Math.floor(nextRng() * 4) * 15;
                    const startMinutes = startHour * 60 + startMinute;
                    const endMinutes = startMinutes + duration;
                    const doctor = doctors[(day + i) % doctors.length];
                    const patientEntry = patients[Math.floor(nextRng() * patients.length)];
                    const patient = patientEntry.name;
                    const risk = patientEntry.risk;
                    const initials = patient
                        .split(' ')
                        .map(part => part[0])
                        .join('')
                        .toUpperCase();

                    nextMonthSchedule[dateKey].push({
                        doctor,
                        patient,
                        initials,
                        risk,
                        duration,
                        startMinutes,
                        color: riskToColor(risk),
                        timeLabel: `${formatTime(startMinutes)}–${formatTime(endMinutes)}`
                    });
                }
            }
            appointmentsCache.set(nextMonthKey, nextMonthSchedule);
        }
    }

    return schedule;
}

function formatTime(totalMinutes) {
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function riskToColor(risk) {
    const green = [107, 191, 124];
    const yellow = [245, 211, 106];
    const red = [122, 30, 30];
    let from = green;
    let to = yellow;
    let t = risk / 50;
    if (risk > 50) {
        from = yellow;
        to = red;
        t = (risk - 50) / 50;
    }
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    return `rgb(${r}, ${g}, ${b})`;
}

function hashString(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return hash >>> 0;
}

function mulberry32(seed) {
    let t = seed;
    return function () {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);

function initAOS() {
    if (window.AOS) {
        AOS.init({
            duration: 900,
            easing: 'ease-out-cubic',
            once: true,
            offset: 60
        });
    }
}

function initIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

function initRiskChart() {
    const canvas = document.getElementById('riskChart');
    if (!canvas || !window.Chart) return;

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Low',
                    data: [42, 38, 45, 40, 36, 44, 39],
                    borderColor: '#9BCFA8',
                    backgroundColor: 'rgba(155, 207, 168, 0.12)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Medium',
                    data: [28, 32, 30, 34, 31, 27, 29],
                    borderColor: '#D9C27A',
                    backgroundColor: 'rgba(217, 194, 122, 0.12)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'High',
                    data: [8, 6, 9, 7, 10, 8, 6],
                    borderColor: '#8A4A4A',
                    backgroundColor: 'rgba(138, 74, 74, 0.12)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        color: '#405751',
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(64, 87, 81, 0.9)',
                    titleColor: '#F3F5F9',
                    bodyColor: '#F3F5F9',
                    borderWidth: 0
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#7A8B87',
                        font: { size: 10 }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(64, 87, 81, 0.08)'
                    },
                    ticks: {
                        color: '#7A8B87',
                        font: { size: 10 }
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
}
