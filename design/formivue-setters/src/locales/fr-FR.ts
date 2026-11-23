const ValidatorFormats = [
  { label: 'URL', value: 'url' },
  { label: 'E-mail', value: 'email' },
  { label: 'Nombre', value: 'number' },
  { label: 'Entier', value: 'integer' },
  { label: 'Pièce d’identité', value: 'idcard' },
  { label: 'Numéro de téléphone', value: 'phone' },
  { label: 'Devise', value: 'money' },
  { label: 'Chinois', value: 'zh' },
  { label: 'Date', value: 'date' },
  { label: 'Code postal', value: 'zip' },
]

export default {
  'fr-FR': {
    settings: {
      'x-validator': {
        title: 'Validateur',
        addValidatorRules: 'Ajouter des règles de validation',
        drawer: 'Modifier les règles',
        triggerType: {
          title: 'Type de déclencheur',
          placeholder: 'Veuillez sélectionner',
          dataSource: ['onInput', 'onFocus', 'onBlur'],
        },
        format: {
          title: 'Format',
          placeholder: 'Veuillez sélectionner',
          dataSource: ValidatorFormats,
        },
        validator: {
          title: 'Validateur personnalisé',
          tooltip: 'Format : function (value){ return "Message d’erreur" }',
        },
        pattern: 'RegExp',
        len: 'Limite de longueur',
        max: 'Longueur/Valeur ≤',
        min: 'Longueur/Valeur ≥',
        exclusiveMaximum: 'Longueur/Valeur <',
        exclusiveMinimum: 'Longueur/Valeur >',
        whitespace: 'Sans espace blanc',
        required: 'Obligatoire',
        message: {
          title: "Message d'erreur",
          tooltip:
            'Le message d’erreur ne s’applique qu’à une règle intégrée de l’ensemble de règles courant. Pour personnaliser le message d’erreur de différentes règles intégrées, scindez-les en plusieurs règles',
        },
      },
    },
    SettingComponents: {
      Common: {
        cancel: 'Annuler',
        ok: 'OK',
      },
      DataSourceSetter: {
        moveUp: 'Monter',
        moveDown: 'Descendre',
        remove: 'Supprimer',
        nodeProperty: 'Propriété du nœud',
        pleaseSelectNode:
          'veuillez sélectionner un nœud dans l’arborescence à gauche',
        addKeyValuePair: 'Ajouter une paire clé/valeur',
        configureDataSource: 'Configurer',
        dataSource: 'Options',
        defaultTitle: 'Titre par défaut',
        dataSourceTree: 'Arborescence des options',
        addNode: 'Ajouter un nœud',
        addChild: 'Ajouter une sous-option',
        label: 'libellé',
        value: 'valeur',
        item: 'Élément',
      },
      ReactionsSetter: {
        fieldProperties: 'Propriétés du champ',
        configureReactions: 'Configurer',
        relationsFields: 'Champs associés',
        variableName: 'Nom de la variable',
        variableNameValidateMessage:
          'Ceci n’est pas un nom de variable standard',
        pleaseInput: 'Veuillez saisir',
        sourceField: 'Champ source',
        sourceProperty: 'Propriété du champ',
        variableType: 'Type de variable',
        operations: 'Opérations',
        addRelationField: 'Ajouter un champ associé',
        propertyReactions:
          'Réactions de propriété (expression JavaScript uniquement)',
        actionReactions:
          'Réactions d’action (facultatif, instruction JavaScript)',
        visible: 'Afficher/Aucun',
        hidden: 'Afficher/Masqué (UI)',
        display: 'Affichage',
        pattern: 'Mode',
        title: 'Titre',
        description: 'Description',
        value: 'Valeur',
        initialValue: 'Valeur initiale',
        dataSource: 'Options',
        required: 'Obligatoire',
        component: 'Composant',
        componentProps: 'Props du composant',
        decorator: 'Décorateur',
        decoratorProps: 'Props du décorateur',
        pleaseSelect: 'Veuillez sélectionner',
        expressionValueTypeIs: 'Le type de la valeur d’expression est',
      },
      ValidatorSetter: {
        pleaseSelect: 'Veuillez sélectionner',
        formats: ValidatorFormats,
      },
    },
  },
}
