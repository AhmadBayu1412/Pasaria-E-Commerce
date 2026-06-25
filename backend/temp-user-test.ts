import { prisma } from "./infra/db/prisma"

async function main(){

const created =
await prisma.user.create({

data:{
email:"update-test@test.com",
passwordHash:"123"
}

})

console.log("\nCREATE")
console.log(created)

await new Promise(
r=>setTimeout(
r,
3000
)
)

const updated =
await prisma.user.update({

where:{
id:created.id
},

data:{
isActive:false
}

})

console.log("\nUPDATE")
console.log(updated)

}

main()