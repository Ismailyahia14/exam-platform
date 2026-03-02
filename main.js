import { initializeDarkMode } from './utils/ui-helpers.js';
import { examsData } from './data/exams-meta.js';

const examGrid = document.getElementById('examGrid');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');

function renderExams(filteredExams) {
    examGrid.innerHTML = filteredExams.map(exam => `
        <div class="exam-card" data-subject="${exam.subject}" data-level="${exam.level}">
            <div class="card-icon"><i class="${exam.icon}"></i></div>
            <h2>${exam.title}</h2>
            <div class="meta">
                <span class="meta-item"><i class="fas fa-layer-group"></i> المستوى ${exam.level}</span>
                <span class="meta-item"><i class="fas fa-question-circle"></i> ${exam.questionsCount} سؤال</span>
            </div>
            <p>${exam.description}</p>
            <a href="${exam.link}" class="card-btn">
                <i class="fas fa-play-circle"></i> ابدأ الاختبار
            </a>
        </div>
    `).join('');
}

function filterExams() {
    const term = searchInput.value.toLowerCase();
    const level = filterSelect.value;
    const filtered = examsData.filter(exam => {
        const matchesSearch = exam.title.toLowerCase().includes(term) || exam.description.toLowerCase().includes(term);
        const matchesLevel = level === 'all' || exam.level == level;
        return matchesSearch && matchesLevel;
    });
    renderExams(filtered);
}

searchInput.addEventListener('input', filterExams);
filterSelect.addEventListener('change', filterExams);

initializeDarkMode();
renderExams(examsData);