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

        // Final progress fill when done
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
        const winner = order.reduce((a, b) => this.scores[a] / CLUSTER_MAX[a] >= this.scores[b] / CLUSTER_MAX[b] ? a : b);
        const isMaster = this.scores[winner] >= Math.round(CLUSTER_MAX[winner] * 0.76);
        const p = PERSONAS[winner];

        // Hero
        const hero = document.getElementById('res-hero');
        hero.style.setProperty('--glow-color', p.color);
        hero.innerHTML = `
            <style>#res-hero::before { background: ${p.color} !important; }</style>
            <span class="hero-icon stagger-1">${p.icon}</span>
            <div class="hero-name stagger-2" style="color:${p.color}">${p.name}</div>
            <div class="hero-desc stagger-3">${p.desc}</div>
        `;
        hero.style.borderColor = p.color + '44';

        // WEF skills from direct skill scores (max 10 per skill)
        const wefSkills = SKILL_ORDER.map(s => ({
            label: s,
            score: Math.round((this.skillScores[s] || 0) / 10 * 100),
            color: SKILL_COLORS[s]
        }));

        // Top and bottom skills
        const sorted = [...wefSkills].sort((a, b) => b.score - a.score);
        const topSkill    = sorted[0];
        const bottomSkill = sorted[sorted.length - 1];

        // Persona score bars
        const barColors = { Owl:'#c084fc', Chameleon:'#4ade80', Dolphin:'#38bdf8', Octopus:'#fb923c' };
        const barLabels = { Owl:'ינשוף אסטרטגי', Chameleon:'זיקית דינמית', Dolphin:'דולפין מחבר', Octopus:'תמנון דיגיטלי' };
        const scoreBarsHTML = order.map((k, i) => `
            <div class="score-row stagger-${(i%3)+1}">
                <div class="score-label">${PERSONAS[k].icon} ${barLabels[k]}</div>
                <div class="score-bar-wrap">
                    <div class="score-bar-track">
                        <div class="score-bar-fill" style="width:${(this.scores[k]/CLUSTER_MAX[k])*100}%;background:${barColors[k]}"></div>
                    </div>
                    <div class="score-val">${this.scores[k]}</div>
                </div>
            </div>
        `).join('');

        const isComm = isMaster;
        document.getElementById('growth-card').innerHTML = `
            <div class="card-title">פרופיל לפי פרסונה</div>
            <div class="score-bars">${scoreBarsHTML}</div>
            <div class="divider"></div>
            <div class="card-title">מיומנות מובילה &larr; <span style="color:${topSkill.color}">${topSkill.label}</span></div>
            <div class="card-title">מיומנות לחיזוק &larr; <span style="color:#8ba4c0">${bottomSkill.label}</span></div>
            <div class="divider"></div>
            <div class="card-title">תוכנית פעולה</div>
            <div class="mission-type ${isComm ? 'commando' : 'growth'}">
                ${isComm ? '⚡ משימת קומנדו' : '🌱 משימת צמיחה'}
            </div>
            <div class="mission-text">${isComm ? p.missionCommando : p.mission70}</div>
            <div style="font-size:0.85rem;color:#9ab3cc;line-height:1.5">
                ${isComm ? 'כיעד מאסטר, המשימה שלך היא לייצר אימפקט ארגוני רחב.' : 'המטרה היא חיזוק שריר המיומנות דרך התנסות בשטח.'}
            </div>
            <div class="divider"></div>
            <div class="learning-item">
                <div class="learning-pct">20%</div>
                <div class="learning-body"><b>למידה מעמיתים:</b> חפש עמית בקבוצת ה-${p.name} והתייעץ על אתגרי המשימה.</div>
            </div>
            <div class="learning-item">
                <div class="learning-pct">10%</div>
                <div class="learning-body"><b>למידה פורמלית:</b> צפה במיני-קורס "מיומנויות 2030" בפורטל הארגוני.</div>
            </div>
            <div class="divider"></div>
            <div style="font-size:0.8rem;color:#8ba4c0;margin-bottom:10px;">משימה אישית לשבוע הקרוב</div>
            <textarea class="write-area" placeholder="כתבו כאן את המשימה שתיקחו איתכם..."></textarea>
        `;

        this.initChart(wefSkills);
        this.fetchAIAnalysis(PERSONAS[winner].name);
    },

    initChart(wefSkills) {
        const ctx = document.getElementById('radarChart').getContext('2d');
        const labels = wefSkills.map(s => s.label);
        const data   = wefSkills.map(s => s.score);

        // gradient fill
        const gradient = ctx.createRadialGradient(0,0,0,0,0,200);
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
    },

    async fetchAIAnalysis(winnerName) {
        const block = document.getElementById('ai-analysis-block');
        const content = document.getElementById('ai-analysis-content');

        block.style.display = 'block';
        content.innerHTML = `
            <div class="ai-loading">
                <div class="ai-spinner"></div>
                <div>מנתח את הפרופיל שלך...</div>
            </div>
        `;

        const prompt = `אתה יועץ פיתוח מקצועי בארגון ישראלי. קיבלת תוצאות אבחון מיומנויות עתיד של עובד.

ציוני הפרסונות (מתוך 25 לכל אחת):
- ינשוף אסטרטגי (חשיבה אנליטית ויצירתית): ${this.scores.Owl}/25
- זיקית דינמית (גמישות ולמידה): ${this.scores.Chameleon}/25
- דולפין מחבר (מנהיגות ואמפתיה): ${this.scores.Dolphin}/25
- תמנון דיגיטלי (אוריינות טכנולוגית): ${this.scores.Octopus}/25

הפרסונה הדומיננטית: ${winnerName}

כתוב ניתוח אישי קצר ב-3 פסקאות בעברית (סה"כ עד 150 מילים):

1. **מי אתה**: תאר את השילוב הייחודי של הפרסונות (לא רק הדומיננטית — התייחס לפרופיל כולו, החוזקות ההדדיות).

2. **הנקודה העיוורת**: זהה את המיומנות הכי חלשה ותן הסבר קצר למה היא חשובה בעולם של 2030.

3. **משימה לשבוע הבא**: תן משימה אחת קונקרטית ומדידה שמחזקת את הנקודה החלשה. כלול יום ומשך זמן מוצע.

הנחיות סגנון:
- כתוב בגוף שני (אתה/את)
- טון חם ומקצועי, לא פורמלי מדי
- אל תשתמש באימוג'ים
- אל תחזור על שמות הפרסונות באנגלית`;

        try {
            // הוספת חלון קופץ להזנת מפתח API למטרת הרצה מקומית במחשב
            const apiKey = window.prompt("🚀 כדי לחבר את הכלי ל-AI, אנא הדבק את מפתח ה-API שלך מ-Anthropic (Claude):\n\n(אם אין לך או שאתה רק רוצה לבדוק את העיצוב, השאר ריק ולחץ ביטול)", "");

            if (!apiKey) {
                block.style.display = 'none'; // אם אין מפתח, ממשיכים בלי הבלוק של ה-AI
                return;
            }

            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey.trim(),
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true"
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20240620",
                    max_tokens: 1000,
                    messages: [{
                        role: "user",
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const textResponse = data.content?.[0]?.text || '';

            if (textResponse) {
                const paragraphs = textResponse.split('\n\n').filter(p => p.trim() !== '');
                content.innerHTML = paragraphs.map(p => {
                    const htmlP = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return `<p>${htmlP}</p>`;
                }).join('');
            } else {
                throw new Error('Empty API response');
            }

        } catch (error) {
            console.error('AI Analysis failed:', error);
            content.innerHTML = `<div style="color: #ff4d4f; background: rgba(255,0,0,0.1); padding: 15px; border-radius: 12px; font-size: 0.85rem; direction: ltr; text-align: left;">
                                    <b>❌ תקלת התחברות ל-API</b><br>
                                    ${error.message.includes('Failed to fetch') ? 'שגיאת רשת / CORS (נסה להריץ דרך שרת מקומי)' : error.message}
                                 </div>`;
        }
    }
};
