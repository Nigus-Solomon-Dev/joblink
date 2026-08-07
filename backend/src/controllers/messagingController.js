const messageService = require('../services/messageService');
const conversationService = require('../services/conversationService');
const { ApiResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError, NotFoundError } = require('../utils/errors');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

class MessageController {
  sendMessage = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    const message = await messageService.createMessage(conversationId, req.user.id, req.body);
    
    const response = ApiResponse.created({ message }, 'Message sent successfully');
    res.status(201).json(response);
  });

  getMessages = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    const { page, limit, sort, before } = req.query;
    
    const result = await messageService.getMessages(conversationId, req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sort: sort || '-createdAt',
      before,
    });
    
    const response = ApiResponse.success(result.data, 'Messages fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getMessage = catchAsync(async (req, res, next) => {
    const message = await messageService.getMessageById(req.params.id, req.user.id);
    
    const response = ApiResponse.success({ message }, 'Message fetched successfully');
    res.status(200).json(response);
  });

  markAsRead = catchAsync(async (req, res, next) => {
    await messageService.markAsRead(req.params.id, req.user.id);
    
    const response = ApiResponse.success(null, 'Message marked as read');
    res.status(200).json(response);
  });

  markConversationAsRead = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    await messageService.markConversationAsRead(conversationId, req.user.id);
    
    const response = ApiResponse.success(null, 'Conversation marked as read');
    res.status(200).json(response);
  });

  editMessage = catchAsync(async (req, res, next) => {
    const { content } = req.body;
    const message = await messageService.editMessage(req.params.id, req.user.id, content);
    
    const response = ApiResponse.success({ message }, 'Message edited successfully');
    res.status(200).json(response);
  });

  deleteMessage = catchAsync(async (req, res, next) => {
    await messageService.deleteMessage(req.params.id, req.user.id);
    
    const response = ApiResponse.success(null, 'Message deleted successfully');
    res.status(200).json(response);
  });

  searchMessages = catchAsync(async (req, res, next) => {
    const { q, page, limit } = req.query;
    
    if (!q || q.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }
    
    const result = await messageService.searchMessages(req.user.id, q.trim(), {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    
    const response = ApiResponse.success(result.data, 'Messages fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  uploadAttachment = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const attachment = await messageService.uploadAttachment(conversationId, req.user.id, req.file);
    
    const response = ApiResponse.success({ attachment }, 'Attachment uploaded successfully');
    res.status(200).json(response);
  });
}

class ConversationController {
  createDirectConversation = catchAsync(async (req, res, next) => {
    const { userId } = req.body;
    
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }
    
    const conversation = await conversationService.createDirectConversation(req.user.id, userId);
    
    const response = ApiResponse.created({ conversation }, 'Conversation created successfully');
    res.status(201).json(response);
  });

  createGroupConversation = catchAsync(async (req, res, next) => {
    const { name, participantIds, avatar } = req.body;
    
    if (!name || !participantIds || participantIds.length < 2) {
      throw new AppError('Group name and at least 2 participant IDs are required', 400);
    }
    
    const conversation = await conversationService.createGroupConversation(req.user.id, {
      name,
      participantIds,
      avatar,
    });
    
    const response = ApiResponse.created({ conversation }, 'Group conversation created successfully');
    res.status(201).json(response);
  });

  getConversations = catchAsync(async (req, res, next) => {
    const { page, limit, sort, includeArchived } = req.query;
    
    const result = await conversationService.getConversations(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sort || '-lastMessageAt',
      includeArchived: includeArchived === 'true',
    });
    
    const response = ApiResponse.success(result.data, 'Conversations fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getConversation = catchAsync(async (req, res, next) => {
    const conversation = await conversationService.getConversationById(req.params.id, req.user.id);
    
    const response = ApiResponse.success({ conversation }, 'Conversation fetched successfully');
    res.status(200).json(response);
  });

  updateConversation = catchAsync(async (req, res, next) => {
    const conversation = await conversationService.updateConversation(req.params.id, req.user.id, req.body);
    
    const response = ApiResponse.success({ conversation }, 'Conversation updated successfully');
    res.status(200).json(response);
  });

  addParticipants = catchAsync(async (req, res, next) => {
    const { participantIds } = req.body;
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      throw new AppError('Participant IDs array is required', 400);
    }
    
    const conversation = await conversationService.addParticipants(req.params.id, req.user.id, participantIds);
    
    const response = ApiResponse.success({ conversation }, 'Participants added successfully');
    res.status(200).json(response);
  });

  removeParticipant = catchAsync(async (req, res, next) => {
    const conversation = await conversationService.removeParticipant(req.params.id, req.user.id, req.params.participantId);
    
    const response = ApiResponse.success({ conversation }, 'Participant removed successfully');
    res.status(200).json(response);
  });

  leaveConversation = catchAsync(async (req, res, next) => {
    await conversationService.leaveConversation(req.params.id, req.user.id);
    
    const response = ApiResponse.success(null, 'Left conversation successfully');
    res.status(200).json(response);
  });

  archiveConversation = catchAsync(async (req, res, next) => {
    await conversationService.archiveConversation(req.params.id, req.user.id);
    
    const response = ApiResponse.success(null, 'Conversation archived successfully');
    res.status(200).json(response);
  });

  unarchiveConversation = catchAsync(async (req, res, next) => {
    await conversationService.unarchiveConversation(req.params.id, req.user.id);
    
    const response = ApiResponse.success(null, 'Conversation unarchived successfully');
    res.status(200).json(response);
  });

  deleteConversation = catchAsync(async (req, res, next) => {
    await conversationService.deleteConversation(req.params.id, req.user.id);
    
    const response = ApiResponse.success(null, 'Conversation deleted successfully');
    res.status(200).json(response);
  });
}

module.exports = {
  messageController: new MessageController(),
  conversationController: new ConversationController(),
};