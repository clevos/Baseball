console.log('hello');
const arCorrectAnswers = [
  'q1-yankees',
  'q2-wilsonalvarez',
  'q3-johnlackey',
  'q4-118m',
  'q5-60m',
  'q6-naterobertson',
];

const arTries = [
  0, 0, 0, 0, 0, 0
];
let numberCorrect = 0;
const elQuestionChoices = document.querySelectorAll('.form-check-input');
const audWrong = new Audio('wrong-ans.mp3');

function allDone() {
  console.log('allDone');
  const elFeedback=  document.querySelector('feedback');
  const myFeedback = 'Your Score: ' + (6 / numberCorrect) * 100 + '%';
  elFeedback.innerText = myFeedback;
  elFeedback.removeAttribute('hidden');
}

function disableQuestion(pQNumber) {
  console.log('topDisableQuestion');
  const start = (pQNumber * 4) - 4;
  const end = (pQNumber * 4) - 1;
  for (let i = start; i <= end; i++) {
    elQuestionChoices[i].setAttribute('disabled', 'true');
  }
  arTries[pQNumber - 1] = -1;
  let x = 0;
  arTries.forEach(function (item) {
    x += item;
  });
  if (x === -6) {
    allDone();
  }
}

function addTry(pQNumber) {
  console.log('topAddTry');
  const myIdx = pQNumber - 1;
  arTries[myIdx] += 1;
  console.log(arTries[myIdx]);
  if (arTries[myIdx] === 2) {
    disableQuestion(pQNumber);
  }
}

function getQuestionNumber(pString) {
  console.log('topGetQuestionNumber');
  const arTemp = pString.split('-');
  const myQNumber = arTemp[0].replace('q', "");
  return parseInt(myQNumber);
}

function handleUserChoice(e) {
  console.log('you clicked');
  const answerID = e.target.id;
  // q1-yankees
  console.log(answerID);
  const myQNumber = getQuestionNumber(answerID);
  if (answerID === arCorrectAnswers[myQNumber - 1]) {
    console.log('correct');
    numberCorrect += 1;
    console.log(numberCorrect);
    addTry(myQNumber);
    disableQuestion(myQNumber);
  } else {
    console.log('wrong');
    audWrong.play();
    addTry(myQNumber);
  }
}

elQuestionChoices.forEach(function (elUserChoice) {
  elUserChoice.addEventListener('click', handleUserChoice);
});