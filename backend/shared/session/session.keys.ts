const PREFIX = "session"

export const SessionKeys = {
    /**
     * Build session key
     * Usage: SessionKeys.byId("abc123") -> "session:abc123"
     */
    byId(sessionId: string): string {
        return `${PREFIX}:${sessionId}`
    }
}