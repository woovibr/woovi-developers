---
id: pix-automatic-state-machine
sidebar_position: 5
title: Máquina de Estados do Pix Automático
tags:
  - pix-automatic
  - api
---

### Assinatura (Subscription)

A assinatura é a entidade mais abrangente, no caso do pix automático, o seu tipo é `PIX_RECURRING`. A assinatura poderá ter os seguintes status:

- `ACTIVE`: Assinatura ativa e criando novas parcelas nas datas pré definidas.
- `COMPLETED`: Assinatura concluída e não criará novas parcelas. (Especificadamente quando a assinatura tem uma data final).
- `EXPIRED`: Possui uma parcela que foi expirada
- `INACTIVE`: Assinartura cancelada

```mermaid
flowchart LR
    A[ACTIVE] -->B(COMPLETED)
    A[ACTIVE] -->C(INACTIVE)
```

### Pix Automático (PixRecurring)

Quando a assinatura é do tipo `PIX_RECURRING`, ela terá um novo status dentro do objeto `pixRecurring`. Isso é necessário porque o status do Pix Automático é alterado de mandeira independente da assinatura.

O status sempre se inicia com `CREATED`, após o consumidor aprovar o QR Code no aplcativo do banco ele muda de status para `APPROVED`, nesse cenário, ele já comecará a criar as cobranças.

Caso o consumidor deseja cancelar a assinatura, ele pode cancelar a qualquer momento no aplicativo do banco. Nesse caso ele mudará de status para `REJECTED`.

Caso você deseja cancelar a assinatura, o status irá ser alterado para `CANCELED`.

- `CREATED`: Status padrão de quando é criado 
- `APPROVED`: Aprovado pelo consumidor e poderá ser criado as cobranças
- `CANCELED`: Cancelado pelo usuário
- `REJECTED`: Autorização removida pelo consumidor

```mermaid
flowchart LR
    A[CREATED] -->B(APPROVED)
    B[APPROVED] -->C(REJECTED)
    B[APPROVED] -->D(CANCELED)
```


### Parcela (Installment)

- `SCHEDULED`: Status padrão de quando é criada. Esse status significa que ela está agendada, e sua cobrança ocorerá na data prevista.
- `ACTIVE`: Ela é movida para esse status após estar agendada. Nesse status a COBR já foi criada e aprovado pelo banco do consumidor.
- `COMPLETED`: Quando o usuário pagou a cobrança que está relacionada
- `EXPIRED`: Quando a cobrança passou do prazo de vencimento e não teve pagamento
- `CANCELED`: Quando a parcela foi cancelada, pode ocorrer manualmente ou devido a um erro ao gerar a cobrança

As primeiras parcelas são geradas junto com a assinatura, com a data prevista definida pelo `dayGenerateCharge` com o status `SCHEDULED`. Em caso de assinatura mensal, elas são geradas sempre no mesmo dia, se ela for criada no dia 31 e o próximo mês não tiver essa data, ela será ajustada para o último dia do mês.

```mermaid
flowchart LR
    A[SCHEDULED] -->B(ACTIVE)
    B[ACTIVE] -->C(COMPLETED)
    B[ACTIVE] -->D(EXPIRED)
    B[ACTIVE] -->E(CANCELED)
```

### Cobrança Recorrente (CobR) 

As cobranças que serão criadas para debitar automaticamente do cliente.

Por padrão ele é criado 4 dias antes da data de cobrança. Após ser criado, é feita uma requisição para o banco do consumidor para ele ser aprovado ou rejeitado.

- `CREATED`: Status padrão de quando é criada
- `ACTIVE`: Cobrança aceita pelo banco do consumidor
- `CONCLUDED`: Cobrança realizada com sucesso
- `FAILED_TRY`: Tentativa de cobrança falhou
- `REJECTED`: Cobrança rejeitada pelo banco do consumidor, ela só mudará para esse status em duas situações: 
    - Após uma tentativa falhar e a cobrança atingir sua data de expiração, caso o retryPolicy seja `THREE_RETRIES_7_DAYS`
    - Após uma tentativa falhar e a cobrança não ser paga na data determinada, caso o retryPolicy seja `NON_PERMITED` 
- `CANCELED`: Cobrança cancelada 

```mermaid
flowchart LR
    A[CREATED] -->B(ACTIVE)
    A[CREATED] --> F[FAILED_TRY]
    F[FAILED_TRY] --> D(REJECTED)
    B[ACTIVE] -->C(CONCLUDED)
    B[ACTIVE] -->E(CANCELED)
```

### Retentativa Cobrança Recorrente (CobRTry) 

Sempre que uma cobrança for criada, também será criada uma tentativa de cobrança, caso ela falhe, dependendo da opção definida na assinatura (`retryPolicy`), poderão ser feitas novas tentativas de cobrança.

Cada retentativa possui um status próprio, somente é possível realizar uma nova retentativa caso a última seja rejeitada

- `REQUESTED`: Status padrão de quando é criada, simboliza que foi feito uma nova tentativa de cobrança
- `SCHEDULED`: Quando a tentativa de cobrança é aceita com sucesso pelo banco
- `PAID`: Quando a tentativa de cobrança é paga pelo banco
- `REJECTED`: Quando a tentativa de cobrança é rejeitada pelo banco, nessa situação poderão ser feitas novas tentativas

```mermaid
flowchart LR
    A[REQUESTED] -->B(SCHEDULED)
    B[SCHEDULED] -->C(PAID)
    A[REQUESTED] -->D(REJECTED)
```