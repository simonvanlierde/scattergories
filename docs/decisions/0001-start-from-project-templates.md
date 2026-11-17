---
status: accepted
date: 2026-11-17
---

# Start from project-templates

## Context and Problem Statement

scattergories needs a build, checks, CI and release steps for python, ts. Writing them by hand
costs a day and drifts from the other projects that solve the same problems.

## Considered Options

* Write the tooling by hand
* Render it from [project-templates](https://github.com/simonvanlierde/project-templates) with Copier

## Decision Outcome

Chosen: render it from project-templates. `.copier-answers.yml` records the answers (Python kind: `app`) (TypeScript kind: `web-app`), and `copier update`
brings later template changes in as a reviewable diff.

### Consequences

* Good: the checks, CI and release steps match the template's other projects, and fixes
  reach this one as `copier update` pull requests.
* Bad: a file the template owns is changed in the template, not here, or the next
  update reverts it. `just/local.just` holds this project's own recipes.

### Confirmation

None: `.copier-answers.yml` names the template version, and `copier update` shows how far
the project has drifted from it.
