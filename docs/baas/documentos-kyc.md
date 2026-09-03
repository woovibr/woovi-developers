---
id: documentos-kyc
title: Documentos e compliance (KYC)
tags:
  - baas
  - kyc
  - compliance
sidebar_position: 3
---

Abrir uma conta passa por um processo de compliance estruturado em três etapas: **levantamento de documentação e informações**, **análise e validação** e **registro da conta**.

A Woovi é uma instituição regulada pelo Banco Central do Brasil. Por isso, determinadas responsabilidades regulatórias não podem ser delegadas: cabe a você iniciar o cadastro e ao seu cliente enviar a documentação; as etapas de análise, validação e registro da conta são de responsabilidade exclusiva da Woovi.

## Como funciona na prática

O caminho recomendado é a **API de KYC Onboarding**: você cria o onboarding com uma única chamada e recebe um link hospedado pela Woovi, onde o próprio cliente preenche os dados cadastrais e envia os documentos — sem que você precise coletar, hospedar ou transferir arquivos.

```bash
curl 'https://api.woovi.com/api/v1/kyc/onboarding' -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: <APP_ID>" \
  --data-binary '{
    "taxID": "XX.XXX.XXX/0001-XX",
    "correlationID": "conta-cliente-001",
    "representatives": [
      { "taxID": "XXX.XXX.XXX-XX" }
    ]
  }'
```

A resposta `201` traz o `linkOnboarding`, que você envia ao seu cliente:

```json
{
  "linkOnboarding": "https://kyc.woovi.com/onboarding/QWNjb3VudFJlZ2lzdGVyOjY5...",
  "accountRegister": {
    "status": "PENDING",
    "correlationID": "conta-cliente-001"
  }
}
```

O passo a passo completo do endpoint — campos, idempotência por `correlationID` e códigos de erro — está em [Como criar um onboarding KYC via API](./kyc/api-onboarding-create.mdx) e na [API Reference](https://developers.woovi.com/api#tag/kyc/POST/api/v1/kyc/onboarding).

O fluxo, do início ao fim:

1. **Você cria o onboarding via API** — apenas o CNPJ e, opcionalmente, os CPFs dos sócios
2. **Envia o `linkOnboarding` ao cliente** — por e-mail, WhatsApp ou dentro do seu produto
3. **O cliente preenche o cadastro** — dados da empresa, endereço, contrato social e documentos dos sócios
4. **O cadastro entra em análise** — o status muda para `IN_REVIEW`; a análise pode levar até 72h
5. **Aprovação ou rejeição** — acompanhe por [webhook](./webhooks-por-conta.md) (`ACCOUNT_REGISTER_APPROVED` / `_REJECTED` / `_PENDING`) ou [consultando o cadastro](./kyc/api-account-register-get.mdx)

## O que você envia na API

| Campo                     | Obrigatório | Descrição                                                                |
| ------------------------- | ----------- | ------------------------------------------------------------------------ |
| `taxID`                   | sim         | CNPJ da empresa do seu cliente, com ou sem máscara                       |
| `correlationID`           | não         | Identificador único para idempotência; sem ele, o CNPJ assume esse papel |
| `representatives[].taxID` | não         | CPFs dos sócios/representantes, para adiantar o preenchimento            |

Os demais dados — razão social, nome fantasia e nomes dos sócios — são preenchidos automaticamente pelo enriquecimento de dados quando disponíveis, e confirmados pelo cliente na tela de onboarding.

## O que o seu cliente precisa ter em mãos

Orientar o cliente antes de enviar o link acelera a aprovação. No formulário, ele vai precisar de:

### Documentos dos representantes (sócios/administradores)

| Documento      | Descrição                          |
| -------------- | ---------------------------------- |
| Foto de perfil | Selfie do representante            |
| CNH            | Completa, ou frente e verso        |
| RG             | Frente e verso (alternativa à CNH) |

Cada representante precisa da **foto de perfil mais uma identificação válida** (CNH ou RG).

### Documentos da empresa

| Documento         | Quem precisa       |
| ----------------- | ------------------ |
| Contrato social   | ONG, Igreja e LTDA |
| Estatuto          | ONG, Igreja e LTDA |
| Ata da assembleia | LTDA               |

**MEI** não precisa de documentos da empresa — apenas os dos sócios.

### Dados cadastrais

- Razão social, nome fantasia e CNPJ (ativo)
- Endereço comercial
- Website ou principal canal de vendas
- Produtos/serviços oferecidos, tempo de mercado e objetivo ao usar a conta

## Boas práticas que aceleram a aprovação

- Arquivos de até **10 MB**, legíveis, coloridos e sem cortes
- Dados idênticos aos registrados na Receita Federal (razão social, endereço, quadro societário)
- CNPJ ativo e representantes com CPF regular

Atividades ilegais não são permitidas.

## O que acontece na análise

Com a documentação completa, o cadastro entra em análise pelo time da Woovi. Recusas comuns: documentação inválida ou ilegível, divergência de dados cadastrais, CNPJ inativo e restrições de perfil de risco.

Se o cadastro voltar para `PENDING`, o seu cliente pode reabrir o mesmo `linkOnboarding` para corrigir os dados — e você acompanha tudo por [webhook](./webhooks-por-conta.md) ou pelo endpoint de [consulta do KYC](./kyc/api-account-register-get.mdx).
