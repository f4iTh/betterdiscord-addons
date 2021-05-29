/**
 * @name USRBGBanners
 * @authorId 249957877999992833
 * @version 0.0.1
 * @description Adds USRBG backgrounds as banner images.
 */

module.exports = (() => {
	const config = {
		info: {
			name: 'USRBGBanners',
			authors: [
				{
					name: 'f4iTh',
					discord_id: '249957877999992833',
					github_username: 'f4iTh'
				}
			],
			version: '0.0.1',
			description: 'Adds USRBG backgrounds as banner images.',
            github: 'https://github.com/f4iTh/betterdiscord-addons',
            github_raw: 'https://raw.githubusercontent.com/f4iTh/betterdiscord-addons/master/src/Plugins/USRBGBanners/USRBGBanners.plugin.js'
		},
		changelog: [
			{
				title: 'Release',
				type: 'added',
				items: ['Initial release.']
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
					const { Patcher, WebpackModules } = Api;
					let CustomBannerList = [];
					return class USRBGBanners extends Plugin {
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
							this.populateBanners();
						}
						onStop() {
							this.promises.cancel();
							Patcher.unpatchAll();
						}
						async populateBanners() {
							let USRBG = await this.getUSRBGbackgrounds();
							Object.keys(USRBG).forEach((id) => (CustomBannerList[id] = USRBG[id].background));
						}
						async getUSRBGbackgrounds() {
							let response = await fetch('https://raw.githubusercontent.com/Discord-Custom-Covers/usrbg/master/dist/usrbg.json');
							return await response.json();
						}
						patchAll(promiseState) {
							this.patchUserPopoutHeader(promiseState);
							this.patchUserBanner(promiseState);
						}
						// TODO: replace explicit classnames with classnames from modules once available
						patchUserPopoutHeader(promiseState) {
							const UserPopoutHeader = WebpackModules.getModule((m) => m.default && m.default.displayName == 'UserPopoutHeader');

							if (promiseState.cancelled) return;
							Patcher.after(UserPopoutHeader, 'default', (_, [props], returnValue) => {
								if (!returnValue?.props?.children[2]?.props?.className || !(props?.user?.id in CustomBannerList)) return returnValue;

								returnValue.props.children[2].props.className = 'avatarWrapperNormal-2tu8Ts avatarWrapper-1-5NA0 avatarPositionPremium-1QenYe';
							});
						}
						async patchUserBanner(promiseState) {
							const UserBanner = WebpackModules.getModule((m) => m.default && m.default.displayName == 'UserBanner');

							if (promiseState.cancelled) return;
							Patcher.after(UserBanner, 'default', (_, [props], returnValue) => {
								if (!returnValue?.props?.className || !(props?.user?.id in CustomBannerList)) return returnValue;

								returnValue.props.className = 'profileBannerPremium-35utuo banner-2QYc2d';
								returnValue.props.style = {
									backgroundImage: `url(${CustomBannerList[props.user.id]})`
								};
							});
						}
					};
				};
				return plugin(Plugin, Api);
		  })(global.ZeresPluginLibrary.buildPlugin(config));
})();
