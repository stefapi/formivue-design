import type { InjectionKey } from 'vue'
import { TreeNode, Engine } from '@formivue-design/core'
import {
  IDesignerLayoutContext,
  IWorkspaceContext,
  IDesignerComponents,
} from './types'

// Port §1.5 : createContext/useContext → InjectionKey + provide/inject.
// Les 5 contexts gardent leurs noms d'ère (baseline-api).

export const DesignerComponentsContext: InjectionKey<IDesignerComponents> =
  Symbol('DesignerComponentsContext')

export const DesignerLayoutContext: InjectionKey<IDesignerLayoutContext> =
  Symbol('DesignerLayoutContext')

export const DesignerEngineContext: InjectionKey<Engine> = Symbol(
  'DesignerEngineContext',
)

export const TreeNodeContext: InjectionKey<TreeNode> = Symbol('TreeNodeContext')

export const WorkspaceContext: InjectionKey<IWorkspaceContext> =
  Symbol('WorkspaceContext')
