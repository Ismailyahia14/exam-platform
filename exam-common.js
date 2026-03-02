import { ExamTimer } from './utils/timer.js';
import { 
    saveExamProgress, 
    loadExamProgress, 
    clearExamProgress,
    getDarkMode,
    setDarkMode
} from './utils/storage.js';

export class ExamManager {
    #currentQuestionIndex = 0;
    #userAnswers = [];
    #startTime = null;
    #timer = null;
    #examCompleted = false;
    #currentQuestions = [];
    #shuffledQuestions = [];
    #usedQuestionIds = new Set();
    #domElements = {};
    #quizQuestions = [];
    #questionsToSelect = 20;

    constructor(quizQuestions, questionsToSelect = 20) {
        this.#quizQuestions = quizQuestions;
        this.#questionsToSelect = questionsToSelect;
        this.#bindElements();
        this.#applyDarkMode();
        this.#addThemeTransition();
        this.#setupEventListeners();
        this.#restoreProgress();
    }

    #bindElements() {
        const ids = [
            'startScreen', 'examScreen', 'resultsScreen', 'startExamBtn', 'endExamBtn',
            'prevBtn', 'nextBtn', 'questionText', 'questionNumber', 'optionsContainer',
            'progressFill', 'progressText', 'progressPercent', 'timer', 'darkModeToggle',
            'reviewBtn', 'retryBtn', 'newTestBtn', 'reviewSection', 'wrongAnswersList',
            'noWrongAnswers', 'closeReviewBtn', 'finalScore', 'percentage', 'grade',
            'correctAnswers', 'wrongAnswers', 'timeTaken', 'scorePercentage', 'scoreCircle',
            'confirmModal', 'cancelEndBtn', 'confirmEndBtn', 'remainingQuestions',
            'unansweredAlert', 'unansweredCount', 'questionsGrid', 'scrollTopBtn'
        ];
        ids.forEach(id => {
            this.#domElements[id] = document.getElementById(id);
        });
    }

    #applyDarkMode() {
        const darkModeToggle = this.#domElements.darkModeToggle;
        if (getDarkMode()) {
            document.body.setAttribute('data-theme', 'dark');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            darkModeToggle.title = 'الوضع النهاري';
        } else {
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            darkModeToggle.title = 'الوضع الليلي';
        }
    }

    #addThemeTransition() {
        document.querySelectorAll('.container, .navbar, .footer, .screen, .exam-header, .instructions, .exam-controls, .questions-nav-grid, .question-container, .review-section, .result-card, .modal-content')
            .forEach(el => el.classList.add('theme-transition'));
    }

    #saveProgress() {
        if (this.#examCompleted) return;
        const progress = {
            currentQuestionIndex: this.#currentQuestionIndex,
            userAnswers: this.#userAnswers,
            timeLeft: this.#timer ? this.#timer.getRemaining() : 60 * 60,
            startTime: this.#startTime ? this.#startTime.toISOString() : null,
            currentQuestions: this.#currentQuestions,
            shuffledQuestions: this.#shuffledQuestions,
            usedQuestionIds: Array.from(this.#usedQuestionIds),
            examCompleted: this.#examCompleted
        };
        saveExamProgress(progress);
    }

    #restoreProgress() {
        const progress = loadExamProgress();
        if (!progress) return;

        if (progress.examCompleted) {
            clearExamProgress();
            return;
        }

        this.#currentQuestionIndex = progress.currentQuestionIndex || 0;
        this.#userAnswers = progress.userAnswers || [];
        this.#startTime = progress.startTime ? new Date(progress.startTime) : new Date();
        this.#currentQuestions = progress.currentQuestions || [];
        this.#shuffledQuestions = progress.shuffledQuestions || [];
        this.#usedQuestionIds = new Set(progress.usedQuestionIds || []);
        this.#examCompleted = false;

        if (this.#shuffledQuestions.length > 0) {
            this.#timer = new ExamTimer({
                duration: progress.timeLeft || 60 * 60,
                onTick: (timeLeft) => this.#updateTimerDisplay(timeLeft),
                onFinish: () => this.endExam()
            });
            this.#updateTimerDisplay(this.#timer.getRemaining());
            this.#switchToExamScreen();
            this.#loadQuestion(this.#currentQuestionIndex);
            this.#updateQuestionsGrid();
            this.#updateUnansweredAlert();
            this.#timer.start();
        }
    }

    startExam() {
        try {
            this.#switchToExamScreen();
            this.#startTime = new Date();
            this.#userAnswers = [];
            this.#examCompleted = false;
            this.#currentQuestionIndex = 0;

            this.#selectRandomQuestions();
            this.#shuffleAllOptions();

            this.#timer = new ExamTimer({
                duration: 60 * 60,
                onTick: (timeLeft) => this.#updateTimerDisplay(timeLeft),
                onFinish: () => this.endExam()
            });
            this.#updateTimerDisplay(this.#timer.getRemaining());
            this.#timer.start();

            this.#loadQuestion(this.#currentQuestionIndex);
            this.#updateQuestionsGrid();
            this.#updateUnansweredAlert();
            this.#saveProgress();
        } catch (error) {
            console.error('خطأ في بدء الامتحان:', error);
            alert('حدث خطأ أثناء بدء الامتحان. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
        }
    }

    #switchToExamScreen() {
        this.#domElements.startScreen.classList.remove('active');
        this.#domElements.examScreen.classList.add('active');
        this.#domElements.resultsScreen.classList.remove('active');
    }

    #selectRandomQuestions() {
        let availableQuestions = this.#quizQuestions.filter(q => !this.#usedQuestionIds.has(q.id));
        const questionsToSelect = this.#questionsToSelect;

        if (availableQuestions.length < questionsToSelect) {
            let usedQuestions = this.#quizQuestions.filter(q => this.#usedQuestionIds.has(q.id));
            const needed = questionsToSelect - availableQuestions.length;
            const randomUsed = this.#shuffleArray([...usedQuestions]).slice(0, needed);
            availableQuestions = [...availableQuestions, ...randomUsed];
            this.#usedQuestionIds.clear();
        }

        this.#currentQuestions = this.#shuffleArray(availableQuestions).slice(0, questionsToSelect);
        this.#currentQuestions.forEach(q => this.#usedQuestionIds.add(q.id));
    }

    #shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    #shuffleAllOptions() {
        this.#shuffledQuestions = this.#currentQuestions.map(q => {
            if (q.type === 'multiple') {
                const opts = [...q.options];
                const correctAnswerText = q.answer !== undefined ? q.answer : q.options[q.correct];
                for (let i = opts.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [opts[i], opts[j]] = [opts[j], opts[i]];
                }
                return {
                    ...q,
                    shuffledOptions: opts,
                    shuffledCorrect: opts.indexOf(correctAnswerText)
                };
            } else {
                return {
                    ...q,
                    shuffledOptions: ['صح', 'خطأ'],
                    shuffledCorrect: q.answer === 'صح' ? 0 : 1
                };
            }
        });
    }

    #updateTimerDisplay(timeLeft) {
        const timerEl = this.#domElements.timer;
        if (!timerEl) return;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const span = timerEl.querySelector('span');
        if (span) span.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft < 300) timerEl.style.color = 'var(--accent-color)';
        else if (timeLeft < 600) timerEl.style.color = 'var(--warning-color)';
        else timerEl.style.color = '';
    }

    #loadQuestion(index) {
        const question = this.#shuffledQuestions[index];
        const dom = this.#domElements;

        dom.questionNumber.textContent = `س${index + 1}`;
        dom.questionText.textContent = question.question;

        const progress = ((index + 1) / this.#shuffledQuestions.length) * 100;
        dom.progressFill.style.width = `${progress}%`;
        dom.progressText.textContent = `السؤال ${index + 1} من ${this.#shuffledQuestions.length}`;
        dom.progressPercent.textContent = `${Math.round(progress)}%`;

        dom.prevBtn.disabled = index === 0;
        dom.nextBtn.textContent = index === this.#shuffledQuestions.length - 1 ? 'إنهاء الاختبار' : 'التالي';

        dom.optionsContainer.innerHTML = '';
        question.shuffledOptions.forEach((option, optionIndex) => {
            const optionElement = document.createElement('div');
            optionElement.className = `option ${this.#userAnswers[index] === optionIndex ? 'selected' : ''}`;

            const marker = document.createElement('div');
            marker.className = 'option-marker';
            marker.textContent = String.fromCharCode(1632 + optionIndex + 1);

            const text = document.createElement('div');
            text.className = 'option-text';
            text.textContent = option;

            optionElement.append(marker, text);
            optionElement.addEventListener('click', () => this.#selectOption(optionIndex));
            dom.optionsContainer.appendChild(optionElement);
        });

        this.#updateQuestionStatus(index);
    }

    #updateQuestionStatus(index) {
        const statusElement = document.getElementById('questionStatus');
        if (!statusElement) return;
        if (this.#userAnswers[index] === undefined || this.#userAnswers[index] === null) {
            statusElement.innerHTML = '<i class="fas fa-star"></i> جديد';
            statusElement.style.color = 'var(--warning-color)';
        } else {
            statusElement.innerHTML = '<i class="fas fa-check"></i> تم الإجابة';
            statusElement.style.color = 'var(--success-color)';
        }
    }

    #updateQuestionsGrid() {
        const grid = this.#domElements.questionsGrid;
        grid.innerHTML = '';
        this.#shuffledQuestions.forEach((_, index) => {
            const btn = document.createElement('button');
            btn.className = 'question-nav-btn';
            btn.textContent = index + 1;

            if (index === this.#currentQuestionIndex) btn.classList.add('current');
            else if (this.#userAnswers[index] !== undefined && this.#userAnswers[index] !== null) btn.classList.add('answered');
            else btn.classList.add('unanswered');

            btn.addEventListener('click', () => {
                this.#currentQuestionIndex = index;
                this.#loadQuestion(index);
                this.#scrollToTop();
            });

            grid.appendChild(btn);
        });
    }

    #updateUnansweredAlert() {
        const unanswered = this.#userAnswers.filter(a => a === undefined || a === null).length;
        if (unanswered > 0) {
            this.#domElements.unansweredCount.textContent = `${unanswered} أسئلة من أصل ${this.#shuffledQuestions.length}`;
            this.#domElements.unansweredAlert.style.display = 'flex';
        } else {
            this.#domElements.unansweredAlert.style.display = 'none';
        }
    }

    #selectOption(optionIndex) {
        this.#userAnswers[this.#currentQuestionIndex] = optionIndex;
        this.#loadQuestion(this.#currentQuestionIndex);
        this.#updateUnansweredAlert();
        this.#updateQuestionsGrid();
        this.#saveProgress();
    }

    prevQuestion() {
        if (this.#currentQuestionIndex > 0) {
            this.#currentQuestionIndex--;
            this.#loadQuestion(this.#currentQuestionIndex);
            this.#scrollToTop();
        }
    }

    nextQuestion() {
        if (this.#currentQuestionIndex < this.#shuffledQuestions.length - 1) {
            this.#currentQuestionIndex++;
            this.#loadQuestion(this.#currentQuestionIndex);
            this.#scrollToTop();
        } else {
            this.#showConfirmModal();
        }
    }

    #showConfirmModal() {
        const dom = this.#domElements;
        const remaining = this.#userAnswers.filter(a => a === undefined || a === null).length;
        dom.remainingQuestions.textContent = remaining;
        dom.confirmModal.style.display = 'flex';
    }

    endExam() {
        try {
            this.#domElements.confirmModal.style.display = 'none';
            if (this.#timer) this.#timer.stop();
            this.#examCompleted = true;

            this.#domElements.examScreen.classList.remove('active');
            this.#domElements.resultsScreen.classList.add('active');

            this.#calculateResults();
            if (parseInt(this.#domElements.correctAnswers.textContent) >= Math.ceil(this.#shuffledQuestions.length * 0.6)) {
                this.#showConfetti();
            }

            clearExamProgress();
            this.#scrollToTop();
        } catch (error) {
            console.error('خطأ في إنهاء الامتحان:', error);
        }
    }

    #calculateResults() {
        let correct = 0, wrong = 0;
        this.#shuffledQuestions.forEach((q, i) => {
            const ans = this.#userAnswers[i];
            if (ans !== undefined && ans !== null) {
                if (ans === q.shuffledCorrect) correct++;
                else wrong++;
            }
        });

        const total = this.#shuffledQuestions.length;
        const percent = (correct / total) * 100;

        const dom = this.#domElements;
        dom.finalScore.textContent = `${correct}/${total}`;
        dom.percentage.textContent = `${percent.toFixed(1)}%`;
        dom.scorePercentage.textContent = `${percent.toFixed(1)}%`;
        dom.correctAnswers.textContent = correct;
        dom.wrongAnswers.textContent = wrong;

        const gradeText = percent >= 90 ? 'امتياز' :
                         percent >= 80 ? 'جيد جداً' :
                         percent >= 70 ? 'جيد' :
                         percent >= 60 ? 'مقبول' : 'راسب';
        dom.grade.textContent = gradeText;
        dom.grade.style.color = percent >= 60 ? 'var(--success-color)' : 'var(--accent-color)';

        const diff = Math.floor((new Date() - this.#startTime) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        dom.timeTaken.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        const circleLength = 800;
        dom.scoreCircle.style.strokeDashoffset = circleLength - (circleLength * (percent / 100));

        if (percent >= 90) dom.scoreCircle.style.stroke = '#9b59b6';
        else if (percent >= 80) dom.scoreCircle.style.stroke = 'var(--success-color)';
        else if (percent >= 70) dom.scoreCircle.style.stroke = '#2ecc71';
        else if (percent >= 60) dom.scoreCircle.style.stroke = 'var(--warning-color)';
        else dom.scoreCircle.style.stroke = 'var(--accent-color)';
    }

    #showConfetti() {
        const colors = ['#4299e1', '#e53e3e', '#38a169', '#d69e2e', '#9b59b6'];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    position: fixed; left: ${Math.random() * 100}vw; top: -10px;
                    width: 10px; height: 10px; background: ${colors[Math.floor(Math.random() * colors.length)]};
                    opacity: 0.8; border-radius: 50%; z-index: 9999; pointer-events: none;
                `;
                document.body.appendChild(confetti);

                confetti.animate([
                    { transform: 'translateY(0) rotate(0deg)', opacity: 0.8 },
                    { transform: `translateY(${window.innerHeight}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0 }
                ], {
                    duration: 2000 + Math.random() * 2000,
                    easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
                }).onfinish = () => confetti.remove();
            }, i * 50);
        }
    }

    toggleReview() {
        const reviewSection = this.#domElements.reviewSection;
        if (reviewSection.style.display === 'block') {
            reviewSection.style.display = 'none';
            this.#domElements.reviewBtn.innerHTML = '<i class="fas fa-list-check"></i> مراجعة الإجابات الخاطئة';
            this.#scrollToTop();
        } else {
            reviewSection.style.display = 'block';
            this.#domElements.reviewBtn.innerHTML = '<i class="fas fa-times"></i> إغلاق المراجعة';
            this.#generateWrongAnswersReview();
            setTimeout(() => reviewSection.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }

    #generateWrongAnswersReview() {
        const wrongList = this.#domElements.wrongAnswersList;
        wrongList.innerHTML = '';
        let wrongCount = 0;

        this.#shuffledQuestions.forEach((q, i) => {
            const userAns = this.#userAnswers[i];
            if (userAns !== undefined && userAns !== null && userAns !== q.shuffledCorrect) {
                wrongCount++;
                const item = document.createElement('div');
                item.className = 'review-item';
                item.innerHTML = `
                    <div class="review-question">${i + 1}. ${q.question}</div>
                    <div class="review-answers">
                        <div class="answer-item user-answer">
                            <i class="fas fa-user"></i> <span>إجابتك: ${q.shuffledOptions[userAns]}</span>
                        </div>
                        <div class="answer-item correct-answer">
                            <i class="fas fa-check"></i> <span>الإجابة الصحيحة: ${q.shuffledOptions[q.shuffledCorrect]}</span>
                        </div>
                        ${q.explanation ? `<div style="margin-top:0.5rem;font-size:0.95rem;color:var(--text-color);opacity:0.8;">${q.explanation}</div>` : ''}
                    </div>
                `;
                wrongList.appendChild(item);
            }
        });

        if (wrongCount === 0) {
            wrongList.style.display = 'none';
            this.#domElements.noWrongAnswers.style.display = 'block';
        } else {
            wrongList.style.display = 'block';
            this.#domElements.noWrongAnswers.style.display = 'none';
        }
    }

    retryExam() {
        this.#currentQuestionIndex = 0;
        this.#userAnswers = new Array(this.#shuffledQuestions.length).fill(null);
        this.#examCompleted = false;

        this.#domElements.resultsScreen.classList.remove('active');
        this.#domElements.examScreen.classList.add('active');
        this.#domElements.reviewSection.style.display = 'none';
        this.#domElements.reviewBtn.innerHTML = '<i class="fas fa-list-check"></i> مراجعة الإجابات الخاطئة';

        this.#startTime = new Date();
        this.#timer = new ExamTimer({
            duration: 60 * 60,
            onTick: (timeLeft) => this.#updateTimerDisplay(timeLeft),
            onFinish: () => this.endExam()
        });
        this.#updateTimerDisplay(this.#timer.getRemaining());
        this.#timer.start();

        this.#loadQuestion(this.#currentQuestionIndex);
        this.#updateUnansweredAlert();
        this.#saveProgress();
        this.#scrollToTop();
    }

    startNewExam() {
        this.#startTime = new Date();
        this.#currentQuestionIndex = 0;
        this.#userAnswers = [];
        this.#examCompleted = false;

        this.#selectRandomQuestions();
        this.#shuffleAllOptions();

        this.#timer = new ExamTimer({
            duration: 60 * 60,
            onTick: (timeLeft) => this.#updateTimerDisplay(timeLeft),
            onFinish: () => this.endExam()
        });
        this.#updateTimerDisplay(this.#timer.getRemaining());
        this.#timer.start();

        this.#domElements.startScreen.classList.remove('active');
        this.#domElements.examScreen.classList.add('active');
        this.#domElements.resultsScreen.classList.remove('active');
        this.#domElements.reviewSection.style.display = 'none';
        this.#domElements.reviewBtn.innerHTML = '<i class="fas fa-list-check"></i> مراجعة الإجابات الخاطئة';

        this.#loadQuestion(this.#currentQuestionIndex);
        this.#updateQuestionsGrid();
        this.#updateUnansweredAlert();
        this.#saveProgress();
        this.#scrollToTop();
    }

    #scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    #setupEventListeners() {
        const dom = this.#domElements;
        dom.startExamBtn.addEventListener('click', () => this.startExam());
        dom.endExamBtn.addEventListener('click', () => this.#showConfirmModal());
        dom.prevBtn.addEventListener('click', () => this.prevQuestion());
        dom.nextBtn.addEventListener('click', () => this.nextQuestion());
        dom.darkModeToggle.addEventListener('click', () => this.#toggleDarkMode());
        dom.reviewBtn.addEventListener('click', () => this.toggleReview());
        dom.retryBtn.addEventListener('click', () => this.retryExam());
        dom.newTestBtn.addEventListener('click', () => this.startNewExam());
        dom.closeReviewBtn.addEventListener('click', () => dom.reviewSection.style.display = 'none');
        dom.cancelEndBtn.addEventListener('click', () => dom.confirmModal.style.display = 'none');
        dom.confirmEndBtn.addEventListener('click', () => this.endExam());
        dom.confirmModal.addEventListener('click', (e) => { if (e.target === dom.confirmModal) dom.confirmModal.style.display = 'none'; });

        window.addEventListener('scroll', () => {
            dom.scrollTopBtn.classList.toggle('visible', window.pageYOffset > 300);
        });
        dom.scrollTopBtn.addEventListener('click', () => this.#scrollToTop());
    }

    #toggleDarkMode() {
        try {
            const isDark = getDarkMode();
            document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
            if (isDark) {
                document.body.removeAttribute('data-theme');
                this.#domElements.darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                this.#domElements.darkModeToggle.title = 'الوضع الليلي';
                setDarkMode(false);
            } else {
                document.body.setAttribute('data-theme', 'dark');
                this.#domElements.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                this.#domElements.darkModeToggle.title = 'الوضع النهاري';
                setDarkMode(true);
            }
            setTimeout(() => document.body.style.transition = '', 500);
        } catch (error) {
            console.error('خطأ في تبديل الوضع الليلي:', error);
        }
    }

    getCurrentQuestionIndex() { return this.#currentQuestionIndex; }
    getUserAnswers() { return [...this.#userAnswers]; }
    isExamCompleted() { return this.#examCompleted; }
}