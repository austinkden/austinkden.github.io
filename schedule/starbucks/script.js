document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthYearHeader = document.getElementById('current-month-year');
    
    // View Switcher Elements
    const btnViewMonth = document.getElementById('btn-view-month');
    const btnViewAgenda = document.getElementById('btn-view-agenda');
    const monthViewContainer = document.getElementById('month-view-container');
    const agendaViewContainer = document.getElementById('agenda-view-container');
    
    // Settings Tray Elements
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsTray = document.getElementById('settings-tray');
    const btnFormat12h = document.getElementById('btn-format-12h');
    const btnFormat24h = document.getElementById('btn-format-24h');
    
    // Calendar Grid & List Elements
    const calendarDaysGrid = document.getElementById('calendar-days');
    const agendaListContainer = document.getElementById('agenda-list');
    
    // Details Panel Elements
    const detailsPlaceholder = document.getElementById('details-placeholder');
    const detailsContent = document.getElementById('details-content');
    const detailsDate = document.getElementById('details-date');
    const detailsBadge = document.getElementById('details-badge');
    const detailsTime = document.getElementById('details-time');
    const detailsDuration = document.getElementById('details-duration');
    const detailsNotes = document.getElementById('details-notes');
    const detailsNotesRow = document.getElementById('details-notes-row');

    // Calendar State
    let currentDate = new Date();
    let selectedDateStr = null;
    let currentView = 'month'; // 'month' or 'agenda'
    
    // Load Time Format Preference from localStorage (defaults to 12h)
    let timeFormat = localStorage.getItem('time-format-pref') || '12h';

    // Month Names
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Helper: Zero-pad single digits
    function pad(n) {
        return String(n).padStart(2, '0');
    }

    // Helper: Format date as YYYY-MM-DD
    function formatDateKey(year, month, day) {
        return `${year}-${pad(month + 1)}-${pad(day)}`;
    }

    // Helper: Parse AM/PM time to minutes from midnight
    function parseTimeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.trim().split(/\s+/);
        if (parts.length < 2) return 0;
        
        const timePart = parts[0];
        const ampmPart = parts[1].toUpperCase();
        
        const timeSplit = timePart.split(':');
        let hours = parseInt(timeSplit[0], 10);
        const minutes = parseInt(timeSplit[1] || '0', 10);
        
        if (ampmPart === 'PM' && hours < 12) {
            hours += 12;
        } else if (ampmPart === 'AM' && hours === 12) {
            hours = 0;
        }
        
        return hours * 60 + minutes;
    }

    // Helper: Calculate shift duration in hours
    function calculateDuration(start, end) {
        const startMins = parseTimeToMinutes(start);
        const endMins = parseTimeToMinutes(end);
        let diffMins = endMins - startMins;
        
        if (diffMins < 0) {
            diffMins += 24 * 60; // Handle overnight shifts
        }
        
        const hours = diffMins / 60;
        return hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1);
    }

    // Helper: Format date for detailed view
    function formatLongDate(dateStr) {
        const parts = dateStr.split('-');
        const dateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        
        const options = { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            timeZone: 'UTC'
        };
        return dateObj.toLocaleDateString('en-US', options);
    }

    // Helper: Format time based on 12h/24h setting
    function formatTime(timeStr, is24h) {
        if (!timeStr) return "";
        const parts = timeStr.trim().split(/\s+/);
        if (parts.length < 2) return timeStr;
        
        if (is24h) {
            const timeSplit = parts[0].split(':');
            let hours = parseInt(timeSplit[0], 10);
            const minutes = timeSplit[1] || '00';
            const ampm = parts[1].toUpperCase();
            
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            return `${pad(hours)}:${minutes}`;
        }
        return timeStr.trim();
    }

    // Helper: Format short time for calendar cells
    function formatShortTime(timeStr, is24h) {
        if (!timeStr) return "";
        const parts = timeStr.trim().split(/\s+/);
        if (parts.length < 2) return timeStr;
        
        const timeSplit = parts[0].split(':');
        let h = parseInt(timeSplit[0], 10);
        const m = parseInt(timeSplit[1] || '0', 10);
        const ampm = parts[1].toUpperCase();

        if (is24h) {
            let h24 = h;
            if (ampm === 'PM' && h < 12) h24 += 12;
            if (ampm === 'AM' && h === 12) h24 = 0;
            return `${pad(h24)}:${pad(m)}`;
        } else {
            const timeText = m > 0 ? `${h}:${pad(m)}` : `${h}`;
            const modifier = ampm === 'PM' ? 'p' : 'a';
            return `${timeText}${modifier}`;
        }
    }

    // Display shift details
    function showShiftDetails(dateStr) {
        selectedDateStr = dateStr;
        
        // Highlight cell in monthly grid
        document.querySelectorAll('.day-cell').forEach(cell => {
            if (cell.dataset.date === dateStr) {
                cell.classList.add('selected');
            } else {
                cell.classList.remove('selected');
            }
        });

        // Highlight row in agenda view
        document.querySelectorAll('.agenda-item').forEach(row => {
            if (row.dataset.date === dateStr) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        });

        const schedule = window.STARBUCKS_SCHEDULE || {};
        const shift = schedule[dateStr];

        detailsPlaceholder.classList.add('hidden');
        detailsContent.classList.remove('hidden');
        detailsDate.textContent = formatLongDate(dateStr);

        const is24h = (timeFormat === '24h');

        if (shift) {
            detailsBadge.textContent = "Shift Scheduled";
            detailsBadge.className = "status-badge";
            detailsTime.textContent = `${formatTime(shift.start, is24h)} - ${formatTime(shift.end, is24h)}`;
            
            const hours = calculateDuration(shift.start, shift.end);
            detailsDuration.textContent = `(${hours} hrs)`;
            
            if (shift.notes) {
                detailsNotes.textContent = shift.notes;
                detailsNotesRow.style.display = 'flex';
            } else {
                detailsNotesRow.style.display = 'none';
            }
        } else {
            detailsBadge.textContent = "Day Off";
            detailsBadge.className = "status-badge off-badge";
            detailsTime.textContent = "None";
            detailsDuration.textContent = "";
            detailsNotes.textContent = "No shifts scheduled. Enjoy the day off!";
            detailsNotesRow.style.display = 'flex';
        }
    }

    // Render monthly grid
    function renderMonthGrid() {
        calendarDaysGrid.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevTotalDays = new Date(year, month, 0).getDate();
        
        const today = new Date();
        const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
        const is24h = (timeFormat === '24h');

        // 1. Previous month trailing padding
        for (let i = firstDayIndex; i > 0; i--) {
            const dayNum = prevTotalDays - i + 1;
            const prevMonthVal = month === 0 ? 11 : month - 1;
            const prevYearVal = month === 0 ? year - 1 : year;
            const dateStr = formatDateKey(prevYearVal, prevMonthVal, dayNum);
            
            const cell = createDayCell(dayNum, dateStr, true, false, is24h);
            calendarDaysGrid.appendChild(cell);
        }
        
        // 2. Current month days
        for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
            const dateStr = formatDateKey(year, month, dayNum);
            const isToday = (dateStr === todayStr);
            
            const cell = createDayCell(dayNum, dateStr, false, isToday, is24h);
            calendarDaysGrid.appendChild(cell);
        }
        
        // 3. Next month leading padding
        const totalCells = firstDayIndex + totalDays;
        const nextMonthPadding = (7 - (totalCells % 7)) % 7;
        
        for (let i = 1; i <= nextMonthPadding; i++) {
            const nextMonthVal = month === 11 ? 0 : month + 1;
            const nextYearVal = month === 11 ? year + 1 : year;
            const dateStr = formatDateKey(nextYearVal, nextMonthVal, i);
            
            const cell = createDayCell(i, dateStr, true, false, is24h);
            calendarDaysGrid.appendChild(cell);
        }

        if (selectedDateStr) {
            const visibleCell = calendarDaysGrid.querySelector(`.day-cell[data-date="${selectedDateStr}"]`);
            if (visibleCell) {
                visibleCell.classList.add('selected');
            }
        }
    }

    // Helper: Create day cell element
    function createDayCell(dayNum, dateStr, isAdjacent, isToday, is24h) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.dataset.date = dateStr;
        
        if (isAdjacent) cell.classList.add('adjacent-month');
        if (isToday) cell.classList.add('today');
        
        const schedule = window.STARBUCKS_SCHEDULE || {};
        const shift = schedule[dateStr];
        
        if (shift) cell.classList.add('has-shift');

        const numberLabel = document.createElement('span');
        numberLabel.className = 'day-number';
        numberLabel.textContent = dayNum;
        cell.appendChild(numberLabel);
        
        if (shift) {
            const shiftTag = document.createElement('span');
            shiftTag.className = 'shift-tag';
            shiftTag.textContent = `${formatShortTime(shift.start, is24h)}-${formatShortTime(shift.end, is24h)}`;
            cell.appendChild(shiftTag);
        }
        
        cell.addEventListener('click', () => {
            showShiftDetails(dateStr);
        });
        
        return cell;
    }

    // Render Agenda / List view
    function renderAgendaList() {
        agendaListContainer.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const schedule = window.STARBUCKS_SCHEDULE || {};
        const is24h = (timeFormat === '24h');
        
        let shiftsCount = 0;
        
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = formatDateKey(year, month, d);
            const shift = schedule[dateStr];
            
            if (shift) {
                shiftsCount++;
                
                const item = document.createElement('div');
                item.className = 'agenda-item';
                item.dataset.date = dateStr;
                if (selectedDateStr === dateStr) {
                    item.classList.add('selected');
                }
                
                // Date tag construction
                const dateParts = dateStr.split('-');
                const tempDateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
                const weekdayShort = tempDateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
                const monthDay = tempDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                
                const dateInfo = document.createElement('div');
                dateInfo.className = 'agenda-date-info';
                
                const weekdayEl = document.createElement('span');
                weekdayEl.className = 'agenda-weekday';
                weekdayEl.textContent = weekdayShort;
                
                const dayEl = document.createElement('span');
                dayEl.className = 'agenda-day';
                dayEl.textContent = monthDay;
                
                dateInfo.appendChild(weekdayEl);
                dateInfo.appendChild(dayEl);
                item.appendChild(dateInfo);
                
                // Shift details
                const shiftInfo = document.createElement('div');
                shiftInfo.className = 'agenda-shift-info';
                
                const timeEl = document.createElement('div');
                timeEl.className = 'agenda-time';
                timeEl.textContent = `${formatTime(shift.start, is24h)} - ${formatTime(shift.end, is24h)}`;
                
                const durationEl = document.createElement('span');
                durationEl.className = 'agenda-duration';
                const hours = calculateDuration(shift.start, shift.end);
                durationEl.textContent = `${hours} hrs`;
                timeEl.appendChild(durationEl);
                
                const notesEl = document.createElement('div');
                notesEl.className = 'agenda-notes';
                notesEl.textContent = shift.notes || "Shift scheduled";
                
                shiftInfo.appendChild(timeEl);
                shiftInfo.appendChild(notesEl);
                item.appendChild(shiftInfo);
                
                item.addEventListener('click', () => {
                    showShiftDetails(dateStr);
                });
                
                agendaListContainer.appendChild(item);
            }
        }
        
        if (shiftsCount === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'agenda-empty';
            emptyState.textContent = 'No shifts scheduled for this month.';
            agendaListContainer.appendChild(emptyState);
        }
    }

    // Master Render function
    function renderAll() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        currentMonthYearHeader.textContent = `${monthNames[month]} ${year}`;
        
        if (currentView === 'month') {
            monthViewContainer.classList.remove('hidden');
            agendaViewContainer.classList.add('hidden');
            renderMonthGrid();
        } else {
            monthViewContainer.classList.add('hidden');
            agendaViewContainer.classList.remove('hidden');
            renderAgendaList();
        }

        if (selectedDateStr) {
            showShiftDetails(selectedDateStr);
        }
    }

    // Set Time Format Preference and update UI
    function setTimeFormat(format) {
        timeFormat = format;
        localStorage.setItem('time-format-pref', format);
        
        if (format === '12h') {
            btnFormat12h.classList.add('active');
            btnFormat24h.classList.remove('active');
        } else {
            btnFormat12h.classList.remove('active');
            btnFormat24h.classList.add('active');
        }
        
        renderAll();
    }

    // Set Active View (Month / Agenda)
    function setView(view) {
        currentView = view;
        
        if (view === 'month') {
            btnViewMonth.classList.add('active');
            btnViewAgenda.classList.remove('active');
        } else {
            btnViewMonth.classList.remove('active');
            btnViewAgenda.classList.add('active');
        }
        
        renderAll();
    }

    // Navigation Listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderAll();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderAll();
    });

    // View Switcher Listeners
    btnViewMonth.addEventListener('click', () => setView('month'));
    btnViewAgenda.addEventListener('click', () => setView('agenda'));

    // Settings Panel Listeners
    settingsToggle.addEventListener('click', () => {
        settingsTray.classList.toggle('hidden');
        settingsToggle.classList.toggle('active');
    });

    btnFormat12h.addEventListener('click', () => setTimeFormat('12h'));
    btnFormat24h.addEventListener('click', () => setTimeFormat('24h'));

    // Initialize formatting toggle buttons on load
    setTimeFormat(timeFormat);

    // Default select current day or the first shift in the current month
    const today = new Date();
    const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    const schedule = window.STARBUCKS_SCHEDULE || {};
    
    if (schedule[todayStr]) {
        showShiftDetails(todayStr);
    } else {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        let firstShiftDateStr = null;
        
        for (let d = 1; d <= 31; d++) {
            const checkStr = formatDateKey(year, month, d);
            if (schedule[checkStr]) {
                firstShiftDateStr = checkStr;
                break;
            }
        }
        
        if (firstShiftDateStr) {
            showShiftDetails(firstShiftDateStr);
        } else {
            showShiftDetails(todayStr);
        }
    }
});
