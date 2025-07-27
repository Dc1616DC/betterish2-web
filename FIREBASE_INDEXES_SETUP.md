# Firebase Composite Indexes Setup

## Required Indexes for Optimal Performance

Based on the console errors and query patterns in DashboardClient.js, create these composite indexes in Firebase Console:

### Index 1: Main Tasks Query
**Collection:** `tasks`
**Fields:**
- `userId` (Ascending)
- `createdAt` (Descending)

### Index 2: Past Promises Query  
**Collection:** `tasks`
**Fields:**
- `userId` (Ascending)
- `source` (Ascending)
- `createdAt` (Ascending)
- `createdAt` (Descending)

### Index 3: Complex Past Promises Query
**Collection:** `tasks`
**Fields:**
- `userId` (Ascending)  
- `source` (Ascending)
- `createdAt` (Descending)

## How to Create Indexes

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `betterish` project
3. Navigate to **Firestore Database** → **Indexes** → **Composite**
4. Click **Create Index**
5. Add each field exactly as listed above
6. Click **Create**

## Query URLs from Console

If you see console errors with URLs like:
```
https://console.firebase.google.com/project/[PROJECT-ID]/firestore/indexes?create_composite=...
```

Simply click those URLs to auto-create the required indexes.

## Verification

After creating indexes:
- Dashboard queries should be faster
- Console errors about missing indexes should disappear
- Query performance will be optimized for larger datasets