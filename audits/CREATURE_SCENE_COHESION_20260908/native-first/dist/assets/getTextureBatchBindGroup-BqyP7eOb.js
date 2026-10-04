import { Ct as init_Texture, St as Texture, g as init_BindGroup, h as BindGroup, nn as __esmMin } from "./Geometry-CgCjw-Bj.js";
//#region port/v2/node_modules/pixi.js/lib/rendering/batcher/gpu/getTextureBatchBindGroup.mjs
function getTextureBatchBindGroup(textures, size, maxTextures) {
	let uid = 2166136261;
	for (let i = 0; i < size; i++) {
		uid ^= textures[i].uid;
		uid = Math.imul(uid, 16777619);
		uid >>>= 0;
	}
	return cachedGroups[uid] || generateTextureBatchBindGroup(textures, size, uid, maxTextures);
}
function generateTextureBatchBindGroup(textures, size, key, maxTextures) {
	const bindGroupResources = {};
	let bindIndex = 0;
	for (let i = 0; i < maxTextures; i++) {
		const texture = i < size ? textures[i] : Texture.EMPTY.source;
		bindGroupResources[bindIndex++] = texture.source;
		bindGroupResources[bindIndex++] = texture.style;
	}
	const bindGroup = new BindGroup(bindGroupResources);
	cachedGroups[key] = bindGroup;
	return bindGroup;
}
var cachedGroups;
var init_getTextureBatchBindGroup = __esmMin((() => {
	init_BindGroup();
	init_Texture();
	cachedGroups = {};
}));
//#endregion
export { init_getTextureBatchBindGroup as n, getTextureBatchBindGroup as t };
