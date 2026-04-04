const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { success, error, created, paginate } = require('../utils/apiResponse');
const { createNotification } = require('../utils/notificationService');

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

exports.listRecipients = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {
      actif: true,
      _id: { $ne: req.user._id },
    };

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ nom: regex }, { prenom: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .select('nom prenom email role')
      .sort({ nom: 1, prenom: 1 })
      .limit(100)
      .lean();

    return success(res, { users }, 'Destinataires recuperes avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation des destinataires', 500);
  }
};

exports.getInbox = async (req, res) => {
  try {
    const { search, lu } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = { destinataire: req.user._id };

    if (typeof lu === 'string') {
      if (lu.toLowerCase() === 'true') filter.lu = true;
      if (lu.toLowerCase() === 'false') filter.lu = false;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ sujet: regex }, { contenu: regex }];
    }

    const [total, messages, unreadCount] = await Promise.all([
      Message.countDocuments(filter),
      Message.find(filter)
        .populate('expediteur', 'nom prenom email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ destinataire: req.user._id, lu: false }),
    ]);

    return paginate(
      res,
      { messages, unreadCount },
      total,
      page,
      limit,
      'Boite de reception recuperee avec succes'
    );
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation de la boite de reception', 500);
  }
};

exports.getSent = async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = { expediteur: req.user._id };
    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ sujet: regex }, { contenu: regex }];
    }

    const [total, messages] = await Promise.all([
      Message.countDocuments(filter),
      Message.find(filter)
        .populate('destinataire', 'nom prenom email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return paginate(res, { messages }, total, page, limit, 'Messages envoyes recuperes avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation des messages envoyes', 500);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { destinataireId, sujet, contenu } = req.body;

    if (!mongoose.isValidObjectId(destinataireId)) {
      return error(res, 'Destinataire invalide', 400);
    }

    if (String(destinataireId) === String(req.user._id)) {
      return error(res, 'Vous ne pouvez pas vous envoyer un message a vous-meme', 400);
    }

    if (!String(sujet || '').trim()) {
      return error(res, 'Le sujet est obligatoire', 400);
    }

    if (!String(contenu || '').trim()) {
      return error(res, 'Le contenu est obligatoire', 400);
    }

    const destinataire = await User.findById(destinataireId).select('_id actif');
    if (!destinataire || !destinataire.actif) {
      return error(res, 'Destinataire introuvable ou inactif', 404);
    }

    const message = await Message.create({
      expediteur: req.user._id,
      destinataire: destinataire._id,
      sujet: String(sujet).trim(),
      contenu: String(contenu).trim(),
    });

    const populated = await Message.findById(message._id)
      .populate('expediteur', 'nom prenom email role')
      .populate('destinataire', 'nom prenom email role');

    try {
      await createNotification({
        userId: destinataire._id,
        type: 'INFO',
        title: 'Nouveau message recu',
        message: `Vous avez recu un message : ${String(sujet).trim()}`,
        module: 'MESSAGES',
        link: '/messages',
        data: {
          messageId: message._id,
          expediteurId: req.user._id,
        },
      });
    } catch {
      // Do not block core messaging flow if notification persistence fails.
    }

    return created(res, { message: populated }, 'Message envoye avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de l\'envoi du message', 500);
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return error(res, 'ID message invalide', 400);
    }

    const message = await Message.findById(id)
      .populate('expediteur', 'nom prenom email role')
      .populate('destinataire', 'nom prenom email role');

    if (!message) return error(res, 'Message introuvable', 404);

    const isOwner =
      String(message.expediteur?._id || message.expediteur) === String(req.user._id) ||
      String(message.destinataire?._id || message.destinataire) === String(req.user._id);

    if (!isOwner) {
      return error(res, 'Acces refuse a ce message', 403);
    }

    if (String(message.destinataire?._id || message.destinataire) === String(req.user._id) && !message.lu) {
      message.lu = true;
      message.dateLecture = new Date();
      await message.save();
    }

    return success(res, { message }, 'Message recupere avec succes');
  } catch (err) {
    return error(res, 'Erreur lors de la recuperation du message', 500);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return error(res, 'ID message invalide', 400);
    }

    const message = await Message.findById(id);
    if (!message) return error(res, 'Message introuvable', 404);

    if (String(message.destinataire) !== String(req.user._id)) {
      return error(res, 'Seul le destinataire peut marquer comme lu', 403);
    }

    if (!message.lu) {
      message.lu = true;
      message.dateLecture = new Date();
      await message.save();
    }

    return success(res, null, 'Message marque comme lu');
  } catch (err) {
    return error(res, 'Erreur lors de la mise a jour du message', 500);
  }
};
