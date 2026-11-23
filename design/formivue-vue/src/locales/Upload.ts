import { createLocales } from '@formivue-design/core'

// Locale Upload / UploadDragger (port d'ère, élaguée aux props de l'Upload
// maison).
export const Upload = {
  'en-US': {
    title: 'Upload',
    settings: {
      'x-component-props': {
        accept: 'Accept',
        action: 'Upload Address',
        data: 'Data',
        directory: 'Support Upload Directory',
        headers: 'Headers',
        listType: { title: 'List Type', dataSource: ['Text', 'Image', 'Card'] },
        multiple: 'Multiple',
        name: 'Name',
        showUploadList: 'Show Upload List',
        withCredentials: 'withCredentials',
        maxCount: 'Max Count',
        method: 'Method',
        textContent: 'Text Content',
      },
    },
  },
  'fr-FR': {
    title: 'Téléversement',
    settings: {
      'x-component-props': {
        accept: 'Types acceptés',
        action: 'URL de téléversement',
        data: 'Données',
        directory: 'Téléversement de dossier autorisé',
        headers: 'En-têtes',
        listType: {
          title: 'Type de liste',
          dataSource: ['Texte', 'Image', 'Carte'],
        },
        multiple: 'Multiple',
        name: 'Nom du champ',
        showUploadList: 'Afficher la liste des fichiers',
        withCredentials: 'withCredentials',
        maxCount: 'Nombre maximal',
        method: 'Méthode',
        textContent: 'Contenu texte',
      },
    },
  },
  'es-ES': {
    title: 'Carga de archivos',
    settings: {
      'x-component-props': {
        accept: 'Tipos aceptados',
        action: 'Dirección de carga',
        data: 'Datos',
        directory: 'Permitir cargar carpetas',
        headers: 'Encabezados',
        listType: {
          title: 'Tipo de lista',
          dataSource: ['Texto', 'Imagen', 'Tarjeta'],
        },
        multiple: 'Múltiple',
        name: 'Nombre del campo',
        showUploadList: 'Mostrar lista de archivos',
        withCredentials: 'withCredentials',
        maxCount: 'Cantidad máxima',
        method: 'Método',
        textContent: 'Contenido de texto',
      },
    },
  },
}

export const UploadDragger = createLocales(Upload, {
  'en-US': { title: 'UploadDragger' },
  'fr-FR': { title: 'Zone de téléversement' },
  'es-ES': { title: 'Zona de carga' },
})
