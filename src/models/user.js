import mongoose from 'mongoose';
import bcrypt from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    enum: ['user', 'instructor', 'admin'],
    default: 'user'
  },
  courseProgress: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
      },
      completedLectures: [String],
      completedQuizzes: [String],  
      progress: {
        type: Number,
        default: 0
      },
      lastAccessed: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });  

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;