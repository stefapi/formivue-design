import { componentSchema, editor, jsonArray, jsonScalar } from './shared'

export const DataTable = componentSchema({
  columns: jsonArray(
    {
      type: 'object',
      required: ['key', 'title'],
      properties: {
        key: { type: 'string' },
        title: { type: 'string' },
        sortable: { type: 'boolean' },
      },
    },
    true,
  ),
  rows: jsonArray({ type: 'object', additionalProperties: jsonScalar }, true),
  rowKey: editor('Input'),
  pageSize: editor('NumberPicker', { min: 1 }),
  searchable: editor('Switch'),
  label: editor('Input'),
  previousText: editor('Input'),
  nextText: editor('Input'),
  searchLabel: editor('Input'),
  emptyText: editor('Input'),
})
