---
id: pix-automatic-state-machine
sidebar_position: 4
title: Máquina de Estados do Pix Automático
tags:
  - pix-automatic
  - api
---

### Assinatura (Subscription)

A assinatura é a entidade mais abrangente, que pode ser do tipo `PIX_RECURRING`. A assinatura poderá ter os seguintes status:

- `ACTIVE`: Assinatura ativa e criando novas parcelas nas datas pré definidas.
- `COMPLETED`: Assinatura concluída e não criará novas parcelas. (Especificadamente quando a assinatura tem uma data final).
- `OVERDUE`: Possui uma cobrança que foi não foi paga.
- `EXPIRED`: Todas as cobranças foram expiradas
- `INACTIVE`: Assinartura cancelada

### Pix Recurring

Quando a assinatura é do tipo `PIX_RECURRING`, ela terá um novo status dentro do objeto `pix_recurring`. Isso é necessário porque o status do Pix Automático é alterado de mandeira independente da assinatura.

Caso o Pix Recurring seja cancelado ou rejeitado. Ainda é possível cobrar a assinatura da maneira tradicional, sem o débito automático da conta. As parcelas serão enviadas por email e whatsapp.

- `CREATED`: Status padrão de quando é criado 
- `APPROVED`: Aprovado pelo consumidor e poderá ser criado as cobranças
- `CANCELED`: Cancelado pelo usuário
- `REJECTED`: Autorização removida pelo consumidor

### COBR (Cobrança Recorrente)

As cobranças serão criadas para efetuar o débito automático.

- `CREATED`: Status padrão de quando é criada
- `ACTIVE`: Cobrança aceita pelo banco do consumidor
- `CONCLUDED`: Cobrança realizada com sucesso
- `REJECTED`: Cobrança rejeitada pelo banco do consumidor
- `CANCELED`: Cobrança rejeitada