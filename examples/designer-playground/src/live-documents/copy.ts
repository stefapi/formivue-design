import { message, type Message } from '../../../shared/language'

const copy = {
  demo: ['Demo', 'Démonstrateur', 'Demostración'],
  back: ['Back to the designer', 'Retour au designer', 'Volver al diseñador'],
  title: ['Live sales', 'Ventes en temps réel', 'Ventas en tiempo real'],
  intro: [
    'Edit a shop and watch the same data update the published table and chart.',
    'Modifiez une boutique et observez le même jeu de données alimenter le tableau publié et le graphique.',
    'Edita una tienda y observa cómo los mismos datos actualizan la tabla publicada y el gráfico.',
  ],
  pause: ['Pause the feed', 'Mettre le flux en pause', 'Pausar el flujo'],
  start: [
    'Start the simulated feed',
    'Démarrer le flux simulé',
    'Iniciar el flujo simulado',
  ],
  revenue: [
    'Published revenue',
    'Chiffre d’affaires publié',
    'Ingresos publicados',
  ],
  target: ['Target achieved', 'Objectif atteint', 'Objetivo alcanzado'],
  revision: ['Data revision', 'Révision des données', 'Revisión de datos'],
  byShop: ['Sales by shop', 'Ventes par boutique', 'Ventas por tienda'],
  feed: ['Data feed', 'Flux de données', 'Flujo de datos'],
  feedIntro: [
    'Simulate a server update.',
    'Simulez une réception du serveur.',
    'Simula una actualización del servidor.',
  ],
  sendPatch: ['Send a patch', 'Envoyer un patch', 'Enviar un parche'],
  replace: [
    'Replace the data',
    'Remplacer les données',
    'Reemplazar los datos',
  ],
  invalid: [
    'Test an invalid batch',
    'Tester un lot invalide',
    'Probar un lote no válido',
  ],
  conflict: [
    'Simulate a conflict',
    'Simuler un conflit',
    'Simular un conflicto',
  ],
  updates: [
    'Latest updates',
    'Dernières mises à jour',
    'Últimas actualizaciones',
  ],
  local: ['Local edits', 'Saisie locale', 'Cambios locales'],
  edit: [
    'Edit a name or amount.',
    'Modifiez un nom ou un montant.',
    'Edita un nombre o un importe.',
  ],
  preserved: [
    'Your edits are preserved.',
    'Votre saisie est conservée.',
    'Se han conservado tus cambios.',
  ],
  overlap: [
    'The update affects {paths}.',
    'La mise à jour touche {paths}.',
    'La actualización afecta a {paths}.',
  ],
  keep: ['Keep my edits', 'Garder la saisie', 'Conservar mis cambios'],
  takeSnapshot: [
    'Use the snapshot',
    'Reprendre l’instantané',
    'Usar la instantánea',
  ],
  published: ['Published data', 'Données publiées', 'Datos publicados'],
  latest: [
    'Latest valid version.',
    'Dernière version valide.',
    'Última versión válida.',
  ],
  documents: [
    'The three documents',
    'Les trois documents',
    'Los tres documentos',
  ],
  documentsIntro: [
    'Inspect the JSON, load a file or edit its contents.',
    'Inspectez les JSON, chargez un fichier ou modifiez son contenu.',
    'Consulta el JSON, carga un archivo o edita su contenido.',
  ],
  jsonGroup: ['JSON documents', 'Documents JSON', 'Documentos JSON'],
  import: ['Import', 'Importer', 'Importar'],
  importFile: ['Import {file}', 'Importer {file}', 'Importar {file}'],
  download: ['Download', 'Télécharger', 'Descargar'],
  apply: [
    'Apply the JSON files',
    'Appliquer les JSON',
    'Aplicar los archivos JSON',
  ],
  loaded: [
    '3 documents loaded',
    '3 documents chargés',
    '3 documentos cargados',
  ],
  verified: [
    'Bindings and data validated',
    'Liaisons et données validées',
    'Vínculos y datos validados',
  ],
  publishedRevision: [
    'Revision {revision} published',
    'Révision {revision} publiée',
    'Revisión {revision} publicada',
  ],
  rejected: [
    'Update rejected',
    'Mise à jour rejetée',
    'Actualización rechazada',
  ],
  partial: ['Partial patch', 'Patch partiel', 'Parche parcial'],
  snapshot: ['Full snapshot', 'Instantané complet', 'Instantánea completa'],
  editsKept: ['Edits kept', 'Saisie conservée', 'Cambios conservados'],
  restored: [
    'Snapshot restored',
    'Instantané restauré',
    'Instantánea restaurada',
  ],
  resolved: ['Conflict resolved', 'Conflit résolu', 'Conflicto resuelto'],
  applied: ['Documents applied', 'Documents appliqués', 'Documentos aplicados'],
  filesRejected: [
    'Documents rejected',
    'Documents rejetés',
    'Documentos rechazados',
  ],
  invalidBatch: ['Invalid batch', 'Lot invalide', 'Lote no válido'],
  editConflict: ['Edit conflict', 'Conflit de saisie', 'Conflicto de edición'],
  rotated: [
    'Rows reordered and amounts updated',
    'Lignes réordonnées, montants actualisés',
    'Filas reordenadas e importes actualizados',
  ],
  doubleEdit: [
    '{shop} · sale edited on both sides',
    '{shop} · une vente modifiée des deux côtés',
    '{shop} · una venta modificada en ambos lados',
  ],
  feedShape: [
    'The simulated feed expects shops with id, boutique, ventes and objectif fields.',
    'Le flux de démonstration attend une liste de boutiques avec les champs id, boutique, ventes et objectif.',
    'El flujo simulado requiere tiendas con los campos id, boutique, ventes y objectif.',
  ],
} satisfies Record<string, Message>

export type CopyKey = keyof typeof copy
export const t = (key: CopyKey, params?: Record<string, string | number>) =>
  message(copy[key], params)

export const schemaCopy = {
  'Chiffre d’affaires et objectif par boutique': [
    'Revenue and target by shop',
    'Chiffre d’affaires et objectif par boutique',
    'Ingresos y objetivo por tienda',
  ],
  Ventes: ['Sales', 'Ventes', 'Ventas'],
  Objectif: ['Target', 'Objectif', 'Objetivo'],
  Boutique: ['Shop', 'Boutique', 'Tienda'],
  'Ventes en €': ['Sales in €', 'Ventes en €', 'Ventas en €'],
  'Ventes en euros': ['Sales in euros', 'Ventes en euros', 'Ventas en euros'],
  'Nom de la boutique': [
    'Shop name',
    'Nom de la boutique',
    'Nombre de la tienda',
  ],
  'Ventes publiées par boutique': [
    'Published sales by shop',
    'Ventes publiées par boutique',
    'Ventas publicadas por tienda',
  ],
  'Ventes (€)': ['Sales (€)', 'Ventes (€)', 'Ventas (€)'],
  'Objectif (€)': ['Target (€)', 'Objectif (€)', 'Objetivo (€)'],
  Précédent: ['Previous', 'Précédent', 'Anterior'],
  Suivant: ['Next', 'Suivant', 'Siguiente'],
  'Aucun résultat': ['No results', 'Aucun résultat', 'Sin resultados'],
} satisfies Record<string, Message>
