name: Feature Request
description: Suggest a new feature
labels: ["enhancement"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a feature! Please provide the details below.

  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: Is there a problem this feature would solve?
      placeholder: Describe the problem...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: How would you like this feature to work?
      placeholder: Describe your proposed solution...
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternative Solutions
      description: Any other approaches you've considered?
      placeholder: List any alternative solutions...

  - type: textarea
    id: context
    attributes:
      label: Additional Context
      description: Any other relevant information?
      placeholder: Add any other context here...

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: I've checked that this feature hasn't been requested before
          required: true
        - label: This feature would be useful for other users
          required: true
