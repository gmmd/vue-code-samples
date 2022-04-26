import { Service } from '@/services/service'

export default (ctx) => {
	Service.prototype.$http = ctx.$http
	Service.prototype.$store = ctx.store
	Service.prototype.$notify = ctx.$notify //plug in later
	Service.prototype.$router = ctx.app.router
}