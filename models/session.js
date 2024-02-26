const mongoose = require("mongoose");
const PlayerResult = require("./playerResult");
const LeaderBoard = require("./leaderBoard");

const sessionSchema = new mongoose.Schema({
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
    },
    sessionId: {
        type: String,
    },
    pin: {
        type: String,
    },
    isLive: {
        type: Boolean,
        default: false,
    },
    playerList: {
        type: [String],
        default: [],
    },
    questionIdList: {
        type: [Number], 
        default: [], 
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    nbOfParticipants: {
        type: Number,
        default: 0,
    },
    playerResultList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PlayerResult",
        },
    ],
});

// sessionSchema.pre('save', async function(next) {
//     if (this.isNew) {
//         try {
//             const playerResults = await PlayerResult.insertMany(
//                 this.playerList.map(playerId => ({
//                     playerId,
//                     gameId: this._id,
//                 }))
//             );
//             const leaderBoard = new LeaderBoard({
//                 gameId: this._id,
//                 playerResultList: playerResults.map(result => result._id),
//                 questionLeaderboard: [],
//                 currentLeaderboard: [],
//             });
//             await leaderBoard.save();
//             this.playerResultList = playerResults.map(result => result._id);
//         } catch (error) {
//             return next(error);
//         }
//     }
//     next();
// });


module.exports = mongoose.model("Session", sessionSchema);