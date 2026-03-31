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
    answers: [],

    chartInstance: null,
    _lastWefSkills: null,
    _lastLeadingSet: null,

    theme: {
        get current() {
            return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        },
        apply(mode) {
            const btn = document.getElementById('theme-toggle');
            if (mode === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
                if (btn) btn.textContent = '☀️';
            } else {
                document.documentElement.removeAttribute('data-theme');
                if (btn) btn.textContent = '🌙';
            }
            localStorage.setItem('theme', mode);
            if (app.chartInstance && app._lastWefSkills) {
                app.chartInstance.destroy();
                app.chartInstance = null;
                app.initChart(app._lastWefSkills, app._lastLeadingSet);
            }
        },
        toggle() { this.apply(this.current === 'light' ? 'dark' : 'light'); },
        init() {
            const saved = localStorage.getItem('theme');
            if (saved) { this.apply(saved); }
            const btn = document.getElementById('theme-toggle');
            if (btn) btn.addEventListener('click', () => app.theme.toggle());
        }
    },

    init() {
        SCORM.init();
        this.theme.init();
    },

    show(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },

    start() { this.show('screen-quiz'); this.renderQ(); },

    renderQ() {
        const q = QUESTIONS[this.step];

        const qText = document.getElementById('q-text');
        qText.classList.remove('fade-in');
        void qText.offsetWidth;
        qText.classList.add('fade-in');

        document.getElementById('q-num').textContent = this.step + 1;
        document.getElementById('progress-fill').style.width = (((this.step + 1) / QUESTIONS.length) * 100) + '%';
        document.getElementById('q-category').textContent = q.skill;
        document.getElementById('q-text').textContent = q.text;

        const backBtn = document.getElementById('back-btn');
        if (backBtn) backBtn.style.display = this.step > 0 ? '' : 'none';
    },

    goBack() {
        if (this.step === 0) return;
        const last = this.answers.pop();
        this.scores[last.cluster] -= last.val;
        this.skillScores[last.skill] -= last.val;
        this.step--;
        this.renderQ();
    },

    handleChoice(val) {
        const q = QUESTIONS[this.step];
        this.answers.push({ cluster: q.cluster, skill: q.skill, val });
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

        // Leading skills: both questions scored 4 or 5 → raw ≥ 8
        const leadingSkillsSet = new Set(
            SKILL_ORDER.filter(s => (this.skillScores[s] || 0) >= 8)
        );

        const sorted      = [...wefSkills].sort((a, b) => b.score - a.score);
        const topSkill    = sorted[0];
        const bottomSkill = sorted[sorted.length - 1];

        // ── SCORM reporting ───────────────────────────────────
        SCORM.set('cmi.core.lesson_status', 'completed');
        SCORM.set('cmi.suspend_data', JSON.stringify({
            persona: winner,
            isMaster,
            scores: this.scores,
            skills: this.skillScores
        }));

        // ── SCORM objectives — one per WEF skill ──────────────
        // Visible in Moodle: SCORM Reports → student attempt → Objectives table
        wefSkills.forEach((skill, i) => {
            SCORM.set(`cmi.objectives.${i}.id`,         skill.label);
            SCORM.set(`cmi.objectives.${i}.score.raw`,  String(skill.score));
            SCORM.set(`cmi.objectives.${i}.score.min`,  '0');
            SCORM.set(`cmi.objectives.${i}.score.max`,  '100');
            SCORM.set(`cmi.objectives.${i}.status`,     skill.score >= 60 ? 'passed' : 'failed');
        });

        SCORM.save();

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

        const isComm = isMaster;

        // ── Profile card ──────────────────────────────────────
        document.getElementById('profile-card').innerHTML = `
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
        `;

        // ── Commando mission card ─────────────────────────────
        const cm = p.commando;
        const commandoCard = document.getElementById('commando-card');
        commandoCard.innerHTML = `
            <div class="mission-type commando">
                ⚡ מסלול מצוינות — קומנדו
                ${isComm ? '<span class="mission-yours-badge">המסלול שלך</span>' : ''}
            </div>
            ${isComm ? '<div class="mission-preamble">כבר יש לך את זה.. עוברים לאימון מתקדם (Impact).</div>' : ''}
            <div class="mission-name">${cm.name}</div>
            <div class="mission-section">
                <div class="mission-field-label">הביצוע</div>
                <div class="mission-field-text">${cm.task}</div>
            </div>
            <div class="mission-section">
                <div class="mission-field-label">שאלת יישום</div>
                <div class="mission-field-text mission-question">${cm.question}</div>
            </div>
            <div class="mission-section">
                <div class="mission-field-label">מדד הצלחה</div>
                <div class="mission-field-text mission-metric">${cm.metric}</div>
            </div>
        `;

        // ── Growth mission card ───────────────────────────────
        const gm = p.growth;
        const growthMissionCard = document.getElementById('growth-mission-card');
        growthMissionCard.innerHTML = `
            <div class="mission-type growth">
                🌱 מסלול לחיזוק — צמיחה
                ${!isComm ? '<span class="mission-yours-badge">המסלול שלך</span>' : ''}
            </div>
            ${!isComm ? '<div class="mission-preamble">כאן יש לך הזדמנות לצמוח ולחזק את השריר.</div>' : ''}
            <div class="mission-name">${gm.name}</div>
            <div class="mission-section">
                <div class="mission-field-label">האתגר</div>
                <div class="mission-field-text">${gm.challenge}</div>
            </div>
            <div class="mission-section">
                <div class="mission-field-label">המשימה</div>
                <div class="mission-field-text">${gm.task}</div>
            </div>
            <div class="mission-section">
                <div class="mission-field-label">שאלות רפלקציה</div>
                <div class="reflections">
                    ${gm.reflections.map(r => `<div class="reflection-item">${r}</div>`).join('')}
                </div>
            </div>
        `;

        // ── Weekly checklist card (full-width, below both missions) ──
        document.getElementById('checklist-card').innerHTML = `
            <div class="weekly-checklist">
                <div class="card-title">✅ צ'ק-ליסט שבועי</div>
                <label class="checklist-item"><input type="checkbox"> ביצעתי את המשימה השבועית</label>
                <label class="checklist-item"><input type="checkbox"> ענתי על שאלות הרפלקציה</label>
                <label class="checklist-item"><input type="checkbox"> שיתפתי את הלמידה עם עמית אחד</label>
            </div>
            <div class="divider"></div>
            <div class="write-label">המשימה שאני לוקח איתי לשבוע הקרוב</div>
            <textarea class="write-area" placeholder="כתבו כאן..."></textarea>
        `;

        this._lastWefSkills = wefSkills;
        this._lastLeadingSet = leadingSkillsSet;
        this.initChart(wefSkills, leadingSkillsSet);
        this.renderLMS(wefSkills);
    },

    renderLMS(wefSkills) {
        const lmsCard = document.getElementById('lms-card');
        const gapSkills = wefSkills.filter(s => s.score < 60);

        if (gapSkills.length === 0) {
            lmsCard.style.display = 'none';
            return;
        }

        const rows = gapSkills.map(s => {
            const url = LMS_LINKS[s.label];
            const isAvailable = url && url !== '#';
            return `
                <div class="lms-row">
                    <div class="lms-skill-name" style="color:${s.color}">${s.label}</div>
                    ${isAvailable
                        ? `<a href="${url}" class="lms-link" target="_blank">אני רוצה ללמוד</a>`
                        : `<span class="lms-link lms-coming-soon">בקרוב</span>`
                    }
                </div>
            `;
        }).join('');

        lmsCard.innerHTML = `
            <div class="card-title">📚 מסלולי למידה מומלצים לפי פערי מיומנויות</div>
            ${rows}
        `;
        lmsCard.style.display = 'block';
    },

    initChart(wefSkills, leadingSkillsSet) {
        const canvas = document.getElementById('radarChart');
        const ctx    = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
        gradient.addColorStop(1, 'rgba(168,85,247,0.08)');

        const pointColors = wefSkills.map(s =>
            leadingSkillsSet.has(s.label) ? s.color : 'rgba(90,112,144,0.45)'
        );
        const pointRadii = wefSkills.map(s =>
            leadingSkillsSet.has(s.label) ? 7 : 4
        );

        const tooltipEl = document.getElementById('chart-tooltip');

        app.chartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: wefSkills.map(s => s.label),
                datasets: [{
                    data: wefSkills.map(s => s.score),
                    backgroundColor: gradient,
                    borderColor: 'rgba(99,155,255,0.8)',
                    borderWidth: 2,
                    pointBackgroundColor: pointColors,
                    pointBorderColor: wefSkills.map(s =>
                        leadingSkillsSet.has(s.label) ? s.color : 'transparent'
                    ),
                    pointBorderWidth: 2,
                    pointRadius: pointRadii,
                    pointHoverRadius: wefSkills.map(s =>
                        leadingSkillsSet.has(s.label) ? 9 : 6
                    ),
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
                            color: (labelCtx) => {
                                const label = SKILL_ORDER[labelCtx.index];
                                return leadingSkillsSet.has(label) ? SKILL_COLORS[label] : '#9ab3cc';
                            },
                            font: { family: 'Heebo', size: 11, weight: '600' },
                            padding: 8
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: false,
                        external(context) {
                            const tooltip = context.tooltip;
                            if (tooltip.opacity === 0) {
                                tooltipEl.style.opacity = '0';
                                tooltipEl.style.pointerEvents = 'none';
                                return;
                            }
                            const idx      = tooltip.dataPoints[0].dataIndex;
                            const skill    = wefSkills[idx];
                            const isLead   = leadingSkillsSet.has(skill.label);
                            const color    = isLead ? skill.color : '#8ba4c0';

                            tooltipEl.innerHTML = `
                                <div class="ct-skill" style="color:${color}">${skill.label}</div>
                                <div class="ct-score">${skill.score}%</div>
                                <div class="ct-desc">${SKILL_DESCRIPTIONS[skill.label] || ''}</div>
                                ${isLead ? '<div class="ct-badge">מיומנות מובילה ⭐</div>' : ''}
                            `;

                            const rect = context.chart.canvas.getBoundingClientRect();
                            const x = rect.left + window.scrollX + tooltip.caretX;
                            const y = rect.top  + window.scrollY + tooltip.caretY - 12;

                            tooltipEl.style.left         = x + 'px';
                            tooltipEl.style.top          = y + 'px';
                            tooltipEl.style.opacity      = '1';
                            tooltipEl.style.pointerEvents = 'none';
                        }
                    }
                }
            }
        });

        // Legend below chart
        const chartCard = canvas.parentElement;
        const oldLegend = chartCard.querySelector('.chart-legend');
        if (oldLegend) oldLegend.remove();

        const legendEl = document.createElement('div');
        legendEl.className = 'chart-legend';
        legendEl.innerHTML = `
            <div class="legend-item">
                <span class="legend-dot" style="background:#93c5fd;box-shadow:0 0 6px rgba(147,197,253,0.7)"></span>
                <span>מיומנות מובילה (ציון 4–5) ${leadingSkillsSet.size > 0 ? '— ' + leadingSkillsSet.size + ' מיומנויות' : ''}</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot" style="background:rgba(90,112,144,0.5)"></span>
                <span>שאר המיומנויות</span>
            </div>
        `;
        chartCard.appendChild(legendEl);
    }
};

// ── Bootstrap ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => app.init());
window.addEventListener('beforeunload', () => SCORM.quit());
