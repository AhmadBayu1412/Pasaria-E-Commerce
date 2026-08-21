// Safe mock queue producer for Serverless mode (No-op)
export const CheckoutQueueProducer = {
    async enqueueOrderConfirmationEmail(_data: any) {},
    async enqueueAuditLog(_data: any) {}
}
