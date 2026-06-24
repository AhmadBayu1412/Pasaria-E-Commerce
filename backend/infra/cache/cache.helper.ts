const PREFIX = "pasaria"

export const CacheKey = {
    // Product
    productsList: `${PREFIX}:products:list`,
    productDetail(id:number){return `${PREFIX}:products:${id}`},

    // User
    userList: `${PREFIX}:users:list`,

    // Categories
    categories: `${PREFIX}:categories:list`,

    // STEP 9
    cartList: `${PREFIX}:cart:list`,
    cartDetail(userId: number) {return `${PREFIX}:cart:${userId}`},
    orderList: `${PREFIX}:order:list`,
    orderDetail(orderId: number) {return `${PREFIX}:order:${orderId}`}
}
