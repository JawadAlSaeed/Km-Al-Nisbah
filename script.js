let gameState = {
    teams: [],
    currentSetterIndex: 0,
    currentGuesserIndex: 1,
    currentQuestionIndex: 0,
    currentPhase: 'percentage',
    currentPercentage: 50,
    questions: [],
    selectedQuestions: [],
    selectedCategories: [],
    difficulty: 'medium'
};

// Initialize the Game
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splashScreen');
    const splashVideo = document.getElementById('splashVideo');

    splashVideo.addEventListener('ended', () => {
        splashScreen.classList.remove('active-screen');
        setTimeout(() => {
            showScreen('mainMenu');
        }, 500);
    });

    setTimeout(() => {
        if (splashScreen.classList.contains('active-screen')) {
            splashScreen.classList.remove('active-screen');
            setTimeout(() => {
                showScreen('mainMenu');
            }, 500);
        }
    }, 10000);
});

// إدارة الشاشات
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');
}

// متغيرات المؤقت
let timer;
let timeLeft = 30;

// عناصر DOM
const nextQuestionButton = document.getElementById('nextQuestionButton');

// إدارة الشاشات
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');
}

// عرض شاشة خيارات اللعبة
function showGameOptions() {
    playSound('buttonClickSound');
    showScreen('gameOptions');
}

// عرض شاشة الدليل التعليمي
function showTutorial() {
    playSound('buttonClickSound');
    showScreen('tutorialScreen');
}

// عرض شاشة حول اللعبة
function showAboutUs() {
    playSound('buttonClickSound');
    showScreen('aboutUsScreen');
}

// العودة إلى القائمة الرئيسية
function confirmReturnToMainMenu() {
    const confirmation = confirm("هل أنت متأكد أنك تريد العودة إلى القائمة الرئيسية؟ سيتم فقدان التقدم الحالي.");
    if (confirmation) {
        returnToMainMenu();
    }
}

function returnToMainMenu() {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active-screen'));
    document.getElementById('mainMenu').classList.add('active-screen');
}

function showTeamSetup() {
    showScreen('teamSetup');
}

function showCategorySelection() {
    showScreen('categorySelection');
    loadCategories();
}

// تحميل الفئات
async function loadCategories() {
    try {
        const response = await fetch('config/questions.json');
        const data = await response.json();
        const categories = [...new Set(data.map(q => q.category))];

        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = '';

        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.textContent = category;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = category;
            checkbox.onchange = () => toggleCategorySelection(category, checkbox.checked);
            categoryItem.appendChild(checkbox);

            categoryItem.addEventListener('mouseenter', async () => {
                try {
                    const response = await fetch('config/questions.json');
                    const data = await response.json();
                    const previewQuestions = data.filter(q => q.category === category).slice(0, 3);
                    categoryItem.title = previewQuestions.map(q => q.question).join('\n');
                } catch (error) {
                    console.error('Error loading category preview:', error);
                }
            });

            categoryList.appendChild(categoryItem);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        alert('فشل في تحميل الفئات.');
    }
}

function toggleCategorySelection(category, isSelected) {
    if (isSelected) {
        gameState.selectedCategories.push(category);
    } else {
        gameState.selectedCategories = gameState.selectedCategories.filter(cat => cat !== category);
    }
}

// تحميل الأسئلة
async function loadQuestions() {
    try {
        const response = await fetch('config/questions.json');
        const data = await response.json();

        gameState.questions = gameState.selectedCategories.length > 0
            ? data.filter(q => gameState.selectedCategories.includes(q.category))
            : data;
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('فشل في تحميل الأسئلة. سيتم استخدام الأسئلة الاحتياطية.');
        gameState.questions = backupQuestions;
    }
}

// بدء اللعبة
async function startGame() {
    const team1 = document.getElementById('team1Input').value.trim() || 'الفريق 1';
    const team2 = document.getElementById('team2Input').value.trim() || 'الفريق 2';

    if (!team1 || !team2) {
        alert('يرجى إدخال أسماء كلا الفريقين!');
        return;
    }

    await loadQuestions();
    selectRandomQuestions();

    gameState.teams = [
        { name: team1, score: 0 },
        { name: team2, score: 0 }
    ];

    resetGameState();
    updateTeamNames();
    updateScores();
    setupNewRound();
    showScreen('gameScreen');
}

function selectRandomQuestions() {
    const shuffled = [...gameState.questions].sort(() => 0.5 - Math.random());
    gameState.selectedQuestions = shuffled.slice(0, 10);
}

function resetGameState() {
    gameState.currentQuestionIndex = 0;
    gameState.currentPhase = 'percentage';
    gameState.currentPercentage = 50;
    gameState.currentSetterIndex = 0;
    gameState.currentGuesserIndex = 1;
    updateMeter(50);
}

// خيار اللعبة العشوائية
function startRandomGame() {
    gameState.selectedCategories = [];
    showTeamSetup();
}

// بدء اللعبة مع الفئات المختارة
function startGameWithSelectedCategories() {
    if (gameState.selectedCategories.length === 0) {
        alert('يرجى اختيار فئة واحدة على الأقل!');
        return;
    }
    showTeamSetup();
}

// منطق اللعبة
function setupNewRound() {
    if (gameState.currentQuestionIndex >= gameState.selectedQuestions.length) {
        endGame();
        return;
    }

    const currentQuestion = gameState.selectedQuestions[gameState.currentQuestionIndex];
    document.getElementById('question').textContent = currentQuestion.question;
    document.getElementById('questionCounter').textContent = 
        `السؤال ${gameState.currentQuestionIndex + 1}/${gameState.selectedQuestions.length}`;

    updateActiveTeamDisplay();
    togglePhaseDisplays();
    resetButtons();
    stopTimer();
    startTimer();
}

function updateActiveTeamDisplay() {
    document.querySelectorAll('.team-card').forEach(card => card.classList.remove('active-team'));
    const activeTeamId = gameState.currentPhase === 'percentage' 
        ? `team${gameState.currentSetterIndex + 1}Display` 
        : `team${gameState.currentGuesserIndex + 1}Display`;
    document.getElementById(activeTeamId).classList.add('active-team');
}

function togglePhaseDisplays() {
    document.getElementById('percentageScreen').style.display = 
        gameState.currentPhase === 'percentage' ? 'block' : 'none';
    document.getElementById('choiceScreen').style.display = 
        gameState.currentPhase === 'guess' ? 'flex' : 'none';
}

// Track if the ticking sound is currently playing
let isTickingSoundPlaying = false;

// وظائف المؤقت
function startTimer() {
    let timeLimit = 30;
    if (gameState.difficulty === 'easy') {
        timeLimit = 45;
    } else if (gameState.difficulty === 'hard') {
        timeLimit = 20;
    }

    timeLeft = timeLimit;
    document.getElementById('timer').innerText = timeLeft;

    stopTimer();

    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;

        if (timeLeft <= 10) {
            playTickingSound();
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            alert('انتهى الوقت!');
            nextQuestion();
        }
    }, 1000);
}

function playTickingSound() {
    const tickingSound = document.getElementById('timerTickingSound');
    if (!isTickingSoundPlaying && tickingSound) {
        isTickingSoundPlaying = true;
        tickingSound.currentTime = 0;
        tickingSound.play().catch(error => {
            console.error('خطأ في تشغيل صوت التوقيت:', error);
        });

        tickingSound.onended = () => {
            isTickingSoundPlaying = false;
        };
    }
}

function stopTimer() {
    clearInterval(timer);
    const tickingSound = document.getElementById('timerTickingSound');
    if (tickingSound) {
        tickingSound.pause();
        tickingSound.currentTime = 0;
        isTickingSoundPlaying = false;
    }
}

function playSound(soundId) {
    const audio = document.getElementById(soundId);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.error('خطأ في تشغيل الصوت:', error);
        });
    }
}

function submitPercentage() {
    playSound('buttonClickSound');
    gameState.currentPercentage = parseInt(document.getElementById('hiddenSlider').value);
    gameState.currentPhase = 'guess';
    updateActiveTeamDisplay();
    togglePhaseDisplays();
    stopTimer();
    startTimer();

    document.getElementById('selectedPercentage').textContent = `النسبة المختارة: ${gameState.currentPercentage}%`;
}

function submitGuess(choice) {
    const currentQuestion = gameState.selectedQuestions[gameState.currentQuestionIndex];
    const correctAnswer = currentQuestion.answer;
    const { setterTeam, guesserTeam } = getCurrentTeams();

    disableChoiceButtons();
    stopTimer();

    const points = calculatePoints(choice, correctAnswer, setterTeam, guesserTeam);
    updateScores();

    if (points.pointsGuessing > 0) {
        playSound('correctGuessSound');
    } else {
        playSound('wrongGuessSound');
    }

    showResult(correctAnswer, points);

    setTimeout(() => {
        showNextQuestionButton();
    }, 1000);
}

function getCurrentTeams() {
    return {
        setterTeam: gameState.teams[gameState.currentSetterIndex],
        guesserTeam: gameState.teams[gameState.currentGuesserIndex]
    };
}

function calculatePoints(choice, correctAnswer, setterTeam, guesserTeam) {
    const differenceSetting = Math.abs(correctAnswer - gameState.currentPercentage);
    const guessedValue = choice === 'higher' ? gameState.currentPercentage + 1 : gameState.currentPercentage - 1;
    const differenceGuessing = Math.abs(correctAnswer - guessedValue);

    const timeBonus = Math.floor(timeLeft / 10);
    const pointsSetting = Math.max(0, 100 - differenceSetting) + timeBonus;
    const pointsGuessing = differenceGuessing < differenceSetting ? 50 + timeBonus : 0;

    setterTeam.score += pointsSetting;
    guesserTeam.score += pointsGuessing;

    return { pointsSetting, pointsGuessing };
}

function showResult(correctAnswer, points) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="result-message">
            الإجابة الصحيحة: ${correctAnswer}%<br>
            ${gameState.teams[gameState.currentSetterIndex].name}: +${points.pointsSetting}<br>
            ${gameState.teams[gameState.currentGuesserIndex].name}: +${points.pointsGuessing}
        </div>
    `;
    resultDiv.className = 'result correct';
}

function nextQuestion() {
    gameState.currentQuestionIndex++;
    gameState.currentPhase = 'percentage';

    [gameState.currentSetterIndex, gameState.currentGuesserIndex] = 
        [gameState.currentGuesserIndex, gameState.currentSetterIndex];

    resetRoundState();
    stopTimer();
    setupNewRound();
}

function resetRoundState() {
    updateMeter(50);
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = '';
    resultDiv.className = 'result';
    nextQuestionButton.classList.remove('visible');
}

function updateTeamNames() {
    document.getElementById('team1Name').textContent = gameState.teams[0].name;
    document.getElementById('team2Name').textContent = gameState.teams[1].name;
}

function updateScores() {
    document.getElementById('team1Score').textContent = gameState.teams[0].score;
    document.getElementById('team2Score').textContent = gameState.teams[1].score;
}

function disableChoiceButtons() {
    document.querySelectorAll('.choice-button').forEach(button => {
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.5';
    });
}

function resetButtons() {
    document.querySelectorAll('.choice-button').forEach(button => {
        button.style.pointerEvents = 'auto';
        button.style.opacity = '1';
    });
}

function showNextQuestionButton() {
    nextQuestionButton.classList.add('visible');
}

function updateMeter(value) {
    const meter = document.querySelector('.meter-background');
    const percentageDisplay = document.getElementById('percentage');
    const thumb = document.querySelector('.meter-thumb');

    meter.style.setProperty('--percentage', `${value}%`);
    percentageDisplay.textContent = value;
    thumb.style.transform = `translateX(-50%) rotate(${value * 3.6}deg)`;
}

const container = document.querySelector('.meter-container');
const slider = document.getElementById('hiddenSlider');
let isDragging = false;

container.addEventListener('mousedown', handleDragStart);
document.addEventListener('mousemove', handleDrag);
document.addEventListener('mouseup', handleDragEnd);

container.addEventListener('touchstart', (e) => {
    handleDragStart(e.touches[0]);
});
document.addEventListener('touchmove', (e) => {
    handleDrag(e.touches[0]);
});
document.addEventListener('touchend', handleDragEnd);

function handleDragStart(e) {
    isDragging = true;
    handleInput(e);
}

function handleDrag(e) {
    if (isDragging) handleInput(e);
}

function handleDragEnd() {
    isDragging = false;
}

function handleInput(e) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let deg = ((angle * (180 / Math.PI) + 450) % 360 + 360) % 360;
    let value = Math.min(100, Math.max(0, Math.round(deg * 100 / 360)));
    
    slider.value = value;
    updateMeter(value);
}

function endGame() {
    const [team1, team2] = gameState.teams;
    let winner = '';
    let message = '';

    if (team1.score > team2.score) {
        winner = team1.name;
        message = `تهانينا لفريق ${winner} على الفوز! 🎉`;
    } else if (team2.score > team1.score) {
        winner = team2.name;
        message = `تهانينا لفريق ${winner} على الفوز! 🎉`;
    } else {
        message = 'تعادل! لا يوجد فائز. 👏';
    }

    const finalResultsDiv = document.getElementById('finalResults');
    finalResultsDiv.innerHTML = `
        <h3>${message}</h3>
        <p>النتائج النهائية:</p>
        <p>${team1.name}: ${team1.score} نقطة</p>
        <p>${team2.name}: ${team2.score} نقطة</p>
    `;

    playSound('gameEndSound');
    showScreen('endScreen');
}

function stopAllSounds() {
    document.querySelectorAll('audio').forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

function restartGame() {
    playSound('buttonClickSound');
    stopAllSounds();
    resetGameState();
    showScreen('mainMenu');
}

updateMeter(50);

const backupQuestions = [
    {
        "question": "ما نسبة الناس الذين يفضلون الشاي على القهوة؟",
        "answer": 60,
        "category": "أطعمة ومشروبات"
    },
    {
        "question": "ما نسبة السيارات الكهربائية في العالم؟",
        "answer": 2,
        "category": "تكنولوجيا"
    },
    {
        "question": "ما نسبة الأشخاص الذين يمارسون الرياضة يوميًا؟",
        "answer": 15,
        "category": "صحة"
    }
];