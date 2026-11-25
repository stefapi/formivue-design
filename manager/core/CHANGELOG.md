# Changelog

## 3.1.1

### Patch Changes

- Bug correction
- Updated dependencies
  - @formivue/reactive@3.1.1
  - @formivue/shared@3.1.1
  - @formivue/validator@3.1.1

## 3.1.1

### Patch Changes

- official 3.1 release with datamodel editing
- Updated dependencies
  - @formivue/reactive@3.1.1
  - @formivue/shared@3.1.1
  - @formivue/validator@3.1.1

Notable changes to `@formivue/core` are recorded here.

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2026-11-25

### Added

- Add `ArrayField.spliceValue` and `moveValue` to update array values and field addresses without emitting a user input event. ([`6193635`](https://github.com/stefapi/formivue-design/commit/61936356cef37c3642f3c888cfb279293913804d))

### Fixed

- Give the `isDataFieldState` type guard an explicit public return type so its declaration resolves in dependent packages. ([`f6f6651`](https://github.com/stefapi/formivue-design/commit/f6f6651cddcd07209e44c8ad5c6930b3e335fa12))

## [3.0.3] - 2026-11-23

### Added

- Released the headless observable form engine, with field models, validation, lifecycle effects, and array field operations.

[Unreleased]: https://github.com/stefapi/formivue-design/compare/18a74c35863c8d81a5658101656b8912ea7bab3d...main
[3.1.0]: https://github.com/stefapi/formivue-design/compare/8ae97b832cf24cbf950917c87fbcfca6fc900050...18a74c35863c8d81a5658101656b8912ea7bab3d
[3.0.3]: https://github.com/stefapi/formivue-design/tree/8ae97b832cf24cbf950917c87fbcfca6fc900050/manager/core
