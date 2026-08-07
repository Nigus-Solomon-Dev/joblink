const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');
const websocketService = require('./websocketService');

class ConversationService {
  async createDirectConversation(userId1, userId2) {
    const Conversation = require('../models').Conversation;
    
    if (userId1.toString() === userId2.toString()) {
      throw new AppError('Cannot create conversation with yourself', 400);
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId1, userId2], $size: 2 },
      isGroup: false,
    });

    if (conversation) {
      return conversation;
    }

    conversation = await Conversation.create({
      participants: [userId1, userId2],
      isGroup: false,
    });

    websocketService.sendToUser(userId1.toString(), 'conversation-created', { conversation });
    websocketService.sendToUser(userId2.toString(), 'conversation-created', { conversation });

    return conversation;
  }

  async createGroupConversation(creatorId, groupData) {
    const Conversation = require('../models').Conversation;
    const User = require('../models').User;

    const { name, participantIds, avatar } = groupData;

    if (!participantIds || participantIds.length < 2) {
      throw new AppError('Group conversation requires at least 2 other participants', 400);
    }

    const allParticipants = [...new Set([creatorId.toString(), ...participantIds.map(p => p.toString())])];
    
    const users = await User.find({ _id: { $in: allParticipants } });
    if (users.length !== allParticipants.length) {
      throw new NotFoundError('One or more participants not found');
    }

    const conversation = await Conversation.create({
      participants: allParticipants,
      participantDetails: allParticipants.map(id => ({ userId: id })),
      isGroup: true,
      groupName: name,
      groupAvatar: avatar,
      groupAdmin: creatorId,
    });

    for (const participantId of allParticipants) {
      websocketService.sendToUser(participantId, 'conversation-created', { conversation });
    }

    return conversation;
  }

  async getConversations(userId, options = {}) {
    const Conversation = require('../models').Conversation;

    const { page = 1, limit = 20, sort = '-lastMessageAt', includeArchived = false } = options;

    const query = { 
      participants: userId,
      isActive: true,
    };

    if (!includeArchived) {
      query['participantDetails.userId'] = userId;
      query['participantDetails.isArchived'] = false;
    }

    const pagination = paginate(page, limit, await Conversation.countDocuments(query));

    const conversations = await Conversation.find(query)
      .populate('participants', 'name avatar email role')
      .populate('lastMessage')
      .populate('groupAdmin', 'name avatar')
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    const enrichedConversations = conversations.map(conv => {
      const myDetail = conv.participantDetails.find(p => p.userId.toString() === userId.toString());
      const otherParticipants = conv.participants.filter(p => p._id.toString() !== userId.toString());
      
      return {
        ...conv,
        unreadCount: myDetail?.unreadCount || 0,
        isArchived: myDetail?.isArchived || false,
        otherParticipants: conv.isGroup ? conv.participants : otherParticipants,
        displayName: conv.isGroup ? conv.groupName : (otherParticipants[0]?.name || 'Unknown'),
        displayAvatar: conv.isGroup ? conv.groupAvatar : (otherParticipants[0]?.avatar || null),
      };
    });

    return {
      data: enrichedConversations,
      meta: pagination,
    };
  }

  async getConversationById(conversationId, userId) {
    const Conversation = require('../models').Conversation;
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name avatar email role')
      .populate('lastMessage')
      .populate('groupAdmin', 'name avatar');

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isParticipant = conversation.participants.some(p => p._id.toString() === userId.toString());
    if (!isParticipant) {
      throw new AppError('Not authorized to view this conversation', 403);
    }

    const myDetail = conversation.participantDetails.find(p => p.userId.toString() === userId.toString());
    const otherParticipants = conversation.participants.filter(p => p._id.toString() !== userId.toString());

    return {
      ...conversation.toObject(),
      unreadCount: myDetail?.unreadCount || 0,
      isArchived: myDetail?.isArchived || false,
      otherParticipants: conversation.isGroup ? conversation.participants : otherParticipants,
    };
  }

  async updateConversation(conversationId, userId, updateData) {
    const Conversation = require('../models').Conversation;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
      throw new AppError('Not authorized', 403);
    }

    const isAdmin = conversation.groupAdmin && conversation.groupAdmin.toString() === userId.toString();

    const allowedFields = [];
    if (conversation.isGroup && isAdmin) {
      allowedFields.push('groupName', 'groupAvatar');
    }

    const updates = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    const updatedConversation = await Conversation.findByIdAndUpdate(conversationId, updates, {
      new: true,
      runValidators: true,
    }).populate('participants', 'name avatar')
      .populate('groupAdmin', 'name avatar');

    websocketService.sendToChannel(`conversation:${conversationId}`, 'conversation-updated', { conversation: updatedConversation });

    return updatedConversation;
  }

  async addParticipants(conversationId, userId, newParticipantIds) {
    const Conversation = require('../models').Conversation;
    const User = require('../models').User;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (!conversation.isGroup) {
      throw new AppError('Can only add participants to group conversations', 400);
    }

    const isAdmin = conversation.groupAdmin && conversation.groupAdmin.toString() === userId.toString();
    if (!isAdmin) {
      throw new AppError('Only group admin can add participants', 403);
    }

    const users = await User.find({ _id: { $in: newParticipantIds } });
    if (users.length !== newParticipantIds.length) {
      throw new NotFoundError('One or more users not found');
    }

    const existingParticipantIds = conversation.participants.map(p => p.toString());
    const uniqueNewIds = newParticipantIds.filter(id => !existingParticipantIds.includes(id.toString()));

    if (uniqueNewIds.length === 0) {
      throw new AppError('All users are already participants', 400);
    }

    conversation.participants.push(...uniqueNewIds);
    
    for (const id of uniqueNewIds) {
      conversation.participantDetails.push({
        userId: id,
        unreadCount: 0,
        lastReadAt: null,
        isArchived: false,
      });
    }

    await conversation.save();

    for (const newId of uniqueNewIds) {
      websocketService.sendToUser(newId.toString(), 'conversation-created', { conversation });
    }

    websocketService.sendToChannel(`conversation:${conversationId}`, 'participants-added', { 
      conversationId, 
      newParticipants: uniqueNewIds 
    });

    return conversation;
  }

  async removeParticipant(conversationId, userId, participantId) {
    const Conversation = require('../models').Conversation;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isAdmin = conversation.groupAdmin && conversation.groupAdmin.toString() === userId.toString();
    const isSelfRemoval = participantId.toString() === userId.toString();

    if (!isAdmin && !isSelfRemoval) {
      throw new AppError('Not authorized to remove this participant', 403);
    }

    if (participantId.toString() === conversation.groupAdmin?.toString()) {
      throw new AppError('Cannot remove the group admin', 400);
    }

    conversation.participants = conversation.participants.filter(p => p.toString() !== participantId.toString());
    conversation.participantDetails = conversation.participantDetails.filter(p => p.userId.toString() !== participantId.toString());

    await conversation.save();

    websocketService.sendToUser(participantId.toString(), 'removed-from-conversation', { conversationId });
    websocketService.sendToChannel(`conversation:${conversationId}`, 'participant-removed', { 
      conversationId, 
      participantId 
    });

    return conversation;
  }

  async leaveConversation(conversationId, userId) {
    return this.removeParticipant(conversationId, userId, userId);
  }

  async archiveConversation(conversationId, userId) {
    const Conversation = require('../models').Conversation;
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { 'participantDetails.$[elem].isArchived': true, 'participantDetails.$[elem].archivedAt': new Date() }
    }, {
      arrayFilters: [{ 'elem.userId': userId }],
    });

    return true;
  }

  async unarchiveConversation(conversationId, userId) {
    const Conversation = require('../models').Conversation;
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { 'participantDetails.$[elem].isArchived': false, 'participantDetails.$[elem].archivedAt': null }
    }, {
      arrayFilters: [{ 'elem.userId': userId }],
    });

    return true;
  }

  async muteConversation(conversationId, userId) {
    // Placeholder for mute functionality
    return true;
  }

  async deleteConversation(conversationId, userId) {
    const Conversation = require('../models').Conversation;
    const Message = require('../models').Message;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isAdmin = conversation.groupAdmin && conversation.groupAdmin.toString() === userId.toString();
    const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());

    if (!isAdmin && conversation.participants.length > 2) {
      throw new AppError('Only admin can delete group conversation', 403);
    }

    await Message.deleteMany({ conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    websocketService.sendToChannel(`conversation:${conversationId}`, 'conversation-deleted', { conversationId });

    return true;
  }
}

module.exports = new ConversationService();