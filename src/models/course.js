const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
duration: { 
  type: Number, 
  required: true, 
  min: 1 
},
  tags: [String],
  price: { type: Number, default: 0 }, 
  level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },

  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },

  thumbnail: { type: String, required: true }, 

  lectures: [{
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnail: { type: String, required: true },   
    views: { type: Number, default: 0 },

    transcript: String,        
    aiSummary: String,     

    resources: [{
      title: String,
      fileUrl: String,
      fileType: { type: String, enum: ["pdf", "doc", "ppt", "zip", "link"] }
    }],

    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }]
  }],

  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  totalEnrollments: { type: Number, default: 0 },

  rating: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],

  aiGeneratedSummary: String,
  aiGeneratedQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }], 

  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
