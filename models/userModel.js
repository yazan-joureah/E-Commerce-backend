// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userModel = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    slug: {
      type: String,
      required : [true,"Slug is required"],
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
      required: function() {
        return this.oauthProvider === 'local';
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    }
    ,
    passwordChangedAt: {
      type: Date,
    },
    
    // OAuth2 Fields
    oauthProvider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'github'],
      default: 'local',
    },
    oauthId: {
      type: String,
      sparse: true,
      unique: true
    },
    oauthAccessToken: {
      type: String,
      select: false,
    },
    oauthRefreshToken: {
      type: String,
      select: false,
    },
    profileImage: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    lockUntil: {
      type: Date,
      select: false
    },
    passwordResetToken:{
      type:String,
      select :false
    },
    passwordResetExpires:{
      type: Date,
      select :false
    },
    passwordResetVerifies:{
      type: Boolean,
      select:false
    }
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to hash password
userModel.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  // Only hash if password exists and is not from OAuth
  if (this.password && this.oauthProvider === 'local') {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Pre-find middleware to exclude inactive users
userModel.pre(/^find/, function(next) {
  if (this.getOptions().showInactive !== true) {
    this.find({ active: { $ne: false } });
  }
  next();
});

// Method to check password (for local accounts)
userModel.methods.comparePassword = async function(candidatePassword) {
  if (this.oauthProvider !== 'local') {
    throw new Error('This account uses OAuth login');
  }
  
  if (!this.password) {
    throw new Error('Password not set');
  }
  
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userModel.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userModel.methods.incLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
  }
  
  return await this.updateOne(updates);
};

module.exports = mongoose.model('User', userModel);