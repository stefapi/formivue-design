---
order: 4
---

# VoidField

Call the VoidField model returned by [createVoidField](Form.md#createvoidfield).

All model attributes are listed below. If the attribute is writable, then we can directly refer to it to modify the attribute, and @formivue/reactive will respond to trigger the UI update.

## Attributes

| Property    | Description                               | Type                                    | Read-only or not | Default value |
| ----------- | ----------------------------------------- | --------------------------------------- | ---------------- | ------------- |
| initialized | Whether the field has been initialized    | Boolean                                 | No               | `false`       |
| mounted     | Is the field mounted                      | Boolean                                 | No               | `false`       |
| unmounted   | Is the field unmounted                    | Boolean                                 | No               | `false`       |
| address     | Field node path                           | [FormPath](../entry/FormPath.md)        | Yes              |               |
| path        | Field data path                           | [FormPath](../entry/FormPath.md)        | Yes              |               |
| title       | Field Title                               | [FieldMessage](#fieldmessage)           | No               | `""`          |
| description | Field description                         | [FieldMessage](#fieldmessage)           | No               | `""`          |
| decorator   | field decorator                           | Any[]                                   | No               | `null`        |
| component   | Field component                           | Any[]                                   | No               | `null`        |
| parent      | Parent field                              | [GeneralField](#generalfield)           | yes              | `null`        |
| display     | Field display status                      | [FieldDisplayTypes](#fielddisplaytypes) | No               | `"visible"`   |
| pattern     | Field interaction mode                    | [FieldPatternTypes](#fieldpatterntypes) | No               | `"editable"`  |
| hidden      | Whether the field is hidden               | Boolean                                 | No               | `false`       |
| visible     | Whether the field is displayed            | Boolean                                 | No               | `true`        |
| disabled    | Whether the field is disabled             | Boolean                                 | No               | `false`       |
| readOnly    | Is the field read-only                    | Boolean                                 | No               | `false`       |
| readPretty  | Whether the field is in the reading state | Boolean                                 | No               | `false`       |
| editable    | Field is editable                         | Boolean                                 | No               | `true`        |

#### explain in detail

**hidden**

When true, display is hidden, when false, display is visible

**visible**

When true, display is visible, when false, display is none

## Method

### setTitle

#### Description

Set field title

#### Signature

```ts
interface setTitle {
  (title?: FieldMessage): void
}
```

FieldMessage Reference [FieldMessage](#fieldmessage)

### setDescription

#### Description

Set field description information

#### Signature

```ts
interface setDescription {
  (title?: FieldMessage): void
}
```

FieldMessage Reference [FieldMessage](#fieldmessage)

### setDisplay

#### Description

Set field display status

#### Signature

```ts
interface setDisplay {
  (display?: FieldDisplayTypes): void
}
```

FieldDisplayTypes Reference [FieldDisplayTypes](#fielddisplaytypes)

### setPattern

#### Description

Set field interaction mode

#### Signature

```ts
interface setPattern {
  (pattern?: FieldPatternTypes): void
}
```

FieldPatternTypes Reference [FieldPatternTypes](#fieldpatterntypes)

### setComponent

#### Description

Set field component

#### Signature

```ts
interface setComponent {
  (component?: FieldComponent, props?: any): void
}
```

FieldComponent Reference [FieldComponent](#fieldcomponent)

### setComponentProps

#### Description

Set field component properties

#### Signature

```ts
interface setComponentProps {
  (props?: any): void
}
```

### setDecorator

#### Description

Set field decorator

#### Signature

```ts
interface setDecorator {
  (decorator?: FieldDecorator, props?: any): void
}
```

FieldDecorator Reference [FieldDecorator](#fielddecorator)

### setDecoratorProps

#### Description

Set field decorator properties

#### Signature

```ts
interface setDecoratorProps {
  (props?: any): void
}
```

### setState

#### Description

Set field status

#### Signature

```ts
interface setState {
  (state: IVoidFieldState): void
  (callback: (state: IVoidFieldState) => void): void
}
```

IVoidFieldState Reference [IVoidFieldState](#ivoidfieldstate)

### getState

#### Description

Get field status

#### Signature

```ts
interface getState<T> {
  (): IVoidFieldState
  (callback: (state: IVoidFieldState) => T): T
}
```

IVoidFieldState Reference [IVoidFieldState](#ivoidfieldstate)

### setData

#### Description

set field data

#### Signature

```ts
interface setData {
  (data: any): void
}
```

### setContent

#### Description

set field content

#### Signature

```ts
interface setContent {
  (content: any): void
}
```

### onInit

#### Description

Trigger field initialization, no need to call manually

#### Signature

```ts
interface onInit {
  (): void
}
```

### onMount

#### Description

Trigger field mount

#### Signature

```ts
interface onMount {
  (): void
}
```

### onUnmount

#### Description

Trigger field unloading

#### Signature

```ts
interface onUnmount {
  (): void
}
```

### query

#### Description

Query field, you can query adjacent fields based on the current field

#### Signature

```ts
interface query {
  (pattern: FormPathPattern): Query
}
```

FormPathPattern API Reference [FormPath](../entry/FormPath.md#formpathpattern)

Query object API reference [Query](Query.md)

### dispose

#### Description

Release observer, no need to release manually by default

#### Signature

```ts
interface dispose {
  (): void
}
```

### destroy

#### Description

Release observer, and remove current field model

#### Signature

```ts
interface destroy {
  (): void
}
```

### match

#### Description

Match fields based on path

#### Signature

```ts
interface match {
  (pattern: FormPathPattern): boolean
}
```

FormPathPattern API Reference [FormPath](../entry/FormPath.md#formpathpattern)

### inject

#### Description

Inject executable methods into field models

#### Signature

```ts
interface inject {
  (actions: Record<string, (...args: any[]) => any>): void
}
```

### invoke

#### Description

Invoke an executable method injected by the field model via inject

#### Signature

```ts
interface invoke {
  (name: string, ...args: any[]): any
}
```

## Types of

<Alert>
Note: If you want to manually consume the type, just export it directly from the package module
</Alert>

### FieldMessage

See [field messages](./Field.md#fieldmessage) for titles and descriptions.

### FieldComponent

See [field components](./Field.md#fieldcomponent) for component bindings.

### FieldDecorator

See [field decorators](./Field.md#fielddecorator) for wrappers.

### FieldReaction

```ts
type FieldReaction = (field: GeneralField) => void
```

### FieldDisplayTypes

```ts
type FieldDisplayTypes = 'none' | 'hidden' | 'visible'
```

### FieldPatternTypes

```ts
type FieldPatternTypes = 'editable' | 'disabled' | 'readOnly' | 'readPretty'
```

### GeneralField

```ts
type GeneralField = Field | VoidField | ArrayField | ObjectField
```

Field Reference [Field](Field.md)

ArrayField Reference [ArrayField](ArrayField.md)

ObjectField Reference [ObjectField](ObjectField.md)

### IVoidFieldState

```ts
interface IVoidFieldState {
  hidden?: boolean
  visible?: boolean
  editable?: boolean
  readOnly?: boolean
  disabled?: boolean
  readPretty?: boolean
  title?: any
  description?: any
  modified?: boolean
  active?: boolean
  visited?: boolean
  initialized?: boolean
  mounted?: boolean
  unmounted?: boolean
  decorator?: FieldDecorator
  component?: FieldComponent
  readonly parent?: GeneralField
  display?: FieldDisplayTypes
  pattern?: FieldPatternTypes
}
```

### IGeneralFieldState

```ts
type IGeneralFieldState = IVoidFieldState & IFieldState
```

IFieldState Reference [IFieldState](Field.md#ifieldstate)
