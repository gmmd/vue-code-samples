import axios from 'axios'
import axiosRetry from 'axios-retry';

export default ({ store, redirect }, inject) => {
	let instance = axios.create({
		baseURL: process.env.API_URL
	})
	instance.interceptors.request.use((request) => {
		if (store.state.user.accessToken)
			request.headers.Authorization = 'Bearer ' + store.state.user.accessToken
		return request
	})
	instance.interceptors.response.use((response) => {
		return response
	}, error => {
		if (error.response && error.response.status == 401) {
			// store.dispatch('user/logout').then(() => {
			// 	redirect('/')
			// })
		}
		return Promise.reject(error)
	})

	let retryCondition = (error) => {
		return axiosRetry.isNetworkOrIdempotentRequestError(error)
	}

	axiosRetry(instance, { retries: 3, retryDelay: axiosRetry.exponentialDelay, retryCondition });
	inject('http', instance)
}