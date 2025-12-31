document.addEventListener('DOMContentLoaded', function() {
    // Текущая дата и неделя
    let currentDate = new Date();
    let notes = JSON.parse(localStorage.getItem('calendarNotes')) || {};

    // DOM элементы
    const calendarElement = document.getElementById('calendar');
    const currentWeekElement = document.getElementById('currentWeek');
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const todayBtn = document.getElementById('todayBtn');
    const aiAssistantBtn = document.getElementById('aiAssistantBtn');
    const aiAssistantPanel = document.getElementById('aiAssistantPanel');
    const closeAiPanel = document.getElementById('closeAiPanel');
    const aiModeBtns = document.querySelectorAll('.ai-mode-btn');
    const aiProcessBtn = document.getElementById('aiProcessBtn');
    const aiInput = document.getElementById('aiInput');
    const aiResponse = document.getElementById('aiResponse');
    const aiLoading = document.getElementById('aiLoading');

    // Дни недели на русском
    const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    // Инициализация календаря
    function initCalendar() {
        renderWeek(currentDate);
        updateWeekDisplay();
    }

    // Получить даты недели
    function getWeekDates(date) {
        const currentDay = date.getDay();
        const monday = new Date(date);
        
        // Начинаем неделю с понедельника (1)
        const diff = currentDay === 0 ? 6 : currentDay - 1;
        monday.setDate(date.getDate() - diff);
        
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            weekDates.push(day);
        }
        return weekDates;
    }

    // Отобразить неделю
    function renderWeek(date) {
        calendarElement.innerHTML = '';
        const weekDates = getWeekDates(date);
        
        weekDates.forEach((dayDate, index) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'day-column';
            
            const dateKey = formatDate(dayDate);
            const dayNotes = notes[dateKey] || '';
            
            dayElement.innerHTML = `
                <div class="day-header">
                    <div class="day-name">${daysOfWeek[index]}</div>
                    <div class="date-number">${dayDate.getDate()}</div>
                    <small style="color: #666; margin-top: 5px;">${months[dayDate.getMonth()].substring(0, 3)}</small>
                </div>
                <textarea class="notes-area" data-date="${dateKey}" 
                          placeholder="Добавьте заметки на этот день...">${dayNotes}</textarea>
            `;
            
            // Сохраняем заметки при изменении
            const textarea = dayElement.querySelector('.notes-area');
            textarea.addEventListener('input', function() {
                saveNote(dateKey, this.value);
            });
            
            calendarElement.appendChild(dayElement);
        });
    }

    // Форматировать дату для ключа
    function formatDate(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    // Сохранить заметку
    function saveNote(dateKey, content) {
        notes[dateKey] = content;
        localStorage.setItem('calendarNotes', JSON.stringify(notes));
    }

    // Обновить отображение текущей недели
    function updateWeekDisplay() {
        const weekDates = getWeekDates(currentDate);
        const startDate = weekDates[0];
        const endDate = weekDates[6];
        
        const startMonth = months[startDate.getMonth()];
        const endMonth = months[endDate.getMonth()];
        
        let displayText;
        if (startMonth === endMonth) {
            displayText = `${startDate.getDate()} - ${endDate.getDate()} ${startMonth} ${startDate.getFullYear()}`;
        } else {
            displayText = `${startDate.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth} ${startDate.getFullYear()}`;
        }
        
        currentWeekElement.textContent = displayText;
    }

    // Перейти на предыдущую неделю
    prevWeekBtn.addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 7);
        renderWeek(currentDate);
        updateWeekDisplay();
    });

    // Перейти на следующую неделю
    nextWeekBtn.addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() + 7);
        renderWeek(currentDate);
        updateWeekDisplay();
    });

    // Вернуться к сегодняшней неделе
    todayBtn.addEventListener('click', function() {
        currentDate = new Date();
        renderWeek(currentDate);
        updateWeekDisplay();
    });

    // AI Помощник
    aiAssistantBtn.addEventListener('click', function() {
        aiAssistantPanel.style.display = 'flex';
    });

    closeAiPanel.addEventListener('click', function() {
        aiAssistantPanel.style.display = 'none';
    });

    // Переключение режимов AI
    aiModeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            aiModeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const mode = this.dataset.mode;
            if (mode === 'structure') {
                aiInput.placeholder = "Опишите, как структурировать заметки... Например: 'Сгруппируй по темам' или 'Выдели важные задачи'";
            } else {
                aiInput.placeholder = "Что искать в заметках? Например: 'встречи', 'задачи', 'идеи' или 'покупки'";
            }
        });
    });

    // Обработка AI запроса
    aiProcessBtn.addEventListener('click', function() {
        const query = aiInput.value.trim();
        const mode = document.querySelector('.ai-mode-btn.active').dataset.mode;
        
        if (!query) {
            aiResponse.innerHTML = '⚠️ Пожалуйста, введите ваш запрос';
            return;
        }
        
        // Показать загрузку
        aiLoading.style.display = 'block';
        aiResponse.style.display = 'none';
        
        // Имитация работы AI (в реальности здесь будет вызов API)
        setTimeout(() => {
            aiLoading.style.display = 'none';
            aiResponse.style.display = 'block';
            
            const weekDates = getWeekDates(currentDate);
            const weekNotes = {};
            
            // Собираем заметки за неделю
            weekDates.forEach(date => {
                const dateKey = formatDate(date);
                if (notes[dateKey]) {
                    weekNotes[dateKey] = notes[dateKey];
                }
            });
            
            if (mode === 'structure') {
                // Структурирование заметок
                aiResponse.innerHTML = processStructure(query, weekNotes, weekDates);
            } else {
                // Поиск заметок
                aiResponse.innerHTML = processSearch(query, weekNotes, weekDates);
            }
        }, 1500);
    });

    // Функция структурирования (имитация AI)
    function processStructure(query, weekNotes, weekDates) {
        const notesCount = Object.keys(weekNotes).length;
        
        if (notesCount === 0) {
            return '📝 На этой неделе еще нет заметок. Добавьте их, чтобы я мог помочь с структурированием!';
        }
        
        let response = `<strong>📊 Анализ заметок за неделю (${notesCount} записей):</strong><br><br>`;
        
        // Анализ содержания (простая имитация)
        const allNotes = Object.values(weekNotes).join(' ').toLowerCase();
        const keywords = {
            'встреч': 'Встречи',
            'звонок': 'Звонки',
            'задач': 'Задачи',
            'проект': 'Проекты',
            'покуп': 'Покупки',
            'идея': 'Идеи',
            'важн': 'Важные дела'
        };
        
        response += '<strong>📈 Обнаруженные категории:</strong><br>';
        for (const [key, category] of Object.entries(keywords)) {
            if (allNotes.includes(key)) {
                const examples = [];
                for (const [date, note] of Object.entries(weekNotes)) {
                    if (note.toLowerCase().includes(key)) {
                        const day = weekDates.find(d => formatDate(d) === date);
                        examples.push(`${day.getDate()} ${months[day.getMonth()].substring(0, 3)}`);
                    }
                }
                response += `• ${category}: найдено в ${examples.length} днях (${examples.join(', ')})<br>`;
            }
        }
        
        response += '<br><strong>💡 Рекомендации:</strong><br>';
        response += '1. Группируйте похожие задачи вместе<br>';
        response += '2. Используйте хештеги для категорий (#встреча, #задача)<br>';
        response += '3. Выделяйте приоритеты с помощью символов (❗, 🔥)<br>';
        response += '4. Добавляйте даты выполнения задач<br><br>';
        
        response += '<em>💡 Совет от AI: Старайтесь писать конкретные формулировки с указанием сроков.</em>';
        
        return response;
    }

    // Функция поиска (имитация AI)
    function processSearch(query, weekNotes, weekDates) {
        const searchTerm = query.toLowerCase();
        const foundNotes = [];
        
        for (const [date, note] of Object.entries(weekNotes)) {
            if (note.toLowerCase().includes(searchTerm)) {
                const day = weekDates.find(d => formatDate(d) === date);
                const dayName = daysOfWeek[day.getDay() === 0 ? 6 : day.getDay() - 1];
                foundNotes.push({
                    date: `${dayName}, ${day.getDate()} ${months[day.getMonth()].substring(0, 3)}`,
                    note: note
                });
            }
        }
        
        if (foundNotes.length === 0) {
            return `🔍 По запросу "${query}" ничего не найдено. Попробуйте другие ключевые слова.`;
        }
        
        let response = `<strong>🔍 Результаты поиска "${query}" (${foundNotes.length}):</strong><br><br>`;
        
        foundNotes.forEach((item, index) => {
            const preview = item.note.length > 100 ? item.note.substring(0, 100) + '...' : item.note;
            response += `<strong>${index + 1}. 📅 ${item.date}:</strong><br>${preview.replace(new RegExp(searchTerm, 'gi'), match => `<mark>${match}</mark>`)}<br><br>`;
        });
        
        response += `<em>💡 Совет от AI: Используйте более конкретные запросы для точного поиска.</em>`;
        
        return response;
    }

    // Автосохранение при потере фокуса
    document.addEventListener('focusout', function(e) {
        if (e.target.classList.contains('notes-area')) {
            const textarea = e.target;
            const dateKey = textarea.dataset.date;
            saveNote(dateKey, textarea.value);
        }
    });

    // Закрытие панели AI при клике вне ее
    document.addEventListener('click', function(e) {
        if (!aiAssistantPanel.contains(e.target) && 
            !aiAssistantBtn.contains(e.target) && 
            aiAssistantPanel.style.display === 'flex') {
            aiAssistantPanel.style.display = 'none';
        }
    });

    // Инициализация
    initCalendar();
});
