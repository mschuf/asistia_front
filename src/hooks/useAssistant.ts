/**
 * Hook reservado para la integración futura del asistente IA.
 */
export function useAssistant() {
  return {
    ready: false,
    sendMessage: async (_message: string) => {
      throw new Error("El asistente de IA aún no está implementado.");
    }
  };
}
