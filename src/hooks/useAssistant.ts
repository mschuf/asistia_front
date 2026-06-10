/**
 * @file useAssistant.ts
 * @description Hook reservado para la integración futura del asistente IA.
 */

/**
 * Hook reservado para la integración futura del asistente IA.
 * @returns Estado `ready` y stub `sendMessage` que lanza error.
 */
export function useAssistant() {
  return {
    ready: false,
    sendMessage: async (_message: string) => {
      throw new Error("El asistente de IA aún no está implementado.");
    }
  };
}
