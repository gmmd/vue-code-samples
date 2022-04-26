<template>
  <div>
    <base-header class="pb-6">
      <div class="row align-items-center py-4">
        <div class="col-auto">
          <base-button size="sm" @click="$router.go(-1)" class="primary">Назад</base-button>
        </div>
        <div class="col-lg-6 col-7">
          <h6 class="h2 text-dark d-inline-block mb-0">{{ $route.params.catname }}</h6>
          <nav aria-label="breadcrumb" class="d-none d-md-inline-block ml-md-4"></nav>
        </div>
        <div class="col-lg-6 col-5 text-right"></div>
      </div>
    </base-header>

    <div class="container-fluid mt--6">
      <validation-observer v-slot="{ handleSubmit }" ref="form">
        <form role="form" @submit.prevent="handleSubmit(save)">
          <card v-loading="loading">
            <div slot="header">
              <div class="steps clearfix">
                <ul role="tablist">
                  <li role="tab" :class="['first', { current: !next, done: next }]">
                    <span class="current-info audible"></span>
                    <div class="title">
                      <span class="step-icon">
                        <i class="fas fa-tag"></i>
                      </span>
                      <span class="step-number">Шаг 1</span>
                      <span class="step-text">Общая информация</span>
                    </div>
                  </li>
                  <li role="tab" :class="{ disabled: !next, current: next }">
                    <div class="title">
                      <span class="step-icon">
                        <i class="fas fa-images"></i>
                      </span>
                      <span class="step-number">Шаг 2</span>
                      <span class="step-text">Картинки</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <transition name="fade">
              <div v-if="!next">
                <div class="row">
                  <base-input class="col-3" label="Сайты" :rules="{ required: true }">
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-select
                        filterable
                        multiple
                        v-model="product.sites_ids"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      >
                        <el-option
                          v-for="option in sites"
                          :value="option.id"
                          :label="option.name"
                          :key="option.id"
                        ></el-option>
                      </el-select>
                    </template>
                  </base-input>
                  <!-- #region Hardcoded fields -->
                  <base-input class="col-md-4" label="Категории" name="categories_ids">
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-select
                        filterable
                        multiple
                        v-model="product.categories_ids"
                        @change="getAttributeGroups(product.categories_ids)"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      >
                        <el-option
                          v-for="option in categories"
                          :value="option.id"
                          :disabled="option.depth < 2"
                          :label="option.name_ru"
                          :key="option.id"
                        ></el-option>
                      </el-select>
                    </template>
                  </base-input>

                  <base-input class="col-md-4" label="Бренд" name="brand_id" :rules="{ required: true }">
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-select
                        filterable
                        v-model="product.brand_id"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      >
                        <el-option
                          v-for="option in brands"
                          :value="option.id"
                          :label="option.name"
                          :key="option.id"
                        ></el-option>
                      </el-select>
                    </template>
                  </base-input>

                  <base-input class="col-md-4" label="Цена" name="price" :rules="{ required: true, min_value: 0 }">
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-input
                        v-model="product.price"
                        placeholder="Цена"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      ></el-input>
                    </template>
                  </base-input>

                  <base-input
                    class="col-6"
                    label="Название"
                    name="name"
                    @input="autoComplete(product.name)"
                    :rules="{ required: true }"
                  >
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-input
                        placeholder="Название"
                        v-model="product.name"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      ></el-input
                    ></template>
                  </base-input>

                  <base-input class="col-6" label="Название договора" name="contract_name" :rules="{ required: true }">
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-input
                        placeholder="Название договора"
                        v-model="product.contract_name"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      ></el-input>
                    </template>
                  </base-input>

                  <base-input class="col" label="Сервисный центр" name="service_id" :rules="{ required: true }">
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-select
                        filterable
                        v-model="product.service_id"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      >
                        <el-option
                          v-for="service in services"
                          :value="service.id"
                          :label="service.name"
                          :key="service.id"
                        >
                          <span class="float-left">{{ service.name }}</span>
                          <span class="float-right text-sm text-muted pr-3">{{ service.code }}</span>
                        </el-option>
                      </el-select>
                    </template>
                  </base-input>

                  <base-input
                    class="col"
                    label="Гарантийный срок (в месяцах)"
                    name="warranty_period"
                    :rules="{ required: true, integer: true, min_value: 0 }"
                  >
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-input
                        v-model="product.warranty_period"
                        placeholder="Срок"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      ></el-input>
                    </template>
                  </base-input>

                  <base-input class="col" label="Состояниe" name="condition_id" :rules="{ required: true }">
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-select
                        filterable
                        v-model="product.condition_id"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                      >
                        <el-option
                          v-for="condtition in conditions"
                          :value="condtition.id"
                          :label="condtition.name"
                          :key="condtition.id"
                        >
                          <span class="float-left">{{ condtition.name }}</span>
                          <span class="float-right text-sm text-muted pr-3">{{ condtition.code }}</span>
                        </el-option>
                      </el-select>
                    </template>
                  </base-input>

                  <base-input
                    v-if="getConditionById(product.condition_id).is_refurbished"
                    class="col"
                    label="Укажите к какому продукту Refurbished"
                    name="refurbish_id"
                  >
                    <template slot-scope="{ valid, invalid, validated }">
                      <el-select
                        filterable
                        remote
                        value-key="site_title"
                        :remote-method="searchProduct"
                        :class="[{ 'is-valid': valid && validated }, { 'is-invalid': invalid && validated }]"
                        v-model="product.refurbish_id"
                      >
                        <el-option
                          v-for="product in foundProducts"
                          :value="product.id"
                          :label="product.site_title"
                          :key="product.id"
                        ></el-option>
                      </el-select>
                    </template>
                  </base-input>
                  <!-- #endregion End Hardcoded fields -->

                  <!-- Dynamic fields -->
                  <collapse class="col-md-12">
                    <collapse-item v-for="group in attributeGroups" :key="group.id">
                      <h4 slot="title" class="mb-0">{{ group.name }}</h4>
                      <div class="row">
                        <div
                          :class="['mb-3', `col-md-${getAttributeById(id).type == 'text' ? '12' : '6'}`]"
                          v-for="id in group.attributes_ids"
                          :key="id"
                        >
                          <component
                            @lookup="lookup(group.slug, getAttributeById(id).slug, $event)"
                            :name="`additional_attributes.${group.slug}.${getAttributeById(id).slug}`"
                            :is="getAttributeType(getAttributeData(group.slug, id).type)"
                            :data="getAttributeData(group.slug, id)"
                            :disabled="!getAttributeById(id).is_searchable && !enabledGroups[group.slug]"
                            v-model="product.additional_attributes[group.slug][getAttributeById(id).slug]"
                          />
                        </div>
                      </div>
                    </collapse-item>
                  </collapse>
                  <!-- Dynamic fields -->
                </div>
              </div>

              <!-- Photouploader -->
              <div v-else>
                <product-images :product-id="product.id" :images="product.images" @removeImage="removeImage" />
              </div>
              <!-- Photouploader -->
            </transition>

            <div slot="footer">
              <div class="row justify-content-end">
                <base-button v-if="!next" class="btn btn-icon-only col-auto rounded-circle" nativeType="submit">
                  <span class="btn-inner--icon">
                    <i class="fas fa-arrow-right"></i>
                  </span>
                </base-button>
                <base-button
                  v-else
                  class="btn btn-icon-only col-auto rounded-circle"
                  type="success"
                  @click="$router.push('/products')"
                >
                  <span class="btn-inner--icon">
                    <i class="fas fa-check"></i>
                  </span>
                </base-button>
              </div>
            </div>
          </card>
        </form>
      </validation-observer>
    </div>
  </div>
</template>
<script>
import Vue from 'vue'

// Components
import ProductImages from '@/components/ProductImages'
import Collapse from '@/components/argon-core/Collapse/Collapse'
import CollapseItem from '@/components/argon-core/Collapse/CollapseItem'
import {Select, Option, OptionGroup, Input, Checkbox} from 'element-ui'

// Attribute types
import string from '@/components/AttributeTypes/string'
import boolean from '@/components/AttributeTypes/boolean'
import selectComponent from '@/components/AttributeTypes/select'
import multiselectComponent from '@/components/AttributeTypes/multiselect'
import textComponent from '@/components/AttributeTypes/text'

// Tools & Services
import { mapGetters, mapState } from 'vuex'
import productsService from '@/services/product'
import attributeGroupsService from '@/services/attribute-groups'
import generator from '@/plugins/mixins/generator'
import { keys } from 'd3'

export default {
  layout: 'DashboardLayout',
  mixins: [/*slugify,*/ generator],
  components: {
    ProductImages,
    Collapse,
    CollapseItem,
    [Input.name]: Input,
    [Select.name]: Select,
    [Option.name]: Option,
    [OptionGroup.name]: OptionGroup,
    [Checkbox.name]: Checkbox,

    string,
    boolean,
    selectComponent,
    multiselectComponent,
    textComponent,
  },
  watchQuery: ['base_product'],
  async asyncData({ route }) {
    let product = {
        brand: null,
        name: '',
        price: '',
        condition_id: '',
        contract_name: '',
        categories_ids: [],
        sites_ids: [],
        additional_attributes: {},
        images: [],
    }

    if (route.query.base_product) {
      product = (({
        brand_id,
        name,
        price,
        condition_id,
        contract_name,
        categories_ids,
        sites_ids,
        service_id,
        warranty_period,
        refurbish_id,
        additional_attributes,
        images,
      }) => ({
        brand_id,
        name,
        price,
        condition_id,
        contract_name,
        categories_ids,
        sites_ids,
        service_id,
        warranty_period,
        refurbish_id,
        additional_attributes,
        images,
        base_product: route.query.base_product,
      }))(await productsService.get(route.query.base_product))
    }

    return { product }
  },
  data() {
    return {
      next: false,
      loading: false,
      conditions: this.$store.state.conditions.data,

      foundProducts: [],
      attributeGroups: [],
      attributes: [],
    }
  },
  mounted() {
    if (this.$route.query.base_product) {
      this.getAttributeGroups(this.product.categories_ids)
    }
  },
  methods: {
    save() {
      this.loading = true
      productsService
        .create(this.product)
        .then((data) => {
          this.axiosSuccess(data)
          this.product = { ...data }
          this.next = !this.next
        })
        .catch(this.axiosCatch)
        .finally(this.axiosFinally)
    },
    autoComplete(string) {
      // this.slug(string, "product");
      this.product.contract_name = string
    },

    // Search product
    searchProduct(name) {
      productsService.filter({ page: 1, search: name, per_page: 5 }).then((data) => {
        this.foundProducts = data.data
      })
    },
    removeImage(imageId) {
      this.product.images = this.product.images.filter((img) => img.id != imageId)
    },
  },

  computed: {
    ...mapState({
      categories: (state) => state.categories.flatten,
      brands: (state) => state.brands.data,
      services: (state) => state.services.data,
      sites: (state) => state.sites.data,
    }),
    ...mapGetters({
      getAttributeGroupById: 'attributeGroups/getItemById',
      getAttributeById: 'attributes/getItemById',
      getAttributeBySlug: 'attributes/getItemBySlug',
      getCategoryById: 'categories/getItemById',
      getConditionById: 'conditions/getItemById',
    }),
  },
}
</script>

<style lang="scss" scoped>
.steps {
  margin-bottom: 33px;
  ul {
    display: flex;
    display: -webkit-flex;
    justify-content: center;
    -o-justify-content: center;
    -ms-justify-content: center;
    -moz-justify-content: center;
    -webkit-justify-content: center;
    list-style: none;
    padding-left: 0;
  }
  li,
  li.current {
    outline: none;
    -o-outline: none;
    -ms-outline: none;
    -moz-outline: none;
    -webkit-outline: none;
    position: relative;
    padding-bottom: 3px;
    padding-right: 63px;
  }
  li:last-child {
    padding-right: 0;
  }
  li .current-info {
    display: none;
  }
  li::before {
    position: absolute;
    content: '';
    background: #e5e5e5;
    width: 143px;
    height: 6px;
    top: 18%;
    left: 45%;
  }
  li:last-child::before {
    content: none;
  }
  li.current::after {
    position: absolute;
    content: '';
    width: 45px;
    height: 3px;
    background: #ccc;
    top: 100%;
    left: 25%;
  }
  li .title {
    text-align: center;
  }
  li .title span {
    display: block;
    font-size: 16px;
  }
  li .title .step-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    -o-border-radius: 50%;
    -ms-border-radius: 50%;
    -moz-border-radius: 50%;
    -webkit-border-radius: 50%;
    background: #ccc;
    margin: 0 auto;
    position: relative;
    outline: none;
    -o-outline: none;
    -ms-outline: none;
    -moz-outline: none;
    -webkit-outline: none;
    color: #fff;
    font-size: 20px;
  }
  li .step-icon i {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    -o-transform: translate(-50%, -50%);
    -ms-transform: translate(-50%, -50%);
    -moz-transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
  }
  li.current .step-icon,
  li.current.active .step-icon,
  .done::before,
  li.done .step-icon,
  li.done.active .step-icon {
    background: #6eba2a;
    transition: 0.5s ease-in-out;
  }
  li.current .step-icon,
  li.current.active .step-icon {
    box-shadow: 0px 5px 18px 0px rgba(0, 0, 0, 0.2);
    -o-box-shadow: 0px 5px 18px 0px rgba(0, 0, 0, 0.2);
    -ms-box-shadow: 0px 5px 18px 0px rgba(0, 0, 0, 0.2);
    -moz-box-shadow: 0px 5px 18px 0px rgba(0, 0, 0, 0.2);
    -webkit-box-shadow: 0px 5px 18px 0px rgba(0, 0, 0, 0.2);
  }
  li .step-number {
    color: #666;
    font-weight: 400;
    padding: 17px 0 8px;
  }
  li .step-text {
    color: #333;
    font-weight: 600;
    padding-bottom: 8px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active до версии 2.1.8 */ {
  opacity: 0;
}
</style>
