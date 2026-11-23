// vue-settings-form — ColorInput (port de l'ère). react-color (SketchPicker)
// est React → palette maison **headless** au même gabarit : zone
// saturation/luminosité, curseurs teinte et opacité, aperçu, saisie hex et
// couleurs prédéfinies, dans un Popover non modal. Format de valeur d'ère
// conservé : `rgba(r,g,b,a)` ; le champ texte passe les valeurs tel quel
// (rgba()/hex/nom CSS).
import { defineComponent, h, reactive, watch, type PropType } from 'vue'
import { Input, Popover } from '@formivue-design/vue-ui'
import { usePrefix } from '@formivue-design/vue'
import { GlobalRegistry } from '@formivue-design/core'
import cls from 'classnames'

export interface IColorInputProps {
  value?: string
  onChange?: (color: string) => void
}

interface IHSVA {
  h: number
  s: number
  v: number
  a: number
}

interface IRGBA {
  r: number
  g: number
  b: number
  a: number
}

// couleurs prédéfinies du SketchPicker d'ère
const PRESET_COLORS = [
  '#D0021B',
  '#F5A623',
  '#F8E71C',
  '#8B572A',
  '#7ED321',
  '#417505',
  '#BD10E0',
  '#9013FE',
  '#4A90E2',
  '#50E3C2',
  '#B8E986',
  '#000000',
  '#4A4A4A',
  '#9B9B9B',
  '#FFFFFF',
]

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value))

const round = (value: number, digits = 2) => {
  const base = 10 ** digits
  return Math.round(value * base) / base
}

export const parseColor = (input?: string): IRGBA | null => {
  const text = String(input ?? '')
    .trim()
    .toLowerCase()
  if (!text) return null
  const hex = /^#?([a-f\d]{3,4}|[a-f\d]{6}|[a-f\d]{8})$/i.exec(text)
  if (hex) {
    let value = hex[1]
    if (value.length <= 4)
      value = value
        .split('')
        .map((c) => c + c)
        .join('')
    const r = parseInt(value.slice(0, 2), 16)
    const g = parseInt(value.slice(2, 4), 16)
    const b = parseInt(value.slice(4, 6), 16)
    const a = value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1
    return { r, g, b, a: round(a) }
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(text)
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean)
    if (parts.length < 3) return null
    const [r, g, b] = parts
      .slice(0, 3)
      .map((p) =>
        p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p),
      )
    const a = parts[3]
      ? parts[3].endsWith('%')
        ? parseFloat(parts[3]) / 100
        : parseFloat(parts[3])
      : 1
    if ([r, g, b, a].some((n) => Number.isNaN(n))) return null
    return {
      r: clamp(Math.round(r), 0, 255),
      g: clamp(Math.round(g), 0, 255),
      b: clamp(Math.round(b), 0, 255),
      a: clamp(a),
    }
  }
  return null
}

const rgbToHsv = ({ r, g, b, a }: IRGBA): IHSVA => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let hue = 0
  if (d) {
    if (max === rn) hue = ((gn - bn) / d) % 6
    else if (max === gn) hue = (bn - rn) / d + 2
    else hue = (rn - gn) / d + 4
    hue *= 60
    if (hue < 0) hue += 360
  }
  return { h: hue, s: max ? d / max : 0, v: max, a }
}

const hsvToRgb = ({ h: hue, s, v, a }: IHSVA): IRGBA => {
  const c = v * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = v - c
  const [rn, gn, bn] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x]
  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
    a,
  }
}

const toHex = ({ r, g, b }: IRGBA) =>
  [r, g, b]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

export const toRgbaString = ({ r, g, b, a }: IRGBA) =>
  `rgba(${r},${g},${b},${round(a)})`

const CHECKERBOARD =
  'repeating-conic-gradient(#e5e5e5 0% 25%, #ffffff 0% 50%) 50% / 8px 8px'

// glisser sur une surface : rapporte la position relative (0..1) au fil du
// mouvement (pointer capture → suit la souris hors de la zone)
const createDrag =
  (onMove: (x: number, y: number) => void) => (e: PointerEvent) => {
    const target = e.currentTarget as HTMLElement
    const update = (event: PointerEvent) => {
      const rect = target.getBoundingClientRect()
      onMove(
        clamp((event.clientX - rect.left) / (rect.width || 1)),
        clamp((event.clientY - rect.top) / (rect.height || 1)),
      )
    }
    e.preventDefault()
    target.setPointerCapture?.(e.pointerId)
    update(e)
    const move = (event: PointerEvent) => update(event)
    const up = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.removeEventListener('pointercancel', up)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
    target.addEventListener('pointercancel', up)
  }

export const ColorPickerPanel = defineComponent({
  name: 'DColorPickerPanel',
  props: {
    value: { type: String, default: undefined },
    onChange: {
      type: null as unknown as PropType<(color: string) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const prefix = usePrefix('color-picker')
    const state = reactive<IHSVA>({ h: 0, s: 0, v: 0, a: 1 })
    let lastEmitted: string | undefined

    const syncFromValue = (value?: string) => {
      if (value !== undefined && value === lastEmitted) return
      const rgba = parseColor(value)
      if (!rgba) return
      const hsva = rgbToHsv(rgba)
      // teinte conservée quand la couleur devient grise (s = 0 ou v = 0)
      if (hsva.s === 0 || hsva.v === 0) hsva.h = state.h
      Object.assign(state, hsva)
    }
    syncFromValue(props.value)
    watch(
      () => props.value,
      (value) => syncFromValue(value),
    )

    const emit = () => {
      lastEmitted = toRgbaString(hsvToRgb(state))
      props.onChange?.(lastEmitted)
    }
    const setFromRgba = (rgba: IRGBA | null) => {
      if (!rgba) return
      const hsva = rgbToHsv(rgba)
      if (hsva.s === 0 || hsva.v === 0) hsva.h = state.h
      Object.assign(state, hsva)
      emit()
    }

    const onSaturationDown = createDrag((x, y) => {
      state.s = x
      state.v = 1 - y
      emit()
    })
    const onHueDown = createDrag((x) => {
      state.h = x * 360
      emit()
    })
    const onAlphaDown = createDrag((x) => {
      state.a = round(x)
      emit()
    })

    const stepKeys =
      (apply: (dx: number, dy: number) => void) => (e: KeyboardEvent) => {
        const step = e.shiftKey ? 0.1 : 0.01
        const moves: Record<string, [number, number]> = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
        }
        const move = moves[e.key]
        if (!move) return
        e.preventDefault()
        apply(move[0], move[1])
        emit()
      }

    return () => {
      const rgba = hsvToRgb(state)
      const hex = toHex(rgba)
      const hueColor = `hsl(${state.h}, 100%, 50%)`
      const opaque = `rgb(${rgba.r},${rgba.g},${rgba.b})`
      return h('div', { class: cls(prefix, 'w-[220px] select-none p-2.5') }, [
        // saturation / luminosité
        h(
          'div',
          {
            class: cls(
              prefix + '-saturation',
              'relative h-[150px] w-full cursor-crosshair touch-none overflow-hidden rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            ),
            style: {
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hueColor}`,
            },
            role: 'slider',
            tabindex: 0,
            'aria-label':
              GlobalRegistry.getDesignerMessage(
                'SettingComponents.ColorInput.saturationBrightness',
              ) || 'Saturation and brightness',
            'aria-valuetext': `saturation ${Math.round(state.s * 100)}%, brightness ${Math.round(state.v * 100)}%`,
            onPointerdown: onSaturationDown,
            onKeydown: stepKeys((dx, dy) => {
              state.s = clamp(state.s + dx)
              state.v = clamp(state.v - dy)
            }),
          },
          [
            h('span', {
              class:
                'pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]',
              style: {
                left: `${state.s * 100}%`,
                top: `${(1 - state.v) * 100}%`,
                backgroundColor: opaque,
              },
            }),
          ],
        ),
        h('div', { class: 'mt-2 flex items-center gap-2' }, [
          h('div', { class: 'flex min-w-0 flex-1 flex-col gap-1.5' }, [
            // teinte
            h(
              'div',
              {
                class:
                  'relative h-2.5 cursor-pointer touch-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                style: {
                  background:
                    'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
                },
                role: 'slider',
                tabindex: 0,
                'aria-label':
                  GlobalRegistry.getDesignerMessage(
                    'SettingComponents.ColorInput.hue',
                  ) || 'Hue',
                'aria-valuemin': 0,
                'aria-valuemax': 360,
                'aria-valuenow': Math.round(state.h),
                onPointerdown: onHueDown,
                onKeydown: stepKeys((dx) => {
                  state.h = clamp(state.h / 360 + dx) * 360
                }),
              },
              [
                h('span', {
                  class:
                    'pointer-events-none absolute top-1/2 h-3.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]',
                  style: { left: `${(state.h / 360) * 100}%` },
                }),
              ],
            ),
            // opacité
            h(
              'div',
              {
                class:
                  'relative h-2.5 cursor-pointer touch-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                style: { background: CHECKERBOARD },
                role: 'slider',
                tabindex: 0,
                'aria-label':
                  GlobalRegistry.getDesignerMessage(
                    'SettingComponents.ColorInput.opacity',
                  ) || 'Opacity',
                'aria-valuemin': 0,
                'aria-valuemax': 100,
                'aria-valuenow': Math.round(state.a * 100),
                onPointerdown: onAlphaDown,
                onKeydown: stepKeys((dx) => {
                  state.a = round(clamp(state.a + dx))
                }),
              },
              [
                h('span', {
                  class: 'absolute inset-0 rounded-sm',
                  style: {
                    background: `linear-gradient(to right, transparent, ${opaque})`,
                  },
                }),
                h('span', {
                  class:
                    'pointer-events-none absolute top-1/2 h-3.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]',
                  style: { left: `${state.a * 100}%` },
                }),
              ],
            ),
          ]),
          // aperçu
          h(
            'span',
            {
              class:
                'relative size-6 shrink-0 overflow-hidden rounded-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]',
              style: { background: CHECKERBOARD },
            },
            [
              h('span', {
                class: 'absolute inset-0',
                style: { backgroundColor: toRgbaString(rgba) },
              }),
            ],
          ),
        ]),
        // saisies hex / opacité
        h('div', { class: 'mt-2 flex gap-1.5 text-[11px]' }, [
          h('label', { class: 'flex min-w-0 flex-[3] flex-col items-center' }, [
            h('input', {
              class:
                'h-6 w-full rounded-sm border border-input bg-background px-1 text-center font-mono text-xs uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              value: hex,
              'aria-label':
                GlobalRegistry.getDesignerMessage(
                  'SettingComponents.ColorInput.hex',
                ) || 'Hex',
              maxlength: 7,
              onChange: (e: Event) => {
                const rgbaValue = parseColor(
                  (e.target as HTMLInputElement).value,
                )
                if (rgbaValue) setFromRgba({ ...rgbaValue, a: state.a })
              },
            }),
            h(
              'span',
              { class: 'mt-0.5 text-muted-foreground' },
              GlobalRegistry.getDesignerMessage(
                'SettingComponents.ColorInput.hex',
              ) || 'Hex',
            ),
          ]),
          h('label', { class: 'flex min-w-0 flex-[2] flex-col items-center' }, [
            h('input', {
              class:
                'h-6 w-full rounded-sm border border-input bg-background px-1 text-center text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              value: Math.round(state.a * 100),
              'aria-label':
                GlobalRegistry.getDesignerMessage(
                  'SettingComponents.ColorInput.opacityPercent',
                ) || 'Opacity percent',
              inputmode: 'numeric',
              onChange: (e: Event) => {
                const percent = parseFloat((e.target as HTMLInputElement).value)
                if (Number.isNaN(percent)) return
                state.a = round(clamp(percent / 100))
                emit()
              },
            }),
            h('span', { class: 'mt-0.5 text-muted-foreground' }, 'A %'),
          ]),
        ]),
        // couleurs prédéfinies
        h(
          'div',
          {
            class:
              '-mx-2.5 mt-2 flex flex-wrap gap-2.5 border-t border-border px-2.5 pt-2.5',
          },
          PRESET_COLORS.map((preset) =>
            h('button', {
              key: preset,
              type: 'button',
              'aria-label': preset,
              title: preset,
              class:
                'size-4 cursor-pointer rounded-[3px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              style: { backgroundColor: preset },
              onClick: () => setFromRgba(parseColor(preset)),
            }),
          ),
        ),
      ])
    }
  },
})

export const ColorInput = defineComponent({
  name: 'DColorInput',
  inheritAttrs: false,
  props: {
    value: { type: String, default: undefined },
    onChange: {
      type: null as unknown as PropType<(color: string) => void>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const prefix = usePrefix('color-input')
    return () => {
      const color = props.value as string
      // d'ère : pastille 20px dans le préfixe du champ texte, ouvre la palette
      return h(
        'div',
        {
          class: cls(
            prefix,
            'relative flex w-full items-center',
            attrs.class as string,
          ),
        },
        [
          h(
            Popover,
            { align: 'start', class: 'w-auto p-0' },
            {
              default: () =>
                h(
                  'button',
                  {
                    type: 'button',
                    'aria-label':
                      GlobalRegistry.getDesignerMessage(
                        'SettingComponents.ColorInput.pickAColor',
                      ) || 'Pick a color',
                    class: cls(
                      prefix + '-tips',
                      'absolute left-1.5 top-1/2 z-[1] size-5 -translate-y-1/2 cursor-pointer overflow-hidden rounded-[2px] border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                    ),
                    style: { background: CHECKERBOARD },
                  },
                  [
                    h('span', {
                      class: 'absolute inset-0',
                      style: { backgroundColor: color },
                    }),
                  ],
                ),
              content: () =>
                h(ColorPickerPanel, {
                  value: color,
                  onChange: (value: string) => props.onChange?.(value),
                }),
            },
          ),
          h(Input, {
            ...attrs,
            class: 'pl-8!',
            value: props.value,
            placeholder: 'Color',
            onChange: (value: string) => {
              props.onChange?.(value)
            },
          }),
        ],
      )
    }
  },
})
