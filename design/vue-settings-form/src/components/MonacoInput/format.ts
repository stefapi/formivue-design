export const format = async (language: string, source: string) => {
  if (language === 'json') {
    return JSON.stringify(JSON.parse(source), null, 2)
  }
  if (language !== 'javascript' && language !== 'typescript') return source

  const [{ format }, { default: babel }, { default: estree }] =
    await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/babel'),
      import('prettier/plugins/estree'),
    ])
  return format(source, {
    parser: 'babel-ts',
    plugins: [babel, estree],
    semi: false,
  })
}
