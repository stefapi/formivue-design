# Introduction

The core idea of @formivue/reactive is to refer to [Mobx](https://github.com/mobxjs/mobx), so why reinvent the wheel?

There are four main reasons:

- mobx does not support dependency collection within actions
- The observable function of mobx does not support filtering special objects such as react node, moment, and immutable
- mobx's observable function will automatically turn the function into action
- The observer of mobx-react-lite does not support React concurrent rendering

For the above reasons, Formivue had to reinvent the wheel, but the wheel strongly relies on Proxy, that is, it does not support IE browser. Of course, reinventing the wheel also has its advantages:

- More controllability, you can do more in-depth optimization and customization for formivue scenes
- Regardless of the historical burden of Mobx, the code can be cleaner
- If the Mobx version is Break Change or there are security vulnerabilities, it will have no impact on Formivue
