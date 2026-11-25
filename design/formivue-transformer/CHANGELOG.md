# Changelog

## 3.1.1

### Patch Changes

- Bug correction
- Updated dependencies
  - @formivue-design/core@3.1.1
  - @formivue-design/shared@3.1.1
  - @formivue/core@3.1.1
  - @formivue/json-schema@3.1.1

## 3.1.1

### Patch Changes

- official 3.1 release with datamodel editing
- Updated dependencies
  - @formivue-design/core@3.1.1
  - @formivue-design/shared@3.1.1
  - @formivue/core@3.1.1
  - @formivue/json-schema@3.1.1

Notable changes to `@formivue-design/formivue-transformer` are recorded here.

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2026-11-25

### Added

- Compile separate UI, data schema, and value documents into a live form session that accepts snapshots and patches. ([`6193635`](https://github.com/stefapi/formivue-design/commit/61936356cef37c3642f3c888cfb279293913804d))
- Register component contracts for typed bindings, dataset columns, and validation. Use the chart and advanced material contracts to check filters and complex controls. ([`3d7ff42`](https://github.com/stefapi/formivue-design/commit/3d7ff42ad481170ffc1784d7c5f21d9696031c8a), [`b1bb9e9`](https://github.com/stefapi/formivue-design/commit/b1bb9e94bd42916eb3c9f622d5c3c5b2e0172c5b))
- Generate data models from the canvas, preserve variant data when renaming or moving fields, and project supported schema constraints onto runtime controls. ([`e3caa73`](https://github.com/stefapi/formivue-design/commit/e3caa7394ce94b3ab8bdf50c114a1a3577e3eea4), [`6a3cb36`](https://github.com/stefapi/formivue-design/commit/6a3cb36e18fd19d96526d4c911a58232c032d5b9), [`acae2a1`](https://github.com/stefapi/formivue-design/commit/acae2a12cce7c97ded2febbd44944ca48a781c99))
- Resolve schema branches and local references for bound controls. Reconcile canvas renames and structural changes independently for each variant and persist pending review choices. ([`b579661`](https://github.com/stefapi/formivue-design/commit/b5796615468eb2062bf880328e418f2e2aafad72), [`b0d6f5b`](https://github.com/stefapi/formivue-design/commit/b0d6f5b75501c3540419ee65b3e1acd259709f26), [`bca698e`](https://github.com/stefapi/formivue-design/commit/bca698e13bedf2eb2944c21f776d04b78222e210), [`a894f43`](https://github.com/stefapi/formivue-design/commit/a894f43f06882efa9231de5effc334a899f60073))

### Fixed

- Rebuild missing chart and table row schemas and restore deleted bound fields during reconciliation. Preserve each variant’s type and field settings. ([`a23531d`](https://github.com/stefapi/formivue-design/commit/a23531da349e5c70b3286e565eaed9c0d32c8fd2), [`fe3a778`](https://github.com/stefapi/formivue-design/commit/fe3a778e0d50b05e826de0d2029923397c0c09b8), [`6aff253`](https://github.com/stefapi/formivue-design/commit/6aff2537a83464ee8f27bd98e5eaae42103eb57a))

### Security

- Restrict executable settings in document compilation and combined-schema imports. Require the host to pass `trusted: true` for trusted content. ([`0867154`](https://github.com/stefapi/formivue-design/commit/0867154aad92236654e9a95e16c4b144f37b1b7c))
- Allow only supported rendering attributes in restricted imports, dropping external submission destinations and Vue refs. ([`f82a085`](https://github.com/stefapi/formivue-design/commit/f82a0853848dd5e57165f1873343f1eb80588b93))

## [3.0.3] - 2026-11-23

### Added

- Released conversion between the designer canvas tree and combined Formivue JSON Schema exports.

[Unreleased]: https://github.com/stefapi/formivue-design/compare/18a74c35863c8d81a5658101656b8912ea7bab3d...main
[3.1.0]: https://github.com/stefapi/formivue-design/compare/8ae97b832cf24cbf950917c87fbcfca6fc900050...18a74c35863c8d81a5658101656b8912ea7bab3d
[3.0.3]: https://github.com/stefapi/formivue-design/tree/8ae97b832cf24cbf950917c87fbcfca6fc900050/design/formivue-transformer
