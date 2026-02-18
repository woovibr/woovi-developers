---
id: pix-api-errors
sidebar_position: 20
title: Erros
tags:
  - pix-automatic
  - api
---

## Erros relacionados a Cobrança

Ao gerar uma cobrança podem ocorrer diversos erros. Segue abaixo a listagem de todos os possíveis erros que podem ocorrer.


| Código | Motivo | Descrição |
|--------|--------|-----------|
| RJCT | Instrução de pagamento rejeitada pelo participante do usuário pagador. | Instrução de pagamento rejeitada pelo participante do usuário pagador. |
| AB10 | Transação interrompida devido a erro no participante do usuário pagador. | Transação interrompida devido a erro no participante do usuário pagador. |
| AC05 | Conta transacional do usuário pagador encerrada. | Conta transacional do usuário pagador encerrada. |
| AC06 | Conta transacional do usuário pagador encontra-se bloqueada. | Conta transacional do usuário pagador encontra-se bloqueada. |
| AG12 | Não é permitida solicitação de agendamento entre contas da mesma instituição. | Não é permitida solicitação de agendamento (pain.013) cujos recursos sejam transferidos de uma conta transacional para outra em uma mesma instituição participante ou entre participantes que utilizem o serviço de liquidação de um mesmo participante liquidante no SPI. |
| AM02 | Valor da cobrança ultrapassa o valor máximo estabelecido pelo usuário pagador. | Valor da cobrança ultrapassa o valor máximo estabelecido pelo usuário pagador. |
| AM09 | Valor da cobrança não corresponde ao valor estabelecido na recorrência. | Valor da cobrança não corresponde ao valor estabelecido na recorrência. |
| CRNC | CNPJ do usuário recebedor não corresponde ao dado da recorrência. | CNPJ do usuário recebedor informado na pain.013 não corresponde com o dado de identificação contida na recorrência. |
| DENC | CPF/CNPJ do usuário pagador não corresponde ao dado contido na recorrência/autorização. | CPF/CNPJ do usuário pagador não corresponde ao dado contido na recorrência/autorização. |
| DS27 | Participante não se encontra cadastrado ou ainda não iniciou a operação no SPI. | Participante não se encontra cadastrado ou ainda não iniciou a operação no SPI. |
| DTED | Divergência entre a data de vencimento informada e a periodicidade da recorrência e/ou as regras do produto. | Divergência entre a data de vencimento informada e a periodicidade da recorrência e/ou as regras do produto. |
| EXPR | Cobrança falhou devido a falta de saldo. | Cobrança falhou devido a falta de saldo na conta do usuário pagador. |
| DTNT | Novas tentativas de agendamento em desacordo com o limite de dias definido na regra de negócio. | Novas tentativas de agendamento pós vencimento em desacordo com o limite de dias definido na regra de negócio (a partir de D+8, considerando D0, a data do vencimento). |
| FCD1 | Pain.013 recebida com mais de 10 dias de antecedência da data prevista para a liquidação. | Pain.013 recebida com mais de 10 dias de antecedência da data prevista para a liquidação, em descumprimento às regras do negócio. |
| FCD2 | Pain.013 recebida com menos de 2 dias de antecedência da data prevista para a liquidação. | Pain.013 recebida com menos de 2 dias de antecedência da data prevista para a liquidação, em descumprimento às regras do negócio. |
| GRER | Motivo do erro genérico/diverso. | Motivo do erro genérico/diverso, utilizado apenas quando não houver outro domínio aplicável. |
| IRNT | Cobrança recorrente não permite novas tentativas de agendamento. | Cobrança recorrente não permite novas tentativas de agendamento pós vencimento (idRecorrencia com característica que não permite novas tentativas). |
| MIDI | idRecorrencia inexistente ou incorreto. | idRecorrencia inexistente ou incorreto. |
| MSUC | statusRecorrencia diferente de "CFDB" (confirmado pelo usuário pagador). | statusRecorrencia diferente de "CFDB" (confirmado pelo usuário pagador). |
| NIEC | Nova instrução de pagamento inválida, ordem de pagamento ainda pendente de envio ao SPI. | Nova instrução de pagamento inválida pois a mesma cobrança já possui ordem de pagamento agendada ainda pendente de envio ao SPI para liquidação. |
| NIPA | Nova instrução de pagamento inválida, pagamento já foi efetivado. | Nova instrução de pagamento inválida, pagamento já foi efetivado. |
| NITX | Nova instrução de pagamento não corresponde a uma cobrança recorrente gerada anteriormente. | Nova instrução de pagamento não corresponde a uma cobrança recorrente gerada anteriormente (IdConciliacaoDoRecebedor diferentes). Utilizada somente para as finalidades de agendamento 'NTAG' e 'RIFL'. |
| QUNT | Quantidade de novas tentativas de agendamento excede o limite definido pela regra de negócio. | Quantidade de novas tentativas de agendamento pós vencimento excede o limite definido pela regra de negócio (mais de 3 tentativas em intervalo de 7 dias após o vencimento, considerando D0, a data do vencimento). |
| RC09 | ISPB do participante do usuário pagador inválido ou inexistente. | ISPB do participante do usuário pagador inválido ou inexistente. |
| UDEI | CPF/CNPJ do devedor incorreto. | CPF/CNPJ do devedor incorreto. |

## Erros relacionados a Cancelamento de Agendamento

| Código | Motivo | Descrição |
|--------|--------|-----------|
| ACCT | Encerramento de conta transacional | Cancelamento do agendamento decorrente de encerramento da conta transacional do usuário pagador ou do usuário recebedor |
| BLCK | Bloqueio de conta transacional | Cancelamento do agendamento decorrente de bloqueio da conta transacional do usuário pagador ou do usuário recebedor |
| CCLD | Cancelamento da autorização para pagamentos periódicos | Cancelamento do agendamento decorrente do cancelamento da autorização para pagamentos periódicos |
| FAIL | Falha ou erro na liquidação | Cancelamento do agendamento por falha ou erro no fluxo de liquidação |
| OTHR | Cancelamento por outros motivos | Cancelamento de agendamento solicitado pelo participante do usuário pagador ou pelo participante do usuário recebedor, decorrente de outros motivos |
| SLBD | Solicitado pelo usuário pagador. | Cancelamento de agendamento solicitado pelo usuário pagador |
| SLCR | Solicitado pelo usuário recebedor. | Cancelamento de agendamento solicitado pelo usuário recebedor |
