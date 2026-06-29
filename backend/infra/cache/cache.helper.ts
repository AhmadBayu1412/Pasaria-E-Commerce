const PREFIX = "pasaria"

export const CacheKey = {
    // Product
    productsList: `${PREFIX}:products:list`,
    productDetail(id:number){return `${PREFIX}:products:${id}`},

    // User
    userList: `${PREFIX}:users:list`,

    // Category (Phase 3 Step 2)
    categoriesList: `${PREFIX}:categories:list`,
    categoryDetail(id: number) { return `${PREFIX}:categories:${id}` },

    // Cart & Order (Phase 2 Step 9)
    cartList: `${PREFIX}:cart:list`,
    cartDetail(userId: number) {return `${PREFIX}:cart:${userId}`},
    orderList: `${PREFIX}:order:list`,
    orderDetail(orderId: number) {return `${PREFIX}:order:${orderId}`}
}
 