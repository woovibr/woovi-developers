---
id: sdk-php-laravel-receiving-webhooks
title: Como receber webhooks em sua aplicação Laravel
tags:
  - php
  - api
  - sdk
---

## Webhooks

Webhooks permitem que uma aplicação ou serviço envie automaticamente informações ou dados para outra aplicação ou serviço sempre que um evento específico ocorre.

A API da woovi, por exemplo, pode enviar um webhook para a sua aplicação sempre que uma cobrança for paga ou cancelada, possibilitando que sua aplicação seja notificada em **tempo real** sobre essas mudanças de status.

## Como receber webhooks

Vamos seguir os seguintes passos:

### Criar a rota

Para receber os webhooks, é fundamental estabelecer um endpoint dedicado ao processamento de todas as notificações.

No contexto do Laravel, você pode criar uma nova rota, como por exemplo `/woovi/webhook`, no arquivo `routes/web.php`:

```php
use App\Http\Controllers\woovi\WebhookController;

Route::post('/woovi/webhook', [WebhookController::class, 'receive']);
```

A seguir, você pode configurar o controller responsável pelo tratamento desses webhooks:

```php
<?php

// ./app/Http/Controllers/woovi/WebhookController.php

namespace App\Http\Controllers\woovi;

use App\Models\Donation;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use woovi\PhpSdk\Client;

class WebhookController extends Controller
{
    const SIGNATURE_HEADER = "x-webhook-signature";

    const woovi_CHARGE_COMPLETED_EVENT = "woovi:CHARGE_COMPLETED";

    public function __construct(private Client $woovi)
    {
    }

    /**
     * Recebe todos os webhooks enviados pela plataforma.
     */
    public function receive(Request $request)
    {
      // ...
    }
}
```

### Como desabilitar a verificação CSRF

O CSRF no Laravel é uma medida de segurança que protege contra ataques nos quais um invasor tenta forçar um usuário autenticado a executar ações não autorizadas.

Todas as requisições `POST` devem conter um token CSRF para garantir que a ação tenha sido autorizada, inclusive para o endpoint de webhook.

Para evitar erros de CSRF, é necessário desabilitar essa verificação, adicionando o caminho da rota dos webhooks, como `/woovi/webhook`, no array `$except` do arquivo `./app/Http/Middleware/VerifyCsrfToken.php`. Por exemplo:

```php
<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        "/woovi/webhook", // Coloque aqui o caminho para a sua rota
    ];
}
```

Não se preocupe, pois isso será substituído pela verificação da assinatura dos webhooks.

### Validando a assinatura

Adicione esse método em seu controller:

```php
/**
 * Permite requisições somente a partir da woovi.
 * 
 * Caso ocorra algum erro, irá retornar uma `Response`
 * que indica um erro na validação. Ocorrendo nenhum erro,
 * irá retornar apenas `null`.
 */
private function allowRequestOnlyFromwoovi(Request $request)
{
    $rawPayload = $request->getContent();

    // self::SIGNATURE_HEADER = "x-webhook-signature"
    $signature = $request->header(self::SIGNATURE_HEADER);

    $isWebhookValid = ! empty($rawPayload)
        && ! empty($signature)
        && $this->woovi->webhooks()->isWebhookValid($rawPayload, $signature);

    if ($isWebhookValid) return null;

    return response()->json([
        "errors" => [
            [
                "message" => "Invalid webhook signature."
            ],
        ],
    ], 400);
}
```

Chamando esse método irá garantir que somente a woovi tenha webhooks processados pela sua aplicação através da [validação da assinatura de webhooks utilizando o SDK de PHP](../../resources.md#validar-um-webhook).

Veja um exemplo de chamada desse método no método `receive`:

```php
/**
 * Recebe todos os webhooks enviados pela plataforma.
 */
public function receive(Request $request)
{
  // Se retornar uma resposta, então devolvemos para
  // o cliente da requisição, que nesse caso irá ser um erro.
  if ($response = $this->allowRequestOnlyFromwoovi($request)) return $response;

  // Continuamos com o processamento...
  return $this->handleWebhook($request);
}
```

### Recebendo os dados de um webhook

É possível receber os parâmetros da requisição de webhook utilizando o método [`input`](https://laravel.com/docs/10.x/requests#retrieving-an-input-value) de uma `Request` do Laravel. Veja um exemplo:

```php
// Obtém o parâmetro `event` da requisição.
$event = $request->input("event");
```

### Validando os eventos recebidos

Durante o processamento dos webhooks, é possível validar seus tipos e encaminhá-los para métodos mais especializados, de acordo com o tipo de webhook, por exemplo.

Cada requisição irá trazer consigo um parâmetro `event` contendo o tipo do webhook. Veja algumas possibilidades de valores:

- `woovi:CHARGE_CREATED` - Nova cobrança criada.
- `woovi:CHARGE_COMPLETED` - Cobrança concluída é quando uma cobrança é totalmente paga.
- `woovi:CHARGE_EXPIRED` - Cobrança expirada é quando uma cobrança não foi totalmente paga e expirou.
- `woovi:TRANSACTION_RECEIVED` - Nova transação PIX recebida.
- `woovi:TRANSACTION_REFUND_RECEIVED` - Novo reembolso de transação PIX recebido ou reembolsado.
- `woovi:MOVEMENT_CONFIRMED` - Pagamento confirmado é quando a transação do pix referente ao pagamento é confirmada.
- `woovi:MOVEMENT_FAILED` - Falha no pagamento é quando o pagamento é aprovado e ocorre um erro.
- `woovi:MOVEMENT_REMOVED` - O pagamento foi removido por um usuário.

Assumindo que você tenha um método `handleWebhook` que recebe todos os webhooks com a assinatura validada, veja o exemplo:

```php
/**
 * Dispara o método apropriado de acordo com o tipo
 * validado do webhook.
 */
private function handleWebhook(Request $request)
{
    // Valida se o webhook é de quando uma cobrança foi paga
    // utilizando o método `isChargePaidPayload`.
    if ($this->isChargePaidPayload($request)) {
        // Dispara o método `handleChargePaidWebhook`
        // quando uma cobrança for paga.
        return $this->handleChargePaidWebhook($request);
    }

    // Valida se o webhook é de teste utilizando
    // o método `isTestPayload`.
    if ($this->isTestPayload($request)) {
        // Dispara o método `handleTestWebhook` se for um webhook de teste.
        return $this->handleTestWebhook();
    }

    return response()->json([
        "errors" => [
            [
                "message" => "Invalid webhook type.",
            ],
        ]
    ], 400);
}
```

Utilizamos o parâmetro `event` para diferenciar diante os outros tipos de webhooks:

```php
/**
 * Verifica se é o webhook de quando uma cobrança foi paga.
 */
private function isChargePaidPayload(Request $request)
{
    $event = $request->input("event");

    $allowedEvents = [
        // Indicam quais eventos são considerados como
        // uma cobrança sendo paga.

        // "woovi:CHARGE_COMPLETED"
        self::woovi_CHARGE_COMPLETED_EVENT,
        
        // "woovi:TRANSACTION_RECEIVED"
        self::woovi_TRANSACTION_RECEIVED_EVENT,
    ];

    $isChargePaidEvent = ! empty($event) && in_array($event, $allowedEvents);

    return $isChargePaidEvent
        && ! empty($request->input("charge.correlationID"));
}
```

### Webhook de teste

Ao configurar uma nova integração via webhooks na plataforma, ela enviará um webhook de teste para verificar se tudo está correto com sua aplicação.

Esse webhook de teste será enviado com o campo `event` contendo o valor especificado pelo evento selecionado na plataforma. 
Por exemplo, se você selecionar o evento `Cobrança paga`, o campo `event` será `woovi:CHARGE_COMPLETED`.

Veja como é possível verificar se um webhook é de teste:

```php
/**
 * Verifica se o webhook é do tipo de teste.
 *
 * A plataforma da woovi envia um webhook de teste
 * para validar se o receptor de webhooks está funcionando.
 */
private function isTestPayload(Request $request)
{
    $event = $request->input("event");

    return ! empty($event) && $event === self::woovi_CHARGE_COMPLETED_EVENT;
}
```

Veja um exemplo de processamento desse webhook:

```php
/**
 * Processa o webhook de teste enviado pela plataforma.
 */
private function handleTestWebhook()
{
    return response()->json(["message" => "Success."]);
}
```

### Processando um webhook

Neste exemplo abaixo, você pode ver como receber uma notificação de que uma cobrança foi paga na woovi e atualizar o status de uma doação para 'paga'.

```php
/**
 * Ativado quando uma cobrança foi paga.
 */
public function handleChargePaidWebhook(Request $request)
{
    // Obtemos o correlationID do webhook utilizando o método `input`
    // de uma `$request`.
    // Um identificador único que relaciona uma cobrança Pix com uma doação.
    $correlationID = $request->input("charge.correlationID");

    // Encontra a doação a partir do correlationID da cobrança.
    $donation = Donation::where("correlationID", $correlationID)->first();

    // Verifica se essa doação existe.
    if (empty($donation)) {
        return response()->json([
            "errors" => [
                [
                    "message" => "Donation not found.",
                ],
            ],
        ], 404);
    }

    // Atualiza o status da doação para paga.
    $donation->status = "PAID";
    $donation->save();

    // Retorna uma resposta 200 para a plataforma woovi.
    return response()->json(["message" => "Success."]);
}
```

## Exemplo de integração com webhooks

Temos um exemplo completo do controller que recebe webhooks [nesse arquivo](https://github.com/Open-Pix/laravel-backend-integration/blob/623baa803e501c5bbd75f19ad43a3b61e205c534/app/Http/Controllers/WebhookController.php).

Veja mais exemplos de integração com Laravel em [nosso repositório](https://github.com/Open-Pix/laravel-backend-integration).
