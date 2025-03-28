const mongoose = require("mongoose");
const Voice = require("./models/voice.js");
var mongoUrl;
const logs = require('discord-logs');
/**
 *
 *
 * @class DiscordVoice
 */
class DiscordVoice {
	/**
	 *
	 *
	 * @static
	 * @param {string} [dbUrl] - A valid mongo database URI.
	 * @return {Promise} - The mongoose connection promise.
	 * @memberof DiscordVoice
	 */
	static async setURL(dbUrl) {
		if (!dbUrl) throw new TypeError("A database url was not provided.");
		return mongoose.connect(dbUrl, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false
		});
	}
	/**
	 *
	 *
	 * @static
	 * @param {string} [userId] - Discord user id.
	 * @param {string} [guildId] - Discord guild id.
	 * @return {objcet} - The user data object.
	 * @memberof DiscordVoice
	 */
	static async createUser(userId, guildId) {
		if (!userId) throw new TypeError("An user id was not provided.");
		if (!guildId) throw new TypeError("A guild id was not provided.");
		const isUser = await Voice.findOne({
			userID: userId,
			guildID: guildId
		});
		if (isUser) return false;
		const newUser = new Voice({
			userID: userId,
			guildID: guildId
		});
		await newUser.save().catch(e => console.log(`Failed to create user: ${e}`));
		return newUser;
	}
	/**
	 *
	 *
	 * @static
	 * @param {string} [userId] - Discord user id.
	 * @param {string} [guildId] - Discord guild id.
	 * @return {objcet} - The user data object.
	 * @memberof DiscordVoice
	 */
	static async deleteUser(userId, guildId) {
		if (!userId) throw new TypeError("An user id was not provided.");
		if (!guildId) throw new TypeError("A guild id was not provided.");
		const user = await Voice.findOne({
			userID: userId,
			guildID: guildId
		});
		if (!user) return false;
		await Voice.findOneAndDelete({
			userID: userId,
			guildID: guildId
		}).catch(e => console.log(`Failed to delete user: ${e}`));
		return user;
	}
	/**
	 *
	 *
	 * @static
	 * @param {Discord.Client} [client] - The Discord Client.
	 * @param {boolean} [trackbots=false] - Wheter to track bot's voice activity.
	 * @param {boolean} [trackallchannels=true] - Wheter to track all the voice channels.
	 * @param {string} [channelID] - If trackallchannels is false the function will check activity for only the specified channelid.
	 * @return {objcet} - The user data object. 
	 * @memberof DiscordVoice
	 */
	static async start(client, trackbots = false, trackallchannels = true, channelID) {
		if (!client) throw new TypeError("A client was not provided.");
		if (!trackallchannels && !channelID) throw new TypeError("A channel ID was not provided.");
		logs(client);
		client.on("voiceChannelJoin", async (member, channel) => {
			if(!trackbots) if (member.bot) return;
			const user = await Voice.findOne({
				userID: member.user.id,
				guildID: member.guild.id
			});
			if (!trackallchannels) {
				if (channel.id === channelID) {
					if (!user) {
						const newUser = new Voice({
							userID: member.user.id,
							guildID: member.guild.id,
							joinTime: Date.now()
						});
						await newUser.save().catch(e => console.log(`Failed to save new user.`));
						return user;
					}
					user.joinTime = Date.now();
				  await user.save().catch(e => console.log(`Failed to save user join time: ${e}`));
				  return user;
				}
			}
			if (trackallchannels) {
				if (!user) {
					const newUser = new Voice({
						userID: member.user.id,
						guildID: member.guild.id,
						joinTime: Date.now()
					});
					await newUser.save().catch(e => console.log(`Failed to save new user.`));
					return user;
				}
				user.joinTime = Date.now();
				await user.save().catch(e => console.log(`Failed to save user join time: ${e}`));
				return user;
			}
		});
		client.on("voiceChannelLeave", async (member, channel) => {
			let user = await Voice.findOne({
				userID: member.user.id,
				guildID: member.guild.id
			});
			if (!trackallchannels) {
				if (channel.id === channelID) {
					if (user) {
						let time = (Date.now() - user.joinTime)
						let finaltime = +time + +user.voiceTime
						user.voiceTime = finaltime
						await user.save().catch(e => console.log(`Failed to save user voice time: ${e}`));
						return user;
					}
				}
			}
			if (trackallchannels) {
				if (user) {
					let time = (Date.now() - user.joinTime)
					let finaltime = +time + +user.voiceTime
					user.voiceTime = finaltime
					await user.save().catch(e => console.log(`Failed to save user voice time: ${e}`));
					return user;
				}
			}
		});
	}
	/**
	 *
	 *
	 * @static
	 * @param {string} [userId] - Discord user id.
	 * @param {string} [guildId] - Discord guild id.
	 * @param {number} [voicetime] - Amount of voice time in ms to set.
	 * @return {objcet} - The user data object.
	 * @memberof DiscordVoice
	 */
	static async setVoiceTime(userId, guildId, voicetime) {
		if (!userId) throw new TypeError("An user id was not provided.");
		if (!guildId) throw new TypeError("A guild id was not provided.");
		if (voicetime == 0 || !voicetime || isNaN(parseInt(voicetime))) throw new TypeError("An amount of voice time was not provided/was invalid.");
		const user = await Voice.findOne({
			userID: userId,
			guildID: guildId
		});
		if (!user) return false;
		user.voiceTime = voicetime;
		user.save().catch(e => console.log(`Failed to set voice time: ${e}`));
		return user;
	}
	/**
	 *
	 *
	 * @static
	 * @param {string} [userId] - Discord user id.
	 * @param {string} [guildId] - Discord guild id.
	 * @param {boolean} [fetchPosition=false] - Wheter to fetch the users position.
	 * @return {objcet} - The user data object.
	 * @memberof DiscordVoice
	 */
	static async fetch(userId, guildId, fetchPosition = false) {
		if (!userId) throw new TypeError("An user id was not provided.");
		if (!guildId) throw new TypeError("A guild id was not provided.");
		const user = await Voice.findOne({
			userID: userId,
			guildID: guildId
		});
		if (!user) return false;
		let userobj = {}
		if (fetchPosition === true) {
			const leaderboard = await Voice.find({
				guildID: guildId
			}).sort([
				['voiceTime', 'descending']
			]).exec();
			userobj.position = leaderboard.findIndex(i => i.userID === userId) + 1;
		}
		userobj.data = user
		return userobj;
	}
	/**
	 *
	 *
	 * @static
	 * @param {string} [userId] - Discord user id.
	 * @param {string} [guildId] - Discord guild id.
	 * @param {number} [voicetime] - Amount of voice time in ms to add.
	 * @return {objcet} - The user data object.
	 * @memberof DiscordVoice
	 */
	static async addVoiceTime(userId, guildId, voicetime) {
		if (!userId) throw new TypeError("An user id was not provided.");
		if (!guildId) throw new TypeError("A guild id was not provided.");
		if (voicetime == 0 || !voicetime || isNaN(parseInt(voicetime))) throw new TypeError("An amount of voice time was not provided/was invalid.");
		const user = await Voice.findOne({
			userID: userId,
			guildID: guildId
		});
		if (!user) return false;
		user.voiceTime += parseInt(voicetime, 10);
		user.save().catch(e => console.log(`Failed to add voice time: ${e}`));
		return user;
	}
	/**
	 *
	 *
	 * @static
	 * @param {string} [userId] - Discord user id.
	 * @param {string} [guildId] - Discord guild id.
	 * @param {number} [voicetime] - Amount of voice time in ms to subtract.
	 * @return {objcet} - The user data object.
	 * @memberof DiscordVoice
	 */
	static async subtractVoiceTime(userId, guildId, voicetime) {
		if (!userId) throw new TypeError("An user id was not provided.");
		if (!guildId) throw new TypeError("A guild id was not provided.");
		if (voicetime == 0 || !voicetime || isNaN(parseInt(voicetime))) throw new TypeError("An amount of voice time was not provided/was invalid.");
		const user = await Voice.findOne({
			userID: userId,
			guildID: guildId
		});
		if (!user) return false;
		user.voiceTime -= parseInt(voicetime, 10);
		user.save().catch(e => console.log(`Failed to subtract voice time: ${e}`));
		return user;
	}
	/**
	 *
	 *
	 * @static
	 * @param {string} [guildId] - Discord guild id.
	 * @param {number} [limit] - Amount of maximum enteries to return.
	 * @return {Array} - The leaderboard array.
	 * @memberof DiscordVoice
	 */
	static async fetchLeaderboard(guildId, limit) {
		if (!guildId) throw new TypeError("A guild id was not provided.");
		if (!limit) throw new TypeError("A limit was not provided.");
		var users = await Voice.find({
			guildID: guildId
		}).sort([
			['voiceTime', 'descending']
		]).exec();
		return users.slice(0, limit);
	}
	/**
	 *
	 *
	 * @static
	 * @param {Discord.Client} [client] - Your Discord.CLient.
	 * @param {array} [leaderboard] - The output from 'fetchLeaderboard' function.
	 * @param {boolean} [fetchUsers=false] - Wheter to fetch each users position.
	 * @return {Array} - The leaderboard array.
	 * @memberof DiscordVoice
	 */
	static async computeLeaderboard(client, leaderboard, fetchUsers = false) {
		if (!client) throw new TypeError("A client was not provided.");
		if (!leaderboard) throw new TypeError("A leaderboard id was not provided.");
		if (leaderboard.length < 1) return [];
		const computedArray = [];
		if (fetchUsers) {
			for (const key of leaderboard) {
				const user = await client.users.fetch(key.userID) || {
					username: "Unknown",
					discriminator: "0000"
				};
				computedArray.push({
					guildID: key.guildID,
					userID: key.userID,
					voiceTime: key.voiceTime,
					position: (leaderboard.findIndex(i => i.guildID === key.guildID && i.userID === key.userID) + 1),
					username: user.username,
					discriminator: user.discriminator
				});
			}
		} else {
			leaderboard.map(key => computedArray.push({
				guildID: key.guildID,
				userID: key.userID,
				voiceTime: key.voiceTime,
				position: (leaderboard.findIndex(i => i.guildID === key.guildID && i.userID === key.userID) + 1),
				username: client.users.cache.get(key.userID) ? client.users.cache.get(key.userID).username : "Unknown",
				discriminator: client.users.cache.get(key.userID) ? client.users.cache.get(key.userID).discriminator : "0000"
			}));
		}
		return computedArray;
	}
}
module.exports = DiscordVoice;