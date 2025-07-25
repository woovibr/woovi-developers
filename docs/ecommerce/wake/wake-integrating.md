---
id: wake-integrating
title: Integrando Wake na woovi
sidebar_position: 0
tags:
  - ecommerce
  - wake
---

:::caution Atenção
Este documento espera que você já tenha um ambiente Wake, e uma conta criada na woovi
:::

## Plugin Pix para Wake

### 1. Acesse a configuração da Wake

Entre na plataforma da woovi e [clique aqui](https://app.woovi.com/home/applications/wake/add) ou vá em `API/Plugins` > `Plugin Wake` > `Adicionar`

![1](./__assets__/wake-integrating-1.png)

### 2. Acesse a configuração da Wake na woovi

![2](./__assets__/wake-integrating-2.png)

### 2.1. Copie o App ID gerado

![3](./__assets__/wake-integrating-3.png)

### 3. Acesse o dashboard do seu ADMIN dentro da Wake

![4](./__assets__/wake-integrating-4.png)

### 4. Vá até `Pagamentos > Conectores de Pagamento F-Gateway`

![5](./__assets__/wake-integrating-5.png)

### 5. Procure a opção Custom

### 6. Clique em `Adicionar configuração`

![6](./__assets__/wake-integrating-6.png)

### 7. Preencha com as seguintes informações

![7](./__assets__/wake-integrating-7.png)

Depois de preencher, adicione a configuração.

### 8. Vá para a configuração que você acabou de criar e preencha as seguintes informações:

- Configuração do Endpoint de Pagamento: https://api.woovi.com/api/wake
- Versão: Completa
- Headers:
  - paymentType: pix
  - appID: Coloque o AppID que você gerou na etapa [2.1](#21-copie-o-app-id-gerado)

![8](./__assets__/wake-integrating-8.png)

### 9. Vá até `Pagamentos > Grupos e Parcelamentos`

![9](./__assets__/wake-integrating-9.png)

### 10. Crie um novo grupo

![10](./__assets__/wake-integrating-10.png)

### 11. Preencha com as seguintes informações

![11](./__assets__/wake-integrating-11.png)

### 12. Após salvar, volte em `Pagamentos > Grupos e Parcelamentos`

### 13. Vincule a forma de pagamento que você criou anteriormente

![12](./__assets__/wake-integrating-12.png)

![13](./__assets__/wake-integrating-13.png)

![14](./__assets__/wake-integrating-14.png)

![15](./__assets__/wake-integrating-15.png)

### 14. Vá `Pagamentos > Estrutura de pagamentos`

![16](./__assets__/wake-integrating-16.png)

### 15. Crie uma nova estrutura

![17](./__assets__/wake-integrating-17.png)

![18](./__assets__/wake-integrating-18.png)

### 16. Configure o grupo de pagamento que você acabou de criar nessa nova estrutura

![19](./__assets__/wake-integrating-19.png)

### 17. Salve a estrutura

![20](./__assets__/wake-integrating-20.png)

Pronto, o método de pagamento Pix da woovi está configurado na sua Wake!
