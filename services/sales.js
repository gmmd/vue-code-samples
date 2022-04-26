import { Service } from './service'

class Sales extends Service {
	constructor() {
		super();
	}

	create(data) {
		return this.$http.post(`/warehouses/sales`, data).then(response => {
			return response.data
		})
	}

	update(data) {
		return this.$http.put(`/warehouses/sales`, data).then(response => {
			return response.data
		})
	}

	return(data) {
		return this.$http.post(`/warehouses/sale_returns`, data).then(response => {
			return response.data
		})
	}

	get(id) {
		return this.$http.get(`/warehouses/sales/${id}`).then(response => {
			return response.data
		})
	}

	getReturns(model) {
		return this.$http.get(`/warehouses/sale_returns`, { params: { ...model } }).then(response => {
			return response.data
		})
	}

	getAll(model = {}) {
		return this.$http.get(`/warehouses/sales`, { params: { ...model } }).then(response => {
			return response.data
		})
	}

	warranty(id) {
		return this.$http.get(`warehouses/sales/${id}/warranty`, { responseType: 'blob', }).then(response => {
			const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
			return url
		})
	}

	deliver(sale) {
		return this.$http.post(`/warehouses/sales/deliver`, sale).then(response => {
			return response.data
		})
	}

	remove(id) {
		return this.$http.delete(`/warehouses/sales/${id}`).then(response => {
			return response.data
		})
	}
}

export default new Sales()