import { h } from 'vue'
import { Fragment, FragmentComponent } from './fragment'
import { formatVue3VNodeData } from '../utils/formatVNodeData'

type RenderChildren = {
  [key in string]?: (...args: any[]) => (VNode | string)[]
}

type Tag = any
type VNodeData = Record<string, any>
type VNode = any

const compatibleCreateElement = (
  tag: Tag,
  data: VNodeData,
  components: RenderChildren,
): any => {
  if (tag === Fragment) {
    tag = FragmentComponent
  }
  return h(tag, formatVue3VNodeData(data), components)
}

export default compatibleCreateElement

export { compatibleCreateElement as h }
