<template>
  <div class="card">
    <div v-if="!isProductPage" class="card-header border-0">
      <div class="row justify-content-between align-items-center">
        <div class="col"><h3 class="mb-0">Продажи</h3></div>

        <div class="col-auto mt-md-0 mt-2">
          <client-only>
            <date-range-field size="mini" :value="filter.period" @change="handlePeriodChange" />
          </client-only>
        </div>

        <div class="col-auto mt-md-0 mt-2">
          <el-tooltip content="Экспортировать в .xls" placement="top" v-can:create="'sales_exports'">
            <base-button @click="handleExport()" icon size="sm">
              <span class="btn-inner--icon"><i class="fas fa-file-excel"></i></span>
              <span class="btn-inner--text">Экспортировать</span>
            </base-button>
          </el-tooltip>

          <el-tooltip v-can:create="'sales'" content="Добавить" placement="top">
            <nuxt-link to="/finance/sales/add" class="btn btn-neutral btn-icon btn-sm">
              <span class="btn-inner--icon"><i class="fas fa-plus"></i></span>
              <span class="btn-inner--text">Добавить</span>
            </nuxt-link>
          </el-tooltip>
        </div>
      </div>
    </div>

    <exports-table v-if="!isProductPage" class="px-3 py-2" :name="exportModel.name" ref="exportTable" v-can:list="'sales_exports'" />

    <el-table
      class="table-responsive align-items-center table-striped"
      header-row-class-name="thead-light"
      :data="data"
      :cell-class-name="cellClassName"
      @sort-change="$emit('sort-change', $event)"
      @filter-change="$emit('filter-change', $event)"
    >
      <el-table-column v-if="!isProductPage" type="expand">
        <template slot-scope="{ row }">
          <el-table border stripe row-key="id" class="rounded border-top-0" cell-class-name="p-1" :data="row.products">
            <el-table-column label="Наименование" prop="site_title" min-width="300px">
              <template slot-scope="{ row }">
                <nuxt-link :to="`/products/${row.product_id}`">
                  {{ row.is_pullout ? '-' : '+' }} {{ row.product.site_title }}
                </nuxt-link>
              </template>
            </el-table-column>

            <el-table-column align="center" label="Количество">
              <template slot-scope="{ row }">{{ row.quantity }}Шт</template>
            </el-table-column>
          </el-table>

          <div class="mt-3" v-if="row.comments">
            <h5 class="label h5 mt-3">Комментарий:</h5>
            <pre class="p-2 border rounded mb-0">{{ row.comments }}</pre>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="#ID" align="center" prop="id" min-width="50px">
        <template slot-scope="{ row }">
          <nuxt-link v-if="can(['read-sales'])" :to="`/finance/sales/${row.id}`">{{ row.id }}</nuxt-link>
          <p v-else class="mb-0">{{ row.id }}</p>
        </template>
      </el-table-column>

      <el-table-column label="Заказчик" prop="customer" min-width="130px">
        <template slot-scope="{ row }">
          <nuxt-link :to="`/users/customers/${row.customer.id}`">{{ row.customer.name }}</nuxt-link>
        </template>
      </el-table-column>

      <el-table-column label="Склад" min-width="80px" :filters="!isProductPage ? warehouses : null" column-key="warehouse_ids">
        <template slot-scope="{ row }">
          <div>{{ getWarehouseById(row.warehouse_id).name }}</div>
        </template>
      </el-table-column>

      <el-table-column
        label="Метод оплаты"
        min-width="110px"
        filter-multiple
        :filters="!isProductPage ? accounts : null"
        column-key="account_ids"
      >
        <template slot-scope="{ row }">
          <span class="badge badge-info" v-for="account in row.accounts" :key="account.id">
            {{ account.payment_method_name }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="Дата" align="center" min-width="90px" prop="created_at" sortable>
        <template slot-scope="{ row }">
          <div>{{ row.sold_at || row.reserved_at || row.created_at | moment('DD.MM.Y') }}</div>
        </template>
      </el-table-column>

      <el-table-column
        label="Общая сумма"
        align="right"
        min-width="70px"
        prop="total_price"
        :sort-method="() => 0"
        sortable
      >
        <template slot-scope="{ row }">
          {{ $filters.currency(row.total_price, mainCurrency) }}
        </template>
      </el-table-column>

      <el-table-column
        label="Договор"
        align="right"
        min-width="80px"
        prop="contract_number"
        column-key="status"
        :filter-multiple="false"
        :filters="!isProductPage ? [
          { text: 'Забронирован', value: 'reserved' },
          { text: 'Продан', value: 'sold' },
          { text: 'Открыт', value: 'open' },
          { text: 'Закрыт', value: 'closed' },
          { text: 'Неоплачен', value: 'unpaid' },
          { text: 'Оплачен', value: 'paid' },
        ] : null"
      >
        <template v-slot="{ row }">
          <div>{{ (row.contract || {}).contract_number }}</div>
          <div>{{ row.zoodpay_transaction_id }}</div>
          <div>{{ row.contract_number }}</div>
        </template>
      </el-table-column>

      <el-table-column class="action" min-width="180px" align="right">
        <template v-if="!isProductPage" slot="header" slot-scope="{}">
          <el-input v-model="filter.search" @input="$emit('search', filter)" size="mini" placeholder="Поиск" />
        </template>

        <template slot-scope="{ row }" class="table-actions">
          <div class="d-flex flex-row justify-content-end align-items-center">
            <div v-can:create="'delivery'" class="col-auto" v-if="!row.delivered && row.sold && !isProductPage">
              <base-button size="sm" type="primary" @click="$emit('deliver', row)"> Доставил </base-button>
            </div>
            <badge class="bg-gray ml-2" v-if="row.reserved">Забронирован</badge>
            <badge class="bg-gray ml-2" v-if="row.sold">Продан</badge>
            <badge class="bg-gray ml-2" v-if="!row.reserved && !row.sold">Черновик</badge>

            <template v-if="getContractRequiredAccount(row)">
              <badge class="bg-success ml-2" v-if="row.closed">Закрыт</badge>
              <badge class="bg-danger ml-2" v-else-if="!row.closed">Открыт</badge>
            </template>
          </div>
        </template>
      </el-table-column>

      <el-table-column v-if="isProductPage" align="center" label="Количество">
        <template slot-scope="{ row }">{{ getProduct(row, productId).quantity || null }}Шт</template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
// Helper
import DateRangeField from '@/components/tables/helpers/DateRangeField'
import ExportsTable from '@/components/tables/helpers/ExportsTable'

// Components
import { Table, TableColumn, DropdownMenu, DropdownItem, Dropdown, Tooltip } from 'element-ui'

// Utils
import { mapGetters, mapState } from 'vuex'

export default {
  name: 'sales-table',
  components: {
    ExportsTable,
    DateRangeField,
    [Tooltip.name]: Tooltip,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    [Dropdown.name]: Dropdown,
    [DropdownItem.name]: DropdownItem,
    [DropdownMenu.name]: DropdownMenu,
  },
  props: {
    data: Array,
    title: String,
    pageName: {
      type: String,
      default: 'sales',
    },
    productId: {
      type: Number,
      default: null,
    }
  },
  data() {
    return {
      filter: {
        search: '',
        period: [],
      },
      exportModel: {
        name: 'sales',
      },
    }
  },
  methods: {
    handleExport() {
      this.exportModel.date_from = this.filter.period[0] ? this.filter.period[0] : null
      this.exportModel.date_to = this.filter.period[1] ? this.filter.period[1] : null
      this.$http.post('exports', this.exportModel).then((res) => {
        this.$refs.exportTable.handleUpdate()
      })
    },
    handlePeriodChange(e) {
      this.filter.period = e
      this.$emit('search', this.filter)
    },
    cellClassName({ row, columnIndex }) {
      if (columnIndex == 0) return 'p-0'
      if (row.paid) return 'text-muted'
    },
    getProduct(row, productId){
      return row.products.find((el) => el.product_id == productId)
    },
    getContractRequiredAccount(row){
      return row.accounts.find(account => account.is_contract_required)
    }
  },
  computed: {
    isProductPage() {
      return this.pageName === 'product'
    },
    ...mapState({
      warehouses: (state) => state.warehouses.data.map(({ name: text, id: value }) => ({ text, value })),
      accounts: (state) =>
        state.accounts.data
          .filter((el) => el.is_active)
          .map(({ payment_method_name: text, id: value }) => ({ text, value })),
    }),
    ...mapGetters({
      getWarehouseById: 'warehouses/getItemById',
      getAccountById: 'accounts/getItemById',
      can: 'user/hasPermissions',
      mainCurrency: 'currency/getMain',
    }),
  },
}
</script>
<style lang="scss">
.el-table__footer-wrapper td {
  padding: 0.25rem !important;
}
.text-muted {
  color: #c4c6cf !important;
}
</style>
