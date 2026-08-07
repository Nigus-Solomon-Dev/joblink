const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    participantDetails: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      unreadCount: {
        type: Number,
        default: 0,
      },
      lastReadAt: {
        type: Date,
        default: null,
      },
      isArchived: {
        type: Boolean,
        default: false,
      },
      archivedAt: {
        type: Date,
        default: null,
      },
    }],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
      default: '',
    },
    groupAvatar: {
      type: String,
      default: null,
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['job', 'application', 'company'],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ 'participantDetails.userId': 1, lastMessageAt: -1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ isActive: 1 });
conversationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });

conversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId',
});

conversationSchema.virtual('lastMessageData', {
  ref: 'Message',
  localField: 'lastMessage',
  foreignField: '_id',
  justOne: true,
});

conversationSchema.pre('save', function (next) {
  if (this.isModified('participants')) {
    const existingUserIds = this.participantDetails.map(p => p.userId.toString());
    const newUserIds = this.participants.map(id => id.toString());
    
    newUserIds.forEach(userId => {
      if (!existingUserIds.includes(userId)) {
        this.participantDetails.push({
          userId,
          unreadCount: 0,
          lastReadAt: null,
          isArchived: false,
        });
      }
    });
    
    this.participantDetails = this.participantDetails.filter(p => 
      newUserIds.includes(p.userId.toString())
    );
  }
  next();
});

conversationSchema.methods.getParticipantDetail = function (userId) {
  return this.participantDetails.find(p => p.userId.toString() === userId.toString());
};

conversationSchema.methods.incrementUnread = async function (userId) {
  const participant = this.getParticipantDetail(userId);
  if (participant) {
    participant.unreadCount += 1;
    return this.save();
  }
};

conversationSchema.methods.resetUnread = async function (userId) {
  const participant = this.getParticipantDetail(userId);
  if (participant) {
    participant.unreadCount = 0;
    participant.lastReadAt = new Date();
    return this.save();
  }
};

conversationSchema.methods.archiveForUser = async function (userId) {
  const participant = this.getParticipantDetail(userId);
  if (participant) {
    participant.isArchived = true;
    participant.archivedAt = new Date();
    return this.save();
  }
};

conversationSchema.methods.unarchiveForUser = async function (userId) {
  const participant = this.getParticipantDetail(userId);
  if (participant) {
    participant.isArchived = false;
    participant.archivedAt = null;
    return this.save();
  }
};

conversationSchema.methods.updateLastMessage = async function (messageId) {
  this.lastMessage = messageId;
  this.lastMessageAt = new Date();
  return this.save();
};

conversationSchema.statics.findOrCreateDirect = async function (userId1, userId2) {
  const existing = await this.findOne({
    participants: { $all: [userId1, userId2], $size: 2 },
    isGroup: false,
  });
  
  if (existing) return existing;
  
  return this.create({
    participants: [userId1, userId2],
    isGroup: false,
  });
};

module.exports = mongoose.model('Conversation', conversationSchema);