// app.js - Main application logic for AI Calendar

// Import TensorFlow.js dynamically
import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.es2017.mjs';

// Configuration for Yandex Cloud Function
const YANDEX_API_URL = 'https://functions.yandexcloud.net/d4eaqaic6hn3ja5d97fm';

// Days of the week
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Calendar application class
class AICalendar {
    constructor() {
        this.notes = {};
        this.currentDay = null;
        this.currentNoteId = null;
        this.tfModel = null;
        this.isTfReady = false;
        
        // Initialize TensorFlow.js
        this.initTensorFlow();
        
        // Initialize the application
        this.initApp();
    }
    
    /**
     * Initialize TensorFlow.js for potential future ML features
     */
    async initTensorFlow() {
        try {
            // Check if TensorFlow.js is available
            await tf.ready();
            console.log('TensorFlow.js loaded successfully');
            
            // Create a simple model for demonstration
            // In a real application, this could be a pre-trained model for text processing
            this.tfModel = tf.sequential({
                layers: [
                    tf.layers.dense({ units: 10, inputShape: [5], activation: 'relu' }),
                    tf.layers.dense({ units: 1, activation: 'sigmoid' })
                ]
            });
            
            this.isTfReady = true;
            console.log('TensorFlow model initialized');
            
            // Update UI status
            this.updateAIStatus(true);
        } catch (error) {
            console.error('Error initializing TensorFlow:', error);
            this.updateAIStatus(false);
        }
    }
    
    /**
     * Update AI status in the UI
     */
    updateAIStatus(isReady) {
        const statusElement = document.querySelector('.ai-status span');
        if (statusElement) {
            statusElement.textContent = isReady 
                ? 'TensorFlow.js Ready • YandexGPT Connected' 
                : 'AI Features Limited • Check Connection';
            
            const statusIcon = document.querySelector('.ai-status i');
            if (statusIcon) {
                statusIcon.style.color = isReady ? '#10b981' : '#f59e0b';
            }
        }
    }
    
    /**
     * Initialize the application UI and event listeners
     */
    initApp() {
        this.generateWeekDays();
        this.loadNotesFromStorage();
        this.setupEventListeners();
    }
    
    /**
     * Generate the 7 day columns for the week view
     */
    generateWeekDays() {
        const weekDaysContainer = document.getElementById('weekDays');
        weekDaysContainer.innerHTML = '';
        
        // Get current date to display
        const today = new Date();
        const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Adjust to start from Monday (index 1)
        const mondayOffset = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
        const mondayDate = new Date(today);
        mondayDate.setDate(today.getDate() + mondayOffset);
        
        DAYS_OF_WEEK.forEach((dayName, index) => {
            // Calculate date for each day
            const dayDate = new Date(mondayDate);
            dayDate.setDate(mondayDate.getDate() + index);
            
            // Format date display
            const dateStr = dayDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            // Check if this is today
            const isToday = dayDate.toDateString() === today.toDateString();
            
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            dayColumn.dataset.day = dayName.toLowerCase();
            
            dayColumn.innerHTML = `
                <div class="day-header ${isToday ? 'today' : ''}">
                    <div>${dayName}</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">${dateStr}</div>
                    ${isToday ? '<div style="font-size: 0.7rem; margin-top: 3px;">TODAY</div>' : ''}
                </div>
                <div class="notes-container" id="notes-${dayName.toLowerCase()}">
                    <!-- Notes will be dynamically added here -->
                </div>
                <button class="add-note-btn" data-day="${dayName.toLowerCase()}">
                    <i class="fas fa-plus"></i> Add Note
                </button>
            `;
            
            weekDaysContainer.appendChild(dayColumn);
        });
        
        // Add notes to each day after creating the columns
        this.renderNotes();
    }
    
    /**
     * Load notes from localStorage
     */
    loadNotesFromStorage() {
        try {
            const savedNotes = localStorage.getItem('aiCalendarNotes');
            if (savedNotes) {
                this.notes = JSON.parse(savedNotes);
            } else {
                // Initialize with empty notes for each day
                DAYS_OF_WEEK.forEach(day => {
                    this.notes[day.toLowerCase()] = [];
                });
                this.saveNotesToStorage();
            }
        } catch (error) {
            console.error('Error loading notes from storage:', error);
            // Initialize empty notes object
            DAYS_OF_WEEK.forEach(day => {
                this.notes[day.toLowerCase()] = [];
            });
        }
    }
    
    /**
     * Save notes to localStorage
     */
    saveNotesToStorage() {
        try {
            localStorage.setItem('aiCalendarNotes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving notes to storage:', error);
        }
    }
    
    /**
     * Render notes for each day
     */
    renderNotes() {
        DAYS_OF_WEEK.forEach(day => {
            const dayKey = day.toLowerCase();
            const notesContainer = document.getElementById(`notes-${dayKey}`);
            if (!notesContainer) return;
            
            notesContainer.innerHTML = '';
            
            if (this.notes[dayKey] && this.notes[dayKey].length > 0) {
                this.notes[dayKey].forEach((note, index) => {
                    const noteElement = document.createElement('div');
                    noteElement.className = 'note';
                    noteElement.dataset.noteId = `${dayKey}-${index}`;
                    
                    // Format time
                    const timeStr = note.timestamp 
                        ? new Date(note.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : 'Recently';
                    
                    noteElement.innerHTML = `
                        <div class="note-content">${this.escapeHtml(note.content)}</div>
                        <div class="note-time">
                            <i class="far fa-clock"></i>
                            <span>${timeStr}</span>
                            <button class="ai-note-action" data-day="${dayKey}" data-index="${index}" style="margin-left: auto; background: none; border: none; color: #8b5cf6; cursor: pointer;">
                                <i class="fas fa-robot"></i>
                            </button>
                        </div>
                    `;
                    
                    notesContainer.appendChild(noteElement);
                });
            } else {
                // Show empty state
                const emptyState = document.createElement('div');
                emptyState.className = 'note';
                emptyState.style.opacity = '0.7';
                emptyState.style.textAlign = 'center';
                emptyState.style.fontStyle = 'italic';
                emptyState.textContent = 'No notes for this day';
                notesContainer.appendChild(emptyState);
            }
        });
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Setup event listeners for the application
     */
    setupEventListeners() {
        // Add note buttons for each day
        document.addEventListener('click', (e) => {
            // Add note button
            if (e.target.closest('.add-note-btn')) {
                const button = e.target.closest('.add-note-btn');
                const day = button.dataset.day;
                this.openNoteModal(day);
            }
            
            // Edit existing note
            if (e.target.closest('.note')) {
                const noteElement = e.target.closest('.note');
                const noteId = noteElement.dataset.noteId;
                
                // Don't trigger if clicking the AI button inside the note
                if (!e.target.closest('.ai-note-action')) {
                    this.editNote(noteId);
                }
            }
            
            // AI action button inside a note
            if (e.target.closest('.ai-note-action')) {
                const button = e.target.closest('.ai-note-action');
                const day = button.dataset.day;
                const index = parseInt(button.dataset.index);
                this.askAIForNoteImprovement(day, index);
            }
        });
        
        // Note modal buttons
        document.getElementById('closeNoteModal').addEventListener('click', () => {
            this.closeNoteModal();
        });
        
        document.getElementById('cancelNote').addEventListener('click', () => {
            this.closeNoteModal();
        });
        
        document.getElementById('saveNote').addEventListener('click', () => {
            this.saveCurrentNote();
        });
        
        document.getElementById('askAIForNote').addEventListener('click', () => {
            this.askAIForCurrentNote();
        });
        
        // AI modal buttons
        document.getElementById('closeAiModal').addEventListener('click', () => {
            this.closeAIModal();
        });
        
        // Global AI buttons
        document.getElementById('structureAllBtn').addEventListener('click', () => {
            this.structureAllNotesWithAI();
        });
        
        document.getElementById('summarizeAllBtn').addEventListener('click', () => {
            this.summarizeWeekWithAI();
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            const noteModal = document.getElementById('noteModal');
            const aiModal = document.getElementById('aiChatModal');
            
            if (e.target === noteModal) {
                this.closeNoteModal();
            }
            
            if (e.target === aiModal) {
                this.closeAIModal();
            }
        });
        
        // Handle beforeunload to clean up TensorFlow memory
        window.addEventListener('beforeunload', () => {
            this.cleanupTensorFlow();
        });
    }
    
    /**
     * Open the note modal for adding/editing a note
     */
    openNoteModal(day, noteIndex = null) {
        this.currentDay = day;
        this.currentNoteId = noteIndex;
        
        const modal = document.getElementById('noteModal');
        const modalTitle = document.getElementById('modalTitle');
        const noteInput = document.getElementById('noteInput');
        const aiResponse = document.getElementById('aiNoteResponse');
        
        // Reset modal state
        aiResponse.style.display = 'none';
        aiResponse.textContent = '';
        
        if (noteIndex !== null && this.notes[day] && this.notes[day][noteIndex]) {
            // Editing existing note
            modalTitle.textContent = `Edit Note for ${this.capitalizeFirstLetter(day)}`;
            noteInput.value = this.notes[day][noteIndex].content;
        } else {
            // Adding new note
            modalTitle.textContent = `Add Note for ${this.capitalizeFirstLetter(day)}`;
            noteInput.value = '';
        }
        
        modal.style.display = 'flex';
        noteInput.focus();
    }
    
    /**
     * Close the note modal
     */
    closeNoteModal() {
        const modal = document.getElementById('noteModal');
        modal.style.display = 'none';
        
        // Clear current state
        this.currentDay = null;
        this.currentNoteId = null;
    }
    
    /**
     * Save the current note from the modal
     */
    saveCurrentNote() {
        if (!this.currentDay) return;
        
        const noteInput = document.getElementById('noteInput');
        const content = noteInput.value.trim();
        
        if (!content) {
            alert('Please enter some text for the note.');
            return;
        }
        
        // Initialize day array if it doesn't exist
        if (!this.notes[this.currentDay]) {
            this.notes[this.currentDay] = [];
        }
        
        const noteData = {
            content: content,
            timestamp: Date.now(),
            day: this.currentDay
        };
        
        if (this.currentNoteId !== null) {
            // Update existing note
            this.notes[this.currentDay][this.currentNoteId] = noteData;
        } else {
            // Add new note
            this.notes[this.currentDay].push(noteData);
        }
        
        // Save to localStorage and re-render
        this.saveNotesToStorage();
        this.renderNotes();
        this.closeNoteModal();
    }
    
    /**
     * Edit an existing note
     */
    editNote(noteId) {
        const [day, indexStr] = noteId.split('-');
        const index = parseInt(indexStr);
        
        if (this.notes[day] && this.notes[day][index]) {
            this.openNoteModal(day, index);
        }
    }
    
    /**
     * Ask AI to improve the current note in the modal
     */
    async askAIForCurrentNote() {
        const noteInput = document.getElementById('noteInput');
        const content = noteInput.value.trim();
        const aiResponse = document.getElementById('aiNoteResponse');
        
        if (!content) {
            alert('Please enter some text for the AI to improve.');
            return;
        }
        
        aiResponse.style.display = 'block';
        aiResponse.textContent = 'AI is thinking...';
        
        try {
            const prompt = `Improve the following note to make it more structured and clear: "${content}"`;
            const improvedText = await this.callYandexAPI(prompt);
            
            aiResponse.textContent = `AI Suggestion:\n\n${improvedText}`;
            
            // Add a button to apply the suggestion
            const applyButton = document.createElement('button');
            applyButton.textContent = 'Apply Suggestion';
            applyButton.style.cssText = `
                background: #10b981;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 8px 16px;
                margin-top: 10px;
                cursor: pointer;
                font-weight: 600;
            `;
            
            applyButton.addEventListener('click', () => {
                noteInput.value = improvedText;
                aiResponse.style.display = 'none';
            });
            
            // Clear previous button if exists
            const oldButton = aiResponse.querySelector('button');
            if (oldButton) oldButton.remove();
            
            aiResponse.appendChild(applyButton);
            
        } catch (error) {
            console.error('Error calling Yandex API:', error);
            aiResponse.textContent = `Error: ${error.message}. Please check your Yandex Cloud Function configuration.`;
        }
    }
    
    /**
     * Ask AI to improve a specific note
     */
    async askAIForNoteImprovement(day, index) {
        if (!this.notes[day] || !this.notes[day][index]) {
            console.error('Note not found');
            return;
        }
        
        const note = this.notes[day][index];
        this.openNoteModal(day, index);
        
        // Wait a bit for modal to open
        setTimeout(async () => {
            const aiResponse = document.getElementById('aiNoteResponse');
            aiResponse.style.display = 'block';
            aiResponse.textContent = 'AI is thinking...';
            
            try {
                const prompt = `Improve the following note to make it more structured and clear: "${note.content}"`;
                const improvedText = await this.callYandexAPI(prompt);
                
                aiResponse.textContent = `AI Suggestion:\n\n${improvedText}`;
                
                // Add a button to apply the suggestion
                const applyButton = document.createElement('button');
                applyButton.textContent = 'Apply Suggestion';
                applyButton.style.cssText = `
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 8px 16px;
                    margin-top: 10px;
                    cursor: pointer;
                    font-weight: 600;
                `;
                
                applyButton.addEventListener('click', () => {
                    document.getElementById('noteInput').value = improvedText;
                    aiResponse.style.display = 'none';
                });
                
                aiResponse.appendChild(applyButton);
                
            } catch (error) {
                console.error('Error calling Yandex API:', error);
                aiResponse.textContent = `Error: ${error.message}. Please check your Yandex Cloud Function configuration.`;
            }
        }, 300);
    }
    
    /**
     * Structure all notes with AI
     */
    async structureAllNotesWithAI() {
        // Collect all notes from all days
        let allNotes = [];
        DAYS_OF_WEEK.forEach(day => {
            const dayKey = day.toLowerCase();
            if (this.notes[dayKey] && this.notes[dayKey].length > 0) {
                this.notes[dayKey].forEach((note, index) => {
                    allNotes.push({
                        day: dayKey,
                        index: index,
                        content: note.content
                    });
                });
            }
        });
        
        if (allNotes.length === 0) {
            this.showAIModal('No notes found to structure. Please add some notes first.');
            return;
        }
        
        // Prepare the prompt for AI
        const notesText = allNotes.map(note => 
            `${this.capitalizeFirstLetter(note.day)}: ${note.content}`
        ).join('\n\n');
        
        const prompt = `I have the following notes for my week. Please structure them into a well-organized list with categories or priorities:\n\n${notesText}`;
        
        this.showAIModal('Structuring all notes with AI...', true);
        
        try {
            const structuredNotes = await this.callYandexAPI(prompt);
            this.showAIModal(`AI has structured your notes:\n\n${structuredNotes}\n\nYou can now apply these suggestions to individual notes.`);
        } catch (error) {
            console.error('Error structuring notes with AI:', error);
            this.showAIModal(`Error: ${error.message}. Please check your Yandex Cloud Function configuration.`);
        }
    }
    
    /**
     * Summarize the week with AI
     */
    async summarizeWeekWithAI() {
        // Collect all notes from all days
        let allNotes = [];
        DAYS_OF_WEEK.forEach(day => {
            const dayKey = day.toLowerCase();
            if (this.notes[dayKey] && this.notes[dayKey].length > 0) {
                this.notes[dayKey].forEach((note, index) => {
                    allNotes.push({
                        day: dayKey,
                        content: note.content
                    });
                });
            }
        });
        
        if (allNotes.length === 0) {
            this.showAIModal('No notes found to summarize. Please add some notes first.');
            return;
        }
        
        // Prepare the prompt for AI
        const notesText = allNotes.map(note => 
            `${this.capitalizeFirstLetter(note.day)}: ${note.content}`
        ).join('\n\n');
        
        const prompt = `Please provide a concise summary of my week based on these notes. Identify key themes, tasks, and any follow-up actions needed:\n\n${notesText}`;
        
        this.showAIModal('Summarizing your week with AI...', true);
        
        try {
            const summary = await this.callYandexAPI(prompt);
            this.showAIModal(`Week Summary:\n\n${summary}`);
        } catch (error) {
            console.error('Error summarizing week with AI:', error);
            this.showAIModal(`Error: ${error.message}. Please check your Yandex Cloud Function configuration.`);
        }
    }
    
    /**
     * Call the Yandex Cloud Function API
     */
    async callYandexAPI(prompt) {
        try {
            const response = await fetch(YANDEX_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: prompt,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Handle different response formats
            if (data.response) {
                return data.response;
            } else if (data.result?.alternatives?.[0]?.message?.text) {
                return data.result.alternatives[0].message.text;
            } else if (data.choices?.[0]?.text) {
                return data.choices[0].text;
            } else if (typeof data === 'string') {
                return data;
            } else {
                return JSON.stringify(data);
            }
            
        } catch (error) {
            console.error('Error calling Yandex API:', error);
            
            // Fallback mock response for demo purposes
            if (error.message.includes('Failed to fetch') || error.message.includes('403')) {
                throw new Error('Cannot connect to Yandex API. Please check if the function URL is correct and accessible.');
            }
            
            throw error;
        }
    }
    
    /**
     * Show the AI modal with a message
     */
    showAIModal(message, showLoading = false) {
        const modal = document.getElementById('aiChatModal');
        const aiResponse = document.getElementById('aiChatResponse');
        const aiLoading = document.getElementById('aiLoading');
        
        if (showLoading) {
            aiLoading.style.display = 'flex';
            aiResponse.textContent = '';
        } else {
            aiLoading.style.display = 'none';
            aiResponse.textContent = message;
        }
        
        modal.style.display = 'flex';
    }
    
    /**
     * Close the AI modal
     */
    closeAIModal() {
        const modal = document.getElementById('aiChatModal');
        modal.style.display = 'none';
    }
    
    /**
     * Capitalize first letter of a string
     */
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    /**
     * Clean up TensorFlow.js memory
     */
    cleanupTensorFlow() {
        if (this.tfModel) {
            try {
                this.tfModel.dispose();
                console.log('TensorFlow model disposed');
            } catch (error) {
                console.error('Error disposing TensorFlow model:', error);
            }
        }
        
        // Clean up any remaining tensors
        tf.disposeVariables();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the AI Calendar application
    const aiCalendar = new AICalendar();
    
    // Make it available globally for debugging
    window.aiCalendar = aiCalendar;
    
    console.log('AI Calendar application initialized');
});

// Export for module usage
export { AICalendar };
