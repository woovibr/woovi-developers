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
| AB10 | ErrorInstructedAgent | Transação interrompida devido a erro no participante do usuário pagador. |
| AC05 | ClosedDebtorAccountNumber | Conta transacional do usuário pagador encerrada. |
| AC06 | BlockedAccount | Conta transacional do usuário pagador encontra-se bloqueada. |
| AG12 | NotAllowedBookTransfer | Não é permitida solicitação de agendamento (pain.013) cujos recursos sejam transferidos de uma conta transacional para outra em uma mesma instituição participante ou entre participantes que utilizem o serviço de liquidação de um mesmo participante liquidante no SPI. |
| AM02 | NotAllowedAmount | Valor da cobrança ultrapassa o valor máximo estabelecido pelo usuário pagador. |
| AM09 | WrongAmount | Valor da cobrança não corresponde ao valor estabelecido na recorrência. |
| DENC | DebtorIdentifierNotCorrespond | CPF/CNPJ do usuário pagador não corresponde ao dado contido na recorrência/autorização. |
| DS27 | UserNotYetActivated | Participante não se encontra cadastrado ou ainda não iniciou a operação no SPI. |
| DTED | InvalidExpiryDate | Divergência entre a data de vencimento informada e a periodicidade da recorrência e/ou as regras do produto. |
| DTNT | Novas tentativas de agendamento em desacordo com o limite de dias definido na regra de negócio | Novas tentativas de agendamento pós vencimento em desacordo com o limite de dias definido na regra de negócio (a partir de D+8, considerando D0, a data do vencimento). |
| FBRD | FailureToComplyBusinessRuleDeadline | Pain.013 recebida fora do prazo para cumprimento das regras do negócio. |
| IRNT | Cobrança recorrente não permite novas tentativas de agendamento | Cobrança recorrente não permite novas tentativas de agendamento pós vencimento (idRecorrencia com característica que não permite novas tentativas). |
| MIDI | MandateIdIncorrect | idRecorrencia inexistente ou incorreto. |
| MSUC | UnconfirmedMandateStatus | statusRecorrencia diferente de "CFDB" (confirmado pelo usuário pagador). |
| NIEC | Nova instrução de pagamento inválida, ordem de pagamento referente à instrução anterior ainda pendente de envio ao SPI. | Nova instrução de pagamento inválida pois a mesma cobrança já possui ordem de pagamento agendada ainda pendente de envio ao SPI para liquidação. |
| NIPA | Nova instrução de pagamento inválida, pagamento já foi efetivado. | Nova instrução de pagamento inválida, pagamento já foi efetivado. |
| NITX | Nova instrução de pagamento não corresponde a uma cobrança recorrente gerada anteriormente. | Nova instrução de pagamento não corresponde a uma cobrança recorrente gerada anteriormente (IdConciliacaoDoRecebedor diferentes). Utilizada somente para as finalidades de agendamento 'NTAG' e 'RIFL'. |
| QUNT | Quantidade de novas tentativas de agendamento excede o limite definido pela regra de negócio | Quantidade de novas tentativas de agendamento pós vencimento excede o limite definido pela regra de negócio (mais de 3 tentativas em intervalo de 7 dias após o vencimento, considerando D0, a data do vencimento). |
| RC09 | InvalidDebtorClearingSystemMemberIdentifier | ISPB do participante do usuário pagador inválido ou inexistente. |
| UDEI | UltimateDebtorIdentifierIncorrect | CPF/CNPJ do devedor incorreto. |


