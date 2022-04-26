<template>
  <div class="card">
    <div class="card-header border-0">
      <div class="row justify-content-between align-items-center">
        <div class="col mb-2 mb-lg-0">
          <h3 class="mb-0">{{ title }}</h3>
        </div>
      </div>
    </div>

    <el-table
      class="table-responsive align-items-center table-striped"
      header-row-class-name="thead-light"
      row-key="id"
      lazy
      :data="data"
      :cell-class-name="cellClassName"
      @sort-change="$emit('sort-change', $event)"
      @filter-change="$emit('filter-change', $event)"
      @expand-change="$emit('expand-change', $event)"
    >
      <el-table-column type="expand">
        <template slot-scope="{ row: purchase }">
          <el-table
            border
            class="rounded border-top-0"
            v-loading="loading"
            :data="purchase.products"
            cell-class-name="p-1"
          >
            <el-table-column label="#ID" prop="id" sortable></el-table-column>
            <el-table-column label="Наименование" prop="site_title" min-width="300px">
              <template slot-scope="{ row }">
                <nuxt-link :to="`/products/${row.id}`">{{ row.site_title }}</nuxt-link>
              </template>
            </el-table-column>

            <el-table-column align="center" label="Количество">
              <template slot-scope="{ row }">{{ row.pivot.quantity }}Шт</template>
            </el-table-column>

            <el-table-column align="center" label="Цена на единицу">
              <template slot-scope="{ row }">
                {{ $filters.currency(row.pivot.cost, getCurrency(getAccount(purchase.account_id).currency_id)) }}
              </template>
            </el-table-column>

            <el-table-column align="center" label="Таможенная стоимость">
              <template slot-scope="{ row }">
                {{
                  $filters.currency(row.pivot.customs_cost, getCurrency(getAccount(purchase.account_id).currency_id))
                }}
              </template>
            </el-table-column>

            <el-table-column align="center" label="Доп. расходы на единицу">
              <template slot-scope="{ row }">
                {{ $filters.currency(row.pivot.outgoings_amount, mainCurrency) }}
              </template>
            </el-table-column>
          </el-table>

          <div class="mt-5" v-if="purchase.comments">
            <span class="text-sm">Комментарий:</span>
            <p class="p-2 border rounded mb-0">{{ purchase.comments }}</p>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="#ID" align="center" prop="id">
        <template slot-scope="{ row }">
          <nuxt-link :to="`/finance/purchases/${row.id}`">{{ row.id }}</nuxt-link>
        </template>
      </el-table-column>

      <el-table-column
        label="Поставщик"
        min-width="100px"
        :filters="!isProductPage ? suppliers : null"
        column-key="supplier_ids"
      >
        <template slot-scope="{ row }">
          <div>{{ row.supplier.name }}</div>
        </template>
      </el-table-column>

      <el-table-column
        label="Склад"
        min-width="100px"
        :filters="!isProductPage ? warehouses : null"
        column-key="warehouse_ids"
      >
        <template slot-scope="{ row }">
          <div>{{ getWarehouseById(row.warehouse_id).name }}</div>
        </template>
      </el-table-column>

      <el-table-column
        label="Метод оплаты"
        min-width="100px"
        :filters="!isProductPage ? accounts : null"
        column-key="account_ids"
      >
        <template slot-scope="{ row }">
          <div>{{ getAccount(row.account_id).payment_method_name }}</div>
        </template>
      </el-table-column>

      <el-table-column label="Дата создания" min-width="110px" prop="created_at" sortable>
        <template slot-scope="{ row }">
          <div>{{ row.created_at | moment('DD.MM.Y') }}</div>
        </template>
      </el-table-column>

      <el-table-column label="Дата закупки" min-width="110px" prop="purchase_date" :sort-method="() => 0" sortable>
        <template slot-scope="{ row }">
          <div>{{ row.purchase_date }}</div>
        </template>
      </el-table-column>

      <el-table-column
        v-if="approved && !isProductPage"
        label="Дата подтверждения"
        min-width="110px"
        prop="purchase_date"
        sortable
      >
        <template slot-scope="{ row }">
          <div>{{ row.approved_at | moment('DD.MM.yyyy') }}</div>
        </template>
      </el-table-column>

      <el-table-column label="Общая сумма" align="right" min-width="100px" :sort-method="() => 0" sortable>
        <template slot-scope="{ row }">
          {{ $filters.currency(row.total_cost, mainCurrency) }}
        </template>
      </el-table-column>

      <el-table-column v-if="!isProductPage" min-width="180px" align="right">
        <template slot="header" slot-scope="{}">
          <el-input v-model="filter.search" @input="$emit('search', filter)" size="mini" placeholder="Поиск" />
        </template>
        <div slot-scope="{ row }" class="table-actions">
          <template v-if="!approved && row.type == 'PURCHASE'">
            <el-button v-can:update="'purchase_approvement'" type="primary" size="small" @click="$emit('approve', row)">
              Подтвердить
            </el-button>
          </template>

          <el-tooltip
            v-if="getWarehouseById(row.warehouse_id).is_virtual || row.type != 'PURCHASE'"
            v-can:update="['purchases', 'household_purchases']"
            content="Редактировать"
            placement="top"
          >
            <a href="#!" @click.prevent="$emit('edit', row)" class="table-action"><i class="fas fa-pen"></i></a>
          </el-tooltip>
        </div>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
// Components
import { Table, TableColumn, Tooltip, Button, Pagination } from 'element-ui'

// Utils
import { mapGetters, mapState } from 'vuex'

export default {
  name: 'purchases-table',
  components: {
    [Tooltip.name]: Tooltip,
    [Button.name]: Button,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    [Pagination.name]: Pagination,
  },
  props: {
    approved: {
      type: Boolean,
      default: false,
    },
    data: Array,
    title: String,
    pageName: {
      type: String,
      default: 'purchases',
    },
  },
  data() {
    return {
      loading: false,
      filter: {
        search: '',
        period: [],
      },
      exportModel: {
        name: 'purchases',
      },
    }
  },
  methods: {
    cellClassName({ row, columnIndex }) {
      if (columnIndex == 0) return 'p-0'
      if (row.type != 'PURCHASE') return 'text-muted'
    },
  },
  computed: {
    isProductPage() {
      return this.pageName === 'product'
    },
    ...mapGetters({
      getWarehouseById: 'warehouses/getItemById',
      getAccount: 'accounts/getItemById',
      getCurrency: 'currency/getItemById',
      mainCurrency: 'currency/getMain',
    }),
    ...mapState({
      suppliers: (state) => state.suppliers.data.map(({ name: text, id: value }) => ({ text, value })),
      warehouses: (state) => state.warehouses.data.map(({ name: text, id: value }) => ({ text, value })),
      accounts: (state) =>
        state.accounts.data
          .filter((el) => el.is_active)
          .map(({ payment_method_name: text, id: value }) => ({ text, value })),
    }),
  },
}
</script>
