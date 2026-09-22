// Importamos o PrismaClient que foi gerado pelo Prisma.
// Ele é o responsável por permitir que nossa aplicação converse
// com o banco de dados usando TypeScript.
import { PrismaClient } from "@/generated/prisma";

// Criamos uma função responsável por criar uma nova instância do PrismaClient.
//
// Em outras palavras: sempre que chamarmos essa função,
// ela cria uma nova conexão/cliente do Prisma para nossa aplicação.
const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Aqui estamos dizendo ao TypeScript que o objeto globalThis
// terá uma propriedade chamada "prismaGlobal".
//
// O globalThis representa um objeto global disponível em toda a aplicação.
// Estamos adicionando o prismaGlobal nele para conseguirmos reutilizar
// a mesma instância do Prisma em vez de criar várias.
//
// ReturnType<typeof prismaClientSingleton> significa:
// "o tipo que essa função prismaClientSingleton retorna".
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Aqui verificamos se já existe uma instância do Prisma armazenada
// no globalThis.
//
// Se existir:
//     usamos a instância que já existe.
//
// Se não existir:
//     criamos uma nova instância usando prismaClientSingleton().
//
// O operador ?? significa "se o valor da esquerda for null ou undefined,
// use o valor da direita".
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Exportamos a instância do Prisma para que ela possa ser utilizada
// em outras partes da aplicação.
//
// Assim, em qualquer arquivo podemos importar:
// import { prisma } from "@/lib/prisma";
//
// E então utilizar:
// prisma.user.findMany()
// prisma.user.create()
// etc.
export { prisma };

// Em ambiente de desenvolvimento, como estamos usando Next.js,
// a aplicação pode ser reiniciada/recarregada várias vezes
// durante o desenvolvimento (Hot Reload).
//
// Sem esse cuidado, cada recarregamento poderia criar uma nova
// instância do PrismaClient.
//
// Por isso, quando NÃO estamos em produção, salvamos a instância
// atual no globalThis.
//
// Na próxima vez que o arquivo for carregado, o código acima:
// globalThis.prismaGlobal ?? prismaClientSingleton()
//
// poderá reutilizar essa instância em vez de criar outra.
if (process.env.NODE_ENV != "production") {
  globalThis.prismaGlobal = prisma;
}
