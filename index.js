const TelegramBot = require("node-telegram-bot-api");
const token =
  process.env.BOT_TOKEN || "6892360693:AAFzNey8uM3hJ_yQyOrDKkA9kR0GOs2E_XA"; // Replace with your bot token

const bot = new TelegramBot(token, {
  polling: {
    interval: 1000,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
});

// Step 1: Auth and saving users
let users = {};

const publics = process.env.PUBLIC_CHANNEL || -1002134844846;
const admins = process.env.ADMINS_CHANNEL || -1001886131721;

// Handle the /start command
bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;

  if (users[userId]) {
    // User is already registered
    bot.sendMessage(
      users[userId],
      `Hello ${msg.chat.username || "user"}! Welcome back.`
    );
  } else {
    // User is not registered
    bot.sendMessage(
      userId,
      "You are not authenticated. Use /login to authenticate."
    );
  }
});

// Handle different media types
[
  "sticker",
  "audio",
  "video",
  "voice",
  "document",
  "photo",
  "video_note",
].forEach((mediaType) => {
  bot.on(mediaType, (msg) => {
    forwardMediaToChannel(msg, mediaType);
  });
});

// Handle the /login command
bot.onText(/\/login/, (msg) => {
  const userId = msg.from.id;

  if (!users[userId]) {
    const keyboard = {
      keyboard: [
        [{ text: "Share Contact", request_contact: true }],
        ["Cancel"],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    };

    bot.sendMessage(
      userId,
      "To better assist you, please share your phone number.",
      { reply_markup: keyboard }
    );
  } else {
    // User is already registered
    bot.sendMessage(users[userId], "Hello user! You are already registered.");
  }
});

// Handle incoming text messages
bot.on("message", (msg) => {
  if (msg.text && msg.text != "/start" && msg.text != "/login") {
    bot.sendMessage(publics, msg.text);
  }
  console.log(msg);
});

// Handle the contact event when the user shares their contact information
bot.on("contact", (msg) => {
  const userId = msg.from.id;
  const phoneNumber = msg.contact.phone_number;

  if (phoneNumber) {
    // Save user data
    users[userId] = {
      chatId: msg.chat.id,
      phoneNumber: phoneNumber,
      firstName: msg.contact.first_name,
      username: msg.contact.username,
    };

    // Send user info to Admins channel
    bot.sendMessage(
      admins,
      `New user data:\nID: ${userId}\nName: ${msg.contact.first_name}\nUsername: ${msg.contact.username}\nPhone Number: ${phoneNumber}`
    );

    // Respond to the user
    bot.sendMessage(userId, "You are now authenticated! Welcome!");
  } else {
    bot.sendMessage(
      userId,
      "Unable to retrieve your phone number. Please try again."
    );
  }
});

// Function to forward media to the channel
function forwardMediaToChannel(msg, mediaType) {
  const mediaId = msg[mediaType].file_id;

  if (msg.caption) {
    // If the media has a caption, use it as the message text
    bot
      .sendDocument(publics, mediaId, { caption: msg.caption })
      .then(() => {
        bot.sendMessage(
          admins,
          `${mediaType} forwarded to channel successfully. 
From ${msg.chat.id}`
        );
      })
      .catch((error) => {
        console.error("Error forwarding media:", error);
        bot.sendMessage(
          msg.chat.id,
          `Error forwarding ${mediaType} to channel.`
        );
      });
  } else {
    // If there is no caption, send a default message
    bot
      .sendDocument(publics, mediaId)
      .then(() => {
        bot.sendMessage(
          admins,
          `${mediaType} forwarded to channel successfully. 
From ${msg.chat.id}`
        );
      })
      .catch((error) => {
        console.error("Error forwarding media:", error);
        bot.sendMessage(
          msg.chat.id,
          `Error forwarding ${mediaType} to channel.`
        );
      });
  }
}
