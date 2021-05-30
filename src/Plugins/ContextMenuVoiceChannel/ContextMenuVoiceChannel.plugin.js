/**
 * @name ContextMenuVoiceChannel
 * @authorId 249957877999992833
 * @version 0.0.2
 * @description Requires using context menu to join voice channels.
 * @website https://github.com/f4iTh/betterdiscord-addons
 * @source https://github.com/f4iTh/betterdiscord-addons/tree/master/src/Plugins/ContextMenuVoiceChannel
 * @updateUrl https://raw.githubusercontent.com/f4iTh/betterdiscord-addons/master/src/Plugins/ContextMenuVoiceChannel/ContextMenuVoiceChannel.plugin.js
 */

module.exports = (() => {
	const config = {
		info: {
			name: 'ContextMenuVoiceChannel',
			authors: [
				{
					name: 'f4iTh',
					discord_id: '249957877999992833',
					github_username: 'f4iTh'
				}
			],
			version: '0.0.2',
			description: 'Requires using context menu to join voice channels.',
            github: 'https://github.com/f4iTh/betterdiscord-addons',
            github_raw: 'https://raw.githubusercontent.com/f4iTh/betterdiscord-addons/master/src/Plugins/ContextMenuVoiceChannel/ContextMenuVoiceChannel.plugin.js'
		},
		changelog: [
			{
				title: 'Release',
				type: 'added',
				items: ['Initial release.', 'Clicking voice channel mentions no longer joins the voice channel.']
			}
		]
	};

	return !global.ZeresPluginLibrary
		? class {
				getName = () => config.info.name;
				getAuthor = () => config.info.authors.map((a) => a.name).join(', ');
				getDescription = () => config.info.description;
				getVersion = () => config.info.version;
				load() {
					BdApi.showConfirmationModal('Library Missing', `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
						confirmText: 'Download Now',
						cancelText: 'Cancel',
						onConfirm: () => {
							require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (err, _, body) => {
								if (err) return require('electron').shell.openExternal('https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js');
								await new Promise((r) => require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
							});
						}
					});
				}
				start() {}
				stop() {}
		  }
		: (([Plugin, Api]) => {
				const plugin = (Plugin, Api) => {
					const { DCM, Patcher, Toasts, Utilities, WebpackModules } = Api;
					let voiceChannels = [];
					return class ContextMenuVoiceChannel extends Plugin {
						constructor() {
							super();
							this.promises = {
								state: {
									cancelled: false
								},
								cancel() {
									this.state.cancelled = true;
								},
								restore() {
									this.state.cancelled = false;
								}
							};
						}
						onStart() {
							this.promises.restore();
							this.patchAll(this.promises.state);
						}
						onStop() {
							this.promises.cancel();
							Patcher.unpatchAll();
						}
						// TODO: add ability to join voice channel from messages containing a voice channel mention?
						patchAll(promiseState) {
							this.patchVoiceChannels(promiseState);
							this.patchVoiceChannelContextMenu(promiseState);
							this.patchMentions(promiseState);
						}
						patchVoiceChannels(promiseState) {
							const ChannelItem = WebpackModules.getModule((m) => m?.default?.displayName === 'ChannelItem');

							if (promiseState.cancelled) return;
							Patcher.before(ChannelItem, 'default', (_, [props], __) => {
								if (props?.channel?.type !== 2) return;

								// better way to handle?
								voiceChannels[props?.channel?.guild_id] = { [props?.channel?.id]: props.onClick };
								props.onClick = () => void 0;
							});
						}
						patchVoiceChannelContextMenu(promiseState) {
							const ChannelListVoiceChannelContextMenu = WebpackModules.getModule((m) => m?.default?.displayName === 'ChannelListVoiceChannelContextMenu');

							if (promiseState.cancelled) return;
							Patcher.after(ChannelListVoiceChannelContextMenu, 'default', (_, [props], returnValue) => {
								const children = Utilities.getNestedProp(returnValue, 'props.children.0.props.children');
								const menuItem = DCM.buildMenuItem({
									label: 'Join Voice Channel',
									id: 'join-voice-channel',
									danger: true,
									action: (_) => {
										const joinChannel = Utilities.getNestedProp(voiceChannels, `${props.channel.guild_id}.${props.channel.id}`);
										if (joinChannel == null || typeof joinChannel !== 'function') return;
										joinChannel();
									}
								});
								if (Array.isArray(children)) children.splice(0, 0, menuItem);
								else returnValue.props.children[0].props.children = [menuItem, children];
							});
						}
						patchMentions(promiseState) {
							const Mention = WebpackModules.getModule((m) => m?.default?.displayName === 'Mention');

							if (promiseState.cancelled) return;
							Patcher.after(Mention, 'default', (_, __, returnValue) => {
								const isVoiceChannel = Utilities.getNestedProp(returnValue, 'props.children.0.props.aria-label');
								if (!isVoiceChannel || isVoiceChannel !== 'Voice Channel') return;

								returnValue.props.onClick = () => void 0;
							});
						}
					};
				};
				return plugin(Plugin, Api);
		  })(global.ZeresPluginLibrary.buildPlugin(config));
})();
