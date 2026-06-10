import { PrismaClient } from "@/generated/prisma";

const prismaClientSingleton  = () => {
    return new PrismaClient()
}

declare const globalThis : {
    prismaGlobal : ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma =globalThis.prismaGlobal ?? prismaClientSingleton()

export {prisma};
if(process.env.NODE_ENV != "production" ) globalThis.prismaGlobal = prisma;
//criando uma variavel global pro prisma nao ficar criando varios clientes