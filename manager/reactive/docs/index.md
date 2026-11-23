---
title: Formivue-Stefapi unified front-end form solution
order: 10
hero:
  title: Reactive Library
  desc: DDD-oriented Responsive State Management Solution
  actions:
    - text: Home Site
      link: https://github.com/stefapi/formivue-design
    - text: Document
      link: /guide
features:
  - title: High Performance
    desc: Efficient update, Demand rendering
  - title: Zero Dependencies
    desc: Cross Device,Cross Framework
  - title: Smart Tips
    desc: Embrace Typescript
footer: Open-source MIT Licensed | Copyright © 2019-present<br />Powered by self
---

## Installation

```bash
$ npm install --save @formivue/reactive

```

## Quick start

```tsx
/**
 * defaultShowCode: true
 */
import React from 'react'
import { observable } from '@formivue/reactive'
import { observer } from '@formivue/reactive-react'

const obs = observable({
  value: 'Hello world',
})

export default observer(() => {
  return (
    <div>
      <div>
        <input
          style={{
            height: 28,
            padding: '0 8px',
            border: '2px solid #888',
            borderRadius: 3,
          }}
          value={obs.value}
          onChange={(e) => {
            obs.value = e.target.value
          }}
        />
      </div>
      <div>{obs.value}</div>
    </div>
  )
})
```
