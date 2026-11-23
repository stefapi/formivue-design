import { IEventProps, Event } from '@formivue-design/shared'
import { ISchema } from '@formivue/json-schema'
import {
  Engine,
  ITreeNode,
  ScreenType,
  Shortcut,
  Viewport,
  Workbench,
  Workspace,
  TreeNode,
} from './models'

export type IEngineProps<T = Event> = IEventProps<T> & {
  shortcuts?: Shortcut[]
  sourceIdAttrName?: string // DOM attribute name of the drag source id
  nodeIdAttrName?: string // DOM attribute name of the node id
  contentEditableAttrName?: string // in-place editing attribute name
  contentEditableNodeIdAttrName?: string // in-place editing node id attribute name
  clickStopPropagationAttrName?: string // click stop-propagation attribute name
  outlineNodeIdAttrName?: string // DOM attribute name of the outline tree node id
  nodeSelectionIdAttrName?: string // node toolbar attribute name
  nodeDragHandlerAttrName?: string // node drag handler attribute name
  screenResizeHandlerAttrName?: string
  nodeResizeHandlerAttrName?: string // node resize handler attribute name
  nodeTranslateAttrName?: string // attribute name of the free node layout
  defaultComponentTree?: ITreeNode // default component tree
  defaultScreenType?: ScreenType
  rootComponentName?: string
}

export type IEngineContext = {
  workspace: Workspace
  workbench: Workbench
  engine: Engine
  viewport: Viewport
}

export type IResizable = {
  width?: (
    node: TreeNode,
    element: Element,
  ) => {
    plus: () => void
    minus: () => void
  }
  height?: (
    node: TreeNode,
    element: Element,
  ) => {
    plus: () => void
    minus: () => void
  }
}

export type ITranslate = {
  x: (
    node: TreeNode,
    element: HTMLElement,
    diffX: string | number,
  ) => {
    translate: () => void
  }
  y: (
    node: TreeNode,
    element: HTMLElement,
    diffY: string | number,
  ) => {
    translate: () => void
  }
}

export interface IDesignerProps {
  package?: string // npm package name
  registry?: string // web npm registry platform url
  version?: string // semver version
  path?: string // component module path
  title?: string // title
  description?: string // description
  icon?: string // icon
  droppable?: boolean // whether it can be a drop container, defaults to true
  draggable?: boolean // whether it can be dragged, defaults to true
  deletable?: boolean // whether it can be deleted, defaults to true
  cloneable?: boolean // whether it can be cloned, defaults to true
  resizable?: IResizable
  translatable?: ITranslate // free layout
  inlineChildrenLayout?: boolean // inline children, used to force inlining for complex layout containers
  selfRenderChildren?: boolean // whether it renders its own children
  propsSchema?: ISchema // Formivue JSON Schema
  defaultProps?: any // default props
  getDragNodes?: (node: TreeNode) => TreeNode | TreeNode[] // intercept and transform drag nodes
  getDropNodes?: (node: TreeNode, parent: TreeNode) => TreeNode | TreeNode[] // intercept and transform drop nodes
  getComponentProps?: (node: TreeNode) => any // intercept props
  onFieldRename?: (node: TreeNode, field: TreeNode, previousKey: string) => void
  allowAppend?: (target: TreeNode, sources?: TreeNode[]) => boolean
  allowSiblings?: (target: TreeNode, sources?: TreeNode[]) => boolean
  allowDrop?: (target: TreeNode) => boolean
  [key: string]: any
}

export type IDesignerPropsMap = Record<string, IDesignerProps>

export type IDesignerControllerProps =
  IDesignerProps | ((node: TreeNode) => IDesignerProps)

export type IDesignerControllerPropsMap = Record<
  string,
  IDesignerControllerProps
>
export interface IDesignerLocales {
  [ISOCode: string]: {
    [key: string]: any
  }
}

export interface IDesignerMiniLocales {
  [ISOCode: string]: string
}

export interface IDesignerBehaviors {
  [key: string]: IBehaviorHost
}

export interface IDesignerStore<P> {
  value: P
}

export type IDesignerIcons = Record<string, any>

export type IDesignerIconsStore = IDesignerStore<IDesignerIcons>
export type IDesignerLocaleStore = IDesignerStore<IDesignerLocales>
export type IDesignerBehaviorStore = IDesignerStore<IBehavior[]>
export type IDesignerLanguageStore = IDesignerStore<string>

export type WorkbenchTypes =
  'FORMIVUEDESIGN' | 'PREVIEW' | 'JSONTREE' | 'MARKUP' | (string & {})

export interface IBehavior {
  name: string
  extends?: string[]
  selector: (node: TreeNode) => boolean
  designerProps?: IDesignerControllerProps
  designerLocales?: IDesignerLocales
}

export interface IBehaviorCreator {
  name: string
  extends?: string[]
  selector: string | ((node: TreeNode) => boolean)
  designerProps?: IDesignerControllerProps
  designerLocales?: IDesignerLocales
}

export interface IBehaviorHost {
  Behavior?: IBehavior[]
}

export type IBehaviorLike = IBehavior[] | IBehaviorHost

export interface IResource {
  title?: string | IDesignerMiniLocales
  description?: string | IDesignerMiniLocales
  icon?: any
  thumb?: string
  span?: number
  node?: TreeNode
}

export interface IResourceHost {
  Resource?: IResource[]
}

export type IResourceLike = IResource[] | IResourceHost
export interface IResourceCreator {
  title?: string | IDesignerMiniLocales
  description?: string | IDesignerMiniLocales
  icon?: any
  thumb?: string
  span?: number
  elements?: ITreeNode[]
}
