import {
  getValidateLocaleIOSCode,
  getLocaleByPath,
  getValidateLocale,
  setValidateLanguage,
} from '../'
import locale from '../locale'

test('getValidateLocaleIOSCode', () => {
  expect(getValidateLocaleIOSCode('en-US')).toEqual('en-US')
  expect(getValidateLocaleIOSCode('en')).toEqual('en')
  expect(getValidateLocaleIOSCode('EN')).toEqual('en')
  expect(getValidateLocaleIOSCode('us')).toEqual('en-US')
  expect(getValidateLocaleIOSCode('fr-FR')).toEqual('fr')
  expect(getValidateLocaleIOSCode('FR')).toEqual('fr')
  expect(getValidateLocaleIOSCode('es')).toEqual('es')
})

test('getLocaleByPath', () => {
  expect(getLocaleByPath('pattern', 'vi')).toEqual(locale.en.pattern)
  expect(getLocaleByPath('pattern')).toEqual(locale.en.pattern)
})

test('getValidateLocale', () => {
  setValidateLanguage('vi')
  expect(getValidateLocale('pattern')).toEqual(locale.en.pattern)
})
