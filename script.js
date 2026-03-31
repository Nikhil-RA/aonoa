// Camera Manager for Candidate Photo Capture
class CameraManager {
    constructor() {
        this.modal = document.getElementById('cameraModal');
        this.videoFeed = document.getElementById('cameraFeed');
        this.canvas = document.getElementById('captureCanvas');
        this.captureBtn = document.getElementById('captureBtn');
        this.skipBtn = document.getElementById('skipCameraBtn');
        this.avatarImg = document.querySelector('.avatar-img');
        this.stream = null;
        this.init();
    }

    init() {
        // Ask for username first
        const username = prompt('Enter your name:', '');
        if (username && username.trim()) {
            document.getElementById('candidateName').textContent = username.trim();
        }
        
        // Then show camera modal
        this.showCameraModal();

        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.skipBtn.addEventListener('click', () => this.skipCamera());
    }

    showCameraModal() {
        this.modal.classList.add('active');
        this.accessCamera();
    }

    accessCamera() {
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 400 },
                height: { ideal: 400 }
            },
            audio: false 
        })
        .then(stream => {
            this.stream = stream;
            this.videoFeed.srcObject = stream;
        })
        .catch(err => {
            console.error('Error accessing camera:', err);
            alert('Unable to access camera. Please check permissions.');
            this.skipCamera();
        });
    }

    capturePhoto() {
        const ctx = this.canvas.getContext('2d');
        this.canvas.width = this.videoFeed.videoWidth;
        this.canvas.height = this.videoFeed.videoHeight;
        ctx.drawImage(this.videoFeed, 0, 0);
        
        const imageData = this.canvas.toDataURL('image/jpeg', 0.95);
        
        // Update avatar (no localStorage - resets on refresh)
        this.avatarImg.src = imageData;
        
        // Stop camera and close modal
        this.stopCamera();
        this.modal.classList.remove('active');
    }

    skipCamera() {
        this.stopCamera();
        this.modal.classList.remove('active');
        
        // Use a default avatar or set a placeholder
        this.avatarImg.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23CCCCCC%22/%3E%3Ccircle cx=%2250%22 cy=%2235%22 r=%2215%22 fill=%22%23999999%22/%3E%3Cpath d=%22M 20 80 Q 50 60 80 80%22 fill=%22%23999999%22/%3E%3C/svg%3E';
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}

// Timer Functionality
class TimerManager {
    constructor() {
        this.totalSeconds = (19 * 60) + 23; // 19 minutes and 23 seconds
        this.timerDisplay = document.querySelector('.timer-display');
        this.init();
    }

    init() {
        this.updateDisplay();
        setInterval(() => this.tick(), 1000);
    }

    tick() {
        if (this.totalSeconds > 0) {
            this.totalSeconds--;
            this.updateDisplay();
        } else {
            this.onTimeUp();
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.totalSeconds / 60);
        const seconds = this.totalSeconds % 60;
        const formattedMin = String(minutes).padStart(2, '0');
        const formattedSec = String(seconds).padStart(2, '0');
        this.timerDisplay.textContent = `${formattedMin} : ${formattedSec}`;
    }

    onTimeUp() {
        console.log('Time is up! Exam ended.');
        // Handle what happens when time runs out
        // e.g., disable form, show message, auto-submit
    }
}

// Form Handler
class FormManager {
    constructor() {
        this.answers = {};
        this.init();
    }

    init() {
        // Store answers when user selects an option
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.answers[e.target.name] = e.target.value;
                this.saveProgress();
            });
        });

        // Load saved answers from localStorage
        this.loadProgress();
    }

    saveProgress() {
        localStorage.setItem('aonAnswers', JSON.stringify(this.answers));
    }

    loadProgress() {
        const saved = localStorage.getItem('aonAnswers');
        if (saved) {
            this.answers = JSON.parse(saved);
            // Re-check the saved radio buttons
            Object.entries(this.answers).forEach(([question, answer]) => {
                const radio = document.querySelector(`input[name="${question}"][value="${answer}"]`);
                if (radio) {
                    radio.checked = true;
                }
            });
        }
    }

    getAnswers() {
        return this.answers;
    }

    clearAnswers() {
        this.answers = {};
        localStorage.removeItem('aonAnswers');
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
    }
}

// Section Navigation
class SectionManager {
    constructor() {
        this.currentSection = '01. Technical';
        this.init();
    }

    init() {
        const sectionItems = document.querySelectorAll('.section-item');
        sectionItems.forEach(item => {
            item.addEventListener('click', () => this.switchSection(item));
        });

        const resetBtn = document.querySelector('.reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetCurrentSection());
        }
    }

    switchSection(sectionElement) {
        // Remove active class from all sections
        document.querySelectorAll('.section-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to clicked section
        sectionElement.classList.add('active');
        const sectionName = sectionElement.querySelector('.section-name').textContent;
        this.currentSection = sectionName;
        console.log(`Switched to section: ${sectionName}`);
    }

    resetCurrentSection() {
        if (confirm(`Are you sure you want to reset answers for ${this.currentSection}?`)) {
            const formManager = new FormManager();
            // Clear answers for current section questions
            const regex = new RegExp(`^q\\d+$`);
            Object.keys(formManager.getAnswers()).forEach(key => {
                if (regex.test(key)) {
                    delete formManager.answers[key];
                }
            });
            formManager.saveProgress();
            // Uncheck all relevant radio buttons
            document.querySelectorAll(`input[type="radio"]`).forEach(radio => {
                if (regex.test(radio.name)) {
                    radio.checked = false;
                }
            });
            console.log(`Reset answers for ${this.currentSection}`);
        }
    }
}

// Submit Handler
class SubmitHandler {
    constructor() {
        this.submitBtn = document.querySelector('.submit-btn');
        this.init();
    }

    init() {
        this.submitBtn.addEventListener('click', () => this.handleSubmit());
    }

    handleSubmit() {
        const formManager = new FormManager();
        const answers = formManager.getAnswers();

        if (Object.keys(answers).length === 0) {
            alert('Please answer at least one question before submitting.');
            return;
        }

        if (confirm('Are you sure you want to submit your answers?')) {
            console.log('Submitted Answers:', answers);
            // Send to server
            this.sendToServer(answers);
        }
    }

    sendToServer(answers) {
        // Simulate API call
        console.log('Sending answers to server:', answers);
        // In a real app, you'd do:
        // fetch('/api/submit-exam', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(answers)
        // }).then(response => response.json())
        //   .then(data => console.log('Success:', data))
        //   .catch(error => console.error('Error:', error));

        alert('Answers submitted successfully!');
    }
}

// Keyboard Shortcuts
class KeyboardShortcuts {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S to submit
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                document.querySelector('.submit-btn').click();
            }

            // Ctrl+R to reset
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                document.querySelector('.reset-btn').click();
            }
        });
    }
}

// Smooth Scrolling to Questions
class QuestionScroller {
    constructor() {
        this.init();
    }

    init() {
        const buttons = document.querySelectorAll('.section-item');
        buttons.forEach((button, index) => {
            button.addEventListener('click', () => {
                const questions = document.querySelectorAll('.question-block');
                if (questions[index]) {
                    questions[index].scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }
}

// Page Visibility Handler (prevent cheating)
class VisibilityHandler {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.warn('User left the page - potential cheating detected');
                // You can send a warning to the server
            } else {
                console.log('User returned to the page');
            }
        });
    }
}

// Initialize all components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing AON Assessment Platform...');

    // Initialize Camera Manager (for candidate photo)
    const cameraManager = new CameraManager();

    // Initialize all managers and handlers
    const timerManager = new TimerManager();
    const formManager = new FormManager();
    const sectionManager = new SectionManager();
    const submitHandler = new SubmitHandler();
    const keyboardShortcuts = new KeyboardShortcuts();
    const questionScroller = new QuestionScroller();
    const visibilityHandler = new VisibilityHandler();

    console.log('AON Assessment Platform initialized successfully!');

    // Display initial stats
    console.log(`Total answers so far: ${Object.keys(formManager.getAnswers()).length}`);
});

// Auto-save every 30 seconds
setInterval(() => {
    const formManager = new FormManager();
    formManager.saveProgress();
    console.log('Auto-saved answers');
}, 30000);
