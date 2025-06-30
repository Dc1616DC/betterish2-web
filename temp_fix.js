  const restoreToToday = async (taskId) => {
    const taskRef = doc(db, 'tasks', taskId);
    try {
      // 1. Check if the task document still exists
      const docSnap = await getDoc(taskRef);

      if (!docSnap.exists()) {
        // Document was deleted – just remove it from the UI list and exit silently
        setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
        return;
      }

      // 2. Move the task back to today in Firestore
      await updateDoc(taskRef, { createdAt: Timestamp.now() });

      // 3. Reflect the change in UI by adding it back to today's tasks
      const restored = {
        id: taskId,
        ...docSnap.data(),
        createdAt: Timestamp.now(),
      };
      setTasks((prev) => [...prev, restored]);
    } catch (err) {
      console.error(
        '[Dashboard] restoreToToday error (document may not exist):',
        err
      );
    } finally {
      // Always remove from pastPromises list to avoid stale entries
      setPastPromises((prev) => prev.filter((t) => t.id !== taskId));
    }
  };
