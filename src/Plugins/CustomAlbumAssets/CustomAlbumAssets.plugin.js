/**
 * @name CustomAlbumAssets
 * @authorId 249957877999992833
 * @version 0.0.1
 * @description Allows setting images for albums that don't have an image (local audio files through Spotify).
 */

module.exports = (() => {
	const config = {
		info: {
			name: 'CustomAlbumAssets',
			authors: [
				{
					name: 'f4iTh',
					discord_id: '249957877999992833',
					github_username: 'f4iTh'
				}
			],
			version: '0.0.1',
			description: "Allows setting images for albums that don't have an image (local audio files through Spotify).",
			github: 'https://github.com/f4iTh/betterdiscord-addons'
		}
	};
	var storedData = {};
	return !global.ZeresPluginLibrary
		? class {
				getName = () => config.info.name;
				getAuthor = () => config.info.authors.map(a => a.name).join(', ');
				getDescription = () => config.info.description;
				getVersion = () => config.info.version;
				load() {
					BdApi.showConfirmationModal(
						'Library Missing',
						`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
						{
							confirmText: 'Download Now',
							cancelText: 'Cancel',
							onConfirm: () => {
								require('request').get(
									'https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js',
									async (err, _, body) => {
										if (err)
											return require('electron').shell.openExternal(
												'https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js'
											);
										await new Promise(r =>
											require('fs').writeFile(
												require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'),
												body,
												r
											)
										);
									}
								);
							}
						}
					);
				}
				start() {}
				stop() {}
		  }
		: (([Plugin, Api]) => {
				const plugin = (Plugin, Api) => {
					const {
						DiscordContextMenu,
						DiscordModules,
						DiscordClasses,
						Patcher,
						PluginUtilities,
						WebpackModules,
						Utilities,
						Toasts
					} = Api;
					const { ModalStack, React } = DiscordModules;

					const Clickable = WebpackModules.findByDisplayName('Clickable');
					const TextInput = WebpackModules.getByDisplayName('TextInput');
					const { TooltipContainer: Tooltip } = WebpackModules.getByProps('TooltipContainer');

					const buttons = WebpackModules.getByProps('button');
					const alignments = WebpackModules.getByProps('justifyStart');
					const newmodal = WebpackModules.getByProps('fullscreenOnMobile', 'root');
					const scroller = WebpackModules.getByProps('scrollerBase');
					const colors = WebpackModules.getByProps('colorStandard');
					const textsizes = WebpackModules.getByProps('size14');
					const newinput = WebpackModules.getByProps('reset', 'description');
					const statusassets = WebpackModules.getByProps('assetsLargeImageProfile');
					const anchor = WebpackModules.getByProps('anchorUnderlineOnHover');

					class CustomAlbumAssetModal extends React.Component {
						constructor(props) {
							super(props);
							this.state = {
								imageUrl: this.props.data.url,
								inputRef: this.props.data.url
							};
						}
						close() {
							ModalStack.popWithKey('CustomAlbumAssets-Modal');
						}
						tryRemoveAsset(artist, album) {
							if (!this.settings.confirmDelete) {
								this.removeAsset(artist, album);
								this.forceUpdate();
								return;
							}
							BdApi.showConfirmationModal(
								'Remove asset',
								['Are you sure you want to remove the asset?'],
								{
									danger: true,
									confirmText: 'Confirm',
									onConfirm: () => {
										this.removeAsset(artist, album);
										this.forceUpdate();
									}
								}
							);
						}
						removeAsset(artist, album) {
							delete storedData[artist][album];
							PluginUtilities.saveData('CustomAlbumAssets', 'data', storedData);
							Toasts.info('Successfully removed album asset.');
						}
						render() {
							return React.createElement(
								'div',
								{
									className: `${newmodal.root} ${newmodal.small}`,
									id: 'CustomAlbumAssets-Modal'
								},
								React.createElement(
									'div',
									{
										className: `${alignments.horizontal} ${newmodal.header}`
									},
									React.createElement(
										'div',
										{
											className: `${DiscordClasses.Titles.h2} ${colors.colorStandard}`
										},
										`${this.props.data.artist} \u2014 ${this.props.data.album}`
									)
								),
								React.createElement(
									'div',
									{
										className: `${newmodal.content} ${scroller.thin}`
									},
									React.createElement(
										'div',
										{},
										React.createElement(
											'div',
											{
												className: `${DiscordClasses.Titles.h5} ${DiscordClasses.Titles.defaultMarginh5} ${textsizes.size14} ${colors.colorStandard}`
											},
											'Image Url'
										),
										React.createElement(TextInput, {
											className: `${newinput.input}`,
											placeholder: this.state.imageUrl ?? '',
											value: this.state.inputRef ?? '',
											onChange: e => {
												this.setState({ inputRef: e });
											}
										})
									),
									React.createElement(
										'button',
										{
											type: 'button',
											className: `${buttons.button} ${newinput.reset} ${buttons.lookLink} ${buttons.colorBrand} ${buttons.grow}`,
											onClick: () => {
												this.tryRemoveAsset(artist, album);
											}
										},
										React.createElement(
											'div',
											{
												className: `${buttons.contents}`,
												onClick: () => {
													this.setState({ inputRef: '' });
												}
											},
											'Reset Image Url'
										)
									)
								),
								React.createElement(
									'div',
									{
										className: `${newmodal.footer} ${alignments.horizontalReverse} ${alignments.directionRowReverse}`
									},
									React.createElement(
										'button',
										{
											type: 'button',
											className: `${buttons.button} ${buttons.colorBrand} ${buttons.lookFilled} ${buttons.sizeMedium} ${buttons.grow}`,
											onClick: () => {
												try {
													const url = this.state.inputRef ?? '';
													this.setState({ imageUrl: url });

													const { artist, album } = this.props.data;
													const data = Object.assign(storedData, {
														[artist]: { [album]: url }
													});

													PluginUtilities.saveData('CustomAlbumAssets', 'data', data);
													Toasts.success(`Successfully saved changes.`);

													this.close();
												} catch (ex) {
													console.error(ex);
													Toasts.error(
														'Somehting went wrong, check the console for more details.'
													);
												}
											}
										},
										React.createElement(
											'div',
											{
												className: `${buttons.contents}`
											},
											'Save Changes'
										)
									),
									React.createElement(
										'button',
										{
											type: 'button',
											className: `${buttons.button} ${buttons.colorPrimary} ${buttons.lookLink} ${buttons.sizeMedium} ${buttons.grow}`,
											onClick: () => {
												this.close();
											}
										},
										React.createElement(
											'div',
											{
												className: `${buttons.contents}`
											},
											'Cancel'
										)
									)
								)
							);
						}
					}

					class CustomAlbumAsset extends React.Component {
						getClassName(type) {
							switch (type) {
								case 'Modal':
									return `${statusassets.assetsLargeImageProfile}`;
								case 'Popout':
									return `${statusassets.assetsLargeImageUserPopout}`;
								default:
									return '';
							}
						}
						tryRemoveAsset(artist, album) {
							if (!this.settings.confirmDelete) {
								this.removeAsset(artist, album);
								this.forceUpdate();
								return;
							}
							BdApi.showConfirmationModal(
								'Remove asset',
								['Are you sure you want to remove the asset?'],
								{
									danger: true,
									confirmText: 'Confirm',
									onConfirm: () => {
										this.removeAsset(artist, album);
										this.forceUpdate();
									}
								}
							);
						}
						removeAsset(artist, album) {
							delete storedData[artist][album];
							PluginUtilities.saveData('CustomAlbumAssets', 'data', storedData);
							Toasts.info('Successfully removed album asset.');
						}
						render() {
							const { artist, album, which } = this.props.data;
							const url = Utilities.getNestedProp(storedData, `${artist}.${album}`);
							let MenuItems = [
								{
									type: 'text',
									label: `${url ? 'Edit' : 'Add'} album asset`,
									action: () => {
										ModalStack.push(
											CustomAlbumAssetModal,
											{
												name: `${album} Assets`,
												data: {
													artist,
													album,
													url
												}
											},
											'CustomAlbumAssets-Modal'
										);
									}
								}
							];
							if (url)
								MenuItems.unshift({
									type: 'text',
									label: 'Remove album asset',
									danger: true,
									action: () => {
										this.tryRemoveAsset(artist, album);
									}
								});

							return React.createElement(
								Tooltip,
								{
									text: album,
									className: `${statusassets.assets}`
								},
								React.createElement(
									Clickable,
									{
										tag: 'a',
										className: `${anchor.anchor} ${anchor.anchorUnderlineOnHover}`,
										role: 'button',
										onContextMenu: e => {
											DiscordContextMenu.openContextMenu(
												e,
												DiscordContextMenu.buildMenu(MenuItems)
											);
										}
									},
									React.createElement('img', {
										src: url,
										className: this.getClassName(which),
										alt: album
									})
								)
							);
						}
					}

					return class CustomAlbumAssets extends Plugin {
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
						/*
                        TODO: implement settings panel
                            * TextInput not co-operating when opening modal through plugin settings?
                        */
						onStart() {
							this.promises.restore();
							this.patchAll(this.promises.state);
							storedData = PluginUtilities.loadData(this.getName(), 'data', {});
						}
						onStop() {
							this.promises.cancel();
							Patcher.unpatchAll();
						}
						patchAll(promiseState) {
							this.patchUserActivity(promiseState);
						}
						async patchUserActivity(promiseState) {
							const UserActivity = WebpackModules.getModule(
								m => m.default && m.default.displayName == 'UserActivity'
							);

							if (promiseState.cancelled) return;
							Patcher.after(
								UserActivity.default.prototype,
								'renderImage',
								(thisObject, [props], returnValue) => {
									if (
										returnValue != null ||
										props.type != 2 ||
										!['Profile Popout', 'Profile Modal'].some(el =>
											el.includes(thisObject?.props?.source)
										)
									)
										return returnValue;

									return React.createElement(CustomAlbumAsset, {
										data: {
											which: thisObject?.props?.source?.split(' ')[1] ?? '',
											artist: props?.state ?? 'Unknown artist',
											album: props?.assets?.large_text ?? 'Unknown album'
										}
									});
								}
							);
						}
					};
				};
				return plugin(Plugin, Api);
		  })(global.ZeresPluginLibrary.buildPlugin(config));
})();
