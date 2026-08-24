---
id: upload-de-arquivo
title: Como fazer upload de um arquivo?
tags:
  - api
  - arquivos
---

O endpoint de arquivos guarda um arquivo na Woovi e devolve os metadados dele junto com uma URL de download temporária. Use esse arquivo em outras APIs da Woovi que consomem documentos, como a [evidência de uma disputa](../disputa/how-add-new-evidence-in-evidence.md), sem precisar hospedar o arquivo por conta própria.

## Requisitos

- Um AppID com o escopo `FILE_POST` ([como adicionar escopos](../apis/api-scopes.md)).
- Um arquivo por requisição, de até 10 MiB (`10485760` bytes).
- Content type entre `application/pdf`, `image/png`, `image/jpeg` e `image/webp`. Os bytes iniciais do arquivo precisam bater com o content type declarado.

## 1. Fazer a requisição

O arquivo é enviado como `multipart/form-data` no campo `file`, junto com o `purpose`, que descreve para que o arquivo serve.

```bash
curl -X POST "https://api.woovi.com/api/v1/files" \
  -H "Authorization: <appID>" \
  -F "file=@evidence.png" \
  -F "purpose=DISPUTE_EVIDENCE" \
  -F "correlationID=evidence-2026-08-1042"
```

| Campo           | Obrigatório | Descrição                                                                                     |
| --------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `file`          | Sim         | O arquivo em si.                                                                                |
| `purpose`       | Sim         | Para que o arquivo será usado. Hoje aceita `DISPUTE_EVIDENCE`.                                  |
| `correlationID` | Não         | Seu identificador para o upload. Quando não enviado, um UUID é gerado para você.                |

## 2. Entendendo o retorno

Um upload novo responde `201`:

```json
{
  "file": {
    "id": "6712c2ac7c2f1e0012a4b8d1",
    "correlationID": "evidence-2026-08-1042",
    "purpose": "DISPUTE_EVIDENCE",
    "fileName": "evidence.png",
    "contentType": "image/png",
    "size": 20480,
    "url": "https://woovi-files.s3.amazonaws.com/company/6712c1f07c2f1e0012a4b8c9/dispute_evidence/6712c2ac7c2f1e0012a4b8d1?X-Amz-Signature=...",
    "urlExpiresAt": "2026-08-22T15:30:00.000Z",
    "createdAt": "2026-08-22T14:30:00.000Z"
  }
}
```

A `url` é pré-assinada e para de funcionar em `urlExpiresAt`. Peça o arquivo novamente para obter uma URL nova.

## Repetindo a requisição com segurança

Quando você envia um `correlationID`, repetir a requisição com o mesmo `correlationID` e o mesmo `purpose` devolve o arquivo já armazenado com status `200`, em vez de subir uma segunda cópia. Isso torna o envio seguro para retentativa.

Sem `correlationID`, cada chamada gera um novo arquivo.

## Erros

| Código | Quando acontece                                                                                     |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `400`  | `purpose` desconhecido, `correlationID` vazio, campo `file` ausente ou mais de um arquivo enviado.      |
| `401`  | Credenciais ausentes ou inválidas.                                                                     |
| `403`  | A aplicação não tem o escopo `FILE_POST`.                                                              |
| `413`  | Arquivo maior que o tamanho máximo aceito.                                                             |
| `415`  | Content type fora da lista permitida, ou bytes iniciais que não batem com o content type declarado.    |
| `502`  | O arquivo não pôde ser armazenado. A requisição pode ser repetida.                                     |

O corpo do erro traz a mensagem no idioma da empresa que fez a requisição (pt-BR, en ou es):

```json
{
  "error": "Invalid value for the field purpose"
}
```

## Usando o arquivo em outra API

Pegue o `file.id` do retorno e envie no campo correspondente da API que vai consumir o documento. Para disputas, ele vai no `fileId` de cada item de `documents` em `POST /api/v1/dispute/:id/evidence` — veja [Como adicionar uma nova evidência em uma disputa?](../disputa/how-add-new-evidence-in-evidence.md).

## Casos de Uso

- Envio de evidências de disputa
