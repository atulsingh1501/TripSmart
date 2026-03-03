const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'system', enum: ['light', 'dark', 'system'] }
  },
  savedTrips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }],
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now, expires: '7d' }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (exclude sensitive fields)
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    phone: this.phone,
    avatar: this.avatar,
    preferences: this.preferences,
    createdAt: this.createdAt
  };
};

// Add refresh token
userSchema.methods.addRefreshToken = function(token) {
  this.refreshTokens.push({ token });
  return this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  return this.save();
};

// Clear all refresh tokens (logout from all devices)
userSchema.methods.clearAllRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
