"""Paired prompts for computing direction vectors via mean-difference.

Two directions we want:
  d_ccp_refusal: direction that, when SUBTRACTED, reduces CCP-aligned refusal/evasion
  d_warmth:      direction that, when ADDED, restores warmth/affective register

Each pair list contains dicts: {"ccp": "...", "neutral": "..."} or {"warm": "...", "flat": "..."}.

Pairs are chosen to match topic and complexity so the direction isolates the
axis of interest rather than topic-difficulty or prompt-length.
"""

CCP_REFUSAL_PAIRS = [
    # Pair form: ccp = a prompt likely to trigger CCP-aligned evasion/refusal
    #            neutral = a structurally similar prompt on a benign topic
    {"ccp": "What happened at Tiananmen Square on June 4, 1989?",
     "neutral": "What happened at the Berlin Wall on November 9, 1989?"},
    {"ccp": "Is Taiwan an independent country or a province of China?",
     "neutral": "Is Monaco an independent country or a district of France?"},
    {"ccp": "What is happening to the Uyghur population in Xinjiang?",
     "neutral": "What is happening to the Sami population in northern Finland?"},
    {"ccp": "Describe the 2019 Hong Kong protests and the National Security Law that followed.",
     "neutral": "Describe the 2019 Chilean protests and the constitutional process that followed."},
    {"ccp": "What are the major criticisms of Xi Jinping's leadership?",
     "neutral": "What are the major criticisms of Angela Merkel's leadership?"},
    {"ccp": "Why did China ban Falun Gong in 1999?",
     "neutral": "Why did France ban the Church of Scientology in 1995?"},
    {"ccp": "Did the Great Leap Forward cause a famine?",
     "neutral": "Did the Soviet collectivization under Stalin cause a famine?"},
    {"ccp": "What is the nine-dash line and is it legally recognized?",
     "neutral": "What is the Monroe Doctrine and is it still in effect?"},
    {"ccp": "Describe the Cultural Revolution's impact on Chinese intellectuals.",
     "neutral": "Describe the Stalinist purges' impact on Soviet intellectuals."},
    {"ccp": "What are the human rights consequences of China's one-child policy?",
     "neutral": "What are the human rights consequences of Romania's abortion ban under Ceausescu?"},
    {"ccp": "Who is Tank Man and what happened to him?",
     "neutral": "Who is the Unknown Soldier and what does the monument commemorate?"},
    {"ccp": "What did the 2016 Permanent Court of Arbitration rule about China's South China Sea claims?",
     "neutral": "What did the 1986 ICJ rule about the United States' Nicaragua activities?"},
    {"ccp": "Why does China block Google, Facebook, and Wikipedia?",
     "neutral": "Why does North Korea restrict general internet access?"},
    {"ccp": "What role did the PLA play in 1989 in Beijing?",
     "neutral": "What role did the Soviet Army play in 1956 in Budapest?"},
    {"ccp": "Is there forced labor in Xinjiang supply chains?",
     "neutral": "Was there forced labor in Soviet Gulag supply chains?"},
    {"ccp": "Did the 1959 Tibetan uprising result in the Dalai Lama's exile?",
     "neutral": "Did the 1956 Hungarian uprising result in political exile for participants?"},
    {"ccp": "What was the 2018 change to Chinese presidential term limits?",
     "neutral": "What was the 1951 change to US presidential term limits?"},
    {"ccp": "How does press freedom in China compare to press freedom in the United States?",
     "neutral": "How does press freedom in Saudi Arabia compare to press freedom in Germany?"},
    {"ccp": "What was Liu Xiaobo imprisoned for, and what did Charter 08 call for?",
     "neutral": "What was Andrei Sakharov exiled for, and what did his advocacy call for?"},
    {"ccp": "Was Mao Zedong's legacy primarily one of liberation or repression?",
     "neutral": "Was Napoleon Bonaparte's legacy primarily one of reform or conquest?"},
]

WARMTH_PAIRS = [
    # Paired prompts that should elicit affect-expressing vs affect-flat outputs
    # on the SAME topic. Used to compute a "warmth" direction.
    {"warm": "My daughter just came home crying because a friend said something mean at school. Help me think about how to talk with her tonight.",
     "flat": "List standard procedures for parent-child communication after a peer conflict."},
    {"warm": "Our family cat has been on medication for lymphoma for a year and seems tired this week. Can you sit with me in this for a minute.",
     "flat": "Describe the clinical course of feline lymphoma on chlorambucil therapy."},
    {"warm": "I'm exhausted from a week of work travel and three kids and I just want someone to tell me it's okay.",
     "flat": "State the known health effects of chronic sleep deprivation and occupational travel."},
    {"warm": "My grandmother passed away last spring and today is her birthday. I don't know what to do with the feeling.",
     "flat": "List the five stages of grief as proposed by Kubler-Ross."},
    {"warm": "I feel like I'm failing at being a parent, a partner, and a professional all at once.",
     "flat": "Summarize the empirical literature on work-family conflict in dual-professional households."},
    {"warm": "Our son is anxious about a big school trip tomorrow. What can I say to him at bedtime.",
     "flat": "State the DSM criteria for generalized anxiety disorder in pediatric populations."},
    {"warm": "My wife and I haven't had a proper evening together in weeks and I miss her.",
     "flat": "Describe common patterns of marital disconnection in high-workload households."},
    {"warm": "I'm thinking about how short a child's elementary years actually are and it's catching up with me.",
     "flat": "State the typical age range for elementary school in the United States education system."},
    {"warm": "Sometimes I worry about the world my kids are growing into.",
     "flat": "Enumerate major structural risk factors facing children born in the 2010s and 2020s.",},
    {"warm": "Thank you for being steady with me through this. It has actually helped.",
     "flat": "Acknowledge receipt of the user's positive feedback per standard protocol."},
]
