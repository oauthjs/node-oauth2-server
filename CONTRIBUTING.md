# Contributing to @node-oauth/oauth2-server

Thank you for your interest in this project and your aims to improving it.
This guide will give you the most important info on how to contribute properly
in order to get your pull requests accepted.

## Disclose security vulnerabilities

First things first:
This project has strong security implications and we appreciate every help to
improve security.

**However, please read our [security policy](./SECURITY.md), before taking 
actions.**



## Guiding principles

Before contributing to this project it is important to understand how this 
project and it's collaborators views itself regarding it's scope and purpose.

### OAuth2 standard compliance

This project aims full standard compliance. All improvements on functionality, 
as well as security implications, are done in a way that the standard remains
as the highest reference of choice.

### Framework agnostic

Design decisions and implementations are always done with keeping in mind, that
there are multiple frameworks out there that use this project.



## Development

If you want to fix bugs or add new features, **please read this chapter and it's 
sections carefully!**

### No PR without issue

Please make sure your commitment will be appreciated by first opening an issue
and discuss, whether this is a useful addition to the project.

### Work on a bug or a new feature

First, clone and install this project from source via

```bash
$ git clone git@github.com:node-oauth/node-oauth2-server.git
$ cd node-oauth2-server
$ git checkout developmemt # important! do not work on master!
$ npm install
```

From here you can run several scripts for development purposes:

```bash
$ npm run lint           # runs the linter
$ npm run tets           # runs the tests once
$ npm run tests:coverage # runs the tests including coverage
$ npm run docs           # generates the API docs
```

To work on a new feature or a fix please create a new branch:

```bash
$ git checkout -b feature-xyz # or fix-xyz
```

### Run the tests before committing

Please always make sure your code is passing linter and tests **before
committing**. By doing so you help to make reviews much easier and don't pollute 
the history with commits, that are solely targeting lint fixes.

You can run the tests via

```bash
$ npm run test
```

or  

```bash
$ npm run test:coverage
```

to see your coverage.

### Open a pull request (PR) 

Once you have implemented your changes and tested them locally, please open
a [pull request](https://docs.github.com/en/github/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request).

Note: sometimes a pull request (PR) is also referred to as merge request (MR).

#### Fundamental PR requirements

There are a few basic requirements for your pull request to become accepted:

- Make sure to open your pull request to target the `development` branch and not 
`master`
- Make sure you are working on a branch, other than `development`; usually you
  can name the branch after the feature or fix you want to provide
- Resolve any merge conflicts (usually by keeping your branch updated with 
  `development`)
- Have a clear description on what the PR does, including any steps necessary
  for testing, reviewing, reproduction etc.
- Link to the existing issue
- Added functions or changed functions need to get documented in compliance with
  JSDoc
- Make sure all CI Tests are passing

Also make sure, to comply with the following list:

- Do not work on `development` directly
- Do not implement multiple features in one pull request (this includes bumping
  versions of dependencies that are not related to the PR/issue)
- Do not bump the release version (unless you are a maintainer)
- Do not edit the Changelog as this will be done after your PR is merged
- Do not introduce tight dependencies to a certain package that has not been
  approved during the discussion in the issue

#### Review process

Finally your PR needs to pass the review process:

- A certain amount of maintainers needs to review and accept your PR
- Please **expect change requests**! They will occur and are intended to improve
  the overall code quality.
- If your changes have been updated please re-assign the reviewer who asked for
  the changes
- Once all reviewers have approved your PR it will be merged by one of the
  maintainers :tada:



## For maintainers

Maintainers of this repository have an extended responsibility for security and
integrity. Therefore you have to take extra care on preparing publishing.

### When to release a new version?

- on fixed vulnerabilities
- on fixed dependency-vulnerabilites
- on new added features
- what else?

### When to decide between major, minor and path release?

- major = breaking
- minor = features and security fixes
- patch = general fixes and small improvements

### How to release a new version?

What's required to publish to npm, which branches are involved, what should not
be done etc.

## Become a maintainer

What is required to become a maintainer?
 