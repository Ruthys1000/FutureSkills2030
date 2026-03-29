const SKILL_COLORS = {
    'חשיבה אנליטית':               '#c084fc',
    'חשיבה יצירתית':               '#c084fc',
    "חוסן, גמישות ואג'יליות":      '#4ade80',
    'מוטיבציה ומודעות עצמית':      '#4ade80',
    'סקרנות ולמידה לאורך החיים':   '#4ade80',
    'מנהיגות והשפעה חברתית':       '#38bdf8',
    'אמפתיה והקשבה פעילה':         '#38bdf8',
    'ניהול טאלנט':                  '#38bdf8',
    'אוריינות טכנולוגית':           '#fb923c',
    'בינה מלאכותית וביג דאטה':     '#fb923c'
};

const SKILL_ORDER = [
    'חשיבה אנליטית',
    'חשיבה יצירתית',
    "חוסן, גמישות ואג'יליות",
    'מוטיבציה ומודעות עצמית',
    'סקרנות ולמידה לאורך החיים',
    'מנהיגות והשפעה חברתית',
    'אמפתיה והקשבה פעילה',
    'ניהול טאלנט',
    'אוריינות טכנולוגית',
    'בינה מלאכותית וביג דאטה'
];

// Max scores per cluster (questions × 5)
const CLUSTER_MAX = { Owl: 20, Chameleon: 30, Dolphin: 30, Octopus: 20 };

const app = {
    step: 0,
    scores: { Owl: 0, Chameleon: 0, Dolphin: 0, Octopus: 0 },
    skillScores: {},

    show(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },

    start() { this.show('screen-quiz'); this.renderQ(); },

    renderQ() {
        const q = QUESTIONS[this.step];

        const qText = document.getElementById('q-text');
        qText.classList.remove('fade-in');
        void qText.offsetWidth; // trigger reflow
        qText.classList.add('fade-in');

        document.getElementById('q-num').textContent = this.step + 1;
        document.getElementById('progress-fill').style.width = (((this.step) / QUESTIONS.length) * 100) + '%';
        document.getElementById('q-category').innerHTML = '';
        document.getElementById('q-text').textContent = q.text;
    },

    handleChoice(val) {
        const q = QUESTIONS[this.step];
        this.scores[q.cluster] += val;
        this.skillScores[q.skill] = (this.skillScores[q.skill] || 0) + val;

        document.getElementById('progress-fill').style.width = (((this.step + 1) / QUESTIONS.length) * 100) + '%';

        if (this.step < QUESTIONS.length - 1) {
            this.step++;
            setTimeout(() => this.renderQ(), 150);
        } else {
            setTimeout(() => this.showResults(), 200);
        }
    },

    showResults() {
        this.show('screen-results');
        const order = ['Owl', 'Chameleon', 'Dolphin', 'Octopus'];
        const winner = order.reduce((a, b) =>
            this.scores[a] / CLUSTER_MAX[a] >= this.scores[b] / CLUSTER_MAX[b] ? a : b
        );
        const isMaster = this.scores[winner] >= Math.round(CLUSTER_MAX[winner] * 0.76);
        const p = PERSONAS[winner];

        // ── Hero ─────────────────────────────────────────────
        const hero = document.getElementById('res-hero');
        hero.style.setProperty('--glow-color', p.color);
        hero.innerHTML = `
            <style>#res-hero::before { background: ${p.color} !important; }</style>
            <span class="hero-icon stagger-1">${p.icon}</span>
            <div class="hero-name stagger-2" style="color:${p.color}">${p.name}</div>
            <div class="hero-desc stagger-3">${p.desc}</div>
            <div class="hero-power stagger-4">
                <span class="power-label">הכוח שלי:</span>
                <span style="color:${p.color};font-weight:700">${p.power}</span>
            </div>
            <div class="hero-identifier stagger-4">${p.identifier}</div>
        `;
        hero.style.borderColor = p.color + '44';

        // ── WEF skill scores (direct, max 10 each) ───────────
        const wefSkills = SKILL_ORDER.map(s => ({
            label: s,
            score: Math.round((this.skillScores[s] || 0) / 10 * 100),
            color: SKILL_COLORS[s]
        }));

        const sorted      = [...wefSkills].sort((a, b) => b.score - a.score);
        const topSkill    = sorted[0];
        const bottomSkill = sorted[sorted.length - 1];

        // ── Persona score bars ────────────────────────────────
        const barColors = { Owl:'#c084fc', Chameleon:'#4ade80', Dolphin:'#38bdf8', Octopus:'#fb923c' };
        const barLabels = { Owl:'ינשוף אסטרטגי', Chameleon:'זיקית דינמית', Dolphin:'דולפין מחבר', Octopus:'תמנון דיגיטלי' };
        const scoreBarsHTML = order.map((k, i) => `
            <div class="score-row stagger-${(i % 3) + 1}">
                <div class="score-label">${PERSONAS[k].icon} ${barLabels[k]}</div>
                <div class="score-bar-wrap">
                    <div class="score-bar-track">
                        <div class="score-bar-fill" style="width:${(this.scores[k] / CLUSTER_MAX[k]) * 100}%;background:${barColors[k]}"></div>
                    </div>
                    <div class="score-val">${this.scores[k]}</div>
                </div>
            </div>
        `).join('');

        // ── Mission content (growth or commando) ─────────────
        const mission     = isMaster ? p.commando : p.growth;
        const isComm      = isMaster;
        const preamble    = isComm
            ? 'כבר יש לך את זה.. עוברים לאימון מתקדם (Impact).'
            : 'כאן יש לך הזדמנות לצמוח ולחזק את השריר.';

        const missionBody = isComm ? `
            <div class="mission-section">
                <div class="mission-field-label">הביצוע</div>
                <div class="mission-field-text">${mission.task}</div>
            </div>
            <div class="mission-section">
                <div class="mission-field-label">שאלת יישום</div>
                <div class="mission-field-text mission-question">${mission.question}</div>
            </div>
            <div class="mission-section">
                <div class="mission-field-label">מדד הצלחה</div>
                <div class="mission-field-text mission-metric">${mission.metric}</div>
            </div>
        ` : `
            <div class="mission-section">
                <div class="mission-field-label">האתגר</div>
                <div class="mission-field-text">${mission.challenge}</div>
            </div>
            <div class="mission-section">
                <div class="mission-field-label">המשימה</div>
                <div class="mission-field-text">${mission.task}</div>
            </div>
            <div class="mission-section">
                <div class="mission-field-label">שאלות רפלקציה</div>
                <div class="reflections">
                    ${mission.reflections.map(r => `<div class="reflection-item">${r}</div>`).join('')}
                </div>
            </div>
        `;

        document.getElementById('growth-card').innerHTML = `
            <div class="card-title">פרופיל לפי פרסונה</div>
            <div class="score-bars">${scoreBarsHTML}</div>

            <div class="divider"></div>
            <div class="skill-highlights">
                <div class="skill-highlight-row">
                    <span class="skill-highlight-label">מיומנות מובילה</span>
                    <span class="skill-highlight-value" style="color:${topSkill.color}">${topSkill.label}</span>
                </div>
                <div class="skill-highlight-row">
                    <span class="skill-highlight-label">מיומנות לחיזוק</span>
                    <span class="skill-highlight-value" style="color:#8ba4c0">${bottomSkill.label}</span>
                </div>
            </div>

            <div class="divider"></div>
            <div class="mission-type ${isComm ? 'commando' : 'growth'}">
                ${isComm ? '⚡ מסלול מצוינות — קומנדו' : '🌱 מסלול לחיזוק — צמיחה'}
            </div>
            <div class="mission-preamble">${preamble}</div>
            <div class="mission-name">${mission.name}</div>
            ${missionBody}

            <div class="divider"></div>
            <div class="write-label">המשימה שאני לוקח איתי לשבוע הקרוב</div>
            <textarea class="write-area" placeholder="כתבו כאן..."></textarea>
        `;

        this.initChart(wefSkills);
    },

    initChart(wefSkills) {
        const ctx = document.getElementById('radarChart').getContext('2d');
        const labels = wefSkills.map(s => s.label);
        const data   = wefSkills.map(s => s.score);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
        gradient.addColorStop(1, 'rgba(168,85,247,0.08)');

        new Chart(ctx, {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: gradient,
                    borderColor: 'rgba(99,155,255,0.8)',
                    borderWidth: 2,
                    pointBackgroundColor: wefSkills.map(s => s.color),
                    pointBorderColor: 'transparent',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true, max: 100,
                        ticks: { display: false, stepSize: 25 },
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        angleLines: { color: 'rgba(255,255,255,0.06)' },
                        pointLabels: {
                            color: '#9ab3cc',
                            font: { family: 'Heebo', size: 11, weight: '600' },
                            padding: 8
                        }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
};
