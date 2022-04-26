import Vue from "vue"
import attributeGroup from "~/services/attribute-groups"
import { mutations as linkedMutations } from "~/util/linkedStateProperty"

export const state = () => ({
	data: [],
	baked: {},
	bakedBySlug: {}
})

export const getters = {
	getItemById: (state) => (id) => {
		return state.baked[id] || {};
	},
	getItemBySlug: (state) => (slug) => {
		return state.bakedBySlug[slug] || {}
	}
}

export const mutations = {
	set(state, payload) {
		state.data = payload;

		// baking
		state.data.forEach(item => {
			this.dispatch('attributeGroups/sortAttributes', item)
			Vue.set(state.baked, item.id, item)
			Vue.set(state.bakedBySlug, item.slug, item)
		})
	},
	add(state, payload) {
		state.data.push(payload)

		this.commit('attributeGroups/updateSharedLinks', {
			prop: 'attributes_ids',
			sharedProp: 'attribute_groups_ids',
			sharedStore: 'attributes',
			data: payload
		})
		this.commit('attributeGroups/updateSharedLinks', {
			prop: 'categories_ids',
			sharedProp: 'attribute_groups_ids',
			sharedStore: 'categories',
			data: payload
		})

		// baking
		this.dispatch('attributeGroups/sortAttributes', payload)
		Vue.set(state.baked, payload.id, payload)
		Vue.set(state.bakedBySlug, payload.slug, payload)

	},
	edit(state, payload) {
		this.commit('attributeGroups/updateSharedLinks', {
			prop: 'attributes_ids',
			sharedProp: 'attribute_groups_ids',
			sharedStore: 'attributes',
			...payload
		})
		this.commit('attributeGroups/updateSharedLinks', {
			prop: 'categories_ids',
			sharedProp: 'attribute_groups_ids',
			sharedStore: 'categories',
			...payload
		})

		delete state.bakedBySlug[payload.item.slug];
		Vue.set(state.bakedBySlug, payload.data.slug, payload.item);
		this.dispatch('attributeGroups/sortAttributes', payload.item)

		Object.keys(payload.data).forEach((key) => {
			Vue.set(payload.item, key, payload.data[key])
		})
	},
	delete(state, payload) {
		this.commit('attributeGroups/updateSharedLinks', {
			prop: 'attributes_ids',
			sharedProp: 'attribute_groups_ids',
			sharedStore: 'attributes',
			item: payload
		})
		this.commit('attributeGroups/updateSharedLinks', {
			prop: 'categories_ids',
			sharedProp: 'attribute_groups_ids',
			sharedStore: 'categories',
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
		await attributeGroup.getAll()
			.then(data => {
				commit('set', data)
			})
			.catch(error => { })
	},
	sortAttributes({ }, payload) {
		// sort
		payload.attributes_ids.sort((a, b) => {
			a = this.getters['attributes/getItemById'](a);
			b = this.getters['attributes/getItemById'](b);
			a = a.is_searchable * 2 + a.is_variable;
			b = b.is_searchable * 2 + b.is_variable;

			if (a < b)
				return 1;
			else if (a === b) {
				return 0;
			} else return -1;
		});
	}
}
