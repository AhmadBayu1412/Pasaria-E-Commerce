// Safe mock queue for Serverless mode (No-op)
export const checkoutQueue = null
export const closeCheckoutWorker = async () => {}
export const closeCheckoutQueue = async () => {}
export async function getQueueStatus() {
    return {
        name: "checkout-queue",
        isReady: false,
        jobCounts: { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0 }
    }
}
