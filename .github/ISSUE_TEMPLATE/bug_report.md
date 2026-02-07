name: Bug Report
description: Report a bug or issue
labels: ["bug"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thanks for reporting a bug! Please fill out the form below to help us understand and fix the issue.

  - type: textarea
    id: description
    attributes:
      label: Description
      description: A clear description of what the bug is
      placeholder: Describe the bug...
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: How to reproduce the bug
      placeholder: |
        1. Go to...
        2. Click on...
        3. See error...
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should happen instead?
      placeholder: I expected...
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happens?
      placeholder: Instead, it...
    validations:
      required: true

  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Information about your environment
      placeholder: |
        - OS: [e.g., macOS, Linux, Windows]
        - Browser: [e.g., Chrome 120, Firefox]
        - Node.js version: [e.g., 18.0.0]
        - EduSagar version: [e.g., 1.0.0]

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots
      description: If applicable, add screenshots showing the bug
      placeholder: You can paste images here

  - type: textarea
    id: logs
    attributes:
      label: Console Errors
      description: Any error messages from browser console
      placeholder: |
        ```
        Error: ...
        ```

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: I've checked that this bug hasn't been reported before
          required: true
        - label: I've included all necessary information
          required: true
        - label: I'm willing to help fix this bug
