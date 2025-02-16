let gameState = {
    teams: [],
    currentSetterIndex: 0,
    currentGuesserIndex: 1,
    currentQuestionIndex: 0,
    currentPhase: 'percentage',
    currentPercentage: 50,
    questions: [],
    selectedQuestions: [],
    selectedCategories: [], // تتبع الفئات المختارة
    difficulty: 'medium' // إضافة مستوى الصعوبة
};


// Initialize the Game
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splashScreen');
    const splashVideo = document.getElementById('splashVideo');

    // Transition to the main menu when the video ends
    splashVideo.addEventListener('ended', () => {
        splashScreen.classList.remove('active-screen'); // Trigger fade-out
        setTimeout(() => {
            showScreen('mainMenu'); // Show main menu after fade-out
        }, 500); // Match this delay with the CSS transition duration
    });

    // Optional: Fallback in case the video doesn't end properly
    setTimeout(() => {
        if (splashScreen.classList.contains('active-screen')) {
            splashScreen.classList.remove('active-screen');
            setTimeout(() => {
                showScreen('mainMenu');
            }, 500); // Match this delay with the CSS transition duration
        }
    }, 10000); // 10 seconds fallback (adjust based on your video length)
});

// إدارة الشاشات
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');
}

// متغيرات المؤقت
let timer;
let timeLeft = 30; // تغيير من 60 إلى 30 ثانية

// عناصر DOM
const nextQuestionButton = document.getElementById('nextQuestionButton');

// إدارة الشاشات
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');
}

// عرض شاشة خيارات اللعبة
function showGameOptions() {
    playSound('buttonClickSound'); // تشغيل صوت النقر على الزر
    showScreen('gameOptions');
}

// عرض شاشة الدليل التعليمي
function showTutorial() {
    playSound('buttonClickSound'); // تشغيل صوت النقر على الزر
    showScreen('tutorialScreen');
}

// عرض شاشة حول اللعبة
function showAboutUs() {
    playSound('buttonClickSound'); // تشغيل صوت النقر على الزر
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
    // Logic to return to the main menu
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
        const categories = [...new Set(data.map(q => q.category))]; // استخراج الفئات الفريدة

        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = ''; // مسح الفئات الحالية

        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.textContent = category;

            // إضافة خانة اختيار للتحديد المتعدد
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = category;
            checkbox.onchange = () => toggleCategorySelection(category, checkbox.checked);
            categoryItem.appendChild(checkbox);

            // إضافة معاينة الفئة عند التمرير
            categoryItem.addEventListener('mouseenter', async () => {
                try {
                    const response = await fetch('config/questions.json');
                    const data = await response.json();
                    const previewQuestions = data.filter(q => q.category === category).slice(0, 3); // عرض 3 أسئلة
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

        // تصفية الأسئلة حسب الفئات المختارة أو استخدام جميع الأسئلة
        gameState.questions = gameState.selectedCategories.length > 0
            ? data.filter(q => gameState.selectedCategories.includes(q.category))
            : data; // إذا لم يتم اختيار أي فئات، استخدم جميع الأسئلة
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
    gameState.selectedCategories = []; // لم يتم اختيار أي فئات محددة
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
    stopTimer(); // تأكد من عدم وجود مؤقت متبقي من الجولة السابقة
    startTimer(); // ابدأ مؤقت جديد للجولة الجديدة
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
    let timeLimit = 30; // الوقت الافتراضي الآن 30 ثانية
    if (gameState.difficulty === 'easy') {
        timeLimit = 45; // تعديل للصعوبة السهلة
    } else if (gameState.difficulty === 'hard') {
        timeLimit = 20; // تعديل للصعوبة الصعبة
    }

    timeLeft = timeLimit; // إعادة تعيين المؤقت إلى الحد الزمني الجديد
    document.getElementById('timer').innerText = timeLeft;

    stopTimer(); // تأكد من مسح أي مؤقت موجود قبل بدء مؤقت جديد

    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;

        // تشغيل صوت التوقيت عند الوصول إلى أقل من 10 ثوانٍ
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
// تشغيل صوت التوقيت مع منع التكرار
function playTickingSound() {
    const tickingSound = document.getElementById('timerTickingSound');
    if (!isTickingSoundPlaying && tickingSound) {
        isTickingSoundPlaying = true; // تعيين العلم على "قيد التشغيل"
        tickingSound.currentTime = 0; // إعادة ضبط الصوت إلى البداية
        tickingSound.play().catch(error => {
            console.error('خطأ في تشغيل صوت التوقيت:', error);
        });

        // إعادة تعيين العلم بعد انتهاء الصوت
        tickingSound.onended = () => {
            isTickingSoundPlaying = false;
        };
    }
}

// إيقاف المؤقت والصوت عند الانتقال إلى السؤال التالي
function stopTimer() {
    clearInterval(timer); // إيقاف المؤقت
    const tickingSound = document.getElementById('timerTickingSound');
    if (tickingSound) {
        tickingSound.pause(); // إيقاف صوت التوقيت
        tickingSound.currentTime = 0; // إعادة ضبط الصوت إلى البداية
        isTickingSoundPlaying = false; // إعادة تعيين العلم
    }
}

// تشغيل صوت
function playSound(soundId) {
    const audio = document.getElementById(soundId);
    if (audio) {
        audio.currentTime = 0; // إعادة ضبط الصوت إلى البداية
        audio.play().catch(error => {
            console.error('خطأ في تشغيل الصوت:', error);
        });
    }
}

// تقديم النسبة
function submitPercentage() {
    playSound('buttonClickSound'); // تشغيل صوت النقر على الزر
    gameState.currentPercentage = parseInt(document.getElementById('hiddenSlider').value);
    gameState.currentPhase = 'guess';
    updateActiveTeamDisplay();
    togglePhaseDisplays();
    stopTimer(); // إيقاف المؤقت السابق
    startTimer(); // إعادة تشغيل المؤقت لمرحلة "التخمين"

    // Update the selected percentage display
    document.getElementById('selectedPercentage').textContent = `النسبة المختارة: ${gameState.currentPercentage}%`;
}

// معالجة التخمين
function submitGuess(choice) {
    let points = 1;
    if (choice === 'muchHigher' || choice === 'muchLower') {
        points = 2; // Double points for much higher or much lower
    }

    // existing logic to handle the guess
    if (choice === 'higher' || choice === 'muchHigher') {
        // logic for higher guess
    } else if (choice === 'lower' || choice === 'muchLower') {
        // logic for lower guess
    }

    // Update the score with the calculated points
    if (isCorrectGuess(choice)) {
        currentTeamScore += points;
    } else {
        currentTeamScore -= points;
    }

    // Update the UI with the new score
    updateScoreDisplay();
}

function isCorrectGuess(choice) {
    // Implement the logic to check if the guess is correct
    // This function should return true if the guess is correct, otherwise false
}

function updateScoreDisplay() {
    // Implement the logic to update the score display in the UI
}

function submitGuess(choice) {
    const currentQuestion = gameState.selectedQuestions[gameState.currentQuestionIndex];
    const correctAnswer = currentQuestion.answer;
    const { setterTeam, guesserTeam } = getCurrentTeams();

    disableChoiceButtons(); // تعطيل الأزرار لمنع المزيد من الإدخال
    stopTimer(); // إيقاف المؤقت فورًا بعد تقديم التخمين

    const points = calculatePoints(choice, correctAnswer, setterTeam, guesserTeam);
    updateScores();

    if (points.pointsGuessing > 0) {
        playSound('correctGuessSound'); // تشغيل صوت الإجابة الصحيحة
    } else {
        playSound('wrongGuessSound'); // تشغيل صوت الإجابة الخاطئة
    }

    showResult(correctAnswer, points);

    // عرض زر السؤال التالي بعد ثانية واحدة
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

    // مكافأة للإجابات الأسرع
    const timeBonus = Math.floor(timeLeft / 10); // نقاط المكافأة بناءً على الوقت المتبقي
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

// التنقل
function nextQuestion() {
    gameState.currentQuestionIndex++;
    gameState.currentPhase = 'percentage';

    // تبديل الأدوار: يصبح المحدد الحالي هو المخمن، والعكس صحيح
    [gameState.currentSetterIndex, gameState.currentGuesserIndex] = 
        [gameState.currentGuesserIndex, gameState.currentSetterIndex];

    resetRoundState();
    stopTimer(); // إيقاف المؤقت قبل إعداد جولة جديدة
    setupNewRound();
}

function resetRoundState() {
    updateMeter(50);
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = '';
    resultDiv.className = 'result';
    nextQuestionButton.classList.remove('visible');
}

// مساعدي واجهة المستخدم
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

// منطق العداد
function updateMeter(value) {
    const meter = document.querySelector('.meter-background');
    const percentageDisplay = document.getElementById('percentage');
    const thumb = document.querySelector('.meter-thumb');

    meter.style.setProperty('--percentage', `${value}%`);
    percentageDisplay.textContent = value;
    thumb.style.transform = `translateX(-50%) rotate(${value * 3.6}deg)`;
}

// معالجة الإدخال
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

// إنهاء اللعبة
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

    // عرض النتائج النهائية على شاشة النهاية
    const finalResultsDiv = document.getElementById('finalResults');
    finalResultsDiv.innerHTML = `
        <h3>${message}</h3>
        <p>النتائج النهائية:</p>
        <p>${team1.name}: ${team1.score} نقطة</p>
        <p>${team2.name}: ${team2.score} نقطة</p>
    `;

    playSound('gameEndSound'); // تشغيل صوت نهاية اللعبة
    showScreen('endScreen');
}

// إيقاف جميع الأصوات
function stopAllSounds() {
    document.querySelectorAll('audio').forEach(audio => {
        audio.pause(); // إيقاف الصوت
        audio.currentTime = 0; // إعادة ضبط الصوت إلى البداية
    });
}

// إعادة بدء اللعبة
function restartGame() {
    playSound('buttonClickSound'); // تشغيل صوت النقر على الزر
    stopAllSounds(); // إيقاف جميع الأصوات، بما في ذلك صوت نهاية اللعبة
    resetGameState();
    showScreen('mainMenu');
}

// تهيئة
updateMeter(50);

// الأسئلة الاحتياطية
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