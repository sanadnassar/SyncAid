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
const newApptBtn = document.getElementById('newApptBtn');
const patientMenu = document.getElementById('patientMenu');
const calendarHeader = document.getElementById('calendarHeader');
const calendarActionsFloating = document.getElementById('calendarActionsFloating');

let currentView = 'month';
let selectedAppointment = null;
const WEEK_START_HOUR = 8;
const WEEK_END_HOUR = 18;
const WEEK_VIEW_HEIGHT = 990;
const WEEK_VIEW_PADDING_TOP = 28;
const WEEK_VIEW_PADDING_BOTTOM = 8;
const appointmentsCache = new Map();
let listenersAttached = false;
const patientDirectory = [
{ name: 'Frank Harrison', risk: 96 },
{ name: 'Maria Lopez', risk: 28 },
{ name: 'Daniel Whitmore', risk: 22 },
{ name: 'Evelyn Brooks', risk: 60 },
{ name: "James O'Connell", risk: 48 },
{ name: 'Aisha Rahman', risk: 18 },
{ name: 'Robert Jenkins', risk: 70 },
{ name: 'Linda Matthews', risk: 35 },
{ name: 'Thomas Caldwell', risk: 52 },
{ name: 'Priya Patel', risk: 16 },
{ name: 'Harold Simmons', risk: 88 },
{ name: 'Naomi Chen', risk: 14 },
{ name: 'William Foster', risk: 57 },
{ name: 'Rosa Martinez', risk: 41 },
{ name: 'Michael Turner', risk: 33 },
{ name: 'Fatima Hassan', risk: 21 },
{ name: 'George Whitfield', risk: 79 },
{ name: 'Emily Sanders', risk: 12 },
{ name: 'Samuel Greene', risk: 55 },
{ name: 'Nora Klein', risk: 38 },
{ name: 'Paul Anderson', risk: 44 },
{ name: 'Yvonne Dubois', risk: 73 },
{ name: 'Kevin Morales', risk: 19 },
{ name: 'Margaret Liu', risk: 75 },
{ name: 'Jonathan Price', risk: 36 },
{ name: 'Sofia Alvarez', risk: 15 },
{ name: 'Dennis Porter', risk: 77 },
{ name: 'Hannah Rosen', risk: 17 },
{ name: 'Victor Nguyen', risk: 42 },
{ name: 'Carol Bennett', risk: 92 }

];

// Month names
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Initialize dashboard
function initDashboard() {
    renderCalendar();
    updateTodayDate();
    if (!listenersAttached) {
        attachEventListeners();
        listenersAttached = true;
    }
    updateStats();
    animateStats(); // Add animation to numbers
    initIcons();
    initAOS();
    initRiskChart();
    initPatientMenu();
    initFloatingActions();
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

    if (monthKey === '2026-02') {
        appointmentsCache.set(monthKey, generateAppointmentsForMonth(viewYear, viewMonth));
    } else if (!appointmentsCache.has(monthKey)) {
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
    prevMonthBtn.onclick = () => {
        if (currentView === 'month') {
            currentDate.setDate(1);
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() - 7);
        }
        renderCalendar();
    };

    nextMonthBtn.onclick = () => {
        if (currentView === 'month') {
            currentDate.setDate(1);
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() + 7);
        }
        renderCalendar();
    };

    viewButtons.forEach(button => {
        button.onclick = () => {
            const view = button.getAttribute('data-view');
            // Only update if view actually changes
            if (currentView !== view) {
                setView(view);
            }
        };
    });

    if (newApptBtn && patientMenu) {
        newApptBtn.onclick = () => {
            const isOpen = patientMenu.classList.toggle('is-open');
            newApptBtn.setAttribute('aria-expanded', String(isOpen));
        };

        document.addEventListener('click', (event) => {
            if (!patientMenu.contains(event.target) && !newApptBtn.contains(event.target)) {
                patientMenu.classList.remove('is-open');
                newApptBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }
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
    if (monthKey === '2026-02') {
        appointmentsCache.set(monthKey, generateAppointmentsForMonth(year, month));
    } else if (!appointmentsCache.has(monthKey)) {
        appointmentsCache.set(monthKey, generateAppointmentsForMonth(year, month));
    }
    const monthAppointments = appointmentsCache.get(monthKey);
    const prevMonthDate = new Date(year, month - 1, 1);
    const nextMonthDate = new Date(year, month + 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const nextMonthKey = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
    if (!appointmentsCache.has(prevMonthKey)) {
        appointmentsCache.set(prevMonthKey, generateAppointmentsForMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth()));
    }
    if (!appointmentsCache.has(nextMonthKey)) {
        appointmentsCache.set(nextMonthKey, generateAppointmentsForMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth()));
    }
    const prevMonthAppointments = appointmentsCache.get(prevMonthKey);
    const nextMonthAppointments = appointmentsCache.get(nextMonthKey);

    monthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createDayElement(day, 'other-month');
        const dateKey = `${prevMonthKey}-${String(day).padStart(2, '0')}`;
        addAppointmentBlocks(dayElement, prevMonthAppointments[dateKey], 'month');
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
        const dayElement = createDayElement(day, 'other-month');
        const dateKey = `${nextMonthKey}-${String(day).padStart(2, '0')}`;
        addAppointmentBlocks(dayElement, nextMonthAppointments[dateKey], 'month');
    }
}

function renderWeekView() {
    const weekStart = getStartOfWeek(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const monthKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
    if (monthKey === '2026-02') {
        appointmentsCache.set(monthKey, generateAppointmentsForMonth(weekStart.getFullYear(), weekStart.getMonth()));
    } else if (!appointmentsCache.has(monthKey)) {
        appointmentsCache.set(monthKey, generateAppointmentsForMonth(weekStart.getFullYear(), weekStart.getMonth()));
    }
    const monthAppointments = appointmentsCache.get(monthKey);

    const weekEndMonthKey = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}`;
    if (weekEndMonthKey !== monthKey) {
        if (weekEndMonthKey === '2026-02') {
            appointmentsCache.set(weekEndMonthKey, generateAppointmentsForMonth(weekEnd.getFullYear(), weekEnd.getMonth()));
        } else if (!appointmentsCache.has(weekEndMonthKey)) {
            appointmentsCache.set(weekEndMonthKey, generateAppointmentsForMonth(weekEnd.getFullYear(), weekEnd.getMonth()));
        }
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

function generateAppointmentsForMonth(year, month, forceRandom = false) {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rng = forceRandom ? Math.random : mulberry32(hashString(monthKey));
    const doctors = ['Dr. Rana', 'Dr. Lynn', 'Dr. Ito'];
    const patients = patientDirectory;
    const schedule = {};

    for (let day = 1; day <= daysInMonth; day++) {
        const count = 1 + Math.floor(rng() * 2);
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

    if (monthKey === '2026-02') {
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `2026-02-${String(day).padStart(2, '0')}`;
            schedule[dateKey] = [];
        }

        const hardcoded = {
            '2026-02-01': [
                { patient: 'Maria Lopez', risk: 28, start: 9 * 60, duration: 45 },
                { patient: 'Harold Simmons', risk: 88, start: 11 * 60, duration: 60 },
                { patient: 'Priya Patel', risk: 16, start: 14 * 60 + 30, duration: 30 }
            ],
            '2026-02-02': [
                { patient: 'Emily Sanders', risk: 12, start: 8 * 60 + 30, duration: 45 }
            ],
            '2026-02-03': [
                { patient: 'Daniel Whitmore', risk: 22, start: 9 * 60, duration: 30 },
                { patient: 'Evelyn Brooks', risk: 60, start: 12 * 60, duration: 45 },
                { patient: 'Sofia Alvarez', risk: 15, start: 16 * 60, duration: 30 }
            ],
            '2026-02-04': [
                { patient: 'Yvonne Dubois', risk: 73, start: 8 * 60, duration: 45 },
                { patient: 'Rosa Martinez', risk: 41, start: 11 * 60 + 30, duration: 30 },
                { patient: 'Carol Bennett', risk: 92, start: 14 * 60, duration: 60 }
            ],
            '2026-02-05': [
                { patient: 'Michael Turner', risk: 33, start: 9 * 60 + 30, duration: 30 },
                { patient: 'Thomas Caldwell', risk: 52, start: 13 * 60, duration: 45 },
                { patient: 'Dennis Porter', risk: 77, start: 15 * 60 + 30, duration: 45 }
            ]
            ,
            '2026-02-06': [
                { patient: 'Yvonne Dubois', risk: 73, start: 11 * 60, duration: 60 }
            ]
            ,
            '2026-02-07': [
                { patient: 'Rosa Martinez', risk: 41, start: 9 * 60, duration: 45 },
                { patient: 'Victor Nguyen', risk: 42, start: 13 * 60, duration: 30 }
            ],
            '2026-02-08': [
                { patient: 'Linda Matthews', risk: 35, start: 10 * 60 + 30, duration: 30 },
                { patient: 'Samuel Greene', risk: 55, start: 14 * 60, duration: 45 }
            ],
            '2026-02-09': [
                { patient: 'Paul Anderson', risk: 44, start: 9 * 60 + 30, duration: 45 },
                { patient: 'Margaret Liu', risk: 75, start: 15 * 60, duration: 45 }
            ],
            '2026-02-10': [
                { patient: 'Kevin Morales', risk: 19, start: 8 * 60 + 30, duration: 30 },
                { patient: 'Jonathan Price', risk: 36, start: 12 * 60, duration: 45 }
            ]
        };

        Object.keys(hardcoded).forEach(dateKey => {
            schedule[dateKey] = hardcoded[dateKey].map((entry, index) => {
                const endMinutes = entry.start + entry.duration;
                const initials = entry.patient
                    .split(' ')
                    .map(part => part[0])
                    .join('')
                    .toUpperCase();
                return {
                    doctor: doctors[index % doctors.length],
                    patient: entry.patient,
                    initials,
                    risk: entry.risk,
                    duration: entry.duration,
                    startMinutes: entry.start,
                    color: riskToColor(entry.risk),
                    timeLabel: `${formatTime(entry.start)}–${formatTime(endMinutes)}`
                };
            });
        });

        for (let day = 11; day <= 28; day++) {
            const dateKey = `2026-02-${String(day).padStart(2, '0')}`;
            if (schedule[dateKey] && schedule[dateKey].length > 0) {
                continue;
            }
            schedule[dateKey] = [];
            const count = 1 + Math.floor(rng() * 2);
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

    if (monthKey === '2026-02') {
        const dateKey = '2026-02-02';
        const target = schedule[dateKey] || [];
        const extraEntries = [
            { patient: 'Harold Simmons', risk: 88, start: 13 * 60, duration: 45 },
            { patient: 'Margaret Liu', risk: 75, start: 14 * 60 + 30, duration: 45 },
            { patient: 'Dennis Porter', risk: 77, start: 16 * 60, duration: 45 }
        ];
        extraEntries.forEach((entry, index) => {
            const endMinutes = entry.start + entry.duration;
            const initials = entry.patient
                .split(' ')
                .map(part => part[0])
                .join('')
                .toUpperCase();
            target.push({
                doctor: doctors[(2 + index) % doctors.length],
                patient: entry.patient,
                initials,
                risk: entry.risk,
                duration: entry.duration,
                startMinutes: entry.start,
                color: riskToColor(entry.risk),
                timeLabel: `${formatTime(entry.start)}–${formatTime(endMinutes)}`
            });
        });
        schedule[dateKey] = target;
    }

    return schedule;
}

function initPatientMenu() {
    if (!patientMenu) return;
    patientMenu.innerHTML = '';
    patientDirectory.forEach((patient) => {
        const item = document.createElement('div');
        item.className = 'patient-dropdown__item';
        item.textContent = patient.name;
        item.setAttribute('role', 'option');
        item.style.setProperty('--risk-color', riskToColor(patient.risk));
        item.addEventListener('click', () => {
            if (patient.name === 'Frank Harrison') {
                handleFrankSelection();
            }
            patientMenu.classList.remove('is-open');
            newApptBtn.setAttribute('aria-expanded', 'false');
        });
        patientMenu.appendChild(item);
    });
}

function handleFrankSelection() {
    const monthKey = '2026-02';
    if (!appointmentsCache.has(monthKey)) {
        appointmentsCache.set(monthKey, generateAppointmentsForMonth(2026, 1));
    }
    const schedule = appointmentsCache.get(monthKey);
    const feb2Key = `${monthKey}-02`;

    schedule[feb2Key] = schedule[feb2Key] || [];

    const fhRisk = (patientDirectory.find(p => p.name === 'Frank Harrison') || { risk: 96 }).risk;

    // Feb 2: replace Emily Sanders with Frank Harrison
    const esIndexFeb2 = schedule[feb2Key].findIndex(entry => entry.patient === 'Emily Sanders');
    if (esIndexFeb2 !== -1) {
        const esSlot = schedule[feb2Key][esIndexFeb2];
        schedule[feb2Key][esIndexFeb2] = {
            doctor: esSlot.doctor,
            patient: 'Frank Harrison',
            initials: 'FH',
            risk: fhRisk,
            duration: esSlot.duration,
            startMinutes: esSlot.startMinutes,
            color: riskToColor(fhRisk),
            timeLabel: esSlot.timeLabel
        };
    }

    appointmentsCache.set(monthKey, schedule);
    renderCalendar();
    updateStats();
}

function initFloatingActions() {
    if (!calendarActionsFloating || !calendarHeader) return;
    const appHeader = document.querySelector('.app-header');
    const headerOffset = appHeader ? appHeader.getBoundingClientRect().height : 72;
    const originalParent = calendarActionsFloating.parentElement;

    const syncPosition = () => {
        const headerRect = calendarHeader.getBoundingClientRect();
        const shouldFix = headerRect.top <= headerOffset;

        if (shouldFix) {
            calendarActionsFloating.classList.add('is-fixed');
            if (calendarActionsFloating.parentElement !== document.body) {
                document.body.appendChild(calendarActionsFloating);
            }
            const rightEdge = Math.min(
                headerRect.right,
                window.innerWidth - 16
            );

            const offset = 10;
            calendarActionsFloating.style.left = `${rightEdge - calendarActionsFloating.offsetWidth - offset}px`;
            calendarActionsFloating.style.top = `${headerOffset + 8}px`;
        } else {
            calendarActionsFloating.classList.remove('is-fixed');
            calendarActionsFloating.style.left = '';
            calendarActionsFloating.style.top = '';
            if (calendarActionsFloating.parentElement !== originalParent) {
                originalParent.appendChild(calendarActionsFloating);
            }
        }
    };

    syncPosition();
    window.addEventListener('scroll', syncPosition, { passive: true });
    window.addEventListener('resize', syncPosition);
}


function formatTime(totalMinutes) {
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function riskToColor(risk) {
    const green = [168, 220, 186];
    const yellow = [246, 226, 158];
    const red = [190, 70, 70];
    const minAge = 30;
    const maxAge = 85;
    const clamped = Math.min(Math.max(risk, minAge), maxAge);
    const normalized = (clamped - minAge) / (maxAge - minAge);
    let from = green;
    let to = yellow;
    let t = normalized / 0.5;
    if (normalized > 0.5) {
        from = yellow;
        to = red;
        t = (normalized - 0.5) / 0.5;
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
