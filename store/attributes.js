import Vue from "vue"
import attributes from "~/services/attributes"
import { mutations as linkedMutations } from "~/util/linkedStateProperty"

export const state = () => ({
	data: [],
	baked: {},
	bakedBySlug: {}
})

export const getters = {
	getItemById: (state) => (id) => {
		return state.baked[id] || {};
		let result = state.data.find((item) => item.id == id)
		return result || {}
	},
	getItemBySlug: (state) => (slug) => {
		return state.bakedBySlug[slug] || {}
	}
}

export const mutations = {
	set(state, payload) {
		state.data = payload

		// baking
		state.data.forEach(item => {
			Vue.set(state.baked, item.id, item)
		})
		state.data.forEach(item => {
			Vue.set(state.bakedBySlug, item.slug, item)
		})
	},
	add(state, payload) {
		state.data.push(payload)

		this.commit('attributes/updateSharedLinks', {
			prop: 'attribute_groups_ids',
			sharedProp: 'attributes_ids',
			sharedStore: 'attributeGroups',
			data: payload
		})

		// baking
		Vue.set(state.baked, payload.id, payload)

		Vue.set(state.bakedBySlug, payload.slug, payload)

	},
	edit(state, payload) {
		this.commit('attributes/updateSharedLinks', {
			prop: 'attribute_groups_ids',
			sharedProp: 'attributes_ids',
			sharedStore: 'attributeGroups',
			...payload
		})

		delete state.bakedBySlug[payload.item.slug];
		Vue.set(state.bakedBySlug, payload.data.slug, payload.item);

		Object.keys(payload.data).forEach((key) => {
			Vue.set(payload.item, key, payload.data[key])
		})
	},
	delete(state, payload) {
		this.commit('attributes/updateSharedLinks', {
			prop: 'attribute_groups_ids',
			sharedProp: 'attributes_ids',
			sharedStore: 'attributeGroups',
			item: payload
		})

		delete state.baked[payload.id]
		delete state.bakedBySlug[payload.slug]
		state.data.splice(state.data.indexOf(payload), 1)
	},
	...linkedMutations
}
export const actions = {
	async fetch({ commit }) {
		await attributes.getAll()
			.then(data => {
				commit('set', data)
			})
			.catch(error => { })
	}
}
