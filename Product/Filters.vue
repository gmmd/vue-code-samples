<template>
  <el-collapse class="mb-9">
    <el-collapse-item :title="$t('filter.price')">
      <div class="row">
        <div class="col-6">
          <el-input v-model="localFilter.price[0]" @change="onChange('price')" :placeholder="localFilter.price[0]">
            <span slot="prefix" class="el-input__icon">От</span>
          </el-input>
        </div>
        <div class="col-6">
          <el-input v-model="localFilter.price[1]" @change="onChange('price')">
            <span slot="prefix" class="el-input__icon">До</span>
          </el-input>
        </div>
      </div>
    </el-collapse-item>

    <el-collapse-item title="Состояние">
      <el-select
        placeholder="Выберите опцию"
        multiple
        filterable
        clearable
        class="w-100"
        v-model="localFilter.condition_ids"
        @change="onChange('condition_ids')"
        value-key="id"
      >
        <el-option
          v-for="condition in filters.conditions"
          :key="condition.id"
          :label="condition.name"
          :value="condition.id"
        ></el-option>
      </el-select>
    </el-collapse-item>

    <el-collapse-item :title="$t('filter.brand')">
      <el-select
        placeholder="Выберите опцию"
        multiple
        filterable
        clearable
        class="w-100"
        v-model="localFilter.brand_ids"
        @change="onChange('brand_ids')"
        value-key="id"
      >
        <el-option v-for="brand in filters.brands" :key="brand.id" :label="brand.name" :value="brand.id"></el-option>
      </el-select>
    </el-collapse-item>

    <el-collapse-item
      v-for="group in filters.additional_attributes"
      :key="group.id"
      :title="group[`display_name_${$i18n.locale}`]"
    >
      <div class="row">
        <div v-for="attribute in group.attributes" :key="attribute.id" class="col-12">
          <h6 class="label mb-1 mt-3">
            {{ attribute[`name_${$i18n.locale}`] }}
            <span class="text-sm text-muted">{{ getUnitById(attribute.unit_id)[`name_${$i18n.locale}`] }}</span>
          </h6>
          <!-- integer & numeric -->
          <div v-if="attribute.type == 'integer' || attribute.type == 'numeric'" class="row">
            <div class="col-6">
              <el-input
                type="number"
                step="0.01"
                v-model="localFilter.additional_attributes[group.slug][attribute.slug][0]"
                @change="onChange(`additional_attributes.${group.slug}.${attribute.slug}`)"
              >
                <span slot="prefix" class="el-input__icon">От</span>
              </el-input>
            </div>
            <div class="col-6">
              <el-input
                type="number"
                step="0.01"
                v-model="localFilter.additional_attributes[group.slug][attribute.slug][1]"
                @change="onChange(`additional_attributes.${group.slug}.${attribute.slug}`)"
              >
                <span slot="prefix" class="el-input__icon">До</span>
              </el-input>
            </div>
          </div>
          <!-- integer & numeric -->

          <!-- Boolean -->
          <div class="btn-group btn-group-toggle" v-else-if="attribute.type == 'boolean'">
            <button
              class="btn btn-sm"
              :class="`${
                localFilter.additional_attributes[group.slug][attribute.slug] === 'true'
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`"
              @click="
                ;(localFilter.additional_attributes[group.slug][attribute.slug] = 'true'),
                  onChange(`additional_attributes.${group.slug}.${attribute.slug}`)
              "
            >
              Есть
            </button>
            <button
              class="btn btn-sm"
              :class="`${
                localFilter.additional_attributes[group.slug][attribute.slug] === 'false'
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`"
              @click="
                ;(localFilter.additional_attributes[group.slug][attribute.slug] = 'false'),
                  onChange(`additional_attributes.${group.slug}.${attribute.slug}`)
              "
            >
              Нет
            </button>
            <button
              class="btn btn-sm"
              :class="`${
                localFilter.additional_attributes[group.slug][attribute.slug] !== 'true' &&
                localFilter.additional_attributes[group.slug][attribute.slug] !== 'false'
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`"
              @click="
                ;(localFilter.additional_attributes[group.slug][attribute.slug] = ''),
                  onChange(`additional_attributes.${group.slug}.${attribute.slug}`)
              "
            >
              Не важно
            </button>
          </div>
          <!-- Boolean -->

          <!-- Others -->
          <el-select
            v-else
            multiple
            clearable
            filterable
            class="w-100"
            v-model="localFilter.additional_attributes[group.slug][attribute.slug]"
            @change="onChange(`additional_attributes.${group.slug}.${attribute.slug}`)"
          >
            <el-option v-for="item in attribute.options" :key="item" :label="item" :value="item"></el-option>
          </el-select>
          <!-- Others -->
        </div>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>
<script>
// Utils
import { clone } from '@/util/clone'
import { mapGetters } from 'vuex'

export default {
  props: {
    filters: {
      type: Object,
      default: () => {},
    },
    value: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      localFilter: {
        warehouse: [],
        brand_ids: [],
        condition_ids: [],
        price: [],
        additional_attributes: {},
      },
      touched: {},
    }
  },
  created() {
    if (this.value) {
      this.localFilter = { ...this.localFilter, ...clone(this.value) }
    }
    this.init()
  },
  methods: {
    init() {
      let value = { additional_attributes: {}, ...this.value }
      this.filters.additional_attributes.forEach((group) => {
        if (!(group.slug in this.localFilter.additional_attributes))
          this.$set(this.localFilter.additional_attributes, group.slug, {})

        group.attributes.forEach((attribute) => {
          if ((value.additional_attributes[group.slug] || {})[attribute.slug]) {
            this.touched[`additional_attributes.${group.slug}.${attribute.slug}`] = true
          }
          if (attribute.type == 'integer' || attribute.type == 'numeric') {
            this.$set(
              this.localFilter.additional_attributes[group.slug],
              attribute.slug,
              (value.additional_attributes[group.slug] || {})[attribute.slug] || [
                +attribute.options[0],
                +attribute.options.slice(-1)[0],
              ]
            )
          } else {
            this.$set(
              this.localFilter.additional_attributes[group.slug],
              attribute.slug,
              (value.additional_attributes[group.slug] || {})[attribute.slug] || []
            )
          }
        })
      })

      if (this.value.price && this.value.price.length == 2) {
        this.$set(this.localFilter, 'price', [...this.value.price])
        this.touched.price = true
      } else {
        this.$set(this.localFilter, 'price', [...this.filters.price])
      }

      if (this.value.brand_ids) {
        this.$set(this.localFilter, 'brand_ids', [...this.value.brand_ids])
        // this.touched.price = true
      } else {
        this.$set(this.localFilter, 'brand_ids', [])
      }

      if (this.value.condition_ids) {
        this.$set(this.localFilter, 'condition_ids', [...this.value.condition_ids])
        // this.touched.price = true
      } else {
        this.$set(this.localFilter, 'condition_ids', [])
      }
    },

    deepSetter(object, keys = [], value) {
      let lastKey = keys.pop()
      keys.forEach((key) => {
        if (!(key in object)) {
          object[key] = {}
        }
        object = object[key]
      })
      object[lastKey] = value
    },

    onChange(path = null) {
      if (path) {
        this.touched[path] = true
      }
      let clean = {}

      if (this.touched.brand_ids && this.localFilter.brand_ids.length !== 0) {
        clean.brand_ids = this.localFilter.brand_ids
      }

      if (this.touched.condition_ids && this.localFilter.condition_ids.length !== 0) {
        clean.condition_ids = this.localFilter.condition_ids
      }

      if (this.touched.price) {
        clean.price = this.localFilter.price
      }

      Object.keys(this.localFilter.additional_attributes).forEach((group_slug) => {
        let group = this.filters.additional_attributes.find((item) => item.slug == group_slug)
        Object.keys(this.localFilter.additional_attributes[group_slug]).forEach((attribute_slug) => {
          let attribute = group.attributes.find((item) => item.slug == attribute_slug)
          let ok = false
          if (attribute.type == 'numeric' || attribute.type == 'integer') {
            if (this.touched[`additional_attributes.${group_slug}.${attribute_slug}`]) {
              ok = true
            }
          } else {
            if (
              this.touched[`additional_attributes.${group_slug}.${attribute_slug}`] &&
              this.localFilter.additional_attributes[group_slug][attribute_slug].length !== 0
            ) {
              ok = true
            }
          }
          if (ok) {
            this.deepSetter(
              clean,
              ['additional_attributes', group_slug, attribute_slug],
              this.localFilter.additional_attributes[group_slug][attribute_slug]
            )
          }
        })
      })

      this.$emit('update', clean)
    },

    clearTouchedFilter(keys) {
      this.touched[keys.join('.')] = false
      this.onChange()
    },
  },
  watch: {
    filters() {
      this.init()
    },
  },
  computed: {
    ...mapGetters({
      getUnitById: 'units/getItemById',
    }),
  },
}
</script>