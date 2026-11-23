// formivue/setters — ReactionsSetter helpers : exemples affichés dans le
// volet d'aide Monaco. Port adapté de l'ère React/antd → pile Vue. Le
// volet pointe vers la doc interne (docs/reactions.md) ;
// événements reçus comme props via le contrat form-friendly
// `value` + `onChange(value)` (pas d'`onSearch` antd), et `labelWidth`
// FormLayout headless (pas de `labelCol` antd).
export const GlobalHelper = `
/**
 * You can use the built-in context variables
 *
 * 1. \`$self\` is the current Field Model
 *
 * 2. \`$form\` is the current Form Model
 *
 * 3. \`$deps\` is the dependencies value
 *
 * 4. \`$observable\` function is used to create an persistent observable state object
 *
 * 5. \`$memo\` function is is used to create a persistent data
 *
 * 6. \`$effect\` function is used to handle side-effect logic
 *
 * 7. \`$props\` function is used to set component props to current field
 *
 * Document Link (internal — component reactions on the Vue stack)
 *
 * design/formivue-setters/docs/reactions.md
 **/
`

export const BooleanHelper = `
/** 
 * Example 1
 * Static Boolean
 **/

false

/** 
 * Example 2
 * Equal Calculation
 **/

$deps.VariableName === 'TARGET_VALUE'

/** 
 * Example 3
 * Not Equal Calculation
 **/

$deps.VariableName !== 'TARGET_VALUE'

/** 
 * Example 4
 * And Logic Calculation
 **/

$deps.VariableName1 && $deps.VariableName2

/** 
 * Example 5
 * Grater Logic Calculation
 **/

$deps.VariableName > 100

/** 
 * Example 6
 * Not Logic Calculation
 **/

!$deps.VariableName

${GlobalHelper}
`

export const DisplayHelper = `
/** 
 * Example 1
 * Static Mode
 **/

'none'

/** 
 * Example 2
 * Equal Condition Associated
 **/

$deps.VariableName === 'TARGET_VALUE' ? 'visible' : 'none'

/** 
 * Example 3
 * Not Equal Condition Associated
 **/

$deps.VariableName !== 'TARGET_VALUE' ? 'visible' : 'hidden'

/** 
 * Example 4
 * And Logic Condition Associated
 **/

$deps.VariableName1 && $deps.VariableName2 ? 'visible' : 'none'

/** 
 * Example 5
 * Grater Logic Condition Associated
 **/

$deps.VariableName > 100 ? 'visible' : 'hidden'

/** 
 * Example 6
 * Not Logic Condition Associated
 **/

!$deps.VariableName ? 'visible' : 'none'

${GlobalHelper}
`

export const PatternHelper = `
/** 
 * Example 1
 * Static Mode
 **/

'readPretty'

/** 
 * Example 2
 * Equal Condition Associated
 **/

$deps.VariableName === 'TARGET_VALUE' ? 'editable' : 'disabled'

/** 
 * Example 3
 * Not Equal Condition Associated
 **/

$deps.VariableName !== 'TARGET_VALUE' ? 'editable' : 'readOnly'

/** 
 * Example 4
 * And Logic Condition Associated
 **/

$deps.VariableName1 && $deps.VariableName2 ? 'editable' : 'readPretty'

/** 
 * Example 5
 * Grater Logic Condition Associated
 **/

$deps.VariableName > 100 ? 'editable' : 'readOnly'

/** 
 * Example 6
 * Not Logic Condition Associated
 **/

!$deps.VariableName ? 'editable' : 'disabled'

${GlobalHelper}
`

export const StringHelper = `
/** 
 * Example 1
 * Static String
 **/

'Normal String Text'

/** 
 * Example 2
 * Associated String
 **/

$deps.VariableName === 'TARGET_VALUE' ? 'Associated String Text' : ''

${GlobalHelper}
`

export const AnyHelper = `
/** 
 * Example 1
 * String Type
 **/

'String'

/** 
 * Example 2
 * String Array
 **/

['StringArray']

/** 
 * Example 3
 * Object Array
 **/

[{ key: 'ObjectArray' }]

/** 
 * Example 4
 * Boolean
 **/

true

/** 
 * Example 5
 * RegExp
 **/

/\\d+/

/** 
 * Example 1
 * Associated String Value
 **/

$deps.VariableName + 'Compose String'

/** 
 * Example 2
 * Associated Array Value
 **/

[ $deps.VariableName ]

/** 
 * Example 3
 * Associated Object Value
 **/

{
  key : $deps.VariableName
}

/** 
 * Example 4
 * Associated Boolean Value
 **/

!$deps.VariableName

${GlobalHelper}
`

export const DataSourceHelper = `
/** 
 * Example 1
 * Static DataSource
 **/

[
  { label : "item1", value: "1" },
  { label : "item2", value: "2" }
]

/** 
 * Example 2
 * Associated DataSource
 **/

[
  { label : "item1", value: "1" },
  { label : "item2", value: "2" },
  ...$deps.VariableName
]

${GlobalHelper}
`

export const ComponentPropsHelper = `
/** 
 * Example 1
 * Static Props
 **/

{
  placeholder: "This is placeholder"
}

/** 
 * Example 2
 * Associated Props
 **/

{
  placeholder: $deps.VariableName
}

${GlobalHelper}
`

export const DecoratorPropsHelper = `
/**
 * Example 1
 * Static Props (headless Vue FormLayout)
 **/

{
  labelWidth:120
}

/**
 * Example 2
 * Associated Props
 **/

{
  labelWidth: $deps.VariableName
}

${GlobalHelper}
`

export const FulfillRunHelper = `
/**
 * Example 1
 * Async Select
 **/

$effect(()=>{
  $self.loading = true
  fetch('/api/options')
    .then(response=>response.json())
    .then(({ data })=>{
      $self.loading = false
      $self.dataSource = data
    },()=>{
      $self.loading = false
    })
},[])


/**
 * Example 2
 * Async Cascading Select (reload options when the selection changes)
 * In Vue, component events are received as props: every component of the
 * stack follows the form-friendly contract \`value\` + \`onChange(value)\`.
 **/

const state = $observable({
  selected:''
})

$props({
  onChange(selected){
    state.selected = selected
  }
})

$effect(()=>{
  if(!state.selected) return
  $self.loading = true
  fetch(\`/api/options?parent=\${state.selected}\`)
    .then(response=>response.json())
    .then(({ data })=>{
      $self.loading = false
      $self.dataSource = data
    },()=>{
      $self.loading = false
    })
},[ state.selected ])

/**
 * Example 3
 * Async Associated Select (same, filtered by the reaction dependencies)
 **/

const state = $observable({
  selected:''
})

$props({
  onChange(selected){
    state.selected = selected
  }
})

$effect(()=>{
  $self.loading = true
  fetch(\`/api/options?parent=\${state.selected}&other=\${$deps.VariableName}\`)
    .then(response=>response.json())
    .then(({ data })=>{
      $self.loading = false
      $self.dataSource = data
    },()=>{
      $self.loading = false
    })
},[ state.selected, $deps.VariableName ])

${GlobalHelper}
`
