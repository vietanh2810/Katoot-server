const express = require("express");
const cors = require("cors");
const dbConfig = require("./config/db.config");
const { Server } = require('socket.io');
const initializeSocketServer = require("./socketServer"); 
const http = require("http");
const bcrypt = require("bcryptjs");

const app = express();

var corsOptions = {
    origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./models");
const { Session } = require("inspector");
const Role = db.role;
const Quiz = db.quiz;
const User = db.user;
const SessionModel = db.session;

// routes
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);

db.mongoose
    .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(async() => {
        console.log("Successfully connect to MongoDB.");
        await purgeData();
        await initial();
        await createUsersWithRoles();
        await createDefaultQuiz();
    })
    .catch(err => {
        console.error("Connection error", err);
        process.exit();
    });

// Create HTTP server and attach Socket.IO to it
const server = http.createServer(app);
const io = new Server(server);
initializeSocketServer(io); // Initialize your WebSocket event handlers

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

async function purgeData() {
    try {
        // Delete all documents from collections
        await User.deleteMany({});
        await Role.deleteMany({});
        await Quiz.deleteMany({});
        await SessionModel.deleteMany({});
        await db.playerResult.deleteMany({});
        await db.leaderBoard.deleteMany({});
        
        console.log("Data purged successfully.");
    } catch (error) {
        console.error("Error purging data:", error);
        throw error;
    }
}

async function initial() {
    try {
        const count = await Role.estimatedDocumentCount();
        if (count === 0) {
            await Promise.all([
                new Role({ name: "user" }).save(),
                new Role({ name: "moderator" }).save(),
                new Role({ name: "admin" }).save()
            ]);
            console.log("Roles added to collection.");
        } else {
            console.log("Roles collection already contains documents.");
        }
    } catch (err) {
        console.error("Error initializing roles:", err);
    }
}

async function createUsersWithRoles() {
    try {
        //get all roles
        const roles = await Role.find();
        const hashedPassword = await bcrypt.hash("password", 10);
        for (const role of roles) {
            const newUser = new User({
                username: `${role}_user`,
                email: `${role}@example.com`,
                password: hashedPassword, // You might want to hash passwords in a real application
                roles: [role._id],
            });

            await newUser.save();
            console.log(`User id: ${newUser._id}`);
        }
    } catch (error) {
        console.error("Error creating users:", error);
        throw error;
    }
}

// Call the function to create users with roles


async function getRandomUser() {
    try {
        const count = await User.countDocuments();
        const randomIndex = Math.floor(Math.random() * count);
        const randomUser = await User.findOne().skip(randomIndex);
        return randomUser;
    } catch (error) {
        console.error("Error retrieving random user:", error);
        throw error;
    }
}

// Function to create a default quiz
async function createDefaultQuiz() {
    try {
        // Retrieve a random user
        const randomUser = await getRandomUser();

        // Define default quiz data
        const defaultQuizData = {
            name: "Default Web Development Quiz",
            description: "Test your knowledge of web development!",
            creatorId: randomUser._id,
            creatorName: randomUser.username,
            numberOfQuestions: 0,
            quizConfig: {
                timerOn: true,
                randomOrder: false,
            },
            numberOfParticipants: 0,
            questionList: [
                {
                    questionType: "True/False",
                    answerTime: 20,
                    question: "JavaScript is a programming language.",
                    answerList: [
                        { name: "True", body: "True", isCorrect: true },
                        { name: "False", body: "False", isCorrect: false },
                    ],
                },
                {
                    questionType: "Multiple Choice",
                    answerTime: 20,
                    question: "Which of the following is not a valid CSS selector?",
                    answerList: [
                        { name: "A", body: "#myElement", isCorrect: false },
                        { name: "B", body: ".myClass", isCorrect: false },
                        { name: "C", body: "<p>", isCorrect: true },
                        { name: "D", body: "[type='text']", isCorrect: false },
                    ],
                },
                {
                    questionType: "Multiple Choice",
                    answerTime: 20,
                    question: "What does HTML stand for?",
                    answerList: [
                        { name: "A", body: "Hyper Text Markup Language", isCorrect: true },
                        { name: "B", body: "Hyperlinks and Text Markup Language", isCorrect: false },
                        { name: "C", body: "Home Tool Markup Language", isCorrect: false },
                        { name: "D", body: "Hyper Tool Markup Language", isCorrect: false },
                    ],
                },
                {
                    questionType: "True/False",
                    answerTime: 20,
                    question: "CSS stands for Cascading Style Sheets.",
                    answerList: [
                        { name: "True", body: "True", isCorrect: true },
                        { name: "False", body: "False", isCorrect: false },
                    ],
                },
                {
                    questionType: "Multiple Choice",
                    answerTime: 20,
                    question: "What is the correct way to refer to an external script called 'script.js'?",
                    answerList: [
                        { name: "A", body: "<script src='script.js'>", isCorrect: true },
                        { name: "B", body: "<script href='script.js'>", isCorrect: false },
                        { name: "C", body: "<script ref='script.js'>", isCorrect: false },
                        { name: "D", body: "<script name='script.js'>", isCorrect: false },
                    ],
                },
                {
                    questionType: "True/False",
                    answerTime: 20,
                    question: "HTML documents are saved with a .html file extension.",
                    answerList: [
                        { name: "True", body: "True", isCorrect: true },
                        { name: "False", body: "False", isCorrect: false },
                    ],
                },
                // Add more questions as needed
            ],
        };

        // Create the quiz in the database
        const createdQuiz = await Quiz.create(defaultQuizData);
        console.log("Quiz Id:", createdQuiz._id);
    } catch (error) {
        console.error("Error creating default quiz:", error);
        throw error;
    }
}

