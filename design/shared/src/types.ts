import { globalThisPolyfill } from './globalThisPolyfill'

const isType =
  <T>(type: string | string[]) =>
  (obj: unknown): obj is T =>
    obj != null &&
    (Array.isArray(type) ? type : [type]).some(
      (t) => getType(obj) === `[object ${t}]`,
    )
export const getType = (obj: any) => Object.prototype.toString.call(obj)
export const isFn = isType<(...args: any[]) => any>([
  'Function',
  'AsyncFunction',
  'GeneratorFunction',
])
// L'ère testait Object.prototype.toString === '[object Window]' — exact en
// navigateur (globalThis === window). Sous un env DOM patché (jsdom/vitest),
// globalThis n'est PAS la window jsdom : toString vaut '[object global]' et
// isWindow(globalThisPolyfill) ratrait — les drivers du moteur s'attachaient
// alors à la global nue (Node.contains(window) y jette). Reconnaître la
// global elle-même restaure le comportement navigateur (attach sur document).
export const isWindow = (obj: any): obj is Window =>
  isType<Window>('Window')(obj) || obj === globalThisPolyfill
export const isHTMLElement = (obj: any): obj is HTMLElement => {
  return obj?.['nodeName'] || obj?.['tagName']
}
export const isArr = Array.isArray
export const isPlainObj = isType<object>('Object')
export const isStr = isType<string>('String')
export const isBool = isType<boolean>('Boolean')
export const isNum = isType<number>('Number')
export const isObj = (val: unknown): val is object => typeof val === 'object'
export const isRegExp = isType<RegExp>('RegExp')
export const isValid = (val: any) => val !== null && val !== undefined
export const isValidNumber = (val: any): val is number =>
  !isNaN(val) && isNum(val)
