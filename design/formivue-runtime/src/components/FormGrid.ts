// formivue/vue — FormGrid binding réelle sur le **grid v3 headless du fork**
// (plus de polyfill ResizeObserver ni de FormGrid antd — le Grid du fork est
// réactif : templateColumns/gap suivent les observables via observer).
// Port de la recette formivue-v3/antd (React) → Vue : ref + onMounted connect,
// re-création du grid quand Grid.id(options) change (sémantique useMemo).
import {
  defineComponent,
  h,
  markRaw,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
} from 'vue'
import { Grid, type IGridOptions } from '@formivue/grid'
import { observer } from '@formivue/reactive-vue'
import cls from 'classnames'

const GRID_KEYS = [
  'maxRows',
  'maxColumns',
  'minColumns',
  'maxWidth',
  'minWidth',
  'breakpoints',
  'columnGap',
  'rowGap',
  'colWrap',
  'strictAutoFit',
] as const

const pickGridOptions = (attrs: Record<string, any>): IGridOptions => {
  const options: Record<string, any> = {}
  GRID_KEYS.forEach((key) => {
    if (attrs[key] !== undefined) options[key] = attrs[key]
  })
  return options
}

const pickDataProps = (props: Record<string, any>) => {
  const results: Record<string, any> = {}
  Object.keys(props).forEach((key) => {
    if (key.indexOf('data-') > -1) results[key] = props[key]
  })
  return results
}

export interface IFormGridProps extends IGridOptions {
  grid?: Grid<HTMLElement>
  className?: string
  style?: Record<string, any>
}

export const FormGridBinding = observer(
  defineComponent({
    name: 'FormivueFormGrid',
    inheritAttrs: false,
    props: {
      grid: { type: Object, default: undefined },
    },
    setup(props, { attrs, slots }) {
      const containerRef = ref<HTMLElement>()
      // attrs n'est pas réactif en Vue : ni computed ni watch ne voient un
      // changement de maxColumns/minWidth… On compare l'id des options à
      // chaque rendu (déclenché par le changement d'attrs) et on recrée la
      // grille si besoin, reconnectée après le patch DOM.
      const readOptions = () => pickGridOptions(attrs as any)
      const createGrid = () =>
        markRaw(props.grid ? props.grid : new Grid(readOptions()))
      let grid = createGrid()
      let gridId = Grid.id(readOptions())
      let needsConnect = false
      let dispose: (() => void) | null = null
      const connect = () => {
        dispose?.()
        dispose = containerRef.value
          ? grid.connect(containerRef.value as HTMLElement)
          : null
      }
      onMounted(connect)
      onUpdated(() => {
        if (!needsConnect) return
        needsConnect = false
        connect()
      })
      onBeforeUnmount(() => dispose?.())
      return () => {
        const nextId = Grid.id(readOptions())
        if (!props.grid && nextId !== gridId) {
          gridId = nextId
          grid = createGrid()
          needsConnect = true
        }
        const dataProps = pickDataProps(attrs as any)
        return h(
          'div',
          {
            ...dataProps,
            ref: containerRef,
            class: cls('formivue-grid grid', (attrs as any).class),
            style: {
              ...(attrs as any).style,
              gridTemplateColumns: grid.templateColumns,
              gap: grid.gap,
            },
          },
          [...(slots.default?.() ?? []), ...(slots.designerActions?.() ?? [])],
        )
      }
    },
  }) as any,
)

export interface IGridColumnProps {
  gridSpan?: number
  style?: Record<string, any>
  className?: string
}

export const GridColumn = defineComponent({
  name: 'FormivueGridColumn',
  inheritAttrs: false,
  props: {
    gridSpan: { type: Number, default: 1 },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          'data-grid-span': props.gridSpan,
        },
        slots.default?.(),
      )
  },
})

FormGridBinding.GridColumn = GridColumn

export const createFormGrid = (props: IFormGridProps = {}) => {
  return markRaw(new Grid(props))
}

FormGridBinding.createFormGrid = createFormGrid
