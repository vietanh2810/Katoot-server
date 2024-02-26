const mongoose = require("mongoose")
const Session = require("../models/session.js")
const PlayerResult = require("../models/playerResult")
const Quiz = require("../models/quiz.model.js")
const LeaderBoard = require("../models/leaderBoard.js")

const createSession = async (quizId, userId, nbOfParticipants, socket) => {
    console.log("Creating session")
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        return { success: false, message: "Quiz not found" }
    }
    console.log("Quiz found" + quiz._id)

    const session = new Session({
        hostId: userId,
        quizId,
        nbOfParticipants: nbOfParticipants,
        // sessionId: Math.random().toString(36).substring(2, 7),
        // pin: Math.floor(1000 + Math.random() * 9000).toString(),
        sessionId: "1234",
        pin: "1234",
        date: new Date().toISOString(),
        isLive: false,
        playerList: [],
        playerResultList: [],
    });

    const leaderBoard = new LeaderBoard({
        gameId: session.sessionId,
        playerResultList: [],
        questionLeaderboard: [],
        currentLeaderboard: [],
    });
    await leaderBoard.save();

    try {
        const newSession = await session.save();
        return { success: true, message: "Session created", session: newSession }
    } catch (error) {
        return { success: false, message: error.message }
    }
}

const addPlayer = async (sessionId, pin, userId, socket) => {
    try {
        const session = await Session.findOne({ sessionId })
        if (session.isLive) {
            return { sucess: false, message: "The session is live" }
        }
        if (session.pin !== pin) {
            return { sucess: false, message: "Invalid pin" }
        }
        if (session.playerList.includes(userId)) {
            return { sucess: false, message: "The user is already in the session" }
        }
        if (session.nbOfParticipants === session.playerList.length) {
            return { sucess: false, message: "The session is full" }
        }
        session.playerList.push(userId)
        await session.save()
        const playerResult = new PlayerResult({
            playerId: userId,
            gameId: session.sessionId,
            score: 0,
            answers: [],
        });
        await playerResult.save();
        const leaderBoard = await LeaderBoard.findOne({ gameId: session.sessionId });
        leaderBoard.playerResultList.push(playerResult._id);
        await leaderBoard.save();

        return { sucess: true, message: "Player added to session" }
    }
    catch (error) {
        return { sucess: false, message: error.message }
    }
}

const startSession = async (sessionId, userId, socket) => {
    try {
        const session = await Session.findOne({ sessionId });
        if (session.isLive) {
            return { success: false, message: "The session is already live" }
        }
        // if (session.hostId !== userId) {
        //     return { success: false, message: "You are not the host" }
        // }
        session.isLive = true;
        const quiz = await Quiz.findById(session.quizId);
        if (!quiz) {
            return { success: false, message: "Quiz not found" }
        }
        const isQuizRandom = quiz.quizConfig.randomOrder === true;
        if (isQuizRandom) {
            const questionIdList = quiz.questionList.map((question, index) => index);
            session.questionIdList = shuffle(questionIdList);
        }
        else {
            session.questionIdList = quiz.questionList.map((question, index) => index);
        }
        await session.save();
        let firstQuestion = quiz.questionList[session.questionIdList[0]];
        firstQuestion.answerList = firstQuestion.answerList.map(answer => answer.isCorrect = null);

        return { success: true, message: "Session started", isLive: true, question: firstQuestion }
    }
    catch (error) {
        return { success: false, message: error.message, isLive: false, question: null }
    }
}

const calculatePoints = (correctAnswers, playerAnswers, answerTime, questionTime) => {
    playerAnswers = playerAnswers.split(",").map(answer => answer.trim());

    if (correctAnswers.length !== playerAnswers.length) {
        return 0;
    }
    const allCorrectAnswersMatch = correctAnswers.every(answer => playerAnswers.includes(answer));

    const allPlayerAnswersMatch = playerAnswers.every(answer => correctAnswers.includes(answer));

    if (!allCorrectAnswersMatch || !allPlayerAnswersMatch) {
        return 0;
    } else {
        return 100 * (1 - answerTime / questionTime);
    }
}

const nextQuestion = async (sessionId) => {
    try {
        const session = await Session.findOne({ sessionId });
        if (!session.isLive) {
            return { success: false, message: "The session is not live" }
        }
        const quiz = await Quiz.findById(session.quizId);
        if (!quiz) {
            return { success: false, message: "Quiz not found" }
        }
        const currentQuestionIndex = session.questionIdList[0];
        // pop the first question index from the list
        session.questionIdList.shift();
        await session.save();

        console.log("Current question index: " + currentQuestionIndex);
        const nextQuestionIndex = session.questionIdList[0];
        console.log("Next question index: " + nextQuestionIndex);
        if (nextQuestionIndex === undefined) {
            return { success: true, message: "No more questions", currentQuestion: null, nextQuestion: null }
        }
        const currentQuestion = quiz.questionList[currentQuestionIndex];
        const nextQuestion = quiz.questionList[nextQuestionIndex];
        return { success: true, message: "Next question found", nextQuestionIndex, currentQuestion, nextQuestion }
    } catch (error) {
        return { success: false, message: error.message }
    }
}

const submitResponse = async (sessionId, userId, response, time, questionIndex, socket) => {
    try {
        const session = await Session.findOne({ sessionId });
        if (!session || !session.isLive) {
            return { success: false, message: "The session is not live or does not exist" };
        }
        const quiz = await Quiz.findById(session.quizId);
        if (!quiz) {
            return { success: false, message: "Quiz not found" };
        }
        const currentQuestion = quiz.questionList[questionIndex];
        if (!currentQuestion) {
            return { success: false, message: "Question not found in the quiz" };
        }
        const correctAnswers = currentQuestion.answerList.filter(answer => answer.isCorrect === true).map(answer => answer.name);
        const playerResult = await PlayerResult.findOne({ playerId: userId, gameId: sessionId });
        if (!playerResult) {
            return { success: false, message: "Player result not found" };
        }
        const questionTime = currentQuestion.answerTime;
        const points = calculatePoints(correctAnswers, response, time, questionTime);
        console.log("Points: " + points);
        console.log('Player result before: ', playerResult);
        // Check if answers array exists in playerResult, if not initialize it
        if (!playerResult.answers) {
            console.log("Answers array not found, initializing it");
            playerResult.answers = [];
        }

        // Push the new answer to the answers array
        playerResult.answers.push({
            questionIndex: questionIndex,
            answered: true,
            answers: answers,  // Make sure answers variable is defined
            time: time,
            points: points,
        });
        playerResult.score += points;
        console.log('Player result after: ', playerResult);
        await playerResult.save();
        console.log("Player result saved: ", playerResult);
        const leaderBoard = await LeaderBoard.findOne({ gameId: session._id });
        console.log("Leaderboard: ", leaderBoard);

        return { success: true, message: "Response submitted", playerResult, leaderBoard };
    } catch (error) {
        return { success: false, message: error };
    }
};


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = { createSession, addPlayer, startSession, submitResponse, nextQuestion }