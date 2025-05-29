#!/bin/bash
cd /home/kavia/workspace/code-generation/tetramaster-23326-19392a3b/tetramaster
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

