import b from 'benny'
import _ from 'lodash'
import * as mobx from 'mobx'
import * as vueReactivity from '@vue/reactivity'
import * as formivueReactive from './src'

function func(obs, times) {
  obs.arr = []
  obs.obj = {}
  _.times(times, (v) => {
    obs.num = v
    obs.str = `${v}`
    obs.arr.push(v)
    obs.obj[`${v}`] = v
  })
}

b.suite(
  'Reactive Observable',

  b.add('Case MobX', () => {
    const obs = mobx.observable({})
    func(obs, 1e3)
  }),

  b.add('Case @vue/reactivity', () => {
    const obs = vueReactivity.reactive({})
    func(obs, 1e3)
  }),

  b.add('Case @formivue/reactive', () => {
    const obs = formivueReactive.observable({})
    func(obs, 1e3)
  }),

  b.cycle(),
  b.complete(),
)
