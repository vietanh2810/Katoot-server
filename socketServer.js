const socketIO = require('socket.io');
const sessionController = require('./controllers/session.controller');


// Function to handle WebSocket logic
function initializeSocketServer(io) {
    // Define socket.io event handlers
    io.on('connection', (socket) => {
        console.log('A client connected');
        socket.emit('connected', 'You are connected to the server');

        socket.on('sessionCreate', async (quizId, userId, nbOfParticipants) => {
            let result = await sessionController.createSession(quizId, userId, nbOfParticipants, socket); 
            if (result.success) {
                socket.emit('success', result.session);
                socket.join(result.session.sessionId);
            } else {
                socket.emit('fail', result.message);
            }
        });

        socket.on('sessionJoin', async (sessionId, pin, userId) => {
            socket.sessionId = sessionId;
            let result = await sessionController.addPlayer(sessionId, pin, userId, socket);
            if (result.sucess) {
                socket.emit('success', result.message);
                socket.join(sessionId);
                io.to(sessionId).emit('Welcome', userId);
            } else {
                socket.emit('fail', result.message);
            }
        });

        const sessionTimers = {}; 

        socket.on('sessionStart', async (sessionId, userId) => {
            let result = await sessionController.startSession(sessionId, userId, socket);
            if (result.success) {
                socket.join(sessionId);
                socket.to(sessionId).emit('success', result.message, result.isLive, result.question);
                
                // Start timer for the first question
                startQuestionTimer(sessionId, sessionTimers, io, result.question);
            } else {
                socket.emit('fail', result.message, result.isLive, result.question);
            }
        });
        
        socket.on('submitAnswer', (sessionId, userId, response, time, questionIndex, socket) => {
            let result = sessionController.submitResponse(sessionId, userId, response, time, questionIndex, socket);

            if (result.success) {
                io.to(sessionId).emit('success', result.message, result.playerResult, result.leaderBoard);
            } else {
                io.to(sessionId).emit('fail', result.message);
            }
        });

        socket.on('disconnect', () => {
            console.log('A client disconnected');
        });
    });
}
function startQuestionTimer(sessionId, sessionTimers, io, question) {
    const { answerTime } = question;

    // Set up a timer for halftime event
    sessionTimers[`half_${sessionId}`] = setTimeout(() => {
        io.to(sessionId).emit('halfTimePassed');
    }, answerTime * 500);

    // Set up a timer for the current question's duration
    sessionTimers[sessionId] = setTimeout(async () => {
        // Fetch the next question
        let nextQuestionResult = await sessionController.nextQuestion(sessionId);

        if (nextQuestionResult.success) {
            // Clear existing timers
            clearTimeout(sessionTimers[`half_${sessionId}`]);
            clearTimeout(sessionTimers[sessionId]);

            // Emit the next question
            io.to(sessionId).emit('question',nextQuestionResult.nextQuestionIndex, nextQuestionResult.nextQuestion );

            if (nextQuestionResult.nextQuestion === null) {
                // Emit the correct answer for the previous question
                io.to(sessionId).emit('sessionEnd', nextQuestionResult.message);
                return;
            }

            // Start timer for the next question
            startQuestionTimer(sessionId, sessionTimers, io, nextQuestionResult.nextQuestion);
        }
    }, answerTime * 1000);
}

module.exports = initializeSocketServer;
