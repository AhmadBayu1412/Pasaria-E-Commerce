// Safe mock producer for Serverless mode (No-op)
export async function queueProductReindex(_productId: number): Promise<string | undefined> {
  return undefined
}
export async function getPendingJobCount(): Promise<number> {
  return 0
}
export async function hasJob(_jobId: string): Promise<boolean> {
  return false
}
