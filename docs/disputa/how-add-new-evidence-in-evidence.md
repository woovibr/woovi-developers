---
id: how-add-new-evidence-in-dispute
title: Como adicionar uma nova evidência em uma disputa?
tags:
  - disputa
---

Quando se está respondendo ou iniciando uma disputa, é possível enviar documentos que serão usados como evidências e provas de que o seu argumento é válido e coerente, serve tanto para defesa quanto para quem contesta.

Para enviar evidências para uma disputa, basta seguir os seguintes passos:

### 1. Obter o id da disputa
  * Entre na plataforma e crie um webhook para o evento "OPENPIX:DISPUTE_CREATED".
  * No payload do evento, obtém-se o id da disputa.
 ```JSON
{
  "event": "OPENPIX:DISPUTE_CREATED",
  "dispute": {
    "status": "<status>",
    "endToEndId": "<endToEndId>",
    "id": "<IdDisputa>"
  }
}
 ```

### 2. Fazer upload do documento

Você tem duas formas de enviar o documento, e cada uma alimenta um campo diferente no passo 3. Envie **`url` ou `fileId`, nunca os dois** no mesmo documento.

| Forma | Campo no passo 3 | Quando usar |
| --- | --- | --- |
| [Endpoint de arquivos da Woovi](../arquivos/upload-de-arquivo.md), com `purpose` `DISPUTE_EVIDENCE` | `fileId` (o `file.id` do retorno) | Recomendado. Você não precisa hospedar o arquivo nem expor uma URL pública. Exige a feature `DISPUTE_EVIDENCE_FILE_ID` na sua conta. |
| Provedor de arquivos de sua preferência | `url` | Quando você já tem uma URL pública de onde a Woovi consegue baixar o documento. |

### 3. Fazer requisição para envio de evidencia
  * Utilize a chave de API para autenticar a requisição.
  * Faça a requisição.

Enviando por `fileId`:

 ```JSON
    curl -X POST "https://api.woovi.com/api/v1/dispute/:IdDisputa/evidence \
      -H "Authorization: <apiKey>" \
      -H "Content-Type: application/json" 
        --data-raw '
{
    "documents": [
      {
        "fileId": "<idDoArquivo>",
        "description": "<discription>",
        "correlationID": "<correlationID>"
      }
    ]
}'
 ```

Enviando por `url`:

 ```JSON
    curl -X POST "https://api.woovi.com/api/v1/dispute/:IdDisputa/evidence \
      -H "Authorization: <apiKey>" \
      -H "Content-Type: application/json" 
        --data-raw '
{
    "documents": [
      {
        "url": "<urlDocumento>",
        "description": "<discription>",
        "correlationID": "<correlationID>"
      }
    ]
}'
 ```

### 4. Entendendo o retorno
  * Caso tudo ocorra corretamente, um código 200 será retornado.
  * No corpo da resposta terá:
 ```JSON
{
    "documents": [
      {
        "url": "<urlParaVisualizarDocumento>",
        "fileId": "<idDoArquivo>",
        "description": "<discription>",
        "correlationID": "<correlationID>"
        "createdAt": "<now>"
      }
    ]
}'
 ```

O `fileId` só volta no retorno quando o documento foi enviado por `fileId`.

OBS: ao finalizar o processamento da requisição, é gerada uma nova url para download, isso se deve ao fato de usarmos a url presente no corpo da requisição para fazer o download dos seus documentos e imediatamente em seguida é realizado o upload novamente em um servidor próprio, nós disponibilizamos essa url no payload do response, logo se tudo der certo, a url que é enviada no corpo da request é diferente da url que é obtida no response.

### Erro ao enviar por `fileId`

Se a sua conta não tem a feature `DISPUTE_EVIDENCE_FILE_ID`, a requisição responde `403`:

 ```JSON
{
  "error": "Your account does not have the permission to send a evidence by fileId",
  "errorCode": "DISPUTE_EVIDENCE_FILE_ID_NOT_ALLOWED"
}
 ```

Nesse caso, envie o documento por `url` ou fale com o suporte para liberar a feature.


## Casos de Uso

- Resposta de Disputa

