// Mock CheckoutWorker for Serverless Vercel environment (No-op)
export const CheckoutWorker = {
  async processJob(_job: any): Promise<void> {}
}
