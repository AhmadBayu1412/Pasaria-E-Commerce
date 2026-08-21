// Mock checkout handlers for Serverless Vercel environment (No-op)
export const EmailHandler = {
  async handle(_job: any): Promise<void> {}
}
export const AuditHandler = {
  async handle(_job: any): Promise<void> {}
}
