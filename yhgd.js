const LINK_DATA = 'https://vmutest.github.io/yhgd/yhgd.txt';
const TIME_DELAY = 2000;

const RIGHT_ANSWER = 'right';
const WRONG_ANSWER = 'wrong';
const NONE_ANSWER = 'none';

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const getQuestionFromData = async () => {
    // load text from data link
    const text = await fetch(LINK_DATA).then((response) => response.text());
    const listQuestion = text
        .split(/\n\s*\n/) // split the text by empty lines
        .map((group) =>
            group.split('\n').map((line) => line.replace(/\r/g, ''))
        ) // split the text by new lines
        .map((group, index) => ({
            question: group[0].startsWith('*')
                ? group[0].replace('*', '').trim() // remove * from question, * for question don't need to shuffle
                : group[0], // get question
            listAnswered: group[0].startsWith('*')
                ? group.slice(1) // get list answer
                : shuffleArray(group.slice(1)), // get list answer and shuffle
            answered: null, // answered by the user
            result: NONE_ANSWER, // result of the question
            index,
        })); // create an object for each question

    return listQuestion;
};

window.addEventListener('load', async function () {
    // list questions
    let listQuestion = await getQuestionFromData();

    // Get some elements from the DOM
    const questionEl = document.getElementById('question');
    const answerContainerEl = document.getElementById('answer-container');
    const btnPrevEl = document.getElementById('btn-prev');
    const btnNextEl = document.getElementById('btn-next');
    const gridQuestionContainerEl = document.getElementById(
        'grid-question-container'
    );

    const btnResetWrongEl = document.getElementById('btn-reset-wrong');

    function resetWrong() {
        listQuestion = listQuestion.filter((question) => {
            if (question.result !== RIGHT_ANSWER) {
                question.result = NONE_ANSWER;
                question.answered = null;
                return true;
            } else {
                const gridQuestionEl = document.getElementById(
                    `grid-question-item-${question.index}`
                );
                gridQuestionContainerEl.removeChild(gridQuestionEl);
                return false;
            }
        });

        if (listQuestion.length > 0) {
            showQuestion(0);
        } else {
            window.location.reload();
        }
    }

    btnResetWrongEl.addEventListener('click', () => {
        resetWrong();
        updateGridQuestion();
    });

    // Create a grid of questions
    listQuestion.forEach(({ index: qsIndex }, index) => {
        const gridQuestionEl = document.createElement('div');
        gridQuestionEl.classList.add('grid-question-item');
        gridQuestionEl.id = `grid-question-item-${qsIndex}`;
        gridQuestionEl.innerText = qsIndex + 1;
        gridQuestionEl.addEventListener('click', () => {
            showQuestion(index);
            tabNavEls[0].click(); // show the first tab
        });
        gridQuestionContainerEl.appendChild(gridQuestionEl);
    });

    const numAnsweredEl = document.getElementById('num-answered');
    const numRightEl = document.getElementById('num-right');
    const scoreEl = document.getElementById('score');

    function updateGridQuestion() {
        listQuestion.forEach((question, index) => {
            const gridQuestionEl = document.getElementById(
                `grid-question-item-${question.index}`
            );
            gridQuestionEl.classList.remove('active');
            gridQuestionEl.classList.remove('right');
            gridQuestionEl.classList.remove('wrong');
            gridQuestionEl.classList.add(question.result);
            if (index === currentQuestionIndex) {
                gridQuestionEl.classList.add('active');
            }

            // remove all event listener
            const newGridQuestionEl = gridQuestionEl.cloneNode(true);
            gridQuestionEl.parentNode.replaceChild(
                newGridQuestionEl,
                gridQuestionEl
            );
            newGridQuestionEl.addEventListener('click', () => {
                showQuestion(index);
                tabNavEls[0].click(); // show the first tab
            });
        });

        // update progress info
        const numAnswered = listQuestion.filter(
            (question) => question.result !== NONE_ANSWER
        ).length;
        const numRight = listQuestion.filter(
            (question) => question.result === RIGHT_ANSWER
        ).length;
        const score =
            Math.round(
                ((numRight / listQuestion.length) * 10 + Number.EPSILON) * 10
            ) / 10;
        numAnsweredEl.innerText = numAnswered;
        numRightEl.innerText = numRight;
        scoreEl.innerText = score;
    }

    function showQuestion(qsNum) {
        clearTimeout(nextTimeOut);
        currentQuestionIndex = qsNum; // update current question index

        const data = listQuestion[qsNum];
        questionEl.innerText = data.question; // show question

        answerContainerEl.innerHTML = ''; // clear all answers

        // if answered, add class 'answered' to the answer container
        if (data.answered !== null) {
            answerContainerEl.classList.add('answered');
        } else {
            // if not answered, remove class 'answered' to the answer container
            answerContainerEl.classList.remove('answered');
        }

        for (let i = 0; i < data.listAnswered.length; i++) {
            // create answer element
            const answerEl = document.createElement('li');
            answerEl.classList.add('answer');

            // get answer
            let answer = data.listAnswered[i];

            // if answer is correct, add class vmu and replace '*' symbol
            if (answer.startsWith('*')) {
                answerEl.classList.add('vmu');
                answer = answer.replace('*', '').trim();
            }

            // if answer is selected, add class selected
            if (data.answered === i) {
                answerEl.classList.add('selected');
            }

            // add answer to answer container
            answerEl.innerText = answer;
            answerContainerEl.appendChild(answerEl);

            // add event listener to answer element if not answered
            if (data.answered === null) {
                answerEl.addEventListener('click', function () {
                    // save the answer
                    data.answered = i;

                    // add class answered to answer container
                    answerContainerEl.classList.add('answered');

                    // check if the answer is correct
                    if (answerEl.classList.contains('vmu')) {
                        data.result = RIGHT_ANSWER;
                    } else {
                        data.result = WRONG_ANSWER;
                    }

                    // toggle the selected class
                    answerEl.classList.toggle('selected');

                    updateGridQuestion();

                    // show the next question after 3 seconds or show the result if it's the last question
                    nextTimeOut = setTimeout(nextQuestion, TIME_DELAY);
                });
            }
        }

        updateGridQuestion();

        btnPrevEl.disabled = qsNum === 0; // disable prev button if it's the first question

        btnNextEl.disabled = qsNum === listQuestion.length - 1; // disable next button if it's the last question
    }

    // current question number
    let currentQuestionIndex = 0;

    // timeout for next question after 3 seconds since the user answered
    let nextTimeOut = null;

    // next question function
    function nextQuestion() {
        showQuestion(currentQuestionIndex + 1);
    }

    // prev question function
    function prevQuestion() {
        showQuestion(currentQuestionIndex - 1);
    }

    btnNextEl.addEventListener('click', nextQuestion); // add event listener to next button
    btnPrevEl.addEventListener('click', prevQuestion); // add event listener to prev button

    showQuestion(currentQuestionIndex); // show the first question

    const tabNavEls = document.getElementsByClassName('tab-link');
    const tabContentEls = document.getElementsByClassName('tab-content');

    for (let i = 0; i < tabNavEls.length; i++) {
        tabNavEls[i].addEventListener('click', function () {
            for (let j = 0; j < tabNavEls.length; j++) {
                tabNavEls[j].classList.remove('active');
                tabContentEls[j].classList.remove('active');
            }
            tabNavEls[i].classList.add('active');
            tabContentEls[i].classList.add('active');
        });
    }
});

// disable text selection
document.addEventListener('selectstart', (e) => e.preventDefault());

// disable right click
document.addEventListener('contextmenu', (e) => e.preventDefault());

// disable copy
document.addEventListener('copy', (e) => e.preventDefault());
