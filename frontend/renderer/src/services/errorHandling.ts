export async function safeExecute<T>(
  operation: () => Promise<T>,
  operationName: string,
  cleanup?: () => void
): Promise<T> {
  try {
    console.log(`Démarrage de ${operationName}...`);
    const result = await operation();
    console.log(`${operationName} terminé avec succès`);
    return result;
  } catch (error) {
    console.error(`Erreur lors de ${operationName}:`, error);
    throw error;
  } finally {
    if (cleanup) cleanup();
  }
}