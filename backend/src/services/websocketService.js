const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const Notification = require('../models').Notification;

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map();
  }

  initialize(server) {
    const { Server } = require('socket.io');
    
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.id;
        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('WebSocket server initialized');
    return this.io;
  }

  handleConnection(socket) {
    const userId = socket.userId.toString();
    
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socket.id);

    socket.join(`user:${userId}`);

    console.log(`User ${userId} connected via WebSocket (${socket.id})`);

    socket.on('disconnect', () => {
      this.handleDisconnect(socket, userId);
    });

    socket.on('subscribe', (data) => {
      this.handleSubscribe(socket, data);
    });

    socket.on('unsubscribe', (data) => {
      this.handleUnsubscribe(socket, data);
    });

    socket.on('mark-read', async (data) => {
      await this.handleMarkRead(socket, data);
    });

    socket.on('join-conversation', (data) => {
      this.handleJoinConversation(socket, data);
    });

    socket.on('leave-conversation', (data) => {
      this.handleLeaveConversation(socket, data);
    });

    socket.on('typing', (data) => {
      this.handleTyping(socket, data);
    });

    socket.on('stop-typing', (data) => {
      this.handleStopTyping(socket, data);
    });
  }

  handleDisconnect(socket, userId) {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    console.log(`User ${userId} disconnected (${socket.id})`);
  }

  handleSubscribe(socket, data) {
    const { channel } = data;
    if (channel) {
      socket.join(channel);
      console.log(`Socket ${socket.id} subscribed to ${channel}`);
    }
  }

  handleUnsubscribe(socket, data) {
    const { channel } = data;
    if (channel) {
      socket.leave(channel);
      console.log(`Socket ${socket.id} unsubscribed from ${channel}`);
    }
  }

  handleJoinConversation(socket, data) {
    const { conversationId } = data;
    if (conversationId) {
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    }
  }

  handleLeaveConversation(socket, data) {
    const { conversationId } = data;
    if (conversationId) {
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    }
  }

  handleTyping(socket, data) {
    const { conversationId } = data;
    if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: socket.userId,
        conversationId,
      });
    }
  }

  handleStopTyping(socket, data) {
    const { conversationId } = data;
    if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit('user-stop-typing', {
        userId: socket.userId,
        conversationId,
      });
    }
  }

  async handleMarkRead(socket, data) {
    const { notificationId } = data;
    if (notificationId) {
      try {
        await Notification.findOneAndUpdate(
          { _id: notificationId, userId: socket.userId },
          { isRead: true, readAt: new Date() }
        );
        socket.emit('notification-read', { notificationId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark as read' });
      }
    }
  }

  sendNotification(userId, notification) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('notification', notification);
    }
  }

  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  sendMessage(userId, conversationId, message) {
    if (this.io) {
      this.io.to(`conversation:${conversationId}`).emit('new-message', { message, conversationId });
    }
  }

  sendConversationUpdate(userId, conversationId, conversation) {
    if (this.io) {
      this.io.to(`conversation:${conversationId}`).emit('conversation-updated', { conversation });
    }
  }

  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  sendToChannel(channel, event, data) {
    if (this.io) {
      this.io.to(channel).emit(event, data);
    }
  }

  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  getUserSocketCount(userId) {
    const sockets = this.userSockets.get(userId.toString());
    return sockets ? sockets.size : 0;
  }

  isUserOnline(userId) {
    return this.userSockets.has(userId.toString());
  }
}

module.exports = new WebSocketService();