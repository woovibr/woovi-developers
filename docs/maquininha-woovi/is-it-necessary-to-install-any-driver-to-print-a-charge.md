---
id: is-it-necessary-to-install-any-driver-to-print-a-charge
sidebar_position: 3
title: É necessário instalar algum driver para imprimir uma cobrança?
description: Quando é preciso instalar drivers para imprimir cobranças com a Maquininha Woovi no macOS e no Windows, com links dos drivers dos modelos recomendados.
tags:
  - pix
  - maquininha-woovi
  - impressora
  - impressora termica
  - imprimir
---

Depende do sistema operacional. No macOS, não: conecte a impressora e imprima. No Windows, sim: instale o driver da sua impressora e, se ela não conectar pelo navegador, reinstale o driver USB com o Zadig (WinUSB). No Linux, a Maquininha Woovi ainda não é suportada.

## macOS

Não é necessário instalar driver. Conecte a impressora e imprima normalmente.

## Windows

Para conectar sua impressora à plataforma, instale o driver do seu modelo.

Aqui estão os links dos drivers dos modelos que recomendamos ([veja as impressoras recomendadas](https://woovi.com/en/articles/maquininhas/)):

| Modelo | Drivers |
| --- | --- |
| EPSON TM-T20X | https://epson.com.br/Suporte/Ponto-de-venda/Impressoras-de-recibos/Epson-TM-T20x/s/SPT_C31CH26031 |
| Jetway JP-800 | http://www.jetway.com.br/suporte-e-downloads/ |
| MP-4200 TH (Bematech) | https://www.bztech.com.br/downloads/driver-bematech-mp-4200 |
| Haiz HZ-5809DD | Bluetooth: imprima pelo botão **Imprimir na maquininha via Bluetooth** (Chrome, Edge ou Opera). Driver: consulte o site do fabricante. |

Caso você já tenha os drivers instalados e não tenha obtido êxito ao conectar seu dispositivo, você pode utilizar o [Zadig](https://zadig.akeo.ie/) para reinstalar o driver USB do seu dispositivo.

### Como utilizar o Zadig

1. Entre no site https://zadig.akeo.ie/ e faça o download da última versão
2. Abra o Zadig
3. Clique em `Options` no menu superior

4. Marque a opção `List All Devices`

![Zadig: opção List All Devices](/img/thermal-printer/zadig-step-1.png)

5. Depois selecione seu dispositivo

![Zadig: seleção do dispositivo](/img/thermal-printer/zadig-step-2.png)

6. Selecione o driver `WinUSB`
7. Clique em `Reinstall Driver`

![Zadig: reinstalação do driver WinUSB](/img/thermal-printer/zadig-step-3.png)

## Linux

A Maquininha Woovi ainda não é suportada no Linux.
