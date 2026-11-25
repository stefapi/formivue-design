# Changelog

## 3.1.1

### Patch Changes

- Bug correction
- Updated dependencies
  - @formivue/core@3.1.1
  - @formivue/reactive@3.1.1
  - @formivue/shared@3.1.1

## 3.1.1

### Patch Changes

- official 3.1 release with datamodel editing
- Updated dependencies
  - @formivue/core@3.1.1
  - @formivue/reactive@3.1.1
  - @formivue/shared@3.1.1

Notable changes to `@formivue/json-schema` are recorded here.

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2026-11-25

### Added

- Validate document values, apply revisioned patches, and merge remote snapshots with local form edits. ([`6193635`](https://github.com/stefapi/formivue-design/commit/61936356cef37c3642f3c888cfb279293913804d))
- Validate documents with JSON Schema 2020-12, resolve registered resources, and provide a runner for the dialect conformance suite. ([`b579661`](https://github.com/stefapi/formivue-design/commit/b5796615468eb2062bf880328e418f2e2aafad72))
- Move values between objects as variant binding paths change. ([`acae2a1`](https://github.com/stefapi/formivue-design/commit/acae2a12cce7c97ded2febbd44944ca48a781c99))

### Changed

- Expose shared document JSON utilities alongside validation, patching, and state APIs, with package-level tests for validation messages. ([`a7415ee`](https://github.com/stefapi/formivue-design/commit/a7415ee2f0614097d7c2fbb9acbbb097da5ac0cc), [`b698b6d`](https://github.com/stefapi/formivue-design/commit/b698b6d75661a93dcf2133db4ace0c033adc9f71))

### Fixed

- Include the rejected value and the expected constant or allowed choices in document validation details. ([`6b85e4a`](https://github.com/stefapi/formivue-design/commit/6b85e4a98920499d87a4bee4f88e1ab8a8743bd9), [`9015f7f`](https://github.com/stefapi/formivue-design/commit/9015f7f346f2cae4e7299829ba1965b36859c27f))

## [3.0.3] - 2026-11-23

### Added

- Released the schema driver that maps JSON Schema fields, validators, and reactions onto the Formivue form engine.

[Unreleased]: https://github.com/stefapi/formivue-design/compare/18a74c35863c8d81a5658101656b8912ea7bab3d...main
[3.1.0]: https://github.com/stefapi/formivue-design/compare/8ae97b832cf24cbf950917c87fbcfca6fc900050...18a74c35863c8d81a5658101656b8912ea7bab3d
[3.0.3]: https://github.com/stefapi/formivue-design/tree/8ae97b832cf24cbf950917c87fbcfca6fc900050/manager/json-schema
