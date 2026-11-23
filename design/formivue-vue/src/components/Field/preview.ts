// formivue/vue — Field (cœur du rendu designer : traduit les props du nœud en
// props de champ formivue et rend le champ réel — ObjectField/ArrayField/
// VoidField/Field du fork — avec le décorateur/composant résolu depuis le
// registre de composants). Port de l'ère Field/preview.tsx.
//
// Écarts de forme assumés (table §1.5) : React.createElement → h(), children
// → slots, JSX spans content-editables → vnodes.
import { defineComponent, h } from 'vue'
import { toJS } from '@formivue/reactive'
import { each, reduce, FormPath } from '@formivue/shared'
import { Schema, type ISchema } from '@formivue/json-schema'
import {
  ArrayField,
  Field as InternalField,
  ObjectField,
  VoidField,
} from '@formivue/vue'
import { observer } from '@formivue/reactive-vue'
import { createBehavior } from '@formivue-design/core'
import {
  useDesigner,
  useTreeNode,
  useComponents,
  type DnFC,
} from '@formivue-design/vue'
import { isArr, isStr } from '@formivue-design/shared'
import { Container } from '../../common/Container'
import { AllLocales } from '../../locales'
import { FormItem } from '../FormItem'

Schema.silent(true)

const SchemaStateMap = {
  title: 'title',
  description: 'description',
  default: 'value',
  enum: 'dataSource',
  readOnly: 'readOnly',
  writeOnly: 'editable',
  required: 'required',
  'x-content': 'content',
  'x-value': 'value',
  'x-editable': 'editable',
  'x-disabled': 'disabled',
  'x-read-pretty': 'readPretty',
  'x-read-only': 'readOnly',
  'x-visible': 'visible',
  'x-hidden': 'hidden',
  'x-display': 'display',
  'x-pattern': 'pattern',
}

const NeedShownExpression = {
  title: true,
  description: true,
  default: true,
  'x-content': true,
  'x-value': true,
}

const isExpression = (val: any) => isStr(val) && /^\{\{.*\}\}$/.test(val)

const filterExpression = (val: any) => {
  if (typeof val === 'object') {
    const isArray = isArr(val)
    const results = reduce(
      val,
      (buf: any, value, key) => {
        if (isExpression(value)) {
          return buf
        } else {
          const results = filterExpression(value)
          if (results === undefined || results === null) return buf
          if (isArray) {
            return buf.concat([results])
          }
          buf[key] = results
          return buf
        }
      },
      isArray ? [] : {},
    )
    return results
  }
  if (isExpression(val)) {
    return
  }
  return val
}

const toFormivueDesignFieldProps = (
  schema: ISchema,
  components: any,
  nodeIdAttrName: string,
  id: string,
) => {
  const results: any = {}
  each(SchemaStateMap, (fieldKey, schemaKey) => {
    const value = schema[schemaKey]
    if (isExpression(value)) {
      if (!NeedShownExpression[schemaKey]) return
      if (value) {
        results[fieldKey] = value
        return
      }
    } else if (value !== undefined && value !== null) {
      results[fieldKey] = filterExpression(value)
    }
  })
  if (!components['FormItem']) {
    components['FormItem'] = FormItem
  }
  const decorator =
    schema['x-decorator'] && FormPath.getIn(components, schema['x-decorator'])
  const component =
    schema['x-component'] && FormPath.getIn(components, schema['x-component'])
  const decoratorProps = schema['x-decorator-props'] || {}
  const componentProps = schema['x-component-props'] || {}

  if (decorator) {
    results.decorator = [decorator, toJS(decoratorProps)]
  }
  if (component) {
    results.component = [component, toJS(componentProps)]
  }
  if (decorator) {
    FormPath.setIn(results['decorator'][1], nodeIdAttrName, id)
  } else if (component) {
    FormPath.setIn(results['component'][1], nodeIdAttrName, id)
  }
  results.title =
    results.title &&
    h('span', { 'data-content-editable': 'title' }, [results.title])
  results.description =
    results.description &&
    h('span', { 'data-content-editable': 'description' }, [results.description])
  return results
}

export const Field: DnFC<ISchema> = observer(
  defineComponent({
    name: 'DField',
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const designer = useDesigner()
      const components = useComponents()
      const node = useTreeNode()
      return () => {
        if (!node) return null
        const currentNode = node as any
        const fieldProps = toFormivueDesignFieldProps(
          attrs as any,
          components,
          designer?.props?.nodeIdAttrName,
          currentNode.id,
        )
        if ((attrs as any).type === 'object') {
          return h(Container, null, {
            default: () => [
              h(
                ObjectField,
                { ...fieldProps, name: currentNode.id },
                { default: () => slots.default?.() },
              ),
            ],
          })
        } else if ((attrs as any).type === 'array') {
          return h(ArrayField, { ...fieldProps, name: currentNode.id })
        } else if (currentNode.props.type === 'void') {
          return h(
            VoidField,
            { ...fieldProps, name: currentNode.id },
            { default: () => slots.default?.() },
          )
        }
        return h(InternalField, { ...fieldProps, name: currentNode.id })
      }
    },
  }) as any,
) as any

Field.Behavior = createBehavior({
  name: 'Field',
  selector: 'Field',
  designerLocales: AllLocales.Field,
})
