const TelegramBot = require("node-telegram-bot-api");
const token =
  process.env.BOT_TOKEN || "6892360693:AAGeSy5NQF8UEMO1WdA8JKzo2sYTnSHPbag"; // Replace with your bot token

const bot = new TelegramBot(token, {
  polling: {
    interval: 1000, // How often to check for new updates (in milliseconds)
    autoStart: true, // Automatically start polling after creating the bot instance
    params: {
      timeout: 10, // Timeout for long polling (in seconds)
    },
  },
});

// Step 1: Auth and saving users
let users = {};

const publics = process.env.PUBLIC_CHANNEL || -1002134844846;
const admins = process.env.ADMINS_CHANNEL || -1001886131721;

bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;

  if (users[userId]) {
    // User is already registered
    bot.sendMessage(
      users[userId],
      `Hello${msg.chat.username || " user"}! Welcome back.`
    );
  } else {
    // User is not registered
    bot.sendMessage(
      userId,
      "You are not authenticated. Use /login to authenticate."
    );
  }
});

// Step 3: Forwarding stickers, audio, video messages, and other media types
bot.on("sticker", (msg) => {
  forwardMediaToChannel(msg, "sticker");
});

bot.on("audio", (msg) => {
  forwardMediaToChannel(msg, "audio");
});

bot.on("video", (msg) => {
  forwardMediaToChannel(msg, "video");
});

bot.on("voice", (msg) => {
  forwardMediaToChannel(msg, "voice");
});

bot.on("document", (msg) => {
  forwardMediaToChannel(msg, "document");
});

bot.on("photo", (msg) => {
  forwardMediaToChannel(msg, "photo");
});

bot.on("video_note", (msg) => {
  forwardMediaToChannel(msg, "video_note");
});

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

    if (msg.contact) {
      const phoneNumber = msg.contact.phone_number;

      users[userId] = msg.chat.id;

      bot.sendMessage(users[userId], "You are now authenticated! Welcome!");

      bot.sendMessage(
        admins,
        `User ${userId} shared their phone number: ${phoneNumber}`
      );
    } else {
      // User shared other contact data
      const userData = {
        Name: msg.from.first_name,
        Username: msg.from.username,
      };

      bot.sendMessage(
        admins,
        `New user data shared:\n${JSON.stringify(userData, null, 2)}`
      );

      bot.sendMessage(
        userId,
        "To better assist you, please share your phone number.",
        { reply_markup: keyboard }
      );
    }
  } else {
    // User is already registered
    bot.sendMessage(users[userId], "Hello user! You are already registered.");
  }
});

bot.on("message", (msg) => {
  if (msg.text) {
    bot.sendMessage(publics, msg.text);
  }
  console.log(msg);
});

function forwardMediaToChannel(msg, mediaType) {
  const mediaId = msg[mediaType].file_id;

  bot.sendChatAction(publics, "upload_document"); // Show "typing..." action

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
      bot.sendMessage(msg.from.id, `Error forwarding ${mediaType} to channel.`);
    });
}
