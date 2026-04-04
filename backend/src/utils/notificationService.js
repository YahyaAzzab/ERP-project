const Notification = require('../models/Notification');
const { emitNotificationToUser } = require('../realtime/socket');

const createNotification = async ({
  userId,
  type = 'INFO',
  title,
  message,
  module = 'GENERAL',
  link = '',
  data = null,
}) => {
  if (!userId || !title || !message) return null;

  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    module,
    link,
    data,
  });

  const payload = {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    module: notification.module,
    link: notification.link,
    data: notification.data,
    lu: notification.lu,
    createdAt: notification.createdAt,
  };

  emitNotificationToUser(userId, payload);
  return notification;
};

module.exports = {
  createNotification,
};
