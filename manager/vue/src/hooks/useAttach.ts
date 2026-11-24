import { onMounted, watch, Ref, onUnmounted, nextTick } from 'vue'

interface IRecycleTarget {
  onMount: () => void
  onUnmount: () => void
}

export const useAttach = <T extends IRecycleTarget>(
  target: Ref<T>,
  retain: () => boolean = () => false,
): Ref<T> => {
  watch(target, (v, old, onInvalidate) => {
    if (v && v !== old) {
      if (!retain()) old?.onUnmount()
      nextTick(() => v.onMount())
      onInvalidate(() => {
        if (!retain()) v.onUnmount()
      })
    }
  })
  onMounted(() => {
    target.value?.onMount()
  })
  onUnmounted(() => {
    if (!retain()) target.value?.onUnmount()
  })
  return target
}
