// formivue/setters — DataSourceSetter types (port verbatim de l'ère,
// framework-agnostic).
export interface IDataSourceItem {
  label?: ''
  value?: any
  children?: any[]
}

export interface INodeItem {
  key: string
  duplicateKey?: string
  map?: { label: string; value: any }[]
  children?: INodeItem[]
}

export interface ITreeDataSource {
  dataSource: INodeItem[]
  selectedKey: string
}
