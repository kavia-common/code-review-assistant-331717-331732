#!/bin/bash
cd /home/kavia/workspace/code-generation/code-review-assistant-331717-331732/backend_api
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

