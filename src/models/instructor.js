import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  bio: { type: String },
  expertise: { type: [String] }, 
  rating: { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },
  totalCourses: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  profileCompleted: { type: Boolean, default: false }
}, { timestamps: true });

const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);

export default Teacher;
