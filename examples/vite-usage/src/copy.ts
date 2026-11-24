import { message, type Message } from '../../shared/language'
export const copy = {
  Demos: ['Demos', 'Démonstrations', 'Demostraciones'],
  'Forms that are reactive, no glue.': [
    'Forms that are reactive, no glue.',
    'Des formulaires réactifs, sans code de liaison.',
    'Formularios reactivos, sin código de enlace.',
  ],
  'Formivue separates the form state from its rendering. Each demo shows the form state updating as you type.':
    [
      'Formivue separates the form state from its rendering. Each demo shows the form state updating as you type.',
      'Formivue sépare l’état du formulaire de son rendu. Chaque démonstration affiche l’état du formulaire au fil de la saisie.',
      'Formivue separa el estado del formulario de su presentación. Cada demostración muestra cómo cambia el estado al escribir.',
    ],
  Tenant: ['Tenant', 'Locataire', 'Inquilino'],
  'zod validation, effects, 4 display modes.': [
    'zod validation, effects, 4 display modes.',
    'Validation Zod, effets et quatre modes d’affichage.',
    'Validación con Zod, efectos y cuatro modos de presentación.',
  ],
  'Rent schedule': [
    'Rent schedule',
    'Échéancier de loyers',
    'Calendario de alquiler',
  ],
  'Dynamic rows and computed totals.': [
    'Dynamic rows and computed totals.',
    'Lignes dynamiques et totaux calculés.',
    'Filas dinámicas y totales calculados.',
  ],
  Lease: ['Lease', 'Bail', 'Contrato de alquiler'],
  'Fields that drive each other.': [
    'Fields that drive each other.',
    'Des champs qui réagissent les uns aux autres.',
    'Campos que reaccionan a otros campos.',
  ],
  'The form described as data.': [
    'The form described as data.',
    'Un formulaire décrit sous forme de données.',
    'El formulario descrito como datos.',
  ],
  'Designer form': [
    'Designer form',
    'Formulaire du designer',
    'Formulario del diseñador',
  ],
  'Render a designer export with the manager.': [
    'Render a designer export with the manager.',
    'Affichez un export du designer avec le moteur.',
    'Renderiza una exportación del diseñador con el motor.',
  ],
  'Fields · validation · effects': [
    'Fields · validation · effects',
    'Champs · validation · effets',
    'Campos · validación · efectos',
  ],
  'Each Field has observable state. The rules come from the same Zod schema as vee-validate. Switch the display mode to see one form in different modes.':
    [
      'Each Field has observable state. The rules come from the same Zod schema as vee-validate. Switch the display mode to see one form in different modes.',
      'Chaque champ possède un état observable. Les règles viennent du même schéma Zod que vee-validate. Changez le mode d’affichage pour voir le même formulaire sous plusieurs formes.',
      'Cada campo tiene un estado observable. Las reglas vienen del mismo esquema Zod que vee-validate. Cambia el modo de presentación para ver el mismo formulario de distintas maneras.',
    ],
  'Tenant profile': [
    'Tenant profile',
    'Profil du locataire',
    'Perfil del inquilino',
  ],
  'Form display mode': [
    'Form display mode',
    'Mode d’affichage du formulaire',
    'Modo de presentación del formulario',
  ],
  editable: ['editable', 'Modifiable', 'Editable'],
  readOnly: ['readOnly', 'Lecture seule', 'Solo lectura'],
  disabled: ['disabled', 'Désactivé', 'Desactivado'],
  readPretty: ['readPretty', 'Lecture mise en forme', 'Lectura con formato'],
  'Full name': ['Full name', 'Nom complet', 'Nombre completo'],
  Email: ['Email', 'Adresse e-mail', 'Correo electrónico'],
  Phone: ['Phone', 'Téléphone', 'Teléfono'],
  'Format: 06 12 34 56 78': [
    'Format: 06 12 34 56 78',
    'Format : 06 12 34 56 78',
    'Formato: 06 12 34 56 78',
  ],
  'Net monthly income': [
    'Net monthly income',
    'Revenu mensuel net',
    'Ingresos mensuales netos',
  ],
  'zod · min €1,000': [
    'zod · min €1,000',
    'Zod · min. 1 000 €',
    'Zod · mín. 1.000 €',
  ],
  Guarantor: ['Guarantor', 'Garant', 'Avalista'],
  'A guarantor stands surety': [
    'A guarantor stands surety',
    'Un garant se porte caution',
    'Un avalista responde del pago',
  ],
  Submit: ['Submit', 'Valider', 'Enviar'],
  Reset: ['Reset', 'Réinitialiser', 'Restablecer'],
  'Fill in a sample': [
    'Fill in a sample',
    'Remplir avec un exemple',
    'Rellenar con un ejemplo',
  ],
  'Form is valid ✓': [
    'Form is valid ✓',
    'Le formulaire est valide ✓',
    'El formulario es válido ✓',
  ],
  '{count} error to fix': [
    '{count} error to fix',
    '{count} erreur à corriger',
    'Hay que corregir {count} error',
  ],
  '{count} errors to fix': [
    '{count} errors to fix',
    '{count} erreurs à corriger',
    'Hay que corregir {count} errores',
  ],
  'At least 2 characters': [
    'At least 2 characters',
    'Au moins 2 caractères',
    'Al menos 2 caracteres',
  ],
  'Invalid email address': [
    'Invalid email address',
    'Adresse e-mail invalide',
    'Correo electrónico no válido',
  ],
  'A number is expected': [
    'A number is expected',
    'Un nombre est attendu',
    'Se esperaba un número',
  ],
  'Minimum income: €1,000': [
    'Minimum income: €1,000',
    'Revenu minimum : 1 000 €',
    'Ingresos mínimos: 1.000 €',
  ],
  'Expected format: 06 12 34 56 78': [
    'Expected format: 06 12 34 56 78',
    'Format attendu : 06 12 34 56 78',
    'Formato esperado: 06 12 34 56 78',
  ],
  'Array fields · computed field': [
    'Array fields · computed field',
    'Tableaux · champ calculé',
    'Listas · campo calculado',
  ],
  'ArrayField manages additions, deletions and moves while preserving each field’s state. A reaction updates the total automatically.':
    [
      'ArrayField manages additions, deletions and moves while preserving each field’s state. A reaction updates the total automatically.',
      'ArrayField gère les ajouts, suppressions et déplacements en conservant l’état de chaque champ. Une réaction met automatiquement le total à jour.',
      'ArrayField gestiona altas, bajas y movimientos conservando el estado de cada campo. Una reacción actualiza el total automáticamente.',
    ],
  Month: ['Month', 'Mois', 'Mes'],
  Amount: ['Amount', 'Montant', 'Importe'],
  'A positive amount is expected': [
    'A positive amount is expected',
    'Un montant positif est attendu',
    'Se esperaba un importe positivo',
  ],
  'Month expected (YYYY-MM)': [
    'Month expected (YYYY-MM)',
    'Mois attendu au format AAAA-MM',
    'Se esperaba un mes en formato AAAA-MM',
  ],
  'Move installment {count} up': [
    'Move installment {count} up',
    'Monter l’échéance {count}',
    'Subir la cuota {count}',
  ],
  'Remove installment {count}': [
    'Remove installment {count}',
    'Supprimer l’échéance {count}',
    'Eliminar la cuota {count}',
  ],
  'No installments yet — add one.': [
    'No installments yet — add one.',
    'Aucune échéance pour le moment. Ajoutez-en une.',
    'Todavía no hay cuotas. Añade una.',
  ],
  'Add an installment': [
    'Add an installment',
    'Ajouter une échéance',
    'Añadir una cuota',
  ],
  'Apply +3.5% rent index': [
    'Apply +3.5% rent index',
    'Appliquer une révision de +3,5 %',
    'Aplicar un ajuste del +3,5 %',
  ],
  Total: ['Total', 'Total', 'Total'],
  'Monthly average': [
    'Monthly average',
    'Moyenne mensuelle',
    'Promedio mensual',
  ],
  'Reactions · dependent fields': [
    'Reactions · dependent fields',
    'Réactions · champs dépendants',
    'Reacciones · campos dependientes',
  ],
  'Lease terms': [
    'Lease terms',
    'Conditions du bail',
    'Condiciones del contrato',
  ],
  'The lease type controls the duration, the deposit cap and the furniture inventory. Try a €2,000 deposit, then switch to furnished.':
    [
      'The lease type controls the duration, the deposit cap and the furniture inventory. Try a €2,000 deposit, then switch to furnished.',
      'Le type de bail détermine la durée, le plafond du dépôt et l’inventaire du mobilier. Essayez un dépôt de 2 000 €, puis passez en meublé.',
      'El tipo de contrato determina la duración, el límite de la fianza y el inventario de muebles. Prueba con una fianza de 2.000 € y cambia a alquiler amueblado.',
    ],
  'Lease type': ['Lease type', 'Type de bail', 'Tipo de contrato'],
  'Unfurnished rental': [
    'Unfurnished rental',
    'Location vide',
    'Alquiler sin muebles',
  ],
  'Furnished rental': [
    'Furnished rental',
    'Location meublée',
    'Alquiler amueblado',
  ],
  'Minimum duration': ['Minimum duration', 'Durée minimale', 'Duración mínima'],
  computed: ['computed', 'calculé', 'calculado'],
  'Rent excluding charges': [
    'Rent excluding charges',
    'Loyer hors charges',
    'Alquiler sin gastos',
  ],
  'Security deposit': ['Security deposit', 'Dépôt de garantie', 'Fianza'],
  'Furniture inventory': [
    'Furniture inventory',
    'Inventaire du mobilier',
    'Inventario de muebles',
  ],
  'Washing machine, fridge, 140×190 bed…': [
    'Washing machine, fridge, 140×190 bed…',
    'Lave-linge, réfrigérateur, lit 140×190…',
    'Lavadora, nevera, cama de 140×190…',
  ],
  '1 year (9 months for students)': [
    '1 year (9 months for students)',
    '1 an (9 mois pour les étudiants)',
    '1 año (9 meses para estudiantes)',
  ],
  '3 years': ['3 years', '3 ans', '3 años'],
  'Legal cap: {amount} ({months} months of rent excluding charges)': [
    'Legal cap: {amount} ({months} months of rent excluding charges)',
    'Plafond légal : {amount} ({months} mois de loyer hors charges)',
    'Límite legal: {amount} ({months} meses de alquiler sin gastos)',
  ],
  'Exceeds the legal cap of {amount}': [
    'Exceeds the legal cap of {amount}',
    'Dépasse le plafond légal de {amount}',
    'Supera el límite legal de {amount}',
  ],
  'JSON Schema · expressions': [
    'JSON Schema · expressions',
    'JSON Schema · expressions',
    'JSON Schema · expresiones',
  ],
  'Solvency simulator': [
    'Solvency simulator',
    'Simulateur de solvabilité',
    'Simulador de solvencia',
  ],
  'The same engine, described as JSON Schema. The form can be stored, versioned or generated server-side. Dependencies use x-reactions expressions.':
    [
      'The same engine, described as JSON Schema. The form can be stored, versioned or generated server-side. Dependencies use x-reactions expressions.',
      'Le même moteur, décrit en JSON Schema. Le formulaire peut être stocké, versionné ou généré côté serveur. Les dépendances utilisent des expressions x-reactions.',
      'El mismo motor, descrito con JSON Schema. El formulario puede guardarse, versionarse o generarse en el servidor. Las dependencias usan expresiones x-reactions.',
    ],
  'Household net monthly income': [
    'Household net monthly income',
    'Revenu mensuel net du foyer',
    'Ingresos mensuales netos del hogar',
  ],
  'Rent including charges': [
    'Rent including charges',
    'Loyer charges comprises',
    'Alquiler con gastos incluidos',
  ],
  'Effort rate': ['Effort rate', 'Taux d’effort', 'Tasa de esfuerzo'],
  'Offer a guarantor': [
    'Offer a guarantor',
    'Proposer un garant',
    'Ofrecer un avalista',
  ],
  Pending: ['Pending', 'En attente', 'Pendiente'],
  'Enter income and rent.': [
    'Enter income and rent.',
    'Renseignez le revenu et le loyer.',
    'Introduce los ingresos y el alquiler.',
  ],
  'Solid application': [
    'Solid application',
    'Dossier solide',
    'Solicitud sólida',
  ],
  'Needs review': ['Needs review', 'Dossier à examiner', 'Requiere revisión'],
  'High risk': ['High risk', 'Risque élevé', 'Riesgo alto'],
  'Effort rate of {rate}% — below the usual 33% threshold.': [
    'Effort rate of {rate}% — below the usual 33% threshold.',
    'Taux d’effort de {rate} %, sous le seuil usuel de 33 %.',
    'Tasa de esfuerzo del {rate} %, por debajo del umbral habitual del 33 %.',
  ],
  'Effort rate of {rate}% — a guarantor is recommended.': [
    'Effort rate of {rate}% — a guarantor is recommended.',
    'Taux d’effort de {rate} %. Un garant est recommandé.',
    'Tasa de esfuerzo del {rate} %. Se recomienda un avalista.',
  ],
  'Effort rate of {rate}% — above 40%.': [
    'Effort rate of {rate}% — above 40%.',
    'Taux d’effort de {rate} %, au-dessus de 40 %.',
    'Tasa de esfuerzo del {rate} %, por encima del 40 %.',
  ],
  'Designer · JSON Schema': [
    'Designer · JSON Schema',
    'Designer · JSON Schema',
    'Diseñador · JSON Schema',
  ],
  'Render a designer form': [
    'Render a designer form',
    'Afficher un formulaire du designer',
    'Mostrar un formulario del diseñador',
  ],
  'This form uses the same components as the designer preview. Try the nested choices, panel defaults and repeating-list controls.':
    [
      'This form uses the same components as the designer preview. Try the nested choices, panel defaults and repeating-list controls.',
      'Ce formulaire utilise les mêmes composants que l’aperçu du designer. Essayez les choix imbriqués, les panneaux et les contrôles des listes répétées.',
      'Este formulario usa los mismos componentes que la vista previa del diseñador. Prueba las opciones anidadas, los paneles y los controles de las listas repetibles.',
    ],
  Brittany: ['Brittany', 'Bretagne', 'Bretaña'],
  Normandy: ['Normandy', 'Normandie', 'Normandía'],
  Name: ['Name', 'Nom', 'Nombre'],
  City: ['City', 'Ville', 'Ciudad'],
  'Location and rating': [
    'Location and rating',
    'Localisation et note',
    'Ubicación y puntuación',
  ],
  'Region tree': ['Region tree', 'Arbre des régions', 'Árbol de regiones'],
  'Region path': ['Region path', 'Chemin de région', 'Ruta de la región'],
  Score: ['Score', 'Note', 'Puntuación'],
  Overview: ['Overview', 'Vue d’ensemble', 'Resumen'],
  'An exported form can be rendered directly.': [
    'An exported form can be rendered directly.',
    'Un formulaire exporté peut être affiché directement.',
    'Un formulario exportado se puede mostrar directamente.',
  ],
  Details: ['Details', 'Détails', 'Detalles'],
  'First line\n\nSecond line': [
    'First line\n\nSecond line',
    'Première ligne\n\nDeuxième ligne',
    'Primera línea\n\nSegunda línea',
  ],
  Notes: ['Notes', 'Notes', 'Notas'],
  'Open this panel to close Instructions.': [
    'Open this panel to close Instructions.',
    'Ouvrez ce panneau pour fermer les instructions.',
    'Abre este panel para cerrar las instrucciones.',
  ],
  Instructions: ['Instructions', 'Instructions', 'Instrucciones'],
  '<p>Edit <strong>any record</strong> below.</p><ul><li>Add or duplicate an item.</li><li>Use the table handle to reorder rows.</li></ul>':
    [
      '<p>Edit <strong>any record</strong> below.</p><ul><li>Add or duplicate an item.</li><li>Use the table handle to reorder rows.</li></ul>',
      '<p>Modifiez <strong>une ligne</strong> ci-dessous.</p><ul><li>Ajoutez ou dupliquez un élément.</li><li>Utilisez la poignée pour réordonner les lignes.</li></ul>',
      '<p>Edita <strong>cualquier registro</strong>.</p><ul><li>Añade o duplica un elemento.</li><li>Usa el control de la tabla para reordenar las filas.</li></ul>',
    ],
  'Contact card': ['Contact card', 'Fiche de contact', 'Ficha de contacto'],
  'Add a contact card': [
    'Add a contact card',
    'Ajouter une fiche de contact',
    'Añadir una ficha de contacto',
  ],
  Reorder: ['Reorder', 'Réordonner', 'Reordenar'],
  'Contact details': ['Contact details', 'Coordonnées', 'Datos de contacto'],
  Actions: ['Actions', 'Actions', 'Acciones'],
  'Add a table row': [
    'Add a table row',
    'Ajouter une ligne au tableau',
    'Añadir una fila a la tabla',
  ],
  'Hide code': ['Hide code', 'Masquer le code', 'Ocultar el código'],
  'Show code': ['Show code', 'Afficher le code', 'Mostrar el código'],
  'live state': ['live state', 'état en direct', 'estado en directo'],
  valid: ['valid', 'valide', 'válido'],
  invalid: ['invalid', 'invalide', 'no válido'],
  modified: ['modified', 'modifié', 'modificado'],
  pristine: ['pristine', 'inchangé', 'sin cambios'],
  'State view': ['State view', 'Vue de l’état', 'Vista del estado'],
  values: ['values', 'valeurs', 'valores'],
  'errors ({count})': [
    'errors ({count})',
    'erreurs ({count})',
    'errores ({count})',
  ],
  'effects ({count})': [
    'effects ({count})',
    'effets ({count})',
    'efectos ({count})',
  ],
  '✓ no errors': ['✓ no errors', '✓ aucune erreur', '✓ sin errores'],
  'Type a value to see the effects…': [
    'Type a value to see the effects…',
    'Saisissez une valeur pour voir les effets…',
    'Escribe un valor para ver los efectos…',
  ],
  'validating…': ['validating…', 'validation…', 'validando…'],
  'submit ✓ success': [
    'submit ✓ success',
    'validation ✓ réussie',
    'envío ✓ correcto',
  ],
  'submit ✕ validation failed': [
    'submit ✕ validation failed',
    'validation ✕ échouée',
    'envío ✕ no válido',
  ],
  reset: ['reset', 'réinitialisation', 'restablecimiento'],
  'sample loaded': ['sample loaded', 'exemple chargé', 'ejemplo cargado'],
} satisfies Record<string, Message>

export function t(key: string, params?: Record<string, string | number>) {
  const text = (copy as Record<string, Message>)[key]
  return text ? message(text, params) : key
}
