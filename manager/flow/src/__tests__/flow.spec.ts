// @vitest-environment node
import { createForm } from '@formivue/core'
import { describe, expect, test, vi } from 'vitest'
import { createFormFlow } from '../index'

describe('headless form flow', () => {
  test('validates the active path and restores the right step after changing a previous answer', async () => {
    const form = createForm()
    const routeChoice = form.createField({ name: 'route', required: true })
    const leftAnswer = form.createField({ name: 'leftAnswer', required: true })
    const rightAnswer = form.createField({
      name: 'rightAnswer',
      required: true,
    })
    const flow = createFormFlow(form, {
      steps: [
        {
          id: 'choose',
          fields: ['route'],
          branches: [{ path: 'route', equals: 'left', next: 'left' }],
          next: 'right',
        },
        { id: 'left', fields: ['leftAnswer'], next: 'review' },
        { id: 'right', fields: ['rightAnswer'], next: 'review' },
        { id: 'review' },
      ],
    })

    expect(flow.current).toBe('choose')
    expect(await flow.next()).toBe(false)
    expect(flow.errors).toHaveLength(1)
    routeChoice.setValue('left')
    expect(await flow.next()).toBe(true)
    expect(flow.current).toBe('left')
    leftAnswer.setValue('Keep this')
    await flow.next()
    expect(flow.current).toBe('review')
    expect(flow.back()).toBe(true)
    expect(flow.back()).toBe(true)
    routeChoice.setValue('right')
    await flow.next()
    expect(flow.current).toBe('right')
    expect(await flow.next()).toBe(false)
    rightAnswer.setValue('Complete this')
    await flow.next()
    const submit = vi.fn()
    expect(await flow.finish(submit)).toBe(true)
    expect(await flow.finish(submit)).toBe(false)
    expect(submit).toHaveBeenCalledExactlyOnceWith({
      route: 'right',
      leftAnswer: 'Keep this',
      rightAnswer: 'Complete this',
    })
  })

  test('validates scoped descendants and serializes concurrent requests', async () => {
    const form = createForm()
    form.createVoidField({ name: 'section' })
    form.createVoidField({ name: 'panel', basePath: 'section' })
    const field = form.createField({
      name: 'answer',
      basePath: 'section.panel',
      required: true,
    })
    const outside = form.createField({ name: 'outside', required: true })
    await expect(outside.validate()).rejects.toBeDefined()
    const flow = createFormFlow(form, {
      steps: [{ id: 'panel', scope: 'section.panel' }, { id: 'done' }],
    })
    expect(await flow.next()).toBe(false)
    field.setValue('Valid')
    const first = flow.next()
    expect(flow.pending).toBe(true)
    expect(await flow.next()).toBe(false)
    expect(await first).toBe(true)
    expect(flow.current).toBe('done')
    expect(await flow.finish()).toBe(true)
  })

  test('rejects bad references and surfaces cycles', async () => {
    const form = createForm()
    expect(() =>
      createFormFlow(form, { steps: [{ id: 'a', next: 'missing' }] }),
    ).toThrow('Unknown flow step')
    const flow = createFormFlow(form, { steps: [{ id: 'a', next: 'a' }] })
    expect(await flow.next()).toBe(false)
    expect(flow.errors).toEqual(['Flow returns to step "a".'])
  })
})
