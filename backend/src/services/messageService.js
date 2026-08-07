const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');
const websocketService = require('./websocketService');

class MessageService {
  async createMessage(conversationId, senderId, messageData) {
    const Message = require('../models').Message;
    const Conversation = require('../models').Conversation;
    const Notification = require('../models').Notification;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isParticipant = conversation.participants.some(p => p.toString() === senderId.toString());
    if (!isParticipant) {
      throw new AppError('You are not a participant in this conversation', 403);
    }

    if (!conversation.isActive) {
      throw new AppError('This conversation is no longer active', 400);
    }

    const otherParticipants = conversation.participants.filter(p => p.toString() !== senderId.toString());
    const receiverId = otherParticipants[0];

    const message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      content: messageData.content,
      attachments: messageData.attachments || [],
    });

    await conversation.updateLastMessage(message._id);

    for (const participantId of otherParticipants) {
      await conversation.incrementUnread(participantId);
      
      await Notification.create({
        userId: participantId,
        type: 'message',
        title: 'New Message',
        message: `You have a new message`,
        data: { conversationId: conversation._id, messageId: message._id },
        relatedEntity: { entityType: 'message', entityId: message._id },
        priority: 'normal',
      });

      websocketService.sendToUser(participantId.toString(), 'new-message', {
        message,
        conversationId: conversation._id,
      });
    }

    return message;
  }

  async getMessages(conversationId, userId, options = {}) {
    const Message = require('../models').Message;
    const Conversation = require('../models').Conversation;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
      throw new AppError('You are not a participant in this conversation', 403);
    }

    const { page = 1, limit = 50, sort = '-createdAt', before } = options;

    const query = { conversationId, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const pagination = paginate(page, limit, await Message.countDocuments(query));

    const messages = await Message.find(query)
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: messages.reverse(),
      meta: pagination,
    };
  }

  async getMessageById(messageId, userId) {
    const Message = require('../models').Message;
    const message = await Message.findById(messageId)
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar');

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    const Conversation = require('../models').Conversation;
    const conversation = await Conversation.findById(message.conversationId);
    
    const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
      throw new AppError('Not authorized to view this message', 403);
    }

    return message;
  }

  async markAsRead(messageId, userId) {
    const Message = require('../models').Message;
    const Conversation = require('../models').Conversation;

    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.receiverId.toString() !== userId.toString()) {
      throw new AppError('Only the receiver can mark this message as read', 403);
    }

    await message.markAsRead();
    await conversation.resetUnread(userId);

    return message;
  }

  async markConversationAsRead(conversationId, userId) {
    const Conversation = require('../models').Conversation;
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    await conversation.resetUnread(userId);

    return true;
  }

  async editMessage(messageId, userId, newContent) {
    const Message = require('../models').Message;
    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new AppError('Only the sender can edit this message', 403);
    }

    if (message.isDeleted) {
      throw new AppError('Cannot edit a deleted message', 400);
    }

    await message.edit(newContent);

    return message;
  }

  async deleteMessage(messageId, userId) {
    const Message = require('../models').Message;
    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new AppError('Only the sender can delete this message', 403);
    }

    await message.softDelete(userId);

    return true;
  }

  async searchMessages(userId, searchTerm, options = {}) {
    const Message = require('../models').Message;
    const Conversation = require('../models').Conversation;

    const { page = 1, limit = 20 } = options;

    const userConversations = await Conversation.find({ 
      participants: userId,
      isActive: true,
    }).select('_id');

    const conversationIds = userConversations.map(c => c._id);

    const query = {
      conversationId: { $in: conversationIds },
      content: { $regex: searchTerm, $options: 'i' },
      isDeleted: false,
    };

    const pagination = paginate(page, limit, await Message.countDocuments(query));

    const messages = await Message.find(query)
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
      .populate('conversationId')
      .sort('-createdAt')
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: messages,
      meta: pagination,
    };
  }

  async uploadAttachment(conversationId, userId, file) {
    const cloudinary = require('cloudinary').v2;
    const Conversation = require('../models').Conversation;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
      throw new AppError('Not authorized', 403);
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'joblink/messages/attachments',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      name: file.originalname,
      type: result.resource_type,
      size: result.bytes,
    };
  }
}

module.exports = new MessageService();