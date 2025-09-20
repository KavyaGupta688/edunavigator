const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team ID is required']
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  message_type: {
    type: String,
    enum: {
      values: ['text', 'file', 'link', 'system'],
      message: 'Message type must be text, file, link, or system'
    },
    default: 'text'
  },
  attachments: [{
    filename: String,
    original_name: String,
    file_size: Number,
    file_type: String,
    url: String
  }],
  reply_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  is_edited: {
    type: Boolean,
    default: false
  },
  edited_at: {
    type: Date,
    default: null
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: {
    type: Date,
    default: null
  },
  reactions: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  read_by: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    read_at: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
messageSchema.index({ team_id: 1, created_at: -1 });
messageSchema.index({ user_id: 1 });
messageSchema.index({ message_type: 1 });
messageSchema.index({ reply_to: 1 });
messageSchema.index({ is_deleted: 1 });
messageSchema.index({ priority: 1 });

// Virtual for message age in minutes
messageSchema.virtual('age_minutes').get(function() {
  const now = new Date();
  const diffTime = now - this.created_at;
  return Math.floor(diffTime / (1000 * 60));
});

// Virtual for read status
messageSchema.virtual('is_read').get(function() {
  return this.read_by.length > 0;
});

// Virtual for reaction count
messageSchema.virtual('reaction_count').get(function() {
  return this.reactions.length;
});

// Virtual for unique reactions
messageSchema.virtual('unique_reactions').get(function() {
  const uniqueEmojis = [...new Set(this.reactions.map(r => r.emoji))];
  return uniqueEmojis.map(emoji => ({
    emoji,
    count: this.reactions.filter(r => r.emoji === emoji).length
  }));
});

// Static method to get team messages
messageSchema.statics.getTeamMessages = function(teamId, limit = 50, skip = 0) {
  return this.find({
    team_id: teamId,
    is_deleted: false
  })
    .populate('user_id', 'name email profile_picture')
    .populate('reply_to', 'message user_id')
    .sort({ created_at: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get recent messages
messageSchema.statics.getRecentMessages = function(teamId, hours = 24) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);
  
  return this.find({
    team_id: teamId,
    created_at: { $gte: cutoffDate },
    is_deleted: false
  })
    .populate('user_id', 'name email')
    .sort({ created_at: -1 });
};

// Static method to mark message as read
messageSchema.statics.markAsRead = function(messageId, userId) {
  return this.findByIdAndUpdate(
    messageId,
    {
      $addToSet: {
        read_by: {
          user_id: userId,
          read_at: new Date()
        }
      }
    },
    { new: true }
  );
};

// Static method to add reaction
messageSchema.statics.addReaction = function(messageId, userId, emoji) {
  return this.findByIdAndUpdate(
    messageId,
    {
      $pull: { reactions: { user_id: userId } }, // Remove existing reaction from user
      $push: { reactions: { user_id: userId, emoji, created_at: new Date() } }
    },
    { new: true }
  );
};

// Static method to remove reaction
messageSchema.statics.removeReaction = function(messageId, userId) {
  return this.findByIdAndUpdate(
    messageId,
    { $pull: { reactions: { user_id: userId } } },
    { new: true }
  );
};

// Static method to edit message
messageSchema.statics.editMessage = function(messageId, userId, newMessage) {
  return this.findOneAndUpdate(
    {
      _id: messageId,
      user_id: userId,
      is_deleted: false
    },
    {
      message: newMessage,
      is_edited: true,
      edited_at: new Date()
    },
    { new: true }
  );
};

// Static method to delete message
messageSchema.statics.deleteMessage = function(messageId, userId) {
  return this.findOneAndUpdate(
    {
      _id: messageId,
      user_id: userId
    },
    {
      is_deleted: true,
      deleted_at: new Date()
    },
    { new: true }
  );
};

// Static method to get unread message count for user
messageSchema.statics.getUnreadCount = function(teamId, userId) {
  return this.countDocuments({
    team_id: teamId,
    user_id: { $ne: userId },
    is_deleted: false,
    'read_by.user_id': { $ne: userId }
  });
};

// Static method to search messages
messageSchema.statics.searchMessages = function(teamId, searchTerm, limit = 20) {
  return this.find({
    team_id: teamId,
    message: { $regex: searchTerm, $options: 'i' },
    is_deleted: false
  })
    .populate('user_id', 'name email')
    .sort({ created_at: -1 })
    .limit(limit);
};

// Static method to get message statistics
messageSchema.statics.getMessageStats = function(teamId) {
  return this.aggregate([
    { $match: { team_id: mongoose.Types.ObjectId(teamId), is_deleted: false } },
    {
      $group: {
        _id: '$user_id',
        message_count: { $sum: 1 },
        last_message: { $max: '$created_at' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $project: {
        user: { $arrayElemAt: ['$user', 0] },
        message_count: 1,
        last_message: 1
      }
    },
    { $sort: { message_count: -1 } }
  ]);
};

// Pre-save middleware to validate message content
messageSchema.pre('save', function(next) {
  if (this.message.trim().length === 0) {
    return next(new Error('Message cannot be empty'));
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);