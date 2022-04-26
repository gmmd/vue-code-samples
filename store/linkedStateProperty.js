/**
 * Mutation for update linked params
 * mixin can loaded to stores, which have "baked" object in state
 * 
 * payload {
 *  prop: 'attribute_groups_ids', // direct links (ids)
 *  sharedProp: 'attributes_ids', // reversed links (ids)
 *  sharedStore: 'attributeGroups', // Store, which have reversed links
 *  item: link to store item,
 *  data: new data item
 * }
 */

export const mutations = {
	updateSharedLinks(state, payload) {
		let oldMap = new Map();
		let newMap = new Map();

		if (!payload.item) { // new element
			payload = {
				...payload,
				item: {
					id: payload.data.id,
					[payload.prop]: []
				}
			}
		} else if (!payload.data) { // deleted element
			payload = {
				...payload,
				data: {
					id: payload.item.id,
					[payload.prop]: []
				}
			}
		}

		payload.item[payload.prop].forEach((it) => oldMap.set(it, true));
		payload.data[payload.prop].forEach((it) => newMap.set(it, true));
		let pushItems = [];
		let deleteItems = [];
		payload.data[payload.prop].forEach((it) => {
			if (!oldMap.get(it)) {
				pushItems.push(it);
			}
		});
		payload.item[payload.prop].forEach((it) => {
			if (!newMap.get(it)) {
				deleteItems.push(it);
			}
		});
		deleteItems.forEach((it) => {
			this.commit(payload.sharedStore + '/editLink', {
				prop: payload.sharedProp,
				itemId: it,
				propId: payload.item.id,
				type: 'delete'
			})
		})
		pushItems.forEach((it) => {
			this.commit(payload.sharedStore + '/editLink', {
				prop: payload.sharedProp,
				itemId: it,
				propId: payload.item.id,
				type: 'create'
			})
		})
	},
	editLink(state, payload) {
		let item = state.baked[payload.itemId]
		if (payload.type == 'create') {
			item[payload.prop].push(payload.propId)
		} else {
			item[payload.prop].splice(item[payload.prop].indexOf(payload.propId), 1)
		}
	}
}