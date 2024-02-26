const mongoose = require("mongoose")

const quizSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    creatorName: { type: String },
    numberOfQuestions: {
        type: Number,
        default: 0,
    },
    dateCreated: { type: Date, default: new Date() },
    quizConfig: {
        timerOn: { type: Boolean },
        randomOrder: { type: Boolean },
    },
    numberOfParticipants: { type: Number },
    questionList: [
        {
            questionType: {
                type: String,
                enum: ["True/False", "Multiple Choice"],
                required: true,
            },
            answerTime: {
                type: Number,
                min: 5,
                max: 90,
            },
            question: {
                type: String,
                required: true,
            },
            answerList: [
                {
                    name: { type: String },
                    body: { type: String },
                    isCorrect: { type: Boolean },
                },
            ],
        },
    ],
})

module.exports = mongoose.model("Quiz", quizSchema)