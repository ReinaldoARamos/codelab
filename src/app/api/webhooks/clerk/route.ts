// Importamos nossa instância do Prisma.
// Ela será usada para conversar com o banco de dados,
// permitindo criar, buscar, atualizar e excluir usuários.
import { prisma } from "@/lib/prisma";

// UserJSON representa os dados de um usuário enviados pelo Clerk.
// WebhookEvent representa a estrutura de um evento recebido pelo webhook.
import type { UserJSON, WebhookEvent } from "@clerk/nextjs/server";

// Usamos headers() para acessar os cabeçalhos (headers)
// da requisição que chegou ao nosso servidor.
import { headers } from "next/headers";

// NextResponse facilita a criação de respostas HTTP dentro do Next.js.
import { NextResponse } from "next/server";

// O Clerk utiliza o Svix para enviar e assinar os webhooks.
// A classe Webhook será utilizada para verificar essa assinatura.
import { Webhook } from "svix";


// Pegamos o segredo do webhook armazenado nas variáveis de ambiente.
//
// Esse segredo fica no arquivo .env e serve para confirmar
// que o webhook realmente foi enviado pelo Clerk.
//
// Nunca devemos colocar esse segredo diretamente no código.
const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;


// Criamos uma rota POST.
// Essa função será executada quando o Clerk enviar
// um evento para nossa API.
//
// Por exemplo:
// - usuário criado
// - usuário atualizado
// - usuário excluído
export async function POST(req: Request) {

  // O try/catch externo serve para capturar qualquer erro
  // inesperado que aconteça durante o processamento do webhook.
  try {

    // Antes de continuar, verificamos se o segredo do webhook
    // realmente está configurado.
    //
    // Sem ele não conseguimos verificar a autenticidade
    // da requisição recebida.
    if (!SIGNING_SECRET) {
      throw new Error("Error: Clerk webhook secret not set");
    }


    // Criamos um objeto Webhook usando nosso segredo.
    //
    // Esse objeto será utilizado posteriormente para verificar
    // se a assinatura enviada pelo Clerk é válida.
    const wh = new Webhook(SIGNING_SECRET);


    // Pegamos todos os headers da requisição.
    //
    // O Svix envia algumas informações importantes nesses headers
    // para conseguirmos validar o webhook.
    const headerPayload = await headers();


    // ID único do webhook enviado pelo Svix.
    const svix_id = headerPayload.get("svix-id");

    // Timestamp informa quando o webhook foi enviado.
    const svix_timestamp = headerPayload.get("svix-timestamp");

    // Assinatura utilizada para verificar a autenticidade
    // do webhook.
    const svix_signature = headerPayload.get("svix-signature");


    // Se algum dos três headers necessários não existir,
    // não conseguimos verificar a requisição.
    //
    // Nesse caso, rejeitamos a requisição com status 400.
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error: Missing Svix headers", {
        status: 400,
      });
    }


    // Pegamos o corpo (body) enviado pelo Clerk.
    //
    // Como a requisição está em JSON, usamos req.json()
    // para transformar esse conteúdo em um objeto JavaScript.
    const payload = await req.json();


    // Transformamos o objeto novamente em uma string JSON.
    //
    // Essa string será utilizada pelo Svix para verificar
    // a assinatura do webhook.
    const body = JSON.stringify(payload);


    // Criamos uma variável que posteriormente armazenará
    // o evento já validado.
    //
    // Ela será do tipo WebhookEvent.
    let evt: WebhookEvent;


    // Criamos um try/catch específico para a verificação.
    //
    // Isso é importante porque, se a assinatura for inválida,
    // o wh.verify() poderá gerar um erro.
    try {

      // Aqui acontece uma das partes mais importantes do código.
      //
      // O wh.verify() verifica se:
      //
      // 1. A assinatura do webhook é válida.
      // 2. Os headers correspondem ao webhook recebido.
      // 3. O conteúdo recebido não foi alterado.
      //
      // Se tudo estiver correto, recebemos o evento.
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as unknown as WebhookEvent;


    } catch (err) {

      // Se a assinatura não puder ser validada,
      // não devemos confiar nos dados recebidos.
      //
      // Por segurança, rejeitamos o webhook.
      console.error("Error: Could not verify webhook:", err);

      return new Response("Error: Verification error", {
        status: 400,
      });
    }


    // Depois que o webhook foi validado,
    // descobrimos qual tipo de evento recebemos.
    //
    // Alguns exemplos:
    //
    // user.created -> usuário criado
    // user.updated -> usuário atualizado
    // user.deleted -> usuário excluído
    const eventType = evt.type;


    // Pegamos o ID do usuário enviado pelo Clerk.
    //
    // Estamos renomeando "id" para "clerkUserId".
    //
    // Isso deixa mais claro que esse ID pertence ao Clerk
    // e será utilizado para relacionar o usuário do Clerk
    // com o usuário existente no nosso banco.
    const { id: clerkUserId } = evt.data;


    // Se o evento não possuir um ID de usuário,
    // não temos como saber qual usuário devemos manipular.
    //
    // Então retornamos um erro.
    if (!clerkUserId)
      return NextResponse.json(
        { error: "No user ID provided" },
        { status: 400 }
      );


    // Essa variável vai armazenar o usuário depois
    // que a operação no banco de dados for concluída.
    //
    // Inicialmente ela é null porque ainda não sabemos
    // qual operação será executada.
    let user = null;


    // Agora verificamos qual evento foi enviado pelo Clerk.
    //
    // Dependendo do tipo de evento, vamos realizar
    // uma operação diferente no banco.
    switch (eventType) {


      // ============================================================
      // USUÁRIO CRIADO
      // ============================================================
      //
      // Executado quando uma nova conta é criada no Clerk.
      case "user.created": {

        // Pegamos os dados completos do usuário enviados pelo Clerk.
        //
        // Fazemos a conversão para UserJSON para informar ao TypeScript
        // qual estrutura de dados estamos trabalhando.
        const data = evt.data as UserJSON;


        // O Clerk fornece o ID do e-mail que está marcado
        // como principal na conta do usuário.
        const primaryEmailId = data.primary_email_address_id;


        // Procuramos o e-mail principal dentro da lista
        // de e-mails do usuário.
        //
        // Se não encontrarmos o e-mail principal,
        // usamos o primeiro e-mail disponível.
        const email =
          data.email_addresses.find(
            (address) => address.id === primaryEmailId
          )?.email_address ?? data.email_addresses[0].email_address;


        // upsert significa:
        //
        // "Se o registro já existir, atualize.
        // Se não existir, crie."
        //
        // Isso ajuda a evitar usuários duplicados.
        user = await prisma.user.upsert({

          // Usamos o clerkUserId para encontrar o usuário.
          //
          // Por isso esse campo precisa ser @unique
          // no nosso schema.prisma.
          where: {
            clerkUserId,
          },


          // Se o usuário já existir, executamos essa atualização.
          update: {
            clerkUserId,
          },


          // Se o usuário ainda não existir,
          // criamos um novo registro no banco.
          create: {
            // ID do usuário no Clerk.
            clerkUserId,

            // E-mail do usuário.
            email,

            // Nome do usuário.
            //
            // Se o Clerk não tiver um first_name,
            // usamos a parte do e-mail antes do @.
            //
            // Exemplo:
            // joao@gmail.com -> joao
            firstName: data.first_name ?? email.split("@")[0],

            // Sobrenome do usuário, caso exista.
            lastName: data.last_name,

            // URL da imagem de perfil fornecida pelo Clerk.
            imageUrl: data.image_url,
          },
        });


        // Encerramos esse case.
        break;
      }


      // ============================================================
      // USUÁRIO EXCLUÍDO
      // ============================================================
      //
      // Executado quando o usuário é excluído do Clerk.
      case "user.deleted": {


        // Primeiro procuramos o usuário no nosso banco.
        //
        // Utilizamos o clerkUserId porque ele conecta
        // o usuário do Clerk ao registro do nosso banco.
        const databaseUser = await prisma.user.findUnique({
          where: {
            clerkUserId,
          },
        });


        // Se o usuário não existir no banco,
        // não temos o que excluir.
        if (!databaseUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }


        // Agora que encontramos o usuário,
        // podemos excluí-lo do banco.
        //
        // Aqui usamos o "id" interno do nosso banco.
        user = await prisma.user.delete({
          where: {
            id: databaseUser.id,
          },
        });


        // Encerramos esse case.
        break;
      }


      // ============================================================
      // USUÁRIO ATUALIZADO
      // ============================================================
      //
      // Executado quando alguma informação do usuário
      // é alterada no Clerk.
      case "user.updated": {

        // Pegamos os dados atualizados enviados pelo Clerk.
        const data = evt.data as UserJSON;


        // Primeiro procuramos o usuário correspondente
        // dentro do nosso banco.
        const databaseUser = await prisma.user.findUnique({
          where: {
            clerkUserId,
          },
        });


        // Se o usuário não estiver no banco,
        // não temos como atualizar seus dados.
        if (!databaseUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }


        // Pegamos o ID do e-mail principal.
        const primaryEmailId = data.primary_email_address_id;


        // Procuramos o e-mail principal dentro da lista.
        //
        // Se não encontrarmos, usamos o primeiro e-mail disponível.
        const email =
          data.email_addresses.find(
            (address) => address.id === primaryEmailId
          )?.email_address ?? data.email_addresses[0].email_address;


        // Atualizamos o usuário existente no banco.
        //
        // Aqui estamos sincronizando os dados que estão no Clerk
        // com os dados que estão no nosso PostgreSQL.
        user = await prisma.user.update({

          // Usamos o ID interno do banco para encontrar
          // exatamente o usuário que queremos atualizar.
          where: {
            id: databaseUser.id,
          },


          // Informações que serão atualizadas.
          data: {
            // Atualiza o e-mail.
            email,

            // Atualiza o nome.
            //
            // Caso não exista um first_name,
            // usamos o começo do e-mail.
            firstName: data.first_name ?? email.split("@")[0],

            // Atualiza o sobrenome.
            lastName: data.last_name,

            // Atualiza a imagem de perfil.
            imageUrl: data.image_url,
          },
        });


        // Encerramos esse case.
        break;
      }
    }


    // Depois de terminar o processamento do evento,
    // retornamos o usuário que foi criado, atualizado ou excluído.
    //
    // Como não especificamos um status,
    // o NextResponse retorna 200 (OK).
    return NextResponse.json({ user });


  } catch (error) {

    // Se ocorrer algum erro inesperado em qualquer parte do código,
    // chegamos aqui.
    //
    // Retornamos status 500, indicando um erro interno do servidor.
    return NextResponse.json({ error }, { status: 500 });
  }
}