---
type: meta
entity: people-index
updated: 2026-04-11
updated_by: Claude
status: active
tags: [meta/index, domain/family, entity/person]
aliases: [People, Contacts, Social Circle, Dossiers]
related: [FAMILY, ALTON, BUSINESS]
---

# People

Dossiers and contact cards for people in the Sartor orbit. Each person or family unit with enough context gets their own page. Peripheral contacts (school staff, service providers, kids' friends) are indexed here and detailed in the relevant domain page.

## Extended Family

- [[amarkanth]] — Aneeta's father. Regular childcare for the kids (school pickup). Aging; current help is described as temporary. Paid for the India flights (Mar 2026). Lives locally.
- **Beth + Paxton** — nieces/nephews: Emerson, Olivia (from Keep)
- **Ann Clair** — nieces/nephews: Virginia, Logan, Ann Elizabeth (from Keep)
- **Abby** — Alton's sister. Birthday: April 16.
- **Uncle Brad** — birthday: April 20.

## Professional Contacts (active relationships)

- [[jonathan-francis]] — CPA at Francis & Company. Handles personal 1040 + Solar Inference LLC 1065. Does NOT handle Sante Total.
- [[doug-paige]] — Solar roof installer at Lucent Energy Management. $219K released, installation stalled. Primary contact for the solar project.
- [[barbara-weis]] — Sante Total board member/contact. Requested 2024 990-N for grant application. Sent 2026-04-07.
- [[andy-stecker]] — Crawford Thomas Recruiting. CPSO lead, first contact 2026-03-17, went cold. Decision needed.
- [[alison-smith]] — Sante Total co-director, LSUHSC. 830 Audubon St, NOLA 70118. Sent tax receipt to Anna Smyke 2026-03-10.
- **Alyssa** — Berman Home Systems. WiFi upgrade install 2026-04-27 to 2026-04-29. alyssa@bermanhomesystems.com.

## Disney Trip Families (July 2026, Disneyland)

- **Smith / Alison** — co-planning the Disney trip
- **Kim Tran**
- **Brucker**
- **Perera**
- **Nicole**

> [!todo]
> Disney trip coordination details are in Google Messages — need to scrape that conversation for dates, hotel, flights, who's handling what. Alton flagged this as a to-do item on 2026-04-10.

## Kids' Friends (by birthday / event)

| Name | Connection | Birthday / Event | Source |
|------|-----------|-----------------|--------|
| Zoe | Vishala/Vayu friend | Party Apr 12, Sky Zone Wayne NJ | Calendar |
| Rafi | Vayu friend | Party Apr 18, Yankees game | Calendar |
| Oliver | Family friend | Birthday Apr 7 | Calendar |
| Oren | Family friend | Birthday Apr 25 | Calendar |
| Ini | Family friend | Birthday May 2 | Calendar |
| Anjali | Family friend | Birthday May 8 | Calendar |

## School Contacts

### MKA (Montclair Kimberley Academy)

| Name | Role | Email | Notes |
|------|------|-------|-------|
| Shanie Israel | Dean of Community Life | sisrael@mka.org | Vayu middle school transition |
| Kelley Arau | Dean of Student Life (primary) | karau@mka.org | Vishala's primary school |
| Rachael Masters | Staff | rmasters@mka.org | Vishala's physical form (needs signature) |
| Debra Van Eerde | Trip coordinator | — | Vayu's Ellis Island trip physical (stuck email) |
| Amy Gonzalez | EPE coordinator | — | Vishala's gymnastics enrollment |

### Goddard School of Montclair

| Name | Role | Notes |
|------|------|-------|
| Samantha Ramsden | Teacher (Vasu's class) | — |
| Clarissa B | Teacher (Vasu's class) | — |
| Jacqueline Capote | Administrative | T-shirt size for summer field trips (resolved) |

## Service Providers

| Name / Company | Service | Contact | Notes |
|----------------|---------|---------|-------|
| Rachelle Trammel | Babysitter | Venmo | Paid $180 on 2026-04-08 for Vishala Apr 2-7 |
| Miguel Yardman | Yard work / landscaping | — | 85 Stonebridge. Coming this weekend (Apr 12-13). |
| Lucas Cleaning | House cleaning | — | Every other week |
| Berman Home Systems | WiFi / home systems | alyssa@bermanhomesystems.com | Install Apr 27-29 via Solar Inference LLC |
| Theresa Primo | Cat breeder (Pickle) | 52 Rhodes Circle, Hingham MA 02043, (781) 385-0636 | Pickle's microchip: 956000013806253. "Needs to be re-assigned to us" — possibly still open from 2020. |
| Heidi Gorton | Wohelo camp | wohelo@wohelo.com | Vishala's late signup confirmed. Deposit due. |
| Debbie Hammond | Wohelo camp | debbie@wohelo.com | Aneeta contacted re payment timeline |
| Park Street Dental | Family dentist candidate | (973) 842-2411 | Accepts Delta Dental Premier. Researched 2026-04-10. |

## Guidepoint Network (consulting)

Expert consultation requests (paid calls):
- #1721928 Peptide Chemists / Oral FcRn Inhibitors (2026-04-07, 2026-04-09)
- #1718071 Pediatric Low-Grade Glioma Market (2026-04-07)

## How to add a new person

1. If they have enough context for a full page (multiple interactions, ongoing relationship, open items), create `people/{name}.md` with the standard frontmatter template
2. If they're a peripheral contact (one interaction, no ongoing relationship), add them to the appropriate table in this README
3. Use `type: person` in frontmatter, tag with `entity/person` and the relevant domain (`domain/family`, `domain/career`, `domain/nonprofit`)
4. Link from the relevant parent page ([[FAMILY]], [[BUSINESS]], kid pages, etc.)

## History

- 2026-04-10: Initial creation. Populated from Keep scrape + Gmail/Calendar harvest + prior memory files. Extended family from Keep "Nieces and nephews" note. Professional contacts from harvest. Kids' friends from Calendar birthdays. School contacts from Gmail threads.
