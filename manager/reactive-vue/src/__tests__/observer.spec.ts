import { mount } from '@vue/test-utils'
import { observable } from '@formivue/reactive'
import { defineComponent, h, nextTick } from 'vue'
import { observer } from '../'

test('observer: component with setup', async () => {
  const model = observable<any>({
    age: 30,
    get sub10() {
      return model.age - 10
    },
    get sub20() {
      return model.sub10 - 10
    },
    setAge() {
      model.age++
    },
  })
  const Component = observer(
    defineComponent({
      setup() {
        return () => {
          return h('button', { onClick: model.setAge }, [model.sub20])
        }
      },
    }),
  )
  const wrapper = mount(Component)
  expect(wrapper.find('button').text()).toBe('10')
  await wrapper.find('button').trigger('click')
  await nextTick()
  expect(wrapper.find('button').text()).toBe('11')
  model.age++
  await nextTick()
  expect(wrapper.find('button').text()).toBe('12')
  wrapper.unmount()
})

test('observer: component scheduler', async () => {
  let schedulerRequest = null

  const model = observable<any>({
    age: 10,
    setAge() {
      model.age++
    },
  })

  const Component = observer(
    defineComponent({
      setup() {
        return () => {
          return h('button', { onClick: model.setAge }, [model.age])
        }
      },
    }),
    {
      scheduler: (update) => {
        clearTimeout(schedulerRequest)
        schedulerRequest = setTimeout(() => {
          update()
        }, 100)
      },
    },
  )

  const wrapper = mount(Component)

  expect(wrapper.find('button').text()).toBe('10')

  await wrapper.find('button').trigger('click')
  await new Promise((r) => setTimeout(r, 150))
  expect(wrapper.find('button').text()).toBe('11')

  // test second render
  await wrapper.find('button').trigger('click')
  await new Promise((r) => setTimeout(r, 150))
  expect(wrapper.find('button').text()).toBe('12')

  wrapper.unmount()
})

test('observer: stop tracking if component is unmounted', async () => {
  let count = 0
  const model = observable<any>({
    age: 10,
    name: 'test',
  })

  const Component = observer({
    name: 'test',
    setup() {
      return () => {
        count++
        return h('div', [model.name, model.age])
      }
    },
  })

  const wrapper = mount(Component)
  await nextTick()
  const renderedCount = count
  model.age++
  await nextTick()
  expect(count).toBeGreaterThan(renderedCount) // reactive render was triggered

  wrapper.unmount()
  const unmountedCount = count
  model.age++
  await nextTick()
  expect(count).toBe(unmountedCount) // no more reactive render after unmount
})

test('observer: name', () => {
  const Component = observer({
    setup() {
      return () => h('div')
    },
  })
  expect((Component as any).name).toEqual('ObservableComponent')

  const Component2 = observer(
    {
      name: 'Base',
      setup() {
        return () => h('div')
      },
    },
    { name: 'abc' },
  )
  expect((Component2 as any).name).toEqual('Base')
})
