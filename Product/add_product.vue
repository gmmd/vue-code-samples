<template>
  <div>
    <base-header class="pb-6">
      <div class="row align-items-center py-4">
        <div class="col-auto">
          <base-button size="sm" @click="$router.go(-1)" class="primary">Назад</base-button>
        </div>
        <div class="col-auto"><h3 class="label">Добавить</h3></div>
      </div>
    </base-header>

    <div class="container-fluid mt--6" v-loading="loading">
      <div class="card pb-2">
        <el-steps :active="step" align-center finish-status="success" process-status="proccess">
          <el-step title="Шаг 1" icon="fas fa-file" description="Тип документа" />
          <el-step title="Шаг 2" icon="fas fa-pallet" description="Продажа" />
          <el-step v-if="sale.sold" title="Шаг 3" icon="fas fa-wallet" description="Методы оплаты" />
          <el-step v-if="sale.sold && warranties" title="Шаг 4" icon="fas fa-barcode" description="Серийные номера" />
        </el-steps>
      </div>

      <validation-observer v-slot="{ handleSubmit }" class="pb-3" tag="div" ref="form">
        <transition name="el-fade-in" mode="out-in">
          <!-- #region Step 1 -->
          <validation-observer class="card" tag="div" key="0" v-if="step == 0">
            <div class="card-header border-0 pb-0"><h3>Тип документа</h3></div>

            <div class="card-body">
              <div class="row">
                <base-input class="col" label="Тип документа" name="type" :rules="{ required: true }">
                  <template slot-scope="{ valid, invalid, validated }">
                    <el-select
                      filterable
                      placeholder="Тип"
                      v-model="saleType"
                      :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                    >
                      <el-option value="draft" label="Черновик" />
                      <el-option value="reserved" label="Бронирование" />
                      <el-option value="sale" label="Продажа" />
                    </el-select>
                  </template>
                </base-input>

                <base-input class="col" label="Создать договор?" name="is_contract_required" v-if="!sale.sold">
                  <base-switch
                    class="mt-2"
                    name="is_contract_required"
                    v-model="sale.is_contract_required"
                  ></base-switch>
                </base-input>
              </div>
            </div>
          </validation-observer>
          <!-- #endregion Step 1 -->

          <!-- #region Step 2 -->
          <validation-observer tag="div" key="1" v-else-if="step == 1">
            <!-- #region Info -->
            <div class="card">
              <div class="card-header border-0 pb-0 mb-0"><h4 class="h4 label">Информация</h4></div>
              <div class="card-body">
                <div class="row">
                  <base-input
                    v-if="sale.sold"
                    inputClasses="mb-0"
                    label="Склад"
                    class="col"
                    name="warehouse_id"
                    :rules="{ required: true }"
                  >
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-select
                        filterable
                        placeholder="Склад"
                        v-model="sale.warehouse_id"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      >
                        <el-option
                          v-for="warehouse in warehouses"
                          :value="warehouse.id"
                          :label="warehouse.name"
                          :key="warehouse.id"
                        >
                        </el-option>
                      </el-select>
                    </template>
                  </base-input>

                  <base-input
                    inputClasses="mb-0"
                    label="Номер телефона"
                    class="col"
                    name="phone"
                    :rules="{ required: true }"
                  >
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-select
                        remote
                        filterable
                        allow-create
                        default-first-option
                        placeholder="Номер"
                        value-key="id"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                        :remote-method="searchCustomers"
                        v-model="sale.customer_id"
                        @change="addNewCustomer(sale.customer_id, $event)"
                      >
                        <el-option
                          v-for="customer in customers || []"
                          class="select-danger"
                          :value="customer.id"
                          :label="customer.name"
                          :key="customer.id"
                        >
                          <span class="float-left">{{ customer.name }}</span>
                          <span class="float-right text-sm text-muted">{{ customer.phone }}</span>
                        </el-option>
                      </el-select>
                    </template>
                  </base-input>

                  <base-input
                    label="Имя"
                    placeholder="Имя"
                    inputClasses="mb-0 h-43px"
                    class="col"
                    name="name"
                    v-model="sale.customer.name"
                    :rules="{ required: true }"
                    :disabled="existCustomer"
                  ></base-input>

                  <base-input
                    label="E-mail"
                    placeholder="E-mail"
                    inputClasses="mb-0 h-43px"
                    class="col"
                    name="email"
                    v-model="sale.customer.email"
                    :rules="{ required: false }"
                    :disabled="existCustomer"
                  ></base-input>

                  <base-input
                    inputClasses="mb-0"
                    label="Продавец"
                    class="col"
                    name="sale_person_id"
                    :rules="{ required: true }"
                  >
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-select
                        remote
                        filterable
                        placeholder="Имя"
                        value-key="id"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                        :remote-method="searchEmployee"
                        v-model="sale.sale_person_id"
                      >
                        <el-option
                          v-for="employee in employes || []"
                          :value="employee.id"
                          :label="employee.name"
                          :key="employee.id"
                        >
                          <span class="float-left">{{ employee.name }}</span>
                          <span class="float-right text-sm text-muted">{{ employee.phone }}</span>
                        </el-option>
                      </el-select>
                    </template>
                  </base-input>

                  <base-input inputClasses="mt-2" label="Комментарий" class="col-12" type="textarea">
                    <textarea v-model="sale.comments" class="form-control" rows="2"></textarea>
                  </base-input>
                </div>
              </div>
            </div>
            <!-- #endregion End Info -->

            <!-- #region Preamble -->
            <div v-if="sale.is_contract_required && sale.type != 'sale'" class="card">
              <div class="card-header border-0">
                <h4 class="label">Шапка</h4>
              </div>
              <div class="card-body pt-0 text">
                <span class="col-auto">
                  OOO «UltraShop.UZ», именуемое в дальнейшем "Продавец", в лице
                  <b class="text-underline">{{ user.preamble.proxy }}</b> действующего на основании
                </span>
                <base-input
                  input-classes="form-control-flush text-dark mb-0 h-auto"
                  class="col-4 border-bottom border-dark mb-0"
                  name="provider_basis"
                  :rules="{ required: false }"
                  v-model="sale.provider_basis"
                />
                <span class="col-auto">с одной стороны,</span>
                <base-input
                  input-classes="form-control-flush text-dark mb-0 h-auto"
                  class="col-4 border-bottom border-dark mb-0"
                  name="customer_company"
                  :rules="{ required: false }"
                  v-model="sale.customer_company"
                />
                <span class="col-auto">в лице</span>
                <base-input
                  input-classes="form-control-flush text-dark mb-0 h-auto"
                  class="col-4 border-bottom border-dark mb-0"
                  name="customer_proxy"
                  :rules="{ required: false }"
                  v-model="sale.customer_proxy"
                />
                <span class="col-auto">действующего на основании</span>
                <base-input
                  input-classes="form-control-flush text-dark mb-0 h-auto"
                  class="col-4 border-bottom border-dark mb-0 mx-1"
                  name="customer_basis"
                  :rules="{ required: false }"
                  v-model="sale.customer_basis"
                />
                <span class="col-auto">
                  именуемый в дальнейшем "Покупатель", составили настоящий договор о нижеследующем:
                </span>
              </div>
            </div>
            <!-- #endregion Preamble -->

            <!-- #region Products -->
            <ProductPicker
              title="К продаже"
              hasChildren
              branch
              v-model="sale.products"
              searchPrefix="#"
              :vat="false"
              :warehouseId="sale.warehouse_id"
              :editPrice="sale.is_contract_required && !sale.sold"
              :sumsInput="sale.is_contract_required && !sale.sold"
              @pointer=";(pointer = $event.pointer), (pickerRef = $event.ref)"
            />
            <!-- #endregion -->

            <!-- #region Options -->
            <div v-if="sale.is_contract_required && !sale.sold" class="card">
              <div class="card-header border-0">
                <h4 class="label">Опции</h4>
              </div>
              <div class="card-body py-0">
                <div class="row">
                  <base-input label="Ставка НДС" class="col" name="vat" :rules="{ required: true }">
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-select
                        placeholder="Ставка"
                        value-key="value"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                        v-model="sale.vat"
                      >
                        <el-option value="15_VAT" label="15%" />
                        <el-option value="0_VAT" label="0" />
                        <el-option value="WITHOUT_VAT" label="Без НДС" />
                      </el-select>
                    </template>
                  </base-input>

                  <base-input
                    label="Предоплата"
                    class="col"
                    name="prepayment_percentage"
                    :rules="{ required: true, min_value: 0, max_value: 100 }"
                  >
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-input
                        placeholder="Предоплата"
                        v-model="sale.prepayment_percentage"
                        suffix-icon="fas fa-percentage"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      >
                      </el-input>
                    </template>
                  </base-input>

                  <base-input
                    label="Срок поставки"
                    class="col"
                    name="delivery_time"
                    :rules="{ required: false, integer: true }"
                  >
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-input
                        placeholder="Срок"
                        suffix-icon="fas fa-calendar-day"
                        v-model="sale.delivery_time"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      >
                      </el-input>
                    </template>
                  </base-input>
                </div>
              </div>
            </div>
            <!-- #endregion Options -->

            <!-- #region Requisites -->
            <div v-if="sale.is_contract_required && !sale.sold" class="card">
              <div class="card-header border-0"><h3 class="label">Реквизиты</h3></div>
              <div class="card-body py-0">
                <div class="row">
                  <base-input label="Покупатель" name="requisites" class="col-12" :rules="{ required: false }">
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-input
                        rows="9"
                        type="textarea"
                        v-model="sale.customer_requisites"
                        :class="[
                          { 'is-valid': valid && validated },
                          { 'is-invalid': invalid && validated },
                          'text-dark',
                        ]"
                      ></el-input>
                    </template>
                  </base-input>
                </div>
              </div>
            </div>
            <!-- #endregion -->
          </validation-observer>
          <!-- #endregion Step 2 -->

          <!-- #region Step 3 -->
          <validation-observer class="card" tag="div" key="2" v-else-if="step == 2">
            <div class="card-header border-0 pb-0"><h3>Выберите методы оплаты</h3></div>

            <div class="card-body">
              <div class="row justify-content-between">
                <div class="col"><h4 class="label">Сумма</h4></div>

                <div class="col-auto">
                  <p class="mb-0 text-right">
                    Общая сумма:
                    <span class="font-weight-bold">
                      {{
                        $filters.currency(
                          calcTotalPrice /
                            (sale.is_contract_required && !sale.sold ? checkCurrency.current_exchange_rate.rate : 1),
                          mainCurrency
                        )
                      }}<br />
                      {{
                        $filters.currency(
                          calcTotalPrice *
                            (sale.is_contract_required && !sale.sold ? 1 : checkCurrency.current_exchange_rate.rate),
                          checkCurrency
                        )
                      }}
                    </span>
                  </p>
                </div>

                <div class="col-auto">
                  <p class="mb-0 text-right">
                    Оплачено:
                    <span class="font-weight-bold">
                      {{ $filters.currency(calcPaidAmount, mainCurrency) }}<br />
                      {{ $filters.currency(calcPaidAmount * checkCurrency.current_exchange_rate.rate, checkCurrency) }}
                    </span>
                  </p>
                </div>
              </div>

              <div class="row">
                <base-input class="col" label="Метод оплаты" name="payment_method_id" :rules="{ required: true }">
                  <template slot-scope="{ valid, invalid, validated }">
                    <el-select
                      filterable
                      multiple
                      placeholder="Метод оплаты"
                      value-key="id"
                      :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      v-model="sale.accounts"
                    >
                      <el-option
                        v-for="pm in paymentMethodsForSale"
                        :key="pm.id"
                        :value="{ id: pm.id, amount: 0 }"
                        :label="pm.payment_method_name"
                      ></el-option>
                    </el-select>
                  </template>
                </base-input>
              </div>

              <el-table :data="sale.accounts" size="small" cell-class-name="py-2" stripe class="border rounded">
                <el-table-column label="Методы оплаты" width="400px" align="right">
                  <template slot-scope="{ row }">
                    <p class="mb-0 font-weight-bold">{{ getPaymentById(row.id).payment_method_name }}</p>
                  </template>
                </el-table-column>

                <el-table-column label="Принятая сумма">
                  <template slot-scope="{ row }">
                    <base-input input-classes="mb-1" type="number" :rules="{ required: true, min_value: 0 }">
                      <template slot-scope="{ valid, invalid, validated }">
                        <el-input
                          v-model="row.amount"
                          size="small"
                          :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                        >
                          <template slot="append">
                            {{ getCurrencyById(getPaymentById(row.id).currency_id).abbreviation }}
                          </template>
                        </el-input>
                      </template>
                    </base-input>
                  </template>
                </el-table-column>

                <el-table-column label="Номер договора">
                  <template slot-scope="{ row }" v-if="getPaymentById(row.id).is_contract_required">
                    <base-input input-classes="mb-1" name="contract_id" :rules="{ required: true }">
                      <template slot-scope="{ valid, invalid, validated }">
                        <el-select
                          remote
                          clearable
                          filterable
                          allow-create
                          default-first-option
                          size="small"
                          value-key="id"
                          placeholder="Номер договора"
                          :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                          :remote-method="searchContracts"
                          v-model="sale.contract_id"
                        >
                          <el-option
                            v-for="contract in contracts || []"
                            :value="contract.id"
                            :label="contract.contract_number"
                            :key="contract.id"
                          ></el-option>
                        </el-select>
                      </template>
                    </base-input>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </validation-observer>
          <!-- #endregion Step 3 -->

          <!-- #region Step 4-->
          <validation-observer class="card" tag="div" key="3" v-else-if="step == 3">
            <div class="card-header border-0 pb-0"><h3>Серийные номера</h3></div>
            <div class="card-body">
              <template v-for="(product, $i) in sale.products.filter((el) => el.id)">
                <el-table
                  v-if="product.warranty_period"
                  :key="product.id"
                  :data="product.serial_numbers"
                  class="border rounded mb-3"
                  stripe
                >
                  <el-table-column label="Продукт" min-width="300px">
                    {{ product.site_title }}
                  </el-table-column>

                  <el-table-column label="Гарантия" min-width="200px">
                    {{ product.warranty_period || 0 }} мес.
                  </el-table-column>

                  <el-table-column label="Серийный номер" min-width="400px">
                    <template slot-scope="{ $index }">
                      <base-input
                        input-classes="mb-1"
                        :name="`products.${$i}.serial_numbers.${$index}`"
                        :rules="{ required: true, min: 3 }"
                      >
                        <template slot-scope="{ valid, invalid, validated }">
                          <el-input
                            size="small"
                            placeholder="Серийный номер"
                            v-model="product.serial_numbers[$index]"
                            :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                          ></el-input>
                        </template>
                      </base-input>
                    </template>
                  </el-table-column>
                </el-table>
              </template>
            </div>
          </validation-observer>
          <!-- #endregion Step 4-->
        </transition>
        <div class="row justify-content-between">
          <div class="col">
            <transition name="fade">
              <el-button v-show="step" @click="prevStep" type="primary">Назад</el-button>
            </transition>
          </div>
          <div class="col-auto">
            <el-button @click="handleSubmit(nextStep)" type="success">Далее</el-button>
          </div>
        </div>
      </validation-observer>
    </div>
  </div>
</template>
<script>
// Components
import { Table, TableColumn, Tooltip, Input, Select, Option, Dialog, Step, Steps, Button } from 'element-ui'
import ProductPicker from '@/components/pickers/ProductPicker'

// Services
import salesService from '@/services/sales'
import customersService from '@/services/customers'
import contractsService from '@/services/contracts'
import productService from '@/services/product'
import usersService from '@/services/users'

// Utils
import { mapGetters, mapState } from 'vuex'
import { clone } from '@/util/clone'
import 'element-ui/lib/theme-chalk/base.css'

export default {
  layout: 'DashboardLayout',
  components: {
    ProductPicker,
    [Dialog.name]: Dialog,
    [Input.name]: Input,
    [Table.name]: Table,
    [Select.name]: Select,
    [Option.name]: Option,
    [Tooltip.name]: Tooltip,
    [TableColumn.name]: TableColumn,
    [Step.name]: Step,
    [Steps.name]: Steps,
    [Button.name]: Button,
  },
  data() {
    return {
      step: 0,
      loading: false,
      existCustomer: true,

      customers: [],
      contracts: [],
      employes: [],

      sale: {
        products: [{}],
        warehouse_id: '',
        customer_id: '',
        comments: '',
        accounts: [],

        closed: false,
        sold: true,
        reserved: true,

        is_contract_required: false,
        provider_basis: (this.$store.state.user.preamble || {}).basis,
        customer_company: '',
        customer_requisites: '',
        customer_proxy: '',
        customer_basis: '',
        customer_id: '',
        requisites: '',

        prepayment_percentage: '100',
        delivery_time: '3',
        vat: '',

        customer: {
          name: '',
          email: '',
          phone: '',
        },
      },

      // errorsByStep: {
      // 	customer: 1,
      // 	customer_id: 1,
      // 	accounts: 2,
      // 	products: 1,
      // 	sale_person_id: 1,
      // 	}
    }
  },

  mounted() {
    if (this.$barcodeScanner.hasListener()) {
      this.$barcodeScanner.destroy()
    } else {
      this.$root.$on('layout-mounted', () => {
        this.$barcodeScanner.destroy()
      })
    }
  },

  destroyed() {
    this.$root.$emit('update-barcode-scanner-listener')
  },

  methods: {
    nextStep() {
      switch (this.step) {
        case 1:
          if (this.sale.sold) this.step++
          else this.save()
          break
        case 2:
          if (this.warranties) {
            this.sale.products.forEach((product) => {
              if (
                product.warranty_period &&
                (!product.serial_numbers || product.serial_numbers.length != product.quantity)
              ) {
                product.serial_numbers = []
                for (let $i = 0; $i < +product.quantity; $i++) {
                  product.serial_numbers.push('')
                }
              }
            })
            this.step++
          } else this.save()
          break
        case 3:
          this.save()
          break
        default:
          this.step++
      }
    },
    prevStep() {
      this.step--
    },

    save() {
      this.loading = true
      let preparedData = clone({ ...this.sale })

      if (!preparedData.sold) {
        delete preparedData.accounts
      }

      preparedData.contract = typeof preparedData.contract_id == 'string' ? preparedData.contract_id : null

      preparedData.products.pop()
      preparedData.products.forEach((el) => el.children.pop())

      preparedData.products = preparedData.products.map((item) => {
        let price = typeof item.price == 'string' ? item.price.replace(/\s/g, '') : item.price
        return {
          price,
          product_id: item.id,
          quantity: item.quantity,
          children: item.children,
          is_parent: item.is_parent,
          is_child: item.is_child,
          serial_numbers: item.serial_numbers,
        }
      })

      preparedData = { ...preparedData }

      customersService
        .create(this.sale.customer)
        .then((data) => {
          preparedData.customer_id = data.id
          this.sale.customer = data
          this.existCustomer = true

          salesService
            .create(preparedData)
            .then((data) => {
              this.axiosSuccess(data)
              this.$router.push(`/finance/sales/${data.id}`)

              salesService.warranty(data.id).then((data) => {
                window.open(data)
              })
            })
            .catch(this.axiosCatch)
            .finally(this.axiosFinally)
        })
        .catch((e) => {
          this.axiosCatch(e)
          this.loading = false
        })
    },

    //#region Contracts
    searchContracts(search) {
      contractsService.getAll({ search }).then((data) => {
        this.contracts = data.data
      })
    },
    //#endregion

    //#region Add responser
    searchEmployee(search) {
      usersService.getAll({ search, employee: true }).then((data) => {
        this.employes = data.data
      })
    },
    //#endregion

    //#region Customer
    addNewCustomer(id, evt) {
      let customer = this.customers.find((el) => id == el.id)
      if (customer == undefined) {
        this.sale.customer = {
          phone: evt,
          name: '',
          email: '',
        }
        this.existCustomer = false
      } else {
        this.sale.customer = customer
        this.sale.customer_requisites = customer.requisites
        this.existCustomer = true
      }
    },
    searchCustomers(search) {
      customersService.getAll({ search }).then((data) => {
        this.customers = data.data
      })
    },
    //#endregion

    // #region Barcode
    barcodeInit() {
      this.$barcodeScanner.init((barcode) => {
        if (/^[1-9]{1}\d{0,4}[A-Z]{4}[\dA-Z]{2}$/.test(barcode)) {
          let productId = barcode.substring(0, barcode.length - 6)

          let index = this.pointer.findIndex((product) => product.id == productId)

          if (index !== -1) {
            this.pointer[index].quantity++
          } else {
            productService
              .get(productId)
              .then((data) => {
                const test =
                  (this.sale.is_contract_required && !this.sale.sold) ||
                  (this.sale.sold && this.sale.accounts.some(({ id }) => getPaymentById(id).is_contract_required))
                if (test && data.stock.quantity_vat <= 0) {
                  this.$notify({
                    duration: 2000,
                    iconClass: `fas fa-exchange-alt text-lg`,
                    type: 'danger',
                    title: 'Нулевой остаток с НДС!',
                  })
                  return
                }

                if (!this.pickerRef.hasChildren && !this.getCategory(data.categories_ids[0]).is_child) {
                  this.$notify({
                    duration: 2000,
                    iconClass: `fas fa-exchange-alt text-lg`,
                    type: 'danger',
                    title: 'Этот товар нельзя снять или добавить!',
                  })
                  return
                }

                const tmp = this.pointer.pop()
                this.pickerRef.addProduct(
                  { ...data, site_title: data.site_title, product_id: data.id, quantity: 1 },
                  this.pointer.push(data) - 1
                )
              })
              .catch(this.axiosCatch)
              .finally(this.axiosFinally)
          }
        } else {
          this.$notify({
            duration: 2000,
            iconClass: `fas fa-exchange-alt text-lg`,
            type: 'danger',
            title: 'Неверный формат штрих-кода',
          })
        }
      })
    },
    // #endregion
  },

  computed: {
    calcTotalPrice() {
      let productPrice = 0
      let sums = !this.sale.sold && this.sale.is_contract_required

      this.sale.products.forEach((parent) => {
        productPrice +=
          parent.id != undefined
            ? parent.quantity *
              (parent.children || []).reduce((acc, child) => {
                if (child.id != undefined) {
                  acc += sums
                    ? (child.price || '0') * this.checkCurrency.current_exchange_rate.rate * (child.is_pullout ? -1 : 1)
                    : (child.price || '0') * (child.is_pullout ? -1 : 1)
                }
                return acc
              }, parent.price)
            : 0
      })

      return productPrice
    },
    calcPaidAmount() {
      return this.sale.accounts.reduce((acc, account) => {
        return (
          acc +
          account.amount / this.getCurrencyById(this.getPaymentById(account.id).currency_id).current_exchange_rate.rate
        )
      }, 0)
    },

    saleType: {
      get: function () {
        if (this.sale.sold && this.sale.reserved) return null
        if (this.sale.sold) return 'sale'
        else if (this.sale.reserved) return 'reserved'
        else return 'draft'
      },
      set: function (type) {
        switch (type) {
          case 'draft':
            this.sale.sold = false
            this.sale.reserved = false
            break
          case 'reserved':
            this.sale.sold = false
            this.sale.reserved = true
            break
          case 'sale':
            this.sale.sold = true
            this.sale.reserved = false
            break
        }
      },
    },

    warranties() {
      return this.sale.products.some((el) => {
        if (typeof el.id === 'undefined') return false
        return el.warranty_period && el.quantity > 0
      })
    },

    ...mapState({
      warehouses: (state) => state.warehouses.data.filter((el) => !el.is_virtual),
      user: 'user',
    }),
    ...mapGetters({
      getWarehouseById: 'warehouses/getItemById',
      getPaymentById: 'accounts/getItemById',
      paymentMethodsForSale: 'accounts/getForSale',
      getCurrencyById: 'currency/getItemById',
      can: 'user/hasPermissions',
      getCategory: 'categories/getItemById',
      mainCurrency: 'currency/getMain',
      checkCurrency: 'currency/getForCheck',
    }),
  },

  watch: {
    step(newStep) {
      switch (newStep) {
        case 1:
          this.barcodeInit()
          break
        default:
          if (this.$barcodeScanner.hasListener()) {
            this.$barcodeScanner.destroy()
          }
      }
    },
  },
}
</script>
<style lang="css" scoped>
.text {
  display: inline-flex;
  flex-flow: wrap;
  align-items: center;
}
</style>
