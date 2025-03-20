document.addEventListener('DOMContentLoaded', function() {
    // Variables for quiz navigation
    const questionCards = document.querySelectorAll('.question-card');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const progressBar = document.getElementById('quiz-progress');
    const quizForm = document.getElementById('quiz-form');
    const totalQuestions = questionCards.length;
    const timerElement = document.getElementById('timer');
    
    let currentQuestion = 0;
    let startTime = Date.now();
    let timerInterval;
    
    // Update progress bar
    function updateProgress() {
        const progress = ((currentQuestion + 1) / totalQuestions) * 100;
        progressBar.style.width = progress + '%';
        progressBar.setAttribute('aria-valuenow', progress);
    }
    
    // Initialize progress bar
    updateProgress();
    
    // Timer function
    function startTimer() {
        timerInterval = setInterval(function() {
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Visual indication as time passes
            if (minutes >= 5) {
                timerElement.classList.add('text-danger');
                timerElement.classList.add('pulse');
            } else if (minutes >= 2) {
                timerElement.classList.add('text-warning');
            }
        }, 1000);
    }
    
    // Start the timer
    startTimer();
    
    // Event listeners for next buttons
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Check if the current question has been answered
            const inputs = questionCards[currentQuestion].querySelectorAll('input[type="radio"]');
            let answered = false;
            
            inputs.forEach(input => {
                if (input.checked) {
                    answered = true;
                }
            });
            
            if (!answered) {
                // Show warning
                const warningElement = document.createElement('div');
                warningElement.className = 'alert alert-warning mt-3';
                warningElement.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Please select an answer before proceeding.';
                
                // Remove any existing warnings
                const existingWarning = questionCards[currentQuestion].querySelector('.alert');
                if (existingWarning) {
                    existingWarning.remove();
                }
                
                questionCards[currentQuestion].appendChild(warningElement);
                
                // Automatically remove the warning after 3 seconds
                setTimeout(() => {
                    warningElement.remove();
                }, 3000);
                
                return;
            }
            
            // Apply transition effect
            questionCards[currentQuestion].classList.add('slide-out');
            
            setTimeout(() => {
                // Hide current question
                questionCards[currentQuestion].style.display = 'none';
                questionCards[currentQuestion].classList.remove('slide-out');
                
                // Show next question
                currentQuestion++;
                questionCards[currentQuestion].style.display = 'block';
                questionCards[currentQuestion].classList.add('slide-in');
                
                // Update progress
                updateProgress();
                
                setTimeout(() => {
                    questionCards[currentQuestion].classList.remove('slide-in');
                }, 300);
            }, 300);
        });
    });
    
    // Event listeners for previous buttons
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Apply transition effect
            questionCards[currentQuestion].classList.add('slide-out-reverse');
            
            setTimeout(() => {
                // Hide current question
                questionCards[currentQuestion].style.display = 'none';
                questionCards[currentQuestion].classList.remove('slide-out-reverse');
                
                // Show previous question
                currentQuestion--;
                questionCards[currentQuestion].style.display = 'block';
                questionCards[currentQuestion].classList.add('slide-in-reverse');
                
                // Update progress
                updateProgress();
                
                setTimeout(() => {
                    questionCards[currentQuestion].classList.remove('slide-in-reverse');
                }, 300);
            }, 300);
        });
    });
    
    // Form validation before submission
    quizForm.addEventListener('submit', function(event) {
        let allAnswered = true;
        let unansweredQuestions = [];
        
        // Check if all questions have been answered
        questionCards.forEach((card, index) => {
            const inputs = card.querySelectorAll('input[type="radio"]');
            let questionAnswered = false;
            
            inputs.forEach(input => {
                if (input.checked) {
                    questionAnswered = true;
                }
            });
            
            if (!questionAnswered) {
                allAnswered = false;
                unansweredQuestions.push(index + 1);
            }
        });
        
        if (!allAnswered) {
            event.preventDefault();
            
            // Clear timer interval
            clearInterval(timerInterval);
            
            // Create a modal to show unanswered questions
            const modalHTML = `
                <div class="modal fade" id="warningModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-warning">
                                <h5 class="modal-title">
                                    <i class="bi bi-exclamation-triangle"></i> Incomplete Quiz
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>You have not answered the following questions:</p>
                                <ul>
                                    ${unansweredQuestions.map(q => `<li>Question ${q}</li>`).join('')}
                                </ul>
                                <p>Would you like to go back and complete them?</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    Continue Editing
                                </button>
                                <button type="button" class="btn btn-primary" id="submit-anyway">
                                    Submit Anyway
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to document
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('warningModal'));
            modal.show();
            
            // Handle "Submit Anyway" button
            document.getElementById('submit-anyway').addEventListener('click', function() {
                modal.hide();
                quizForm.submit();
            });
            
            // Restart timer when modal is closed
            document.getElementById('warningModal').addEventListener('hidden.bs.modal', function() {
                startTimer();
            });
        }
    });
    
    // Add hover effect for option items
    const optionItems = document.querySelectorAll('.option-item');
    optionItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            if (!this.querySelector('input').checked) {
                this.classList.add('option-hover');
            }
        });
        
        item.addEventListener('mouseleave', function() {
            this.classList.remove('option-hover');
        });
        
        // Add click effect
        item.addEventListener('click', function() {
            // Remove selected class from all options in this question
            const questionCard = this.closest('.question-card');
            questionCard.querySelectorAll('.option-item').forEach(opt => {
                opt.classList.remove('option-selected');
            });
            
            // Add selected class to this option
            this.classList.add('option-selected');
            
            // Check the radio button
            this.querySelector('input').checked = true;
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Left arrow key for previous
        if (e.key === 'ArrowLeft' && currentQuestion > 0) {
            questionCards[currentQuestion].querySelector('.prev-btn')?.click();
        }
        
        // Right arrow key for next
        if (e.key === 'ArrowRight' && currentQuestion < totalQuestions - 1) {
            questionCards[currentQuestion].querySelector('.next-btn')?.click();
        }
        
        // Number keys for options (1-4)
        if (['1', '2', '3', '4'].includes(e.key)) {
            const optionIndex = parseInt(e.key) - 1;
            const currentOptions = questionCards[currentQuestion].querySelectorAll('.form-check-input');
            
            if (currentOptions[optionIndex]) {
                currentOptions[optionIndex].checked = true;
                
                // Update visual selection
                const questionCard = questionCards[currentQuestion];
                questionCard.querySelectorAll('.option-item').forEach(opt => {
                    opt.classList.remove('option-selected');
                });
                
                currentOptions[optionIndex].closest('.option-item').classList.add('option-selected');
            }
        }
    });
});