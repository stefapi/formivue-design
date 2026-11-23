/**
 * Porté en interne depuis les paquets `no-case@3.0.4`, `pascal-case@3.1.2`,
 * `camel-case@4.1.2`, `param-case@3.0.4`, `lower-case@2.0.2`, `upper-case@2.0.1`
 * (MIT, blakeembrey/change-case) — cf. plan v3 A7 (zéro dep externe runtime).
 */

export const lowerCase = (input: string, locale?: string): string => {
  const language = locale?.toLowerCase?.()
  if (language === 'tr' || language === 'az') {
    return input.toLocaleLowerCase(language)
  }
  const lang = SUPPORTED_LOCALE[language]
  if (lang) {
    return lowerCase(input.replace(lang.regexp, (m) => lang.map[m]))
  }
  return input.toLowerCase()
}

export const upperCase = (input: string, locale?: string): string => {
  const lang = SUPPORTED_UPPER_LOCALE[locale?.toLowerCase?.()]
  if (lang) {
    return input.replace(lang.regexp, (m) => lang.map[m]).toUpperCase()
  }
  return input.toUpperCase()
}

const camelCaseTransform = (input: string, index: number): string => {
  if (index === 0) return input.toLowerCase()
  return pascalCaseTransform(input, index)
}

export const camelCase = (input: string): string => {
  return noCase(input, {
    delimiter: '',
    transform: camelCaseTransform,
  })
}

const pascalCaseTransform = (input: string, index: number): string => {
  const firstChar = input.charAt(0)
  const lowerChars = input.substr(1).toLowerCase()
  if (index > 0 && firstChar >= '0' && firstChar <= '9') {
    return `_${firstChar}${lowerChars}`
  }
  return `${firstChar.toUpperCase()}${lowerChars}`
}

export const pascalCase = (input: string): string => {
  return noCase(input, {
    delimiter: '',
    transform: pascalCaseTransform,
  })
}

export const paramCase = (input: string): string => {
  return noCase(input, {
    delimiter: '-',
  })
}

/* ---------------------------------- internal ---------------------------------- */

// no-case@3.0.4
const DEFAULT_SPLIT_REGEXP = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g]
const DEFAULT_STRIP_REGEXP = /[^A-Z0-9]+/gi

type NoCaseOptions = {
  splitRegexp?: RegExp | RegExp[]
  stripRegexp?: RegExp | RegExp[]
  delimiter?: string
  transform?: (input: string, index: number) => string
}

const noCase = (input: string, options: NoCaseOptions = {}): string => {
  const {
    splitRegexp = DEFAULT_SPLIT_REGEXP,
    stripRegexp = DEFAULT_STRIP_REGEXP,
    transform = (token) => token.toLowerCase(),
    delimiter = ' ',
  } = options

  const result = replace(
    replace(input, splitRegexp, '$1\0$2'),
    stripRegexp,
    '\0',
  )
  let start = 0
  let end = result.length
  // Trim the delimiter from around the output string.
  while (result.charAt(start) === '\0') start++
  while (result.charAt(end - 1) === '\0') end--

  // Transform each token independently.
  return result.slice(start, end).split('\0').map(transform).join(delimiter)
}

const replace = (
  input: string,
  re: RegExp | RegExp[],
  value: string,
): string => {
  if (re instanceof RegExp) return input.replace(re, value)
  return re.reduce((input, re) => input.replace(re, value), input)
}

// lower-case@2.0.2 — Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
const SUPPORTED_LOCALE: Record<string, any> = {
  lt: {
    regexp: /\u0049|\u004A|\u012E|\u00CC|\u00CD|\u0128/g,
    map: {
      I: '\u0069\u0307',
      J: '\u006A\u0307',
      Į: '\u012F\u0307',
      Ì: '\u0069\u0307\u0300',
      Í: '\u0069\u0307\u0301',
      Ĩ: '\u0069\u0307\u0303',
    },
  },
}

// upper-case@2.0.1
const SUPPORTED_UPPER_LOCALE: Record<string, any> = {
  tr: {
    regexp: /[\u0069]/g,
    map: {
      i: '\u0130',
    },
  },
  az: {
    regexp: /[\u0069]/g,
    map: {
      i: '\u0130',
    },
  },
  lt: {
    regexp: /[\u0069\u006A\u012F\u00CC|\u00CD\u0128]/g,
    map: {
      i: '\u0049\u0307',
      j: '\u004A\u0307',
      į: '\u012E\u0307',
      ì: '\u00CC\u0307',
      í: '\u00CD\u0307',
      ĩ: '\u0128\u0307',
    },
  },
}
