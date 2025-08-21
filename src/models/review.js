import mongoose from "mongoose"


const ReviewSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String
}, { timestamps: true });


export default mongoose.models.review || mongoose.model("review", ReviewSchema);
