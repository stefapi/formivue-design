import { Table2Icon } from '@lucide/vue'
import { DataTable as RuntimeDataTable } from '@formivue-design/shadcn-advanced-runtime'
import { createMaterial } from '../shared'
import { DataTable as DataTableSchema } from '../../schemas/DataTable'
import { DataTable as DataTableLocales } from '../../locales/DataTable'

export const DataTable = createMaterial({
  name: 'DataTable',
  icon: Table2Icon,
  component: RuntimeDataTable,
  props: {
    columns: [{ key: 'name', title: 'Name' }],
    rows: [{ name: 'Example' }],
    pageSize: 10,
    searchable: true,
  },
  schema: DataTableSchema,
  locales: DataTableLocales,
})
