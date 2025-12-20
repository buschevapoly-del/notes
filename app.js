// app.js - AI Weekly Calendar Application

// Import TensorFlow.js
import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.es2017.mjs';

// Configuration
const YANDEX_API_URL = 'https://functions.yandexcloud.net/d4eaqaic6hn3ja5d97fm';
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STORAGE_KEY = 'ai_calendar_notes_v2';

/**
 * Main AI Calendar Application Class
 */
class AICalendar {
    constructor() {
        this.notes = {};
        this.tfModel = null;
        this.isTfReady = false;
        
        // Initialize the application
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize TensorFlow.js
            await this.initTensorFlow();
            
            // Load saved notes
            this.loadNotes();
            
            // Setup UI
            this.renderWeek();
            this.setupEventListeners();
            
            console.log('AI Calendar initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showNotification('Failed to initialize application', 'error');
        }
    }
    
    /**
     * Initialize TensorFlow.js
     */
    async initTensorFlow() {
        try {
            await tf.ready();
            console.log('TensorFlow.js loaded successfully');
            
            // Create a simple model for text analysis demonstration
            this.tfModel = tf.sequential();
            this.isTfReady = true;
            
            // Update UI status
            this.updateAIStatus();
        } catch (error) {
            console.warn('TensorFlow.js initialization warning:', error);
            this.isTfReady = false;
        }
    }
    
    /**
     * Update AI status in the UI
     */
    updateAIStatus() {
        const statusElement = document.querySelector('.ai-status span');
        if (statusElement) {
            statusElement.textContent = this.isTfReady 
                ? 'TensorFlow.js Ready • Notes Saved Locally' 
                : 'Notes Saved Locally • AI Features Available';
        }
    }
    
    /**
     * Load notes from localStorage
     */
    loadNotes() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                this.notes = JSON.parse(savedData);
                
                // Ensure all days exist in notes object
                DAYS_OF_WEEK.forEach(day => {
                    const dayKey = day.toLowerCase();
                    if (!this.notes[dayKey]) {
                        this.notes[dayKey] = [];
                    }
                });
            } else {
                // Initialize with empty arrays for each day
                DAYS_OF_WEEK.forEach(day => {
                    this.notes[day.toLowerCase()] = [];
                });
                this.saveNotes();
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            // Initialize empty notes
            DAYS_OF_WEEK.forEach(day => {
                this.notes[day.toLowerCase()] = [];
            });
        }
    }
    
    /**
     * Save notes to localStorage
     */
    saveNotes() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving notes:', error);
            this.showNotification('Failed to save notes', 'error');
        }
    }
    
    /**
     * Render the week view with all days
     */
    renderWeek() {
        const container = document.getElementById('weekContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Get current date for date display
        const today = new Date();
        const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const mondayOffset = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
        const mondayDate = new Date(today);
        mondayDate.setDate(today.getDate() + mondayOffset);
        
        DAYS_OF_WEEK.forEach((dayName, index) => {
            const dayKey = dayName.toLowerCase();
            const dayDate = new Date(mondayDate);
            dayDate.setDate(mondayDate.getDate() + index);
            
            const formattedDate = dayDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            const isToday = dayDate.toDateString() === today.toDateString();
            
            const dayCard = this.createDayCard(dayName, formattedDate, isToday, dayKey);
            container.appendChild(dayCard);
        });
        
        // Render notes for each day
        this.renderAllNotes();
    }
    
    /**
     * Create a day card element
     */
    createDayCard(dayName, date, isToday, dayKey) {
        const card = document.createElement('div');
        card.className = 'day-card';
        card.dataset.day = dayKey;
        
        card.innerHTML = `
            <div class="day-header">
                <div class="day-title">${dayName}</div>
                <div class="day-date">${date}</div>
                ${isToday ? '<div class="today-badge">TODAY</div>' : ''}
            </div>
            
            <div class="notes-container" id="notes-${dayKey}">
                <!-- Notes will be rendered here -->
                <div class="empty-state">
                    <i class="fas fa-sticky-note"></i>
                    <p>No notes yet</p>
                </div>
            </div>
            
            <div class="add-note-form">
                <textarea 
                    class="note-input" 
                    id="note-input-${dayKey}" 
                    placeholder="Type your note here..."
                    rows="3"
                ></textarea>
                <div class="form-actions">
                    <button class="btn btn-primary btn-full" data-day="${dayKey}" data-action="add">
                        <i class="fas fa-plus"></i>
                        Add Note
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    /**
     * Render notes for a specific day
     */
    renderNotesForDay(dayKey) {
        const container = document.getElementById(`notes-${dayKey}`);
        if (!container) return;
        
        const notes = this.notes[dayKey] || [];
        
        if (notes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sticky-note"></i>
                    <p>No notes yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        notes.forEach((note, index) => {
            const noteElement = this.createNoteElement(note, dayKey, index);
            container.appendChild(noteElement);
        });
    }
    
    /**
     * Render notes for all days
     */
    renderAllNotes() {
        DAYS_OF_WEEK.forEach(day => {
            this.renderNotesForDay(day.toLowerCase());
        });
    }
    
    /**
     * Create a note element
     */
    createNoteElement(note, dayKey, index) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note';
        
        // Format timestamp
        const timestamp = new Date(note.timestamp);
        const timeString = timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        const dateString = timestamp.toLocaleDateString();
        
        noteDiv.innerHTML = `
            <div class="note-actions">
                <button class="note-action-btn" data-day="${dayKey}" data-index="${index}" data-action="ask-ai">
                    <i class="fas fa-robot"></i>
                </button>
                <button class="note-action-btn delete" data-day="${dayKey}" data-index="${index}" data-action="delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="note-content">${this.escapeHtml(note.content)}</div>
            <div class="note-time">
                <i class="far fa-clock"></i>
                <span>${dateString} at ${timeString}</span>
            </div>
        `;
        
        return noteDiv;
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
     * Add a new note for a specific day
     */
    addNote(dayKey) {
        const input = document.getElementById(`note-input-${dayKey}`);
        const content = input.value.trim();
        
        if (!content) {
            this.showNotification('Please enter note content', 'error');
            input.focus();
            return;
        }
        
        const note = {
            content: content,
            timestamp: Date.now(),
            day: dayKey
        };
        
        // Add note to array
        if (!this.notes[dayKey]) {
            this.notes[dayKey] = [];
        }
        
        this.notes[dayKey].push(note);
        
        // Save and update UI
        this.saveNotes();
        this.renderNotesForDay(dayKey);
        
        // Clear input
        input.value = '';
        
        // Show success message
        this.showNotification(`Note added to ${this.capitalizeFirstLetter(dayKey)}`, 'success');
        
        // Optional: Analyze note with TensorFlow.js if enabled
        if (this.isTfReady) {
            this.analyzeNoteWithTF(note);
        }
    }
    
    /**
     * Delete a note
     */
    deleteNote(dayKey, index) {
        if (!this.notes[dayKey] || !this.notes[dayKey][index]) {
            this.showNotification('Note not found', 'error');
            return;
        }
        
        // Remove note from array
        this.notes[dayKey].splice(index, 1);
        
        // Save and update UI
        this.saveNotes();
        this.renderNotesForDay(dayKey);
        
        this.showNotification('Note deleted', 'success');
    }
    
    /**
     * Clear all notes for all days
     */
    clearAllNotes() {
        if (!confirm('Are you sure you want to delete ALL notes? This action cannot be undone.')) {
            return;
        }
        
        DAYS_OF_WEEK.forEach(day => {
            this.notes[day.toLowerCase()] = [];
        });
        
        this.saveNotes();
        this.renderAllNotes();
        
        this.showNotification('All notes cleared', 'success');
    }
    
    /**
     * Ask AI to improve a specific note
     */
    async askAIForNote(dayKey, index) {
        const note = this.notes[dayKey]?.[index];
        if (!note) {
            this.showNotification('Note not found', 'error');
            return;
        }
        
        this.showAIModal('AI is improving your note...', true);
        
        try {
            const prompt = `Improve and structure this note to make it more clear and actionable: "${note.content}"`;
            const improvedText = await this.callYandexAPI(prompt);
            
            this.showAIModal(
                `Original Note:\n"${note.content}"\n\n` +
                `AI Improved Version:\n"${improvedText}"\n\n` +
                `Would you like to replace your note with the improved version?`,
                false
            );
            
            // Add replace button to modal
            const responseDiv = document.getElementById('aiResponse');
            const replaceButton = document.createElement('button');
            replaceButton.className = 'btn btn-primary';
            replaceButton.innerHTML = '<i class="fas fa-check"></i> Replace with AI Version';
            replaceButton.onclick = () => {
                this.replaceNoteWithAI(dayKey, index, improvedText);
                this.closeAIModal();
            };
            
            responseDiv.appendChild(replaceButton);
            
        } catch (error) {
            console.error('AI request failed:', error);
            this.showAIModal(`Failed to contact AI service: ${error.message}`, false);
        }
    }
    
    /**
     * Replace a note with AI-improved version
     */
    replaceNoteWithAI(dayKey, index, newContent) {
        if (!this.notes[dayKey]?.[index]) return;
        
        this.notes[dayKey][index].content = newContent;
        this.notes[dayKey][index].timestamp = Date.now();
        
        this.saveNotes();
        this.renderNotesForDay(dayKey);
        
        this.showNotification('Note updated with AI improvement', 'success');
    }
    
    /**
     * Structure all notes with AI
     */
    async structureAllNotes() {
        // Collect all notes
        const allNotes = [];
        DAYS_OF_WEEK.forEach(day => {
            const dayKey = day.toLowerCase();
            const dayNotes = this.notes[dayKey] || [];
            
            dayNotes.forEach(note => {
                allNotes.push({
                    day: day,
                    content: note.content
                });
            });
        });
        
        if (allNotes.length === 0) {
            this.showAIModal('No notes found to structure. Please add some notes first.', false);
            return;
        }
        
        this.showAIModal('AI is analyzing and structuring all your notes...', true);
        
        try {
            const notesText = allNotes.map(n => `${n.day}: ${n.content}`).join('\n\n');
            const prompt = `Analyze and structure these weekly notes. Organize them into categories, suggest priorities, and identify patterns:\n\n${notesText}`;
            
            const analysis = await this.callYandexAPI(prompt);
            this.showAIModal(analysis, false);
            
        } catch (error) {
            console.error('AI analysis failed:', error);
            this.showAIModal(`Failed to analyze notes: ${error.message}`, false);
        }
    }
    
    /**
     * Summarize the week with AI
     */
    async summarizeWeek() {
        // Collect all notes
        const allNotes = [];
        DAYS_OF_WEEK.forEach(day => {
            const dayKey = day.toLowerCase();
            const dayNotes = this.notes[dayKey] || [];
            
            dayNotes.forEach(note => {
                allNotes.push({
                    day: day,
                    content: note.content
                });
            });
        });
        
        if (allNotes.length === 0) {
            this.showAIModal('No notes found to summarize. Please add some notes first.', false);
            return;
        }
        
        this.showAIModal('AI is creating a weekly summary...', true);
        
        try {
            const notesText = allNotes.map(n => `${n.day}: ${n.content}`).join('\n\n');
            const prompt = `Create a concise weekly summary based on these notes. Highlight key achievements, pending tasks, and insights:\n\n${notesText}`;
            
            const summary = await this.callYandexAPI(prompt);
            this.showAIModal(summary, false);
            
        } catch (error) {
            console.error('AI summary failed:', error);
            this.showAIModal(`Failed to create summary: ${error.message}`, false);
        }
    }
    
    /**
     * Call Yandex Cloud Function API
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
                throw new Error(`API error: ${response.status} ${response.statusText}`);
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
                // Return stringified data as fallback
                return JSON.stringify(data, null, 2);
            }
            
        } catch (error) {
            console.error('Yandex API call failed:', error);
            
            // Provide fallback mock response for demo
            if (error.message.includes('Failed to fetch') || error.message.includes('403')) {
                throw new Error('Cannot connect to AI service. Please check your internet connection and Yandex Cloud Function configuration.');
            }
            
            throw error;
        }
    }
    
    /**
     * Analyze note with TensorFlow.js (demonstration)
     */
    async analyzeNoteWithTF(note) {
        if (!this.isTfReady || !this.tfModel) return;
        
        try {
            // This is a demonstration of how TensorFlow.js could be used
            // In a real application, you would use a proper NLP model
            
            // Simple text analysis: count words and estimate reading time
            const wordCount = note.content.split(/\s+/).length;
            const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
            
            console.log(`Note analysis: ${wordCount} words, ~${readingTime} min read`);
            
        } catch (error) {
            console.warn('TF.js analysis failed:', error);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add note buttons
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Add note button
            if (target.closest('[data-action="add"]')) {
                const button = target.closest('[data-action="add"]');
                const dayKey = button.dataset.day;
                this.addNote(dayKey);
            }
            
            // Ask AI for note improvement
            if (target.closest('[data-action="ask-ai"]')) {
                const button = target.closest('[data-action="ask-ai"]');
                const dayKey = button.dataset.day;
                const index = parseInt(button.dataset.index);
                this.askAIForNote(dayKey, index);
            }
            
            // Delete note
            if (target.closest('[data-action="delete"]')) {
                const button = target.closest('[data-action="delete"]');
                const dayKey = button.dataset.day;
                const index = parseInt(button.dataset.index);
                this.deleteNote(dayKey, index);
            }
        });
        
        // Global action buttons
        document.getElementById('structureAllBtn')?.addEventListener('click', () => {
            this.structureAllNotes();
        });
        
        document.getElementById('summarizeAllBtn')?.addEventListener('click', () => {
            this.summarizeWeek();
        });
        
        document.getElementById('clearAllBtn')?.addEventListener('click', () => {
            this.clearAllNotes();
        });
        
        // AI modal close button
        document.getElementById('closeAiModal')?.addEventListener('click', () => {
            this.closeAIModal();
        });
        
        // Close modal when clicking outside
        document.getElementById('aiModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('aiModal')) {
                this.closeAIModal();
            }
        });
        
        // Allow Enter key to add notes (with Ctrl/Shift modifier)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement.classList.contains('note-input')) {
                    const dayKey = activeElement.id.replace('note-input-', '');
                    this.addNote(dayKey);
                }
            }
        });
        
        // Cleanup TensorFlow on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    /**
     * Show AI modal
     */
    showAIModal(message, isLoading = false) {
        const modal = document.getElementById('aiModal');
        const responseDiv = document.getElementById('aiResponse');
        const loadingDiv = document.getElementById('aiLoading');
        const titleDiv = document.getElementById('aiModalTitle');
        
        if (isLoading) {
            titleDiv.textContent = 'AI Assistant';
            responseDiv.textContent = '';
            loadingDiv.style.display = 'flex';
        } else {
            loadingDiv.style.display = 'none';
            responseDiv.textContent = message;
        }
        
        modal.style.display = 'flex';
    }
    
    /**
     * Close AI modal
     */
    closeAIModal() {
        const modal = document.getElementById('aiModal');
        modal.style.display = 'none';
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    /**
     * Capitalize first letter
     */
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        // Cleanup TensorFlow.js resources
        if (this.tfModel) {
            try {
                this.tfModel.dispose();
                tf.disposeVariables();
                console.log('TensorFlow.js resources cleaned up');
            } catch (error) {
                console.error('Error cleaning up TensorFlow.js:', error);
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create application instance
    const app = new AICalendar();
    
    // Make available globally for debugging
    window.aiCalendar = app;
    
    console.log('AI Weekly Calendar application loaded');
});

// Export for module usage
export { AICalendar };
