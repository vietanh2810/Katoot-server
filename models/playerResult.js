const mongoose = require("mongoose");
const Leaderboard = require("./leaderBoard");

const playerResultSchema = new mongoose.Schema({
    playerId: {
        type: String
    },
    gameId: {
        type: String
    },
    score: {
        type: Number,
        default: 0,
    },
    answers: [
        {
            questionIndex: { type: Number },
            answered: {
                type: Boolean,
                default: false,
            },
            answers: {
                type: String,  
            },
            time: { type: Number },
            points: {
                type: Number,
                default: 0,
            },
        },
    ],
});

// playerResultSchema.post('save', async function (doc, next) {
//     const playerResult = doc;
//     if (playerResult.score === 0) {
//         next();
//     } else {
//         try {
//             let leaderboard = await Leaderboard.findOne({ gameId: playerResult.gameId });

//             const playerScoreIndex = leaderboard.currentLeaderboard.leaderboardList.findIndex(entry => entry.playerId.equals(playerResult.playerId));
//             if (playerScoreIndex > -1) {
//                 leaderboard.currentLeaderboard.leaderboardList[playerScoreIndex].playerCurrentScore = playerResult.score;
//             } else {
//                 leaderboard.currentLeaderboard.leaderboardList.push({
//                     playerId: playerResult.playerId,
//                     playerCurrentScore: playerResult.score,
//                 });
//             }
//             const questionLeaderboardIndex = leaderboard.questionLeaderboard.findIndex(entry => entry.questionIndex === playerResult.answers[playerResult.answers.length - 1].questionIndex);
//             if (questionLeaderboardIndex > -1) {
//                 const playerQuestionScoreIndex = leaderboard.questionLeaderboard[questionLeaderboardIndex].questionResultList.findIndex(entry => entry.playerId.equals(playerResult.playerId));
//                 if (playerQuestionScoreIndex > -1) {
//                     leaderboard.questionLeaderboard[questionLeaderboardIndex].questionResultList[playerQuestionScoreIndex].playerPoints = playerResult.score;
//                 } else {
//                     leaderboard.questionLeaderboard[questionLeaderboardIndex].questionResultList.push({
//                         playerId: playerResult.playerId,
//                         playerPoints: playerResult.score,
//                         nbOfAnswers: leaderboard.questionLeaderboard[questionLeaderboardIndex].nbOfAnswers + 1,
//                     });
//                 }
//             } else {
//                 leaderboard.questionLeaderboard.push({
//                     questionIndex: playerResult.answers[playerResult.answers.length - 1].questionIndex,
//                     questionResultList: [
//                         {
//                             playerId: playerResult.playerId,
//                             playerPoints: playerResult.score,
//                         },
//                     ],
//                     nbOfAnswers: 1,
//                 });
//             }

//             await leaderboard.save();

//             next();
//         } catch (error) {
//             console.error('Error updating leaderboard:', error);
//             next(error);
//         }
//     }
// });


module.exports = mongoose.model("PlayerResult", playerResultSchema);