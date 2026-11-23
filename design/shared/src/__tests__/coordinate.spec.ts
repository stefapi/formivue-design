// Phase 2.4 du plan — premiers tests (baseline = 0 test, tout ajout est un gain net).
import {
  Rect,
  Point,
  RectQuadrant,
  isEqualRect,
  calcRectByStartEndPoint,
  calcBoundingRect,
  isRectInRect,
  isCrossRectInRect,
  calcQuadrantOfPointToRect,
  isRect,
} from '@formivue-design/shared'

describe('shared/coordinate', () => {
  test('Rect expose les bornes dérivées', () => {
    const rect = new Rect(10, 20, 100, 50)
    expect(rect.x).toBe(10)
    expect(rect.y).toBe(20)
    expect(rect.width).toBe(100)
    expect(rect.height).toBe(50)
    expect(rect.left).toBe(10)
    expect(rect.top).toBe(20)
    expect(rect.right).toBe(110)
    expect(rect.bottom).toBe(70)
  })

  test('isEqualRect', () => {
    const a = new Rect(0, 0, 10, 10)
    const b = { x: 0, y: 0, width: 10, height: 10 }
    expect(isEqualRect(a, b)).toBe(true)
    expect(isEqualRect(a, { ...b, width: 11 })).toBe(false)
  })

  test('calcRectByStartEndPoint', () => {
    const rect = calcRectByStartEndPoint(
      { x: 10, y: 20 } as Point,
      { x: 30, y: 60 } as Point,
    )
    // sens agnostique : start peut être après end
    expect(rect.x).toBe(10)
    expect(rect.y).toBe(20)
    expect(rect.width).toBe(20)
    expect(rect.height).toBe(40)
  })

  test('calcBoundingRect', () => {
    const bounding = calcBoundingRect([
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 20, width: 10, height: 10 },
    ])
    expect(bounding).toEqual({
      x: 0,
      y: 0,
      width: 30,
      height: 30,
    })
  })

  test('isRect / inclusion / croisement', () => {
    // quirk conservé : isRect exige x/y/width/height tous truthy (rect à l'origine rejeté)
    expect(isRect({ x: 1, y: 2, width: 3, height: 4 })).toBeTruthy()
    expect(isRect({ x: 0, y: 2, width: 3, height: 4 })).toBeFalsy()
    const outer = { x: 0, y: 0, width: 100, height: 100 }
    const inner = { x: 10, y: 10, width: 10, height: 10 }
    const crossing = { x: 90, y: 90, width: 20, height: 20 }
    expect(isRectInRect(inner, outer)).toBe(true)
    expect(isRectInRect(crossing, outer)).toBe(false)
    expect(isCrossRectInRect(crossing, outer)).toBe(true)
  })

  test('calcQuadrantOfPointToRect', () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 }
    expect(calcQuadrantOfPointToRect({ x: 10, y: 10 } as Point, rect)).toEqual(
      RectQuadrant.Inner1,
    )
    expect(
      calcQuadrantOfPointToRect({ x: -10, y: -10 } as Point, rect),
    ).toEqual(RectQuadrant.Outer1)
    expect(calcQuadrantOfPointToRect({ x: 90, y: 90 } as Point, rect)).toEqual(
      RectQuadrant.Inner3,
    )
  })
})
