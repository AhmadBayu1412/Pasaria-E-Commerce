import {prisma} from "../../infra/db/prisma"

export const Auditing = {
    async log(
        action: string,
        entityType: string,
        entityId: number,
        data: object,
        requestId?: string
     ) {
        try {
            await prisma.audit.create({
                data: {
                    action,
                    entityType,
                    entityId,
                    data: JSON.stringify(data),
                    requestId: requestId || null,
                    createdAt: new Date()
                }
            })
        } catch (error) {
            // Audit log gagal Tidak boleh melakukan operation lagi
            console.error("[AUDIT LOG FAILED]", error)
        }
    }
}