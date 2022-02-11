const login = require('facebook-chat-api');
const fs = require('fs');
const mongoose = require('mongoose');
const SimsimiRepo = require('./api/SimsimiRepo');
require('dotenv').config();

mongoose.connect(
	process.env.MONGO_URL || 'mongodb://localhost/chat_auto',
	function (err) {
		if (err) throw err;

		console.log('Successfully connected');
	}
);

const friendSchema = mongoose.Schema({
	friendId: String,
	chatWithBot: { type: Boolean, default: false },
	receiveMessage: { type: Boolean, default: false },
});
const Friend = mongoose.model('Friend', friendSchema);

const credential = {
	appState: JSON.parse(fs.readFileSync('appstate.json', 'utf-8')),
};

login(credential, (err, api) => {
	if (err) return console.error(err);

	api.listenMqtt(async (err, message) => {
		console.log(message);
		if (message && message.body) {
			var friend = await Friend.findOne({ friendId: message.senderID }).exec();
			console.log('Friend', friend);
			if (!friend) {
				friend = new Friend({ friendId: message.senderID });
				await friend.save();
			}
			switch (message.body) {
				case '1':
					friend.chatWithBot = true;
					await friend.save();
					api.sendMessage('(Bot) Chào!', message.threadID);
					break;
				case '2':
					friend.receiveMessage = true;
					await friend.save();
					api.sendMessage('(Bot) Xin hãy gửi lời nhắn!', message.threadID);
					break;
				case 'stop':
					friend.chatWithBot = false;
					await friend.save();
					api.sendMessage('(Bot) Bye!', message.threadID);
					break;
				default:
					if (friend.receiveMessage) {
						api.sendMessage(
							'(Bot) Bạn đã gửi lời nhắn thành công! Đợi Tú phản hồi nhé!',
							message.threadID
						);
						friend.receiveMessage = false;
						await friend.save();
						return;
					}
					if (friend.chatWithBot) {
						SimsimiRepo.talk(message.body)
							.then((data) => {
								console.log(data.data.success);
								api.sendMessage('(Bot) ' + data.data.success, message.threadID);
							})
							.catch((err) => console.error(err));
						return;
					}
					api.getUserInfo(message.senderID, (err, ret) => {
						if (err) return console.log(err);

						api.sendMessage(
							`(Bot) Hi ${
								ret[message.senderID]?.firstName ?? 'bạn'
							}! Tú đang bận. Bạn có thể gửi lời nhắn qua mình hoặc đợi Tú nhé!`,
							message.threadID
						);

						setTimeout(() => {
							api.sendMessage(
								`(Bot) Chọn: \n1. Chat với mình\n2. Gửi lời nhắn`,
								message.threadID
							);
						}, 2000);
					});
					break;
			}
		}
	});
});
