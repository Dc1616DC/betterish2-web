#!/bin/bash

echo "🗑️  Deleting all tasks from Firestore..."
echo ""
echo "⚠️  WARNING: This will delete ALL tasks for ALL users!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Use Firebase CLI to delete all documents in the tasks collection
firebase firestore:delete tasks --all-collections --yes

echo ""
echo "✅ All tasks have been deleted!"
echo "🎯 Database is clean and ready for the new architecture!"