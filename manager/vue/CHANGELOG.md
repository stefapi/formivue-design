# Changelog

## 3.1.1

### Patch Changes

- Bug correction
- Updated dependencies
  - @formivue/core@3.1.1
  - @formivue/json-schema@3.1.1
  - @formivue/reactive@3.1.1
  - @formivue/reactive-vue@3.1.1
  - @formivue/shared@3.1.1

## 3.1.1

### Patch Changes

- official 3.1 release with datamodel editing
- Updated dependencies
  - @formivue/core@3.1.1
  - @formivue/json-schema@3.1.1
  - @formivue/reactive@3.1.1
  - @formivue/reactive-vue@3.1.1
  - @formivue/shared@3.1.1

Notable changes to `@formivue/vue` are recorded here.

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2026-11-25

### Added

- Add a `retain` prop to `FormProvider` so a form session can survive provider unmounting. ([`6193635`](https://github.com/stefapi/formivue-design/commit/61936356cef37c3642f3c888cfb279293913804d))

### Changed

- Hide document fields marked `writeOnly` when rendering outside editable mode. ([`6a3cb36`](https://github.com/stefapi/formivue-design/commit/6a3cb36e18fd19d96526d4c911a58232c032d5b9))
- Update the guides and usage examples for document trust and the standalone standard renderer. ([`f82a085`](https://github.com/stefapi/formivue-design/commit/f82a0853848dd5e57165f1873343f1eb80588b93), [`262342f`](https://github.com/stefapi/formivue-design/commit/262342ffcfe1d9f308a6ca1ca24631e2b933e777), [`18a74c3`](https://github.com/stefapi/formivue-design/commit/18a74c35863c8d81a5658101656b8912ea7bab3d))

## [3.0.3] - 2026-11-23

### Added

- Released Vue 3 field components, `FormProvider`, composables, and a schema component factory for the headless engine.

[Unreleased]: https://github.com/stefapi/formivue-design/compare/18a74c35863c8d81a5658101656b8912ea7bab3d...main
[3.1.0]: https://github.com/stefapi/formivue-design/compare/8ae97b832cf24cbf950917c87fbcfca6fc900050...18a74c35863c8d81a5658101656b8912ea7bab3d
[3.0.3]: https://github.com/stefapi/formivue-design/tree/8ae97b832cf24cbf950917c87fbcfca6fc900050/manager/vue
