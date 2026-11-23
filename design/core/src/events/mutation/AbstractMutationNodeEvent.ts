import { TreeNode } from '../../models'
import { IEngineContext } from '../../types'

export interface IMutationNodeEventData {
  // data source of the event
  source: TreeNode | TreeNode[]
  // target object of the event
  target: TreeNode | TreeNode[]
  // origin object of the event
  originSourceParents?: TreeNode | TreeNode[]
  // extra data
  extra?: any
}

export class AbstractMutationNodeEvent {
  data: IMutationNodeEventData
  context: IEngineContext
  constructor(data: IMutationNodeEventData) {
    this.data = data
  }
}
