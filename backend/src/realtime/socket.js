const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let ioInstance = null;

const extractToken = (socket) => {
  const authToken = socket.handshake?.auth?.token;
  if (authToken) return String(authToken).replace(/^Bearer\s+/i, '');

  const header = socket.handshake?.headers?.authorization;
  if (header && header.startsWith('Bearer ')) return header.split(' ')[1];

  return null;
};

const initRealtime = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) return next(new Error('Token manquant'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'erp-pme-api',
        audience: 'erp-pme-front',
      });

      socket.user = {
        _id: decoded._id,
        email: decoded.email,
        role: decoded.role,
      };

      return next();
    } catch (err) {
      return next(new Error('Token invalide'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = String(socket.user._id);
    socket.join(`user:${userId}`);

    socket.on('notifications:markRead', (notificationId) => {
      if (!notificationId) return;
      socket.emit('notifications:ack', { notificationId });
    });
  });

  return ioInstance;
};

const getRealtime = () => ioInstance;

const emitNotificationToUser = (userId, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${String(userId)}`).emit('notifications:new', payload);
};

module.exports = {
  initRealtime,
  getRealtime,
  emitNotificationToUser,
};
