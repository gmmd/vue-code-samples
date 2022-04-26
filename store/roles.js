import Vue from 'vue'
import roles from "~/services/roles"

export const state = () => ({
	data: [],
	baked: {}
})

export const getters = {
	getItemById: (state) => (id) => {
		return state.baked[id] || {}
	}
}

export const mutations = {
	set(state, payload) {
		state.data = payload

		// baking
		state.data.forEach(item => {
			Vue.set(state.baked, item.id, item)
		})
	},
	add(state, payload) {
		if (!state.baked[payload.id]) {
			state.data.push(payload)

			// baking
			Vue.set(state.baked, payload.id, payload)
		}
	},
	edit(state, payload) {
		state.data = state.data.map(el => {
			return payload.id === el.id ? payload : el
		})

		// baking
		Vue.set(state.baked, payload.id, payload)

	}
}

export const actions = {
	async fetch({ commit }) {
		await roles.getAll()
			.then(data => {
				commit('set', data)
			})
			.catch(error => { })
	}
}