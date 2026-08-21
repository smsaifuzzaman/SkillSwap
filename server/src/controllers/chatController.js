import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

// @desc    Get conversation between logged-in user and another user
// @route   GET /api/chat/:userId
// @access  Private
export async function getConversation(req, res, next) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    next(error);
  }
}

// @desc    Send a message
// @route   POST /api/chat/:userId
// @access  Private
export async function sendMessage(req, res, next) {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user._id;

    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const newMessage = await Message.create({
      sender: currentUserId,
      receiver: userId,
      content
    });

    // Create a notification for the receiver
    await Notification.create({
      recipient: userId,
      type: "chat",
      title: "New Message",
      message: `${req.user.name} sent you a message: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
      relatedEntityId: currentUserId
    });

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
}

// @desc    Get all conversations (inbox)
// @route   GET /api/chat
// @access  Private
export async function getInbox(req, res, next) {
  try {
    const currentUserId = req.user._id;

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name profilePhoto")
      .populate("receiver", "name profilePhoto");

    const inboxMap = new Map();

    messages.forEach((msg) => {
      // Determine the other user in the conversation
      const isSender = msg.sender._id.toString() === currentUserId.toString();
      const otherUser = isSender ? msg.receiver : msg.sender;
      
      const otherUserId = otherUser._id.toString();

      if (!inboxMap.has(otherUserId)) {
        inboxMap.set(otherUserId, {
          user: {
            id: otherUserId,
            name: otherUser.name,
            profilePhoto: otherUser.profilePhoto
          },
          lastMessage: msg.content,
          createdAt: msg.createdAt,
          unreadCount: 0 // Simplification for now
        });
      }

      // If we are the receiver and the message is unread, increment count
      if (!isSender && !msg.read) {
        inboxMap.get(otherUserId).unreadCount += 1;
      }
    });

    const inbox = Array.from(inboxMap.values());

    res.json(inbox);
  } catch (error) {
    next(error);
  }
}
