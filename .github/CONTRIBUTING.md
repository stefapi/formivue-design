# Contributing Guide

Hi! I’m really excited that you are interested in contributing to FormivueDesign. Before submitting your contribution though, please make sure to take a moment and read through the following guidelines.

- [Stack](#stack)
- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Git Commit Specific](./GIT_COMMIT_SPECIFIC.md)

## Stack

- **Vue 3.5** (`defineComponent` + `h()`, pure TS — no SFCs in the design packages), formivue v3 bindings **from the integrated manager** `manager/` (`@formivue/vue` + `@formivue/reactive-vue`, self-contained repo — no more fork sibling).
- **Headless UI.** `@formivue-design/vue-ui` supplies the controls and
  Tailwind theme contract. `formivue-runtime` binds them to schemas.
  `formivue-vue` supplies canvas behavior and resources. Follow the
  [package boundaries](../ARCHITECTURE.md).
- **Accessibility.** The `a11y.spec` suites check components with axe-core.
- **API parity**: no public export disappears without a CHANGELOG entry.

## Issue Reporting Guidelines

- Use the issue tracker for bug reports and feature requests. Start with the
  [guides and examples](../README.md#documentation) for usage questions.

- Try to search for your issue, it may have already been answered or even fixed in the development branch.

- Check if the issue is reproducible with the latest stable version of FormivueDesign. If you are using a pre-release, please indicate the specific version you are using.

- It is **required** that you clearly describe the steps necessary to reproduce the issue you are running into. Issues with no clear repro steps will not be triaged. If an issue labeled "need repro" receives no further input from the issue author for more than 5 days, it will be closed.

- For bugs that involves build setups, you can create a reproduction repository with steps in the README.

- If your issue is resolved but still open, don’t hesitate to close it. In case you found a solution by yourself, it could be helpful to explain how you fixed it.

## Pull Request Guidelines

- Only code that's ready for release should be committed to the main branch. All development should be done in dedicated branches.
- Checkout a **new** topic branch from main branch, and merge back against main branch.
- Work in the `src` folder and **DO NOT** checkin `dist` in the commits.
- Run `pnpm install --frozen-lockfile` and `pnpm harness` from the root.
  See the [development guide](../DEVELOPMENT.md) for the toolchain and demos.
- If adding new feature:
  - Add accompanying test case.
  - Provide convincing reason to add this feature. Ideally you should open a suggestion issue first and have it greenlighted before working on it.
- If fixing a bug:
  - If you are resolving a special issue, add `(fix #xxxx[,#xxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `update entities encoding/decoding (fix #3899)`.
  - Provide detailed description of the bug in the PR. Live demo preferred.
  - Add appropriate test coverage if applicable.

## Git Commit Specific

- Your commits message must follow our [git commit specific](./GIT_COMMIT_SPECIFIC.md).
- We will check your commit message (CI `commitlint`), if it does not conform to the specification, the commit will be automatically refused, make sure you have read the specification above.
- It's OK to have multiple small commits as you work on your branch - we will let GitHub automatically squash it before merging.
