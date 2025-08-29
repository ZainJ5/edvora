const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,

  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  lecture: { type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }, 

  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }, 
    explanation: String
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher"},
  aiGenerated: { type: Boolean, default: false },

  attempts: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    score: Number,
    submittedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);
