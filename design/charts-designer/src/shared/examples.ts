export const salesRows = [
  { month: 'Jan', actual: 24, goal: 30 },
  { month: 'Feb', actual: 38, goal: 34 },
  { month: 'Mar', actual: 43, goal: 40 },
]

export const seriesExample = {
  rows: salesRows,
  xKey: 'month',
  series: [
    { key: 'actual', title: 'Actual' },
    { key: 'goal', title: 'Goal' },
  ],
}

export const sliceExample = {
  rows: salesRows,
  xKey: 'month',
  valueKey: 'actual',
}
export const linkExample = {
  rows: [
    { from: 'Web', to: 'Cart', amount: 12 },
    { from: 'Store', to: 'Cart', amount: 8 },
    { from: 'Cart', to: 'Paid', amount: 15 },
    { from: 'Cart', to: 'Abandoned', amount: 5 },
  ],
  sourceKey: 'from',
  targetKey: 'to',
  valueKey: 'amount',
}
export const hierarchyExample = {
  rows: [
    { group: 'Europe', country: 'France', value: 30 },
    { group: 'Europe', country: 'Spain', value: 17 },
    { group: 'Asia', country: 'Japan', value: 26 },
  ],
  groupKey: 'group',
  xKey: 'country',
  valueKey: 'value',
}
export const pointExample = {
  rows: [
    { city: 'Paris', lat: 48.86, lon: 2.35, value: 12 },
    { city: 'Lisbon', lat: 38.72, lon: -9.14, value: 8 },
  ],
  xKey: 'city',
  latitudeKey: 'lat',
  longitudeKey: 'lon',
  valueKey: 'value',
}
