import { createLocales } from '@formivue-design/core'
import { Component } from './Component'
import { FormLayout } from './FormLayout'

// Le Form réutilise les clés de layout headless + style (CSSStyle).
// NB : les settings du nœud Form sont APLATIS (layout/labelAlign/labelWidth/
// size directement — cf. schemas/Form : le matériau designer étale les props
// du nœud sur la FormLayout, pas sous x-component-props) alors que le
// MATÉRIAU FormLayout (créé par createVoidFieldSchema) les référence imbriqués
// sous x-component-props. Les clés de FormLayout sont donc re-projetées au
// niveau plat pour le Form — sans quoi useLocales ne résout ni les titres
// (labels vides → axe button-name) ni les dataSource des options.
const flatFormLayoutSettings = Object.fromEntries(
  Object.entries(FormLayout).map(([lang, def]) => [
    lang,
    {
      settings: {
        ...(def as any).settings['x-component-props'],
      },
    },
  ]),
) as Record<string, any>

export const Form = createLocales(
  FormLayout,
  Component,
  flatFormLayoutSettings,
  {
    'en-US': {
      title: 'Form',
    },
    'fr-FR': {
      title: 'Formulaire',
    },
    'es-ES': {
      title: 'Formulario',
    },
  },
)
