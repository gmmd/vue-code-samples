<template>
  <div class="card">
    <div v-if="title" class="card-header border-0 mb-0 pb-0">
      <h4 class="mb-0">{{ title }}</h4>
    </div>

    <div class="card-body px-0">
      <el-table
        stripe
        class="table-responsive"
        :data="localValue"
        :cell-class-name="(props) => (props.columnIndex == 0 && hasChildren ? 'p-1' : 'p-1 px-4')"
      >
        <el-table-column v-if="hasChildren" type="expand">
          <template slot-scope="{ row }">
            <el-table
              border
              stripe
              cell-class-name="p-1"
              header-row-class-name="thead-light"
              class="table-responsive rounded border-top-0"
              :data="(row.children || []).filter((el) => el.id != undefined)"
            >
              <el-table-column label="Наименование" prop="site_title" min-width="300px">
                <template slot-scope="{ row }">
                  <nuxt-link :to="`/products/${row.id}`">{{ row.site_title }}</nuxt-link>
                </template>
              </el-table-column>

              <el-table-column label="Цена за единицу" min-width="150px" align="center" prop="price">
                <template slot-scope="{ row }">
                  <span>{{ row.price | numFormat('0,0.00') }}</span>
                </template>
              </el-table-column>

              <el-table-column align="center" label="Pullout" min-width="70px">
                <template slot-scope="{ row }">
                  <i v-if="row.is_pullout" class="fas fa-check text-success"></i>
                  <i v-else class="fas fa-ban text-danger"></i>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>

        <el-table-column label="Название" min-width="250px" prop="site_title">
          <template slot-scope="{ row, $index }">
            <div class="row">
              <base-input class="col-10" input-classes="mb-0" name="value">
                <el-select
                  filterable
                  remote
                  loading-text="Поиск..."
                  value-key="site_title"
                  size="mini"
                  default-first-option
                  :remote-method="searchProduct"
                  @keyup.enter="addProduct"
                  @input="addProduct($event, $index)"
                  @visible-change="start($index, $event)"
                  :disabled="returning"
                  v-model="localValue[$index]"
                >
                  <el-option
                    v-for="product in [...foundProducts, localValue[$index]].filter(
                      (el, $i, arr) => !!el.id && arr.findIndex((el2) => el.id == el2.id) == $i
                    )"
                    :value="product"
                    :label="product.site_title"
                    :key="`${$index}_${product.id}`"
                    :disabled="product.disabled"
                  ></el-option>
                </el-select>
              </base-input>

              <template v-if="localValue[$index].id && hasChildren">
                <el-button
                  circle
                  size="mini"
                  class="col-auto"
                  icon="el-icon-plus"
                  v-if="getCategory(localValue[$index].categories_ids[0]).is_parent"
                  @click="showChildrenModal(row)"
                ></el-button>
              </template>
            </div>
          </template>
        </el-table-column>

        <el-table-column align="center" label="Pullout" v-if="pulloutToggle">
          <template slot-scope="{ $index, row }">
            <el-checkbox v-if="localValue[$index].id" v-model="row.is_pullout"></el-checkbox>
          </template>
        </el-table-column>

        <el-table-column
          v-if="!quantityOnly && !hidePrice"
          label="Цена за единицу"
          min-width="150px"
          align="center"
          prop="price"
        >
          <template slot-scope="{ $index, row }">
            <span v-if="localValue[$index].id && editPrice">
              <base-input v-if="localValue[$index].id" input-classes="mb-0 text-right" :rules="{ min: 1 }">
                <el-input size="mini" v-model="row.price" :disabled="returning"> </el-input>
              </base-input>
              <!-- v-money="money" -->
            </span>
            <span v-else-if="localValue[$index].id">{{ localValue[$index].price | numFormat('0,0.00') }}</span>
          </template>
        </el-table-column>

        <el-table-column v-if="returning" label="Исходное количество" min-width="150px" align="center" prop="quantity">
          <template slot-scope="{ row }">
            {{ row.sold_quantity }}
          </template>
        </el-table-column>

        <el-table-column v-if="!hideQuantity" label="Количество" min-width="150px" align="center" prop="quantity">
          <template slot-scope="{ $index, row }">
            <!-- min_value: +!returning, -->
            <base-input
              v-if="localValue[$index].id"
              input-classes="mb-0"
              :rules="{
                integer: true,
                max_value: returning ? row.sold_quantity : 10000,
              }"
            >
              <el-input-number size="mini" v-model="localValue[$index].quantity"></el-input-number>
            </base-input>
          </template>
        </el-table-column>

        <el-table-column
          v-if="!hideQuantity && !quantityOnly"
          label="Общая стоимость"
          min-width="150px"
          align="right"
          header-align="right"
          prop="cost"
        >
          <template slot-scope="{ $index }">
            <span v-if="localValue[$index].id">
              {{ calculateRow(localValue[$index]) | numFormat('0,0.00') }}
            </span>
          </template>
        </el-table-column>

        <el-table-column v-if="!returning" min-width="80px" align="right">
          <template slot-scope="{ $index, row }">
            <a
              v-if="(localValue[$index].quantity > 1 && branch) || localValue[$index].is_pullout"
              href
              @click.prevent="newBranch(row)"
              class="ml-3"
            >
              <i class="fas fa-code-branch"></i>
            </a>
            <a v-if="localValue[$index].id" href @click.prevent="removeProduct(row)" class="ml-3">
              <i class="el-icon-delete"></i>
            </a>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog :visible.sync="childrenModal" @close="closeChildrenModal">
      <template #title>
        <h5>Добавить товары</h5>
      </template>

      <product-picker
        ref="childrenRef"
        branch
        :title="parent.site_title"
        pulloutToggle
        hideQuantity
        :searchPrefix="searchPrefix"
        v-model="parent.children"
        :is-parent="false"
      />

      <template #footer>
        <div class="text-right">
          <el-button size="mini" @click="childrenModal = false">Отмена</el-button>
          <el-button size="mini" type="success" @click="childrenModal = false">OK</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script>
// Components
import { Select, Option, Table, TableColumn, InputNumber, Input, Button, Checkbox, Dialog } from 'element-ui'
import ProductPicker from './ProductPicker'

// Services
import productsService from '@/services/product'

// Utils
import { clone } from '@/util/clone'
import { mapGetters, mapState } from 'vuex'

export default {
  name: 'product-picker',
  props: {
    searchPrefix: {
      type: String,
      default: '',
    },
    title: String,
    editPrice: {
      type: Boolean,
      default: false,
    },
    vat: {
      type: Boolean,
      default: false,
    },
    sumsInput: {
      type: Boolean,
      default: false,
    },
    returning: {
      type: Boolean,
      default: false,
    },
    hideQuantity: {
      type: Boolean,
      default: false,
    },
    hidePrice: {
      type: Boolean,
      default: false,
    },
    preventPrice: {
      type: Boolean,
      default: false,
    },
    quantityOnly: {
      type: Boolean,
      default: false,
    },
    warehouseId: {
      type: [Number, String],
      default: null,
    },
    hasChildren: {
      type: Boolean,
      default: false,
    },
    isParent: {
      type: Boolean,
      default: true,
    },
    pulloutToggle: {
      type: Boolean,
      default: false,
    },
    value: {
      type: Array,
      default: () => [{}],
    },
    sumChilds: {
      type: Boolean,
      default: true,
    },
    branch: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    [Input.name]: Input,
    [Table.name]: Table,
    [Option.name]: Option,
    [Button.name]: Button,
    [Dialog.name]: Dialog,
    [Select.name]: Select,
    [Checkbox.name]: Checkbox,
    'product-picker': ProductPicker,
    [InputNumber.name]: InputNumber,
    [TableColumn.name]: TableColumn,
  },
  data() {
    return {
      foundProducts: [],
      prepared: [],
      parent: {},
      backupChildren: {},
      newItem: true,
      emited: false,
      childrenModal: false,
      localValue: this.value,
    }
  },
  methods: {
    searchProduct(name) {
      productsService
        .filter({
          stock: this.vat ? 'vat' : null,
          page: 1,
          search: `${this.searchPrefix}${name}`,
          per_page: 5,
          warehouse_id: this.warehouseId,
          out_of_stock: !this.warehouseId,
          is_child: !this.isParent,
        })
        .then((data) => {
          this.foundProducts = data.data.map((option) => {
            return { ...option, disabled: this.localValue.some((product) => product.id == option.id) }
          })
        })
    },

    addProduct($event, $index) {
      let price = !this.preventPrice ? $event.price : '0'

      if (this.sumsInput && !this.preventPrice) {
        price *= (1 + this.settings.discount / 100) * this.settings.exchange_rate
        price = Math.ceil(price / 1000) * 1000
      } else if (!this.editPrice && !this.preventPrice) {
        price = price * (1 + this.settings.discount / 100)
      }

      let product = {
        price,
        id: $event.id,
        product_id: $event.id,
        quantity: $event.quantity,
        is_pullout: typeof $event.is_pullout === 'boolean' ? $event.is_pullout : false,
        site_title: $event.site_title,
        children: $event.children ? $event.children : [{}],
        categories_ids: $event.categories_ids,
        warranty_period: $event.warranty_period,
        product: { price },
      }

      // this.localValue = this.localValue.map((el, index) => {
      //   return el.id == product.product_id && index == $index ? product : el
      // })
      this.localValue.splice($index, 1, product)

      if (this.newItem) {
        this.localValue.push({})
      }
      this.foundProducts = []

      this.emited = true
      this.$emit('input', this.localValue)
    },

    newBranch(row) {
      if (row.quantity !== 0) {
        row.quantity--
      }
      this.addProduct(
        clone({ ...row, quantity: 1, price: row.price / (1 + this.settings.discount / 100) }),
        this.localValue.length - 1
      )
    },

    start($index, open) {
      // this.foundProducts = this.foundProducts
      //   .map((option) => {
      //     return { ...option, disabled: this.localValue.some((product) => product.id == option.id) }
      //   })
      //   .filter((option) => option.id)

      if (open && this.localValue[$index].id) {
        if (this.preventPrice) this.localValue[$index].price = ''
        this.newItem = false
      } else this.newItem = true
    },

    removeProduct(row) {
      this.localValue.splice(this.localValue.indexOf(row), 1)
      this.emited = true
      this.$emit('input', this.localValue)
    },
    showChildrenModal(parent) {
      this.backupChildren = clone(parent)
      this.parent = parent
      this.childrenModal = true

      this.$nextTick(() => {
        this.$emit('pointer', { pointer: parent.children, ref: this.$refs.childrenRef })
      })
    },
    closeChildrenModal() {
      this.$emit('pointer', { pointer: this.localValue, ref: this })
    },

    calculateRow(parent) {
      let summ = +parent.price

      if (!this.sumChilds) {
        return parent.quantity * summ
      }

      ;(parent.children || []).forEach((child) => {
        if (child.id != undefined) {
          summ += this.sumsInput
            ? +child.price * this.settings.exchange_rate * (child.is_pullout ? -1 : 1)
            : +child.price * (child.is_pullout ? -1 : 1)
        }
      })
      return parent.quantity * summ
    },
  },
  mounted() {
    this.localValue = this.value
    this.foundProducts = this.value //.filter((el) => el.id != undefined)

    this.$emit('pointer', { pointer: this.localValue, ref: this })
  },
  watch: {
    value() {
      if (this.emited) {
        this.emited = false
        return
      }
      this.localValue = this.value
      this.foundProducts = this.value //.filter((el) => el.id != undefined)
    },
  },
  computed: {
    ...mapGetters({
      getCategory: 'categories/getItemById',
    }),
    ...mapState({
      settings: (state) => state.settings.data,
    }),
  },
}
</script>
