import { PrismaClient } from "@/generated/prisma";

const prismaClientSingleTon = () => {
    return new PrismaClient()
}

declare const globlaThis : {
    prismaGlobal : ReturnType<typeof prismaClientSingleTon>
} & typeof global




const prisma = globlaThis.prismaGlobal ?? prismaClientSingleTon


export {prisma}


if( process.env.NODE_ENV  != "production")  globlaThis.prismaGlobal = prisma