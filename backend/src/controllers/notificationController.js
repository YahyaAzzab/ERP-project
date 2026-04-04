const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { success, error, paginate } = require('../utils/apiResponse');

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

exports.getMyNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { lu, module } = req.query;

    const filter = { user: req.user._id };
    if (typeof lu === 'string') {
      if (lu.toLowerCase() === 'true') filter.lu = true;
      if (lu.toLowerCase() === 'false') filter.lu = false;
    }
    if (module?.trim()) filter.module = module.trim().toUpperCase();

    const [total, notifications, unreadCount] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ user: req.user._id, lu: false }),
    ]);

    return paginate(
      res,
      { notifications, unreadCount },
      total,
      page,
      limit,
      'Notifications recuperees avec succes'
    );
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation des notifications', 500);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return error(res, 'ID notification invalide', 400);

    const notification = await Notification.findById(id);
    if (!notification) return error(res, 'Notification introuvable', 404);
    if (String(notification.user) !== String(req.user._id)) {
      return error(res, 'Acces refuse a cette notification', 403);
    }

    if (!notification.lu) {
      notification.lu = true;
      notification.dateLecture = new Date();
      await notification.save();
    }

    return success(res, { notification }, 'Notification marquee comme lue');
  } catch (err) {
    return error(res, 'Erreur lors de la mise a jour de la notification', 500);
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, lu: false },
      { $set: { lu: true, dateLecture: new Date() } }
    );

    return success(res, null, 'Toutes les notifications ont ete marquees comme lues');
  } catch (err) {
    return error(res, 'Erreur lors de la mise a jour des notifications', 500);
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ user: req.user._id, lu: false });
    return success(res, { unreadCount }, 'Compteur non lues recupere');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation du compteur', 500);
  }
};
