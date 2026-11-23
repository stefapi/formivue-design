import type { Component } from 'vue'
import { Engine, IResource, IBehavior } from '@formivue-design/core'

export interface IDesignerLayoutProps {
  prefixCls?: string
  theme?: 'dark' | 'light' | (string & {})
  variables?: Record<string, string>
  position?: 'fixed' | 'absolute' | 'relative'
}
export interface IDesignerProps extends IDesignerLayoutProps {
  engine: Engine
}

export interface IDesignerComponents {
  [key: string]: DnFC<any> | DnComponent<any>
}

export interface IDesignerLayoutContext {
  theme?: 'dark' | 'light' | (string & {})
  prefixCls: string
  position: 'fixed' | 'absolute' | 'relative'
}

export interface IWorkspaceContext {
  id: string
  title?: string
  description?: string
}

// Ére React : React.FC<P> / React.ComponentType<P>. Vue : tout composant
// (options, defineComponent, fonctionnel) est un Component — les deux types
// d'ère convergent (écart de forme assumé, table §1.5 du plan).
export type DnFC<P = {}> = Component & {
  Resource?: IResource[]
  Behavior?: IBehavior[]
}

export type DnComponent<P = {}> = Component & {
  Resource?: IResource[]
  Behavior?: IBehavior[]
}
