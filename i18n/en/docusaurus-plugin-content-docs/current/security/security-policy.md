---
id: security-policy
title: Security Policy
tags:
- security
- policy
---

*Version: April 2021*

*Document history*

| Date  | Description | Author | Reviewers |
| -  | - | - | - |
| April 2021 | Software development guidelines moved to a dedicated document | RAT | SIBS |
| March 2021 | Supplier Policy review | DNS | RAT, SIBS |
| January 2021 | First version | RAT | RAT, SIBS |

## Objective
This document describes the security policy adopted across the entire organization. This policy applies to Employees, Customers, Users, Suppliers, Systems, Infrastructure, Products and Services. This policy aims to protect the data of all Stakeholders.

## Security principles that guide us:

**1. SECURITY IS NOT NEGOTIABLE.**

**2. LOOKING AFTER SECURITY IS A CONTINUOUS ACT. A security culture must be present whenever we interact with our Customers, Users, Employees and Suppliers**

**3. SECURITY MUST BE PRESENT IN ALL OUR PRODUCTS AND SERVICES; Security must cover the entire lifecycle of our products and services, including Documentation, Code, Source Code, Tests, Messages, Analyses, Images and any infrastructure, physical or digital, used to provide services or products to our customers.**

**4. EVERYONE IS RESPONSIBLE. Everyone must look after, maintain and ensure security for our customers, users, employees, products and services.**


## Users and Passwords Policy

| Item | Description |
| - | - |
| **Unique Users** | All employees, users, customers and/or suppliers with access to systems must have unique, named access accounts. Sharing passwords is expressly forbidden. |
| **Passwords** | Passwords are mandatory to access any and all systems, whether internal or external. |
| **Strong Passwords** | Login and user registration systems must enforce strong passwords. <br/>Login systems must not block or restrict the use of password manager applications. |
| **MFA** | All systems must support [MFA]. The platform must recommend and encourage the use of [MFA] |
| **SSO** | Users of business customers can access their respective environments using [SSO]. The platform must, whenever possible, recommend, encourage and facilitate the use of [SSO]. |
| **Logs** | All access to the platforms, including failed access attempts, must be monitored. |
| **Monitoring** | Access to systems and platforms must be monitored in real time. |
| **Encryption** | Passwords must be encrypted using one-way hashes that prevent the original password from being recovered. |
| **Access segregation** | Systems must implement access levels for each user, based on [RBAC] |


## Equipment Policy

| Item | Description |
| - | - |
| **Antivirus** | All equipment must run antivirus continuously. <br/>The antivirus cannot be disabled by the user. |
| **Passwords** | Passwords are mandatory to access any and all equipment. |
| **Encryption** | Users' operating systems must use encryption on all their disks. |
| **Logs** | All access to devices, including failed access attempts, must be monitored. |

## Backend and Platforms Security Policy

| Item | Description |
| - | - |
| **Environment segregation** | Production, testing and development environments are segregated and kept apart. |
| **Restricted access** | Access to production environments must be strictly restricted to users who are properly qualified and authorized to access the backend. |
| **Monitoring** | Any and all access to the production, testing and development environments must be monitored in real time, including failures. |
| **Encryption** | All access to the platform must be encrypted. Environment data storage must be encrypted. |
| **Secure Development** | Software must be developed, tested and approved with a security culture. <br/>Secure software development has its own security guidelines: [Secure Software Development Guidelines](security-guidelines) |

## Security Policy for Cloud environments

The platform runs in the Cloud. The cloud reduces our time to market and enables rapid prototyping and controlled costs. However, the cloud is inevitably a third-party environment and must be considered an
environment that can be compromised. **Regardless of the cloud provider used, the platform's security remains our responsibility.**

### Cloud security assumptions

| Item | Description |
| - | - |
| **Zero Trust** | The cloud is just another company's server, managed by a third party. Our code must take into account that the cloud provider can, and eventually will, be compromised. |
| **Fault tolerance** | Even the best cloud provider will fail. Even the best replication scheme will fail. The platform, code, environments and systems must anticipate and protect themselves against third-party failures. |
| **Encryption** | Data must be encrypted at all times, both in transit and at rest. |

### Cloud security requirements

| Item | Description |
| - | - |
| **Encryption at rest** | Database data must be encrypted using unique encryption keys. The keys must be stored in [HSM] keys. This ensures the data cannot be read by an unauthorized person if the files are compromised.<br/><br/>With encryption at rest, databases encrypt data before storing it on disk.<br/><br/>Access to the [HSM] keys must be protected by [IAM] keys.
| **Containers** | All backend services must run in their own designated container. |
| **Code guidelines** | Software development must take into account the Cloud environment, the exposure of APIs on the Internet, and a hostile environment and users. <br/>Secure software development has its own security guidelines: [Secure Software Development Guidelines](security-guidelines) | |
| **Separation of duties** | Separation of duties and role-based access control are inherent to the cloud design.<br/><br/>Systems that run code or monitor the health and availability of the network must not be involved in creating and managing other environments. |
| **Limited access to cloud infrastructure** | Access to the cloud provider is restricted to a small number of senior developers in the company, all of them company members.<br/><br/>Developers only have access to the source code. The development environment is separate from the production environment (staging environment).<br/><br/>Code changes, whether in development, testing or production, are made only through the continuous deployment platform, so every code change can be tracked and controlled. |
| **MFA** | Human employees must use [MFA] authentication when connecting to the cloud infrastructure. |
| **IAM key management** | Each environment will use its own set of keys. Keys will be loaded directly into Kubernetes. |
| **Key rotation** | Keys must be rotated every 6 months. Key rotation is performed directly in the Kubernetes configuration environment. |

## Supplier Security Policy {#política-de-segurança-de-fornecedores}

| Item | Description |
| - | - |
| **Pre-certification** | Suppliers must be certified and validated in advance to assess their security capabilities. |
| **Same Bar** | Suppliers must meet or exceed the security bar in their internal processes and controls. |

### Backup Policy

The backup policy is defined in a dedicated document: [Backup Policy](backup-policy)


[RBAC]: https://en.wikipedia.org/wiki/Role-based_access_control
[SSO]: https://en.wikipedia.org/wiki/Single_sign-on
[MFA]: https://en.wikipedia.org/wiki/Multi-factor_authentication
[HSM]: https://en.wikipedia.org/wiki/Hardware_security_module
[IAM]: https://en.wikipedia.org/wiki/Identity_management
