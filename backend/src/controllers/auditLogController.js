const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { paginate, error } = require('../utils/apiResponse');

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

const parseDate = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
};

const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const {
      search,
      module,
      method,
      success,
      statusCode,
      userId,
      dateDebut,
      dateFin,
    } = req.query;

    const filter = {};

    if (module?.trim()) filter.module = String(module).trim().toUpperCase();
    if (method?.trim()) filter.method = String(method).trim().toUpperCase();

    if (typeof success === 'string') {
      if (success.toLowerCase() === 'true') filter.success = true;
      if (success.toLowerCase() === 'false') filter.success = false;
    }

    if (statusCode !== undefined && statusCode !== null && String(statusCode).trim() !== '') {
      const parsed = Number(statusCode);
      if (!Number.isNaN(parsed)) filter.statusCode = parsed;
    }

    if (userId && mongoose.isValidObjectId(userId)) {
      filter.user = userId;
    }

    const from = parseDate(dateDebut, false);
    const to = parseDate(dateFin, true);
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const users = await User.find({
        $or: [{ nom: regex }, { prenom: regex }, { email: regex }],
      })
        .select('_id')
        .lean();

      const userIds = users.map((u) => u._id);

      filter.$or = [
        { action: regex },
        { path: regex },
        { email: regex },
      ];

      if (userIds.length > 0) {
        filter.$or.push({ user: { $in: userIds } });
      }
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .populate('user', 'nom prenom email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return paginate(res, { logs }, total, page, limit, 'Logs plateforme recuperes avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation des logs plateforme', 500);
  }
};

module.exports = {
  getAuditLogs,
};
