import { prisma } from "@/lib/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // ============================================================
    // 1. RECEBIMENTO DO WEBHOOK
    // ============================================================
    // Esta função POST é executada quando o Clerk envia uma
    // requisição HTTP POST para:
    //
    // /api/webhooks/clerk
    //
    // O webhook é uma comunicação servidor → servidor.
    // O Clerk envia informações sobre eventos que aconteceram
    // na plataforma, como criação, atualização ou exclusão
    // de usuários.

    console.log("1 - WEBHOOK CHEGOU");

    // ============================================================
    // 2. VERIFICAÇÃO DA ASSINATURA DO WEBHOOK
    // ============================================================
    // verifyWebhook() verifica se a requisição realmente foi
    // enviada pelo Clerk.
    //
    // O Clerk utiliza uma assinatura criptográfica nos headers
    // da requisição. O verifyWebhook() utiliza essa assinatura
    // juntamente com o webhook signing secret para validar
    // a autenticidade da mensagem.
    //
    // Isso evita que qualquer pessoa consiga enviar um POST
    // falso para nossa rota e criar/modificar usuários no banco.

    const evt = await verifyWebhook(req);

    console.log("2 - WEBHOOK VERIFICADO");

    // ============================================================
    // 3. IDENTIFICAÇÃO DO EVENTO
    // ============================================================
    // Um webhook pode representar diferentes eventos.
    //
    // Exemplos:
    // user.created  → usuário criado
    // user.updated  → usuário atualizado
    // user.deleted  → usuário excluído
    //
    // Aqui descobrimos qual evento o Clerk enviou.

    console.log("3 - EVENTO:", evt.type);

    // ============================================================
    // 4. TRATAMENTO DO EVENTO user.created
    // ============================================================
    // Só executamos esta parte quando o Clerk informar que
    // um novo usuário foi criado.

    if (evt.type === "user.created") {
      console.log("4 - ENTROU NO USER.CREATED");

      // Dados enviados pelo Clerk sobre o usuário.
      const {
        id,
        email_addresses,
        first_name,
        last_name,
        image_url,
      } = evt.data;

      console.log("5 - ID:", id);
      console.log("6 - EMAILS:", email_addresses);

      // ==========================================================
      // 5. OBTENDO O EMAIL PRINCIPAL
      // ==========================================================
      // O Clerk pode possuir mais de um endereço de email.
      //
      // primary_email_address_id informa qual deles é o principal.
      // Primeiro tentamos encontrar esse email.
      //
      // Caso ele não seja encontrado, usamos o primeiro email
      // disponível no array.

      const primaryEmailId = evt.data.primary_email_address_id;

      const email =
        email_addresses.find(
          (address) => address.id === primaryEmailId
        )?.email_address ??
        email_addresses[0]?.email_address;

      // Se não houver nenhum email, não podemos criar o usuário
      // porque o campo email é obrigatório no nosso banco.

      if (!email) {
        console.log("Webhook recebido, mas sem email.");

        return Response.json({
          success: true,
          message: "Usuário recebido, mas sem email.",
        });
      }

      console.log("9 - ANTES DO PRISMA");

      // ==========================================================
      // 6. SALVANDO O USUÁRIO NO BANCO
      // ==========================================================
      // Aqui fazemos a integração entre Clerk e Prisma.
      //
      // clerkUserId é utilizado para relacionar o usuário do
      // Clerk com o usuário armazenado no nosso banco.
      //
      // upsert significa:
      //
      // - se o usuário já existir → atualiza
      // - se não existir → cria
      //
      // Isso também ajuda a evitar problemas caso o Clerk envie
      // o mesmo webhook mais de uma vez.

      const user = await prisma.user.upsert({
        where: {
          clerkUserId: id,
        },

        update: {},

        create: {
          clerkUserId: id,
          email,
          firstName: first_name ?? email.split("@")[0],
          lastName: last_name,
          imageUrl: image_url,
        },
      });

      console.log("10 - USUÁRIO SALVO:", user);

      // ==========================================================
      // 7. RESPOSTA PARA O CLERK
      // ==========================================================
      // O status HTTP 200 indica que o webhook foi processado
      // com sucesso.

      return Response.json({
        success: true,
        user,
      });
    }

    // ============================================================
    // 8. OUTROS EVENTOS
    // ============================================================
    // Se recebermos um evento diferente de user.created,
    // atualmente apenas confirmamos o recebimento.
    //
    // Posteriormente podemos implementar aqui:
    //
    // user.updated → atualizar usuário no banco
    // user.deleted → excluir usuário do banco

    console.log("EVENTO DIFERENTE DE USER.CREATED");

    return Response.json({
      success: true,
      message: `Evento ${evt.type} recebido`,
    });
  } catch (error) {
    // ============================================================
    // 9. TRATAMENTO DE ERROS
    // ============================================================
    // Qualquer erro durante a validação do webhook ou durante
    // a comunicação com o banco cairá aqui.

    console.error("========== ERRO NO WEBHOOK ==========");
    console.error(error);
    console.error("====================================");

    return new Response("Webhook error", {
      status: 400,
    });
  }
}
