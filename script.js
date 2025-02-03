let gameState = {
    teams: [],
    currentSetterIndex: 0,
    currentGuesserIndex: 1,
    currentQuestionIndex: 0,
    currentPhase: 'percentage',
    currentPercentage: 50,
    questions: [],
    selectedQuestions: []
};

// Timer variables
let timer;
let timeLeft = 60;

// DOM Elements
const nextQuestionButton = document.getElementById('nextQuestionButton');

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');
}

function showTeamSetup() {
    showScreen('teamSetup');
}

// Question Loading
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        gameState.questions = data;
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('فشل في تحميل الأسئلة. سيتم استخدام الأسئلة الاحتياطية.');
        gameState.questions = backupQuestions;
    }
}

// Game Initialization
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

// Game Logic
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
    startTimer(); // Start the timer for the new round
}

function updateActiveTeamDisplay() {
    document.querySelectorAll('.team-card').forEach(card => card.classList.remove('active-team'));
    const activeTeamId = gameState.currentPhase === 'percentage' ? 
        `team${gameState.currentSetterIndex + 1}Display` : 
        `team${gameState.currentGuesserIndex + 1}Display`;
    document.getElementById(activeTeamId).classList.add('active-team');
}

function togglePhaseDisplays() {
    document.getElementById('percentageScreen').style.display = 
        gameState.currentPhase === 'percentage' ? 'block' : 'none';
    document.getElementById('choiceScreen').style.display = 
        gameState.currentPhase === 'guess' ? 'flex' : 'none';
}

// Timer Functions
function startTimer() {
    timeLeft = 60; // Reset the timer to 60 seconds
    document.getElementById('timer').innerText = timeLeft;

    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timer);
            // Handle the end of the timer (e.g., move to the next question)
            alert('انتهى الوقت!');
            nextQuestion();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
}

// Percentage Submission
function submitPercentage() {
    gameState.currentPercentage = parseInt(document.getElementById('hiddenSlider').value);
    gameState.currentPhase = 'guess';
    updateActiveTeamDisplay();
    togglePhaseDisplays();
    stopTimer(); // Stop the timer when percentage is submitted
}

// Guess Handling
function submitGuess(choice) {
    const currentQuestion = gameState.selectedQuestions[gameState.currentQuestionIndex];
    const correctAnswer = currentQuestion.answer;
    const { setterTeam, guesserTeam } = getCurrentTeams();

    disableChoiceButtons();
    const points = calculatePoints(choice, correctAnswer, setterTeam, guesserTeam);
    updateScores();
    showResult(correctAnswer, points);
    
    // Show next question button after 1 second
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

    const pointsSetting = Math.max(0, 100 - differenceSetting);
    const pointsGuessing = differenceGuessing < differenceSetting ? 50 : 0;

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

// Navigation
function nextQuestion() {
    gameState.currentQuestionIndex++;
    gameState.currentPhase = 'percentage';
    
    // Switch roles using destructuring
    [gameState.currentSetterIndex, gameState.currentGuesserIndex] = 
        [gameState.currentGuesserIndex, gameState.currentSetterIndex];

    resetRoundState();
    setupNewRound();
}

function resetRoundState() {
    updateMeter(50);
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = '';
    resultDiv.className = 'result';
    nextQuestionButton.classList.remove('visible');
}

// UI Helpers
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

// Meter Logic
function updateMeter(value) {
    const meter = document.querySelector('.meter-background');
    const percentageDisplay = document.getElementById('percentage');
    const thumb = document.querySelector('.meter-thumb');

    meter.style.setProperty('--percentage', `${value}%`);
    percentageDisplay.textContent = value;
    thumb.style.transform = `translateX(-50%) rotate(${value * 3.6}deg)`;
}

// Input Handling
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
    const centerX = rect.left + rect.width/2;
    const centerY = rect.top + rect.height/2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let deg = ((angle * (180/Math.PI) + 450) % 360 + 360) % 360;
    let value = Math.min(100, Math.max(0, Math.round(deg * 100 / 360)));
    
    slider.value = value;
    updateMeter(value);
}

// End Game
function endGame() {
    const [team1, team2] = gameState.teams;
    const winner = team1.score > team2.score ? team1.name : team2.name;
    alert(`انتهت اللعبة! الفائز: ${winner}\nالنتائج النهائية:\n${team1.name}: ${team1.score}\n${team2.name}: ${team2.score}`);
    showScreen('mainMenu');
}

// Initialize
updateMeter(50);

// Backup Questions
const backupQuestions = [ /* Your question data from questions.json */ ];