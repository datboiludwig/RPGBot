const Discord = require('discord.js')
const client = new Discord.Client()
const config = require('./config.json')
const fs = require('fs')
const players = require('./players.json')
const profiles = require('./profiles.json')
const guilds = require('./guilds.json')
const guildInvites = require('./guild-invites.json')

const commands = require('./commands')

function createHash(string) {
	let hash = 0;
    if (string.length == 0) return hash;
    for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash;
    }
    return hash.toString();
}

function tryToCreateGuild(members, owner) {

}

client.on('ready', () => {
	console.log('Client is ready.')

	commands(client, 'create-guild', (message) => {
		if(players[createHash(message.author.tag)] == message.author.tag) {
			if(profiles[createHash(message.author.tag)].creationStage != 4) {
				message.channel.send("You are not finished with the profile creation process yet.");
				return;
			}
		} else {
			message.channel.send("You don't have a profile yet. Create one by typing \"!create-profile\"");
			return;
		}

		let guildMembers = message.content.split(" ").slice(1);
		let guildMemberTagsHashed = [];

		for(let i = 0; i < guildMembers.length; i++) {
			guildMemberTagsHashed.push(createHash(client.users.cache.find(user => user.id == guildMembers[i].slice(3, -1)).tag));
		}

		if(guildMembers.length < 2) {
			message.channel.send("You need to have a minimum of 2 starting guild members to create a guild.");
		}

		for(let i = 0; i < guildMembers.length; i++) {
			console.log(profiles[createHash(client.users.cache.find(user => user.id == guildMembers[i].slice(3, -1)).tag)]);
			if(players[createHash(client.users.cache.find(user => user.id == guildMembers[i].slice(3, -1)).tag)] == client.users.cache.find(user => user.id == guildMembers[i].slice(3, -1)).tag) {
				if(profiles[createHash(client.users.cache.find(user => user.id == guildMembers[i].slice(3, -1)).tag)].creationStage != 4) {
					message.channel.send("One of your guild members is not finished with the profile creation process.");
					return;
				}
			} else {
				message.channel.send("One of your guild members doesn't have a profile yet.");
				return;
			}
		}

		for(let i = 0; i < guildMembers.length; i++) {
			let guildMember = client.users.cache.find(user => user.id == guildMembers[i].slice(3, -1));
			guildMember.send(`You have been invited to join a guild by ${message.author.username}. To accept, use the command \"!accept-invite [@Theirname]\".`);
			if(guildInvites[createHash(guildMember.tag)] != undefined) {
				guildInvites[createHash(guildMember.tag)].push({
					"owner": createHash(message.author.tag), 
					"hash": createHash(message.author.tag)
				});

				guilds[createHash(message.author.tag)] = {
					"name": "PLACEHOLDER",
					"owner": message.author.tag,
					"members": guildMemberTagsHashed,
					"created": false,
					"acceptedInvitations": []
				};

				fs.writeFile('guild-invites.json', JSON.stringify(guildInvites), (err) => {
				if(err) {
					throw err;
				}

				console.log('Guild invites updated');
				})

				fs.writeFile('guilds.json', JSON.stringify(guilds), (err) => {
				if(err) {
					throw err;
				}

				console.log('Guilds updated');
				})
			} else {
				guildInvites[createHash(guildMember.tag)] = [];
				guildInvites[createHash(guildMember.tag)].push({
					"owner": createHash(message.author.tag), 
					"hash": createHash(message.author.tag)
				});

				guilds[createHash(message.author.tag)] = {
					"name": "PLACEHOLDER",
					"owner": message.author.tag,
					"members": guildMemberTagsHashed,
					"created": false,
					"acceptedInvitations": []
				};


				fs.writeFile('guild-invites.json', JSON.stringify(guildInvites), (err) => {
				if(err) {
					throw err;
				}

				console.log('Guild invites updated');
				})

				fs.writeFile('guilds.json', JSON.stringify(guilds), (err) => {
				if(err) {
					throw err;
				}

				console.log('Guilds updated');
				})
			}
		}

	})

	commands(client, 'accept-invite', (message) => {

		if(message.content.split(" ").length < 1 || message.content.split(" ").length > 1) {
			message.channel.send("You need to specify whose invite you are accepting by pinging them. (@Username#0000)");
			return;
		}

		let inviter = client.users.cache.find(user => user.id == message.content.split(" ")[1].slice(3, -1));

		console.log(inviter);

		let index = guildInvites[createHash(message.author.tag)].indexOf(createHash(inviter.tag));

		console.log(guildInvites[createHash(message.author.tag)]);
		if(index > -1) {
			guildInvites[createHash(message.author.tag)].splice(index, 1);
		}
		console.log(guildInvites[createHash(message.author.tag)]);

		guilds[guildInvites[createHash(message.author.tag)]].acceptedInvitations.push(createHash(message.author.tag));

		if(guilds[guildInvites[createHash(message.author.tag)]].acceptedInvitations == guilds[guildInvites[createHash(message.author.tag)]].members) {
			guilds[guildInvites[createHash(message.author.tag)]].created = true;
		}

		fs.writeFile('guild-invites.json', JSON.stringify(guildInvites), (err) => {
			if(err) {
				throw err;
			}

			console.log('Guild invites updated');
		})

	})

	commands(client, 'guild-list', (message) => {

		let guildList = guilds;


		const embed = new Discord.MessageEmbed()
			.setTitle("Listing all current guilds.");


		let guildMemberStr;
		for(let i in guildList) {
			guildMemberStr = "";
			for(let j in guildList[i].members) {
				guildMemberStr = guildMemberStr + players[guildList[i].members[j]].slice(0, -5) + ", ";
				
			}


			embed.addField(guildList[i].name, "\nOwner:\n" + guildList[i].owner.slice(0, -5) + "\nMembers:\n" + guildMemberStr, false);
		}

		message.channel.send(embed);
	})

	commands(client, 'profile', (message) => {
		if(players[`${createHash(message.author.tag)}`] != message.author.tag) {
			message.channel.send("You don't have a profile yet. Create one by typing \"!create-profile\"");
			return;
		}

		let author = "";
		let profile = {};
		if(message.content.split(" ").length == 2) {
			let author = message.content.split(" ")[1];
			profile = profiles[createHash(message.content.split(" ")[1])];
		} else if(message.content.split(" ").length == 1) {
			let author = message.author.tag;
			profile = profiles[createHash(message.author.tag)];
		} else {
			return;
		}

		if(profile.creationStage != 4) {
			message.channel.send("You can't view your profile until the profile creation process is done.");
			return;
		}

		const embed = new Discord.MessageEmbed()
			.setTitle(`${players[createHash(message.author.tag)].slice(0, -5)}\'s profile.`)
			.setFooter(`Name: ${profile.name}\nGender: ${profile.gender}\nRace: ${profile.race}\nClass: ${profile.class}\n\nLevel: ${profile.lvl}\nStrength: ${profile.str}\nDexterity: ${profile.dex}\nIntelligence: ${profile.int}\n\nMaximum Health: ${profile.hp}\nAttack Damage: ${profile.ad}\nMagic Damage: ${profile.md}\nArmor: ${profile.armor}\nMagic Resistance: ${profile.mr}\nCritical Strike Chance: ${profile.critchance}%\nCritical Strike Damage: ${profile.critdmg}%`);


		message.channel.send(embed);
	})

	commands(client, 'create-profile', (message) => {
		if(players[`${createHash(message.author.tag)}`] == message.author.tag) {
			message.channel.send("You already have a profile. View it by typing \"!profile\"");
			return;
		}

		players[createHash(message.author.tag)] = message.author.tag;

		let profile = {
			"name": "",
			"gender": "",
			"race": "",
			"class": "",

			"lvl": 1,
			"str": 0,
			"dex": 0,
			"int": 0,

			"hp": 0,
			"ad": 0,
			"md": 0,
			"armor": 0,
			"mr": 0,
			"ms": 0,
			"critchance": 0,
			"critdmg": 100,

			/*HIDDEN PARAMETERS*/
			"creationStage": 0
		};

		profiles[createHash(message.author.tag)] = profile;

		fs.writeFile('players.json', JSON.stringify(players), (err) => {
			if(err) {
				throw err;
			}

			console.log('Players updated.');
		});

		fs.writeFile('profiles.json', JSON.stringify(profiles), (err) => {
			if(err) {
				throw err;
			}

			console.log('Profiles updated');
		})

		message.channel.send("Profile created. Choose a name with \"!profile-name \" followed by your desired name. (Note: You can't play until you have chosen a name/gender/race/class.)");
	})

	commands(client, 'profile-name', (message) => {
		if(players[`${createHash(message.author.tag)}`] != message.author.tag) {
			message.channel.send("You don't have a profile yet. Create one by typing \"!create-profile\"");
			return;
		}

		let profile = profiles[createHash(message.author.tag)];

		if(profile.creationStage > 0) {
			message.channel.send("You have already chosen a name.");
			return;
		}
		if(profile.creationStage == 0) {
			profile.name = message.content.slice(14);
			profile.creationStage++;

			profiles[createHash(message.author.tag)] = profile;

			fs.writeFile('profiles.json', JSON.stringify(profiles), (err) => {
				if(err) {
					throw err;
				}

				console.log('Profiles updated');
			})

			message.channel.send(`Name chosen: ${profile.name}. Next, choose a gender with \"!profile-gender \" followed by your desired gender. Valid genders include: Male/Female/Other.`);
		}
	})

	commands(client, 'profile-gender', (message) => {
		if(players[`${createHash(message.author.tag)}`] != message.author.tag) {
			message.channel.send("You don't have a profile yet. Create one by typing \"!create-profile\"");
			return;
		}

		let profile = profiles[createHash(message.author.tag)];

		if(profile.creationStage == 0) {
			message.channel.send("You have not chosen a name yet. Choose a name with \"!profile-name \" followed by your desired name.");
			return;
		}
		if(profile.creationStage > 1) {
			message.channel.send("You have already chosen a gender.");
			return;
		}
		if(profile.creationStage == 1) {
			if(message.content.slice(16) != "Male" && message.content.slice(16) != "Female" && message.content.slice(16) != "Other") {
				message.channel.send("You must must choose a valid gender. These include: Male/Female/Other");
				return;
			}
			profile.gender = message.content.slice(16);
			profile.creationStage++;

			profiles[createHash(message.author.tag)] = profile;

			fs.writeFile('profiles.json', JSON.stringify(profiles), (err) => {
				if(err) {
					throw err;
				}

				console.log('Profiles updated');
			})

			message.channel.send(`Gender chosen: ${profile.gender}. Next, choose a race with \"!profile-race\". Valid races include: BLANK`);
		}
	})

	commands(client, 'profile-race', (message) => {
		if(players[`${createHash(message.author.tag)}`] != message.author.tag) {
			message.channel.send("You don't have a profile yet. Create one by typing \"!create-profile\"");
			return;
		}

		let profile = profiles[createHash(message.author.tag)];

		if(profile.creationStage == 0) {
			message.channel.send("You have not chosen a name yet. Choose a name with \"!profile-name \" followed by your desired name.");
			return;
		}
		if(profile.creationStage == 1) {
			message.channel.send("You have not chosen a gender yet. Choose a name with \"!profile-gender \" followed by your desired gender.");
			return;
		}
		if(profile.creationStage > 2) {
			message.channel.send("You have already chosen a race.");
			return;
		}
		if(profile.creationStage == 2) {
			if(message.content.slice(14) != "BLANK") {
				message.channel.send("You must must choose a valid gender. These include: BLANK");
				return;
			}
			profile.race = message.content.slice(14);
			profile.creationStage++;

			profiles[createHash(message.author.tag)] = profile;

			fs.writeFile('profiles.json', JSON.stringify(profiles), (err) => {
				if(err) {
						throw err;
					}

					console.log('Profiles updated');
				})

			message.channel.send(`Race chosen: ${profile.race}. Next, choose a class with \"!profile-class\". Valid classes include: BLANK`);
		}
	})

	commands(client, 'profile-class', (message) => {
		if(players[`${createHash(message.author.tag)}`] != message.author.tag) {
			message.channel.send("You don't have a profile yet. Create one by typing \"!create-profile\"");
			return;
		}

		let profile = profiles[createHash(message.author.tag)];

		if(profile.creationStage == 0) {
			message.channel.send("You have not chosen a name yet. Choose a name with \"!profile-name \" followed by your desired name.");
			return;
		}
		if(profile.creationStage == 1) {
			message.channel.send("You have not chosen a gender yet. Choose a gender with \"!profile-gender \" followed by your desired gender.");
			return;
		}
		if(profile.creationStage == 2) {
			message.channel.send("You have not chosen a race yet. Choose a race with \"!profile-race \" followed by your desired race.");
			return;
		}
		if(profile.creationStage > 3) {
			message.channel.send("You have already chosen a class.");
			return;
		}
		if(profile.creationStage == 3) {
			if(message.content.slice(15) != "BLANK") {
				message.channel.send("You must must choose a valid gender. These include: BLANK");
				return;
			}
			profile.class = message.content.slice(15);
			profile.creationStage++;

			profiles[createHash(message.author.tag)] = profile;

			fs.writeFile('profiles.json', JSON.stringify(profiles), (err) => {
				if(err) {
					throw err;
				}

				console.log('Profiles updated');
			})

			message.channel.send(`Class chosen: ${profile.class}. Your character has been created and you can now play.`);
		}
	})


	commands(client, 'hello', (message) => {
		const embed = new Discord.MessageEmbed()
			.setTitle(`Hello, ${message.author.username}.`);

		message.channel.send(embed);
	})
})

client.login(config.token)

