import { ICustomEvent } from '@formivue-design/shared'
import { ITreeNode, TreeNode } from '../../models'
import { IEngineContext } from '../../types'

export interface IFromNodeEventData {
  // data source of the event
  source: ITreeNode
  // target object of the event
  target: TreeNode
}

export class FromNodeEvent implements ICustomEvent {
  type = 'from:node'
  data: IFromNodeEventData
  context: IEngineContext
  constructor(data: IFromNodeEventData) {
    this.data = data
  }
}
