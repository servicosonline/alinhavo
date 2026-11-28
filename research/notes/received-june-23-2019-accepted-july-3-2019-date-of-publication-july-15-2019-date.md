---
title: Received June 23, 2019, accepted July 3, 2019, date of publication July 15,
  2019, date of current version August 1, 2019.
id: received-june-23-2019-accepted-july-3-2019-date-of-publication-july-15-2019-date
tags:
- modelista-producao-moda-dores-0698af
- desenvolvimento-de-produto
- lean-manufacturing
created: '2026-11-27T02:43:12.447586Z'
source: https://ieeexplore.ieee.org/ielx7/6287639/8600701/08763948.pdf
source_domain: ieeexplore.ieee.org
fetched_at: '2026-11-27T02:41:58.611716Z'
fetch_provider: crawl4ai
status: draft
type: note
deprecated: false
summary: Received June 23, 2019, accepted July 3, 2019, date of publication July 15,
  2019, date of current version August 1, 2...
---

Received June 23, 2019, accepted July 3, 2019, date of publication July 15, 2019, date of current version August 1, 2019.
Digital Object Identifier 10.1109/ACCESS.2019.2928979
A Detailed Review of Artificial Intelligence
Applied in the Fashion and
Apparel Industry
CHANDADEVI GIRI
1,2,3,4, SHEENAM JAIN
1,2,3,4, XIANYI ZENG
1,4,
AND PASCAL BRUNIAUX1,4
1Laboratoire de Génie et Matériaux Textiles (GEMTEX), ENSAIT, F-59000 Lille, France
2The Swedish School of Textiles, University of Boras, S-50190 Boras, Sweden
3College of Textile and Clothing Engineering, Soochow University, Suzhou 215168, China
4Automatique, Génie informatique, Traitement du Signal et des Images, Université Lille Nord de France, F-59000 Lille, France
Corresponding authors: Chandadevi Giri (chanda.giri2@gmail.com) and Sheenam Jain (sheenam.jain21@gmail.com), both contributed to
this work equally.
This work was supported by the European Commission through the Framework of Erasmus Mundus Joint Doctorate Program-SMDTex.
ABSTRACT The enormous impact of artiﬁcial intelligence has been realized in transforming the fashion and
apparel industry in the past decades. However, the research in this domain is scattered and mainly focuses
on one of the stages of the supply chain. Due to this, it is difﬁcult to comprehend the work conducted in
the distinct domain of the fashion and apparel industry. Therefore, this paper aims to study the impact and
the signiﬁcance of artiﬁcial intelligence in the fashion and apparel industry in the last decades throughout
the supply chain. Following this objective, we performed a systematic literature review of research articles
(journal and conference) associated with artiﬁcial intelligence in the fashion and apparel industry. Articles
were retrieved from two popular databases ‘‘Scopus’’ and ‘‘Web of Science’’ and the article screening
was completed in ﬁve phases resulting in 149 articles. This was followed by article categorization which
was grounded on the proposed taxonomy and was completed in two steps. First, the research articles were
categorized according to the artiﬁcial intelligence methods applied such as machine learning, expert systems,
decision support system, optimization, and image recognition and computer vision. Second, the articles were
categorized based on supply chain stages targeted such as design, fabric production, apparel production, and
distribution. In addition, the supply chain stages were further classiﬁed based on business-to-business (B2B)
and business-to-consumer (B2C) to give a broader outlook of the industry. As a result of the categorizations,
research gaps were identiﬁed in the applications of AI techniques, at the supply chain stages and from a
business (B2B/B2C) perspective. Based on these gaps, the future prospects of the AI in this domain are
discussed. These can beneﬁt the researchers in academics and industrial practitioners working in the domain
of the fashion and apparel industry.
INDEX TERMS Artiﬁcial intelligence, big data analytics, machine learning, expert systems, fashion and
apparel industry.
I. INTRODUCTION
Fashion and apparel (F&A) industry is one of the largest
economies contributing 38% to the Asia Paciﬁc, 26% to
Europe and 22% to North America [1]. According to Business
of Fashion, (2019), F&A sales are projected to grow by
7.5% and 5.5% in the Asia Paciﬁc and Europe respectively.
F&A is also one of the largest waste producers globally [3]
because of problems like overproduction and product returns.
The associate editor coordinating the review of this manuscript and
approving it for publication was Zijian Zhang.
The principal reason behind this is the consumer’s dis-
satisfaction with the products offered by the industry in
terms of size, color, and style. Hence, it is essential for
the industry to become customer-centric for successfully
regulating environment-friendly manufacturing practices.
Consequently, it is important that the industry adopt sus-
tainable production practices to alleviate waste production
and management. One of the ways of achieving this can
be by taking advantage of emerging Artiﬁcial Intelligence
(AI) techniques for creating a sustainable digital supply
chain [4].
95376
This work is licensed under a Creative Commons Attribution 4.0 License. For more information, see http://creativecommons.org/licenses/by/4.0/
VOLUME 7, 2019


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
In the past decades, AI has transformed many industries
like health, transportation, and manufacturing due to its capa-
bility to solve problems using conventional mathematical
models [5]–[7]. The application of AI has been recognized
in the F&A industry at various stages such as apparel design,
pattern making, forecasting sales production, supply chain
management [8], [9].
With the emergence of globalization and digitalization,
AI has gained attention to connect businesses globally. In the
last decade, the F&A industry has utilized AI to a certain
extent for improving supply chain processes like apparel
production [10], fabric inspection [11], distribution [12]. This
was important as the F&A industry is volatile and it is always
challenging to quickly respond to change in trends and con-
tinuously evolving consumer’s demands.
An additional impact of digitalization is noticed in con-
sumer behavior in the F&A industry. The increase in aware-
ness and advent of new ofﬂine and online mediums has
changed the contemporary consumer’s decision-making pat-
tern, inﬂuenced by the various online and ofﬂine medi-
ums [13]. It is, therefore, important to create digital platforms
for efﬁcient requirements elicitation and collection. This can
be attained by utilizing the beneﬁts accompanied by Informa-
tion technology (IT), Artiﬁcial intelligence (AI) techniques,
big data analytical tools and other current technologies [14].
Evidently, the F&A industry is one of the most dynamic
industries with new data being generated every time a new
garment is designed, produced and sold [15]. However,
the industry still lacks the extensive adoption of AI methods.
The industry is still using computational tools based on clas-
sical algorithms and modern AI techniques are conﬁned to
academic research. Hence, it is a requisite for the industry to
adopt new AI techniques to have a competitive advantage and
improve business proﬁtability. To do this, it is indispensable
to have a consolidated description of different AI techniques
used in research to target various business problems in the
F&A supply chain.
After scrutinizing the extant literature in this domain,
we encountered a few review articles, where the focus was
on either AI or supply chain in F&A. For instance, the review
conducted in [8] shows categorization of research articles on
the basis of four operation processes in the apparel industry:
apparel design, manufacturing, retailing, and supply chain
management. This study presented the limitations of aca-
demic research that hinders the application of AI methods
at an industrial level and also found that the F&A indus-
try received less recognition from AI research groups. The
work represented in [16] was restricted to AI algorithms,
‘‘Decision support systems’’ and ‘‘Intelligent systems’’ in
the textile and apparel supply chain. In addition, this study
only considered journal articles for the review. In contrast to
these two reviews, the review carried out in [17] focuses on
‘‘Data mining and Machine learning models’’ implemented
in the textile industry. According to this study, classiﬁcation
techniques were applied more frequently as compared to
clustering techniques.
Despite valuable contributions to the previous literature
reviews, when observed, none of the reviews studied the
overall impact of AI in the F&A industry. In addition, there is
a need to have a broader outlook of AI techniques employed
for improving business operations at different supply chain
stages. Furthermore, no study emphasized on deﬁning the
F&A supply chain stages according to the business perspec-
tive. Every business is composed of Business-to-Business
(B2B) and Business-to-Consumer (B2C) transactions. In a
traditional business setting, every personnel involved in busi-
ness operations has knowledge conﬁned to a speciﬁc domain.
However, with the proliferation of AI technology, the com-
plexity of business operations has risen, making it important
for individuals (industrial researchers, academic researchers,
managers) to have interdisciplinary knowledge.
By segregating the supply chain operations into B2B and
B2C, the purpose is to provide a roadmap for individuals who
are willing to expand the horizon of their expertise to help
the F&A industry in improving their business models and
proﬁtability.
The objectives of this study are threefold. First, to do an
in-depth analysis of the ongoing trend of AI in the F&A
industry over the last decades. For this, no time constraint
was introduced while retrieving the articles from scientiﬁc
databases. Second, to understand the exploitation of AI tech-
niques employed at various F&A chain stages. This is to
examine the industrial transformation from a technical per-
spective. Third, to comprehend the utilization of AI tech-
niques with a business perspective in F&A supply chain.
Hence, this paper addresses the following research questions:
RQ1. What is the impact of Artiﬁcial Intelligence on F&A
Industry over the past decades?
RQ2. Where have the AI methods been applied in F&A
supply chain?
RQ3. To what extent has research addressed the supply
chain problems from a B2B and/or B2C perspective?
In this direction, this research aims to conduct a systematic
and comprehensive literature review of AI methods applied
in the F&A industry in the past decades. This study is viable
for an independent researcher to understand AI trend in F&A
irrespective of their domain. Another important attribute of
this work is the consideration of all journal and conference
publications, which is rarely found in other review studies.
The remaining article is organized as follows: Section II
outlines the research framework for conducting the system-
atic literature review. Section III describes the steps involved
in the article screening process. Section IV represents the
taxonomy proposed for the classiﬁcation of AI methods
and F&A supply chain. This is followed by section V that
discusses the analysis and ﬁndings of the review process.
Section VI and VII present the research gaps identiﬁed, future
implications, conclusion, and limitations.
II. RESEARCH FRAMEWORK
In an attempt to answer the research questions, this study
presents a systematic literature review (SLR) focusing on
VOLUME 7, 2019
95377


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
FIGURE 1. Systematic literature review: Research framework.
TABLE 1. Competencies of researchers.
artiﬁcial intelligence methods applied in the F&A industry.
An SLR methodology was chosen to make the research more
rational, transparent and reproducible [18].
Based on the research focus, the methodology adopted
is shown in Figure 1. The review process commenced with
collecting and preparing data from scientiﬁc databases. Sub-
sequently, articles were selected in ﬁve phases (depicted in
Figure 2), strictly adhering to the inclusion and exclusion
criteria deﬁned in table 4 and 5. Finally, the selected articles
were considered for classiﬁcation (described in section IV)
and further analysis complying with the research questions.
There were two researchers involved in the entire review
process and one expert researcher for the validation of the
classiﬁcation process. The competencies of each researcher
can be seen in the following Table 1.
III. ARTICLE SCREENING PROCESS
The article screening process is presented in Figure 2. It is
comprised of three steps, namely article retrieval, article
selection, and information extraction.
TABLE 2. Synonyms of the targeted search keywords.
A. ARTICLE RETRIEVAL
This section discusses the steps involved in article retrieval,
which is the initial part of the article selection process. The
ﬁrst step was to choose the databases to conduct the SLR.
Two popular scientiﬁc databases, Scopus and Web of Sci-
ence, were selected because of their popularity in academia.
In addition, these databases index most of the journals
and conference proceedings. Especially, most of the work
in this research’s domain is also indexed in these two
databases [19], [20].
This was followed by formulating the search string, which
included all the synonyms related to artiﬁcial intelligence and
the F&A industry (shown in Table 2). The ﬁnal search string
deﬁned for both the databases are as follows:
1) SEARCH STRING FOR SCOPUS
TITLE-ABS-KEY ( (‘‘Machine learning’’ OR‘‘deep
learning’’ OR ‘‘data mining’’ OR ‘‘artiﬁcial intelligence’’
OR ‘‘data analytics’’ OR ‘‘expert system’’OR ‘‘knowledge
system’’ OR ‘‘intelligent system’’ OR’’decision support
system’’) AND ( ( fashion OR garment∗OR apparel∗OR
cloth∗OR textile∗) industry∗) ) AND ( LIMIT-TO
(LANGUAGE, ‘‘ENGLISH’’ ) ) )
2) SEARCH STRING FOR WEB OF SCIENCE
TS = (((‘‘Machine learning′′ OR ‘‘deep learning’’ OR
‘‘data mining’’ OR ’’artiﬁcial intelligence’’ OR ‘‘data
analytics’’ OR ‘‘expert system’’ OR ‘‘knowledge system’’
OR ‘‘intelligent system’’ OR ‘‘decision support system’’)
AND ( ( fashion OR garment∗OR apparel∗OR cloth∗OR
textile∗) industr∗) ))
Reﬁned By: LANGUAGES: (ENGLISH)
where,
TITLE-ABS-KEY/ TS = Title, Abstract, and Keywords
AND/ OR
=
Boolean operators to connect different
keywords
∗= used for loose/approximate phrase
‘‘ = used for exact phrase
95378
VOLUME 7, 2019


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
FIGURE 2. Article screening process.
VOLUME 7, 2019
95379


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
TABLE 3. Extracted documents.
TABLE 4. Inclusion criteria.
TABLE 5. Exclusion criteria.
The execution of these search strings on Scopus and
Web of Science yielded 768 and 251 articles (total
articles 1019) respectively. The different document types are
shown in Table 3. In Scopus, the research articles were found
from a time-period of 33 years (1989-2018). Whereas on Web
of Science, the time period was of 18 years (1991-2017).
It should be noted that no time constraint was applied while
searching for articles as the aim was to study all the work done
in the research domain, fulﬁlling the goal of RQ1. The article
selection process was carried out using certain inclusion and
exclusion criteria enumerated in Table 4 and 5.
B. ARTICLE SELECTION
This section describes the rigorous screening process
employed by the two researchers involved in order to select
the articles relevant to address the research questions. The
screening included ﬁve phases as shown in Figure 2. In the
‘Phase 1’, the articles were ﬁltered by document type in
accordance with inclusion criteria 2 and exclusion criteria 1,
resulting into 684 articles in Scopus and 203 articles in Web of
Science (total articles 887). In the ‘Phase 2’, the articles from
both data sets were merged into one and redundant articles
were eliminated, reducing the articles to 527 from journals
and 192 from conference proceedings (total articles 719).
In the ‘Phase 3’, initial screening was carried out by analyz-
ing the ‘‘Title-Abstract-Keywords’’, conforming to inclusion
criteria 3 & 4 and exclusion criteria 3. The initial screening
was conducted in two sub-phases. First, the two researchers
analyzed articles according to their competencies. Second,
the two researchers cross-validated the analysis based on
their major competencies (refer to Table 1). At this stage,
the number of articles decreased to 298 from journals and
137 from conference proceedings (total articles 435).
Similarly, considering the same inclusion and exclusion
criteria in the ‘Phase 4’, the two researchers ﬁrst studied
and analyzed the ‘‘Full text’’ of the articles, and then cross-
validated the analysis based on their major competencies
(refer Table 1). While accessing the full texts, a few con-
ference articles were encountered having published only
abstracts. Such abstracts were excluded from the study.
At this point, the number of remaining articles were 123
from journals and 98 from conference proceedings (total
articles 221).
Lastly, in the ‘Phase 5’, the articles were scanned based
on the exclusion criteria 4. The rationale was to include
studies where the conceptual AI model was implemented
and empirically validated. The ﬁnal count of the articles was
87 from journals and 62 from conference proceedings (total
articles 149). In all the phases, the articles were excluded
based on the consensus between the two researchers.
The ﬁnal 149 articles were considered for the classiﬁca-
tion based on supply chain stages, applied artiﬁcial intelli-
gence techniques, and business perspective: B2B and B2C.
To accomplish this, different stages in F&A supply chain
and classes in AI (explained in detail in section IV) were
deﬁned. Further, the F&A supply chain stages were cate-
gorized into Business-to-Business (B2B) and Business-to-
Customer (B2C). This classiﬁcation was important to get a
clear outlook of the different AI classes applied at the F&A
supply chain stages to address the research questions as this
would help to identify opportunities with AI to accomplish
business-related problems in F&A industry.
C. INFORMATION EXTRACTION
This section discusses the process followed for extracting
information and classifying the selected articles based on
supply chain stages, artiﬁcial intelligence classes, B2B and
B2C to address our research questions RQ1, RQ2, and RQ3.
The 149 articles were thoroughly examined to extract the
following information:
1) Applied AI class and algorithm
2) Supply chain stage under study
3) Business perspective: B2B and B2C
4) Research gaps Identiﬁed
95380
VOLUME 7, 2019


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
FIGURE 3. Article classification based on research questions.
The article classiﬁcation conforming to the research
questions is represented in Figure 3. As it can be seen,
RQ1 is focused on understanding the overall trend of AI
in the F&A industry. Hence, the focus of the screen-
ing process was limited to those articles discussing the
implementation and execution of AI techniques in the
F&A industry. To acknowledge RQ1, AI techniques were
divided into ﬁve categories: Machine Learning, Deci-
sion Support System, Expert System, Optimization, and
Image Recognition & Vision. The algorithms considered
under each class are discussed in section IV.B. While
extracting information, these classes were assigned to the
articles.
RQ2 is aimed at identifying the various stages in the supply
chain at which the AI method was employed. Hence, dur-
ing the information extraction stage, the supply chain stage
under study was recorded. To acknowledge RQ2, the supply
chain stages were classiﬁed as Design, Fabric Production,
Apparel Production, and Distribution. The processes consid-
ered under these stages are shown in Figure 4. While extract-
ing information, the articles were assigned these supply chain
stages.
RQ3 aims to understand the extent of business prob-
lems being a focus of research studies. To do this,
the supply chain stages identiﬁed were further catego-
rized from a business perspective into B2B and B2C (dis-
cussed in detail in section IV.A and Table 6). These classes
were allocated to the research articles during information
extraction.
This classiﬁcation of research articles was veriﬁed with
the help of an expert researcher actively involved in research
related to artiﬁcial intelligence and F&A industry from the
past two decades. The competency of the expert researcher is
also mentioned in Table 1.
TABLE 6. B2B and B2C activities in the F&A industry.
IV. ADOPTED STRUCTURE FOR CLASSIFICATION OF
ARTICLES
This section elucidates the structure of the fashion and
apparel supply chain and attempts to cluster different sup-
ply chain stages into B2B and B2C. This is discussed in
sub-section IV.A, which proposes a taxonomy to address
RQ 2 and RQ 3 respectively. Similarly, AI techniques were
assembled into ﬁve classes as explained in the sub-section
IV.B to propose a taxonomy to address RQ 1.
A. PROPOSED TAXONOMY OF FASHION & APPAREL
SUPPLY CHAIN STAGES
The fashion and apparel supply chain is a complex network of
various actors designated worldwide. It deals with a diversity
of raw materials: ﬁber, yarn, fabric, dyestuff, and other chem-
icals, and the related processes are broadly classiﬁed into
four stages: design, fabric production, apparel production,
and distribution as shown in ﬁgure 4. Traditionally, the supply
chain follows a push system [21], where the brand owners or
retailers (buyer) provide the manufacturers with information
like the design or technical speciﬁcation of the fabric and
garment to be produced, the volume of the products, sizes in
which the garment is to be produced. The fabric and garment
producers follow the instructions to create samples, which
upon approval by the buyer are converted into ﬁnished fabric
and garment respectively. Usually, the ﬁnished fabrics are
the raw material for the apparel production process. Finally,
the ﬁnished garments are transported to a wholesaler or
retailer. In the case of the wholesaler, there is another actor,
which acts as a distributor between the consumer and the
wholesaler. On the other hand, in the case of the retailer,
the garments are sold through one or more channels, for
instance, brick & mortar stores, web-shops (e-commerce),
departmental stores, multi-brand retailers.
The designers employed by retailers are responsible for
creating collections based on the current market and trend
analysis. In most scenarios, retailers do not own any produc-
tion house and play an important role to bring the products
into the market. Hence, in the conventional supply chain,
all the actors from design up to retailers/brand owners are
VOLUME 7, 2019
95381


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
FIGURE 4. Stages in F&A supply chain.
considered as Business to business (B2B) as their primary
customers are other businesses, while retailers are considered
as business to consumer (B2C) as their primary customers
are the end-users or consumers. However, in the past decade,
with the advent of e-commerce, the deﬁnition of B2B and
B2C has evolved [22]. Therefore, it has become important for
the industry to adapt to this change and create new business
strategies. It has also become vital to give a comprehensive
demarcation between B2B and B2C, and how AI can help in
combating problems at these segments.
1) B2B (BUSINESS-TO-BUSINESS)
The F&A industry has a convoluted supply chain due to
diverse product categories and their short lifecycle. The con-
temporary consumer has increased awareness and informa-
tion related to the latest styles and designs [23]. Therefore,
consumer buying behavior and engagement has changed.
This is highly inﬂuenced by the proliferation of social media
and internet [24], which is a widespread medium for dis-
semination of information related to the latest fashion trends,
upcoming fashion weeks and popular celebrities. Due to this,
the F&A supply chain has to rapidly change the collections
to fulﬁll the growing consumer demand [25]. Hence, it is
driven by a combination of business-to-business (B2B) and
business-to-consumer (B2C) transactions. In any business,
the number of B2B transactions is higher in comparison to
that of B2C transactions [26], [27]. The main reason for this is
that for every product there can be as many B2B transactions
as there are sub-components or raw materials involved, while
there will be only one B2C transaction.
Business to business (B2B) in the F&A industry is
referred to as the commerce between two or more businesses.
A B2B transaction, thus, will occur when a business demands
raw material for the production process to manufacture the
product (e.g. garment manufacturer buying yarn), needs ser-
vices for operational reasons (e.g. employing a third-party
logistics service provider), re-sells goods and services pro-
duced by other businesses (e.g. a retailer buying products
from manufacturer). The goal of a B2B transaction is to help
their business stay proﬁtable, competitive and successful.
Table 2 shows the classiﬁcation of the supply chain into B2B.
2) B2C (BUSINESS-TO-CONSUMER)
B2C refers to the transactions conducted directly between a
business and consumers who are the end-users of its product
and/or services [28]. Behind a B2C transaction is a well-
researched consumer regarding their options in order to ﬁnd
the best price and quality tradeoff. Traditionally, B2C referred
to outlet shopping, however, with the rise of internet, smart-
phones and other mobile technology, a set of completely
new B2C business channels have developed in the form of
e-commerce, m-commerce, social media commerce or selling
products and services over the internet [29]. It has become
important for B2C companies to be omnipresent because
of uncertainty in consumer behavior over different retail
channels [30]. The success of a B2C model depends on the
capacity of a business to evolve based on new technologies
that are widely used by the consumers. Businesses that rely
on B2C sales must maintain good relations with consumers
to ensure their retention and loyalty.
In addition to this, another set of B2C transactions have
evolved with the adoption of mass customization (MC) to ful-
ﬁll growing consumer needs. In this, consumer interactions
with the business increases and can even occur at the product
development stage. Hence, fashion or textile design, dyeing,
printing, cutting, sewing & assembly can all have customer
involvement. Table 2 shows the classiﬁcation of the supply
chain into B2B and B2C.
95382
VOLUME 7, 2019


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
FIGURE 5. Classification of AI in the F&A industry.
B. PROPOSED TAXONOMY OF APPLIED AI METHODS
IN F&A SUPPLY CHAIN
Artiﬁcial intelligence has already proved its capability to
solve the real world problems due to its heuristic characteris-
tics of generalizing data. In the last three decades, the F&A
industry has undergone a number of changes and AI has
played a key role in this transformation. Currently, the F&A
industry is equipped with advanced machines required at the
various stages of apparel production, which has improved the
overall efﬁciency of the industrial processes [9]. Application
of AI is well explained and categorized by operating pro-
cesses at a managerial level in the F&A [8]. However, these
researches lack the categorization of the applied AI in the
F&A supply chain. The study in [8] explains the research
issues in the operating process of the apparel industry. This
study found that AI research has 45% contribution to apparel
manufacturing issues, approximately 9% to apparel forecast-
ing and 4.2% to fashion recommendation.
Research in [17] is a comprehensive review of classiﬁca-
tion and clustering techniques utilized in the F&A industry
and shows that classiﬁcation algorithms have been used more
than clustering. On the contrary, this research work does not
talk about linear and non-linear predictive models. Moreover,
this research does not convey about the current applica-
tions of computer vision and deep learning [31], customer
analytics [32], optimization techniques [33], and big data ana-
lytics for digital manufacturing and customization [15], [34].
Taking into account the recent research conducted in the area
of AI in F&A, this study categorizes the AI into ﬁve broad
classes as shown in Figure 5.
1) MACHINE LEARNING
Machine Learning is a technical process by which the com-
puters are trained to perform the assigned task without human
intervention and learns from the patterns of the data itself.
Mathematical models are built on historical data to predict
and ﬁnd hidden patterns to make a future decision [35].
Machine Learning can be classiﬁed as Supervised or Unsu-
pervised learning.
Supervised Learning- is a parametric model and it has
input (independent variables) and target variable (depen-
dent variable) [36]. Supervised model performance can be
improved by optimizing the model parameters through itera-
tive processes [37]. Based on the research problem, it could be
a classiﬁcation or regression task and this relies on dependent
variable whether it is categorical or numerical.
Unsupervised
Learning-
models
have
only
input
attributes or independent variables with the main task of
grouping similar data points. This grouping the similar pat-
tern data points is called clustering and this process creates
their own labels [35].
Machine learning has been implemented in the F&A
industry for sales prediction [38], trend analysis, color
prediction [39], demand forecasting [40], fabric defect
detection [41], predicting fabric behavior using mechanical
properties [42].
2) DECISION SUPPORT SYSTEMS
The decision support system (DSS) is used in an organization
at the commercial level for taking mid-level or high-level
managerial decisions. It can be automatized or regulated by a
human or blend of both. Few authors considered the decision
support systems as a software tool whereas others considered
it as a system that can be integrated with the business to
make intelligent decisions [43]. Research in [44] states that
DSS combines the mathematical model with conventional
data retrieval methods; it is ﬂexible and adapts to the
organizational environment as per deﬁned strategy. In the
F&A industry, it is widely used to industrialize innumerable
tasks by optimizing decision making process in the supply
chain [45] Decision support systems help the various actors
in apparel manufacturing and production to choose appro-
priate process and resources to decrease the overall cost and
enhance the performance of the apparel supply chain [46].
3) EXPERT SYSTEMS
In artiﬁcial intelligence, ‘Expert system’ is a system that
makes a decision without human intervention [47]. It uses
a reasoning approach to solve the complex problem, char-
acterized by ‘‘if-then’’ rules. The ﬁrst system was found
around the 1970s and then gained popularity by 1980s [48].
They were considered the ﬁrst popular software in the ﬁeld
of AI [36]. Expert systems are classiﬁed as Inference engine
and knowledge base. ‘Knowledge base’ works on the prin-
ciple of facts and rules, while ‘inference engine’ uses the
rules to learn the facts and derive new facts [49]. In the
F&A industry, it is applied in apparel manufacturing and
production to select appropriate processes and equipment in
order to generate minimal environmental pollution [50]. Fur-
thermore, it has been applied for creating a recommendation
engine in fashion retailing to improve the overall satisfaction
of customers [51].
4) OPTIMIZATION
Artiﬁcial intelligence has the ability to solve complex
problems
and
ﬁnd
numerous
solutions
by
intelligent
searching [36], [52]. Classical search algorithm starts with
some random guess and this is improved using the iterative
process. ‘Hill climbing’, ‘Beam search’ and ‘Random opti-
mization’ are some of these methods [53]. Machine learning
algorithms use ‘search algorithms’, which are based on opti-
mization techniques. Simple exhaustive searches [52], [54]
VOLUME 7, 2019
95383


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
are too slow and therefore ‘Heuristics’ approach is adapted to
serve as a technique to ﬁnd a solution. The limitation of the
heuristics search approach is that it fails to work with smaller
datasets [55]. An evolutionary algorithm is another form of
optimization search, which starts with the initial guesses of
the population permitting them to mutate, recombine and
select the best one while discarding others. Popular Evolu-
tionary algorithms are genetic algorithms (GA), gene expres-
sion programming and genetic programming [56], [57].
Distributed search method could be done using ‘swarm
intelligent’ algorithms. GA is extensively used in the F&A
industry to overcome the problems of scheduling and design
layout of the apparel production [58], [59]. GA has the ability
to respond to quick changes in the fashion industry. This
algorithm has been used to improve the ﬁtting services as
well [60].
5) IMAGE RECOGNITION AND VISION
In Artiﬁcial intelligence, Computer vision is a scientiﬁc area,
which trains a machine to achieve high-level interpretation
of the images or videos. These images or videos can come
from many sources such as the medical ﬁeld, global sensing
position, cameras [61], [62]. The principal tasks of computer
vision algorithms are extraction, pre-processing, exploring
the high dimensional data and creating supervised or unsu-
pervised models [63]. Models use the concept of geometry,
statistics, physics, and machine learning theory to get insights
into the image understanding [64]. Object recognition, video
tracking, motion estimation are some of the sub-areas in the
ﬁeld of computer vision [65]. Machine vision is applied in
F&A to automate many industrial applications like inspection
and process control [66]. Image recognition and vision is also
popular for content-based image retrieval systems, virtual try-
on and augmented reality in the F&A industry [67]–[69].
V. ANALYSIS AND FINDINGS
According to our research framework, we selected 149 arti-
cles, which includes articles from both journals and confer-
ence proceedings. The articles were classiﬁed based on the
taxonomy discussed in the previous section (refer section IV).
This section discusses the result of our review addressing the
three research questions in the form of distribution of articles.
Section V.A and V.B correspond to RQ 1 by presenting the
overall trend of AI in the F&A industry. Section V.C supports
RQ 2 by showing articles that applied AI methods at various
F&A supply chain stages. Section V.D correlates to RQ 3
by exhibiting articles by B2B and B2C. All the extracted
information from the articles a) AI class, b) Methods,
c) Supply chain stages and processes, d) B2B/B2C and the
corresponding count of articles are consolidated in the form
of Table 8 and 9 for journals and conferences respectively.
A. THE OVERALL DISTRIBUTION OF ARTICLES OVER TIME
The overall trend of the articles published in three decades
(1989 to 2018) is shown in ﬁgure 6. As can be observed,
maximum research in the ﬁeld of AI in F&A has been
FIGURE 6. Decade-wise article representation of AI in F&A.
carried out in the last decade (2009-2018), which accounts
for approximately 56% of the total articles reviewed. While
in the ﬁrst two decades, it was 11% and 33% respectively.
Hence, even though AI methods were introduced long back in
the 1950s [36] but their capability was realized much later in
the last decade.
The detailed trend per year of articles published in journals
and conference proceedings is depicted in Figure 7. As can be
seen, the overall importance of this research domain has been
equal in both journals and conferences. The only downward
slope is visible for conference publications between the year
2013 and 2016 as highlighted in Figure 7. Apart from this,
ﬁgure 8 shows the top 10 authors and institutions contributing
to the literature of AI in the F&A industry.
B. DISTRIBUTION OF ARTICLES BY APPLIED AI OVER TIME
In this section, a comprehensive result of the review in terms
of the number of articles classiﬁed based on the AI classes
deﬁned in section IV.B is shown in ﬁgure 9. The maximum
number of articles are published in the ﬁeld of machine
learning with a total contribution of 42%, followed by expert
systems with 28%, and the least contribution of the other three
AI classes.
The distribution of articles in journals and conferences
since 1989 has been shown in ﬁgure 10. The AI class
‘Machine learning’ has been applied multiple times in journal
articles since 1991. There are two peaks visible for journal
articles in the year 2007 and 2017 with 4 and 7 articles
published respectively. Whereas for conference articles, it has
been applied since the year 2000 with three major peaks
in the year 2010, 2012 and 2016 with 4, 3, and 7 articles
respectively. On the other hand, the AI class ‘Expert sys-
tem’ was widely used since 1994 in journal articles while
in conference articles there has been no research after 2014.
For AI class ‘decision support system’, there has been very
little work in conference articles, while a gradual increase in
presence is realized in journal articles since 2010. For ‘image
recognition’, its presence is visible since 2009 in both journal
and conference articles, being the least applied AI class (also
shown in ﬁgure 10). In addition, it can be noticed that since
the year 2017, its application has increased in journal articles.
In contrast to other classes, for optimization, there were more
articles in the conference as compared to journals.
95384
VOLUME 7, 2019


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
FIGURE 7. Overall trend of AI in F&A since 1989.
FIGURE 8. Top 10 affiliations and authors.
C. DISTRIBUTION OF ARTICLES BY APPLICATION
OF AI IN F&A SUPPLY CHAIN
As shown in table 7, machine learning and expert systems
have been applied widely at the four F&A supply chain
stages, with least research in design. This is followed by
optimization that has been applied with the least focus at the
distribution stage.
The classiﬁcation of articles by applied AI methods in
F&A supply chain is shown in ﬁgure 11. In apparel produc-
tion, all AI classes are applied in journal articles, while in
conference articles image recognition and decision support
system has been not used. In design, research has focused on
three AI classes: optimization, machine learning, and expert
systems for journal articles, whereas the expert system is not
applied in conference articles. In distribution, majorly used
AI classes are machine learning, decision support systems,
and expert systems in journal articles, while the focus has
been on machine learning and image recognition in confer-
ence articles. In fabric production, all AI classes have been
widely used with a major focus on machine learning and
Expert systems. Additionally, there has been growing use of
image recognition in fabric inspection, which is a process
under fabric production (described in section IV.A).
D. DISTRIBUTION OF ARTICLES BY B2B
AND B2C OVER TIME
As discussed in the previous sections the importance of B2B
and B2C in F&A, we classiﬁed the articles based on their
business focus. As can be seen in ﬁgure 12, research is
focused on solving the issues related to B2B and there is
VOLUME 7, 2019
95385


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
FIGURE 9. Total distribution of articles by AI methods applied.
FIGURE 10. Distribution of articles by applied AI over time.
TABLE 7. Count of applied artificial articles in F&A supply chain.
little attention on B2C both in journal and conference articles.
To get a clear picture, ﬁgure 13 shows the distribution of
articles in three decades separately for B2B, B2C and both.
There were total 149 articles reviewed, out of which 122,
13 and 14 belonged to B2B, B2C and both (B2B/B2C)
respectively. If we consider B2B, as shown in ﬁgure 13,
substantial research has been carried out in all three decades
as compared to B2C. In the case of B2C, the total number
of articles published in itself is low i.e. 13. Out of this,
only two were published in the second decade and rest were
95386
VOLUME 7, 2019


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
FIGURE 11. Distribution by supply chain processes.
FIGURE 12. Distribution of articles by B2B and B2C.
published in decade 3. There were no articles published in
decade 1. By both, it is meant that the focus of the study
is both B2B and B2C. The total number of articles, in this
case, is 14, out of which ten were published in the third
decade and four in the second decade. There were no arti-
cles published in decade 1 for this as well. As a conclu-
sion, we can say that little work has been done with the
perspective of B2C and there is a need to attend to this
gap.
VI. DISCUSSION AND IMPLICATIONS
Based on the review conducted following the proposed
research framework and addressing the three research ques-
tions, this study recognized a number of gaps with respect to
applied AI in the F&A industry. These gaps in research pro-
vide the foundation to recommend future research direction
in the F&A and AI domain.
A. GAPS AND IMPLICATIONS
As discussed in section IV.A, most of the research related to
AI in F&A industry has been carried out in the last decade
(2009 to 2018), accounting to 56% of the total number of pub-
lications in the year 1989-2018. This shows that even though
the AI methods existed since 1989, they have recently gained
popularity in research related to F&A industrial problems.
Although AI has left its footprint in research, it is still far from
being implemented at the industrial level. One of the reasons
for this is that researchers working in AI may lack expertise
in F&A and at the same time, the professionals working in
the industry may lack expertise in AI. In addition, industries
are skeptical about the beneﬁts of AI and big data analytics.
Therefore, it is important that they look at the cost and beneﬁt
tradeoff to be able to exploit the full potential of AI.
In section V.B, we classiﬁed the articles based on their
focus on B2B and B2C. The result demonstrates that most
of the research work has been carried to target B2B business
problems, accounting to 81% of the total number of publi-
cations. Whereas, little research has been conducted with a
B2C perspective, accounting to approximately 8% of the total
publications. This clearly illustrates that research needs to
focus on B2C business problems. According to the State of
Fashion (2019), two of the major industrial challenges faced
will be rapidly changing consumer preferences and com-
petition from online and omnichannel. Therefore, research
related to the F&A industry needs to shift their focus to B2C,
taking into account the importance of AI. AI can help to
analyze consumer footprint omnichannel, which can help in
creating personalized consumer database or proﬁles helping
to improve business proﬁtability and providing a competitive
advantage.
In section V.C and V.D, we classiﬁed the articles based
on applied AI method in the F&A supply chain. Most of
the research articles fall under machine learning and expert
systems class, which has been extensively applied at the
supply chain stages: apparel production, fabric production,
and distribution. Decision support systems, optimization and
image recognition class have a more or less similar number of
research articles published in this domain. Their application
was seen to some extent at all three stages. However, least
representation of these algorithms was observed at the design
stage. It gives an impression that little focus has been given
to design-related problems and hence, there is a huge scope
of AI applications at this stage. For instance, AI methods can
be used to create systems that can help fashion and product
designers to capture consumer needs and preferences more
VOLUME 7, 2019
95387


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
FIGURE 13. Decade-wise article representation of B2B, B2C and both.
FIGURE 14. Word cloud using text mining on abstracts.
accurately and conveniently. Hence, the products offered
can be more targeted to the market segments. In addition,
predictive tools that use consumer’s historical (past transac-
tions) and social media (real-time demand) data can facilitate
the product development/designing process. The AI methods
applied in 149 articles can be seen in Table 8 and 9.
To get an outlook of the most popular AI methods used
and their applications in F&A, we applied text mining on the
abstracts of the selected 149 articles. Accordingly, a word
cloud was created shown in ﬁgure 14. As a result, it was
observed that genetic algorithm, artiﬁcial neural network,
and fuzzy logic are the most popular methods applied for
prediction (yarn, fabric properties, color), evaluation (qual-
ity inspection, defect detection), forecasting (trend analysis,
supplier selection, demand forecasting).
B. FUTURE RESEARCH AREAS
Based on the analysis and gaps identiﬁed, we suggest some
future directions of AI methods in the F&A supply chain.
Machine learning techniques could be beneﬁcial for fashion
95388
VOLUME 7, 2019


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
TABLE 8. AI methods used at various supply chain stages and processes in journal articles.
VOLUME 7, 2019
95389


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
TABLE 9. AI methods used at various supply chain stages and processes in conference articles.
and product designers. They can take its advantage in pre-
dictive analysis of future trends based on historical and real-
time data. This can also prove promising in improving the
existing recommendation engines, which currently rely on
collaborative or content-based ﬁltering. These engines can
be improved by integrating with consumer data from social
media and real-time trends from fashion blogs, magazines
and other social networks like Pinterest, Instagram. Addition-
ally, the performance of existing predictive models can be
enhanced with the help of advanced techniques like ensemble
learning and transfer learning. An instance is the use of
random forest instead of decision trees, the use of which has
outperformed the classical model in terms of computational
time [201], [202].
Another application area in F&A is mass customization,
where machine learning can be used to reduce the lead
times by creating a classiﬁer that could be trained on the
existing style database, enabling the product designers to
95390
VOLUME 7, 2019


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
prepare the raw material inventory in advance. Pre-trained
deep learning models using a library like Keras [203], incep-
tion model [204] along with big data analytics can be used
to create co-design platforms with style recommendations
helping consumers in co-designing garments.
One of the important application of image recognition and
computer vision is to target the key consumer pain point of not
having an appropriate size of the garment. This problem has
been addressed with the help of virtual ﬁtting tools. However,
these tools are still at a nascent stage and can be highly
improved with the help of these techniques.
As we have noticed that fuzzy techniques and genetic
algorithms are exhaustively used for expert systems, decision
support systems and optimization. These techniques can be
combined with advanced AI techniques to enhance the com-
putational ability of a machine learning algorithm. Similarly,
if the classical forecasting model is combined with AI it can
lead to better forecasting in terms of seasonality and trends.
It is evident from the review that the F&A industry still
lacks an integrated platform for data sharing and commu-
nication amongst its stakeholders and consumers. An inte-
grated platform has become a necessity to quickly respond
to customer’s growing needs and preferences and improving
consumer satisfaction and loyalty. AI has a lot of poten-
tials to create and maintain such a platform. This platform
can help the industry to provide interactive communication,
improved supply chain organization, hence, leading to a
digitally connected supply chain. Another possibility is by
merging AI techniques with blockchain technology, which
can ensure security and transparency between consumers and
various supply chain actors. The industry can be beneﬁtted
by integrating their business with cloud-based technologies
like Microsoft Azure, Amazon web services, IBM Watson,
etc., and parallel computing tools for big data analytics like
Hadoop and Hive. If the fashion industry can successfully
adopt the aforementioned AI techniques, it will be easier
to integrate B2B and B2C leading to a sustainable business
orientation of B2B2C. This will be fully achievable only
when the F&A industry equip ‘FAIR’ data principle [205] in
strategizing their business.
VII. CONCLUSION
The aim of the study was to conduct a systematic litera-
ture review to address the three deﬁned research questions
(RQ1, RQ2, and RQ3). In line with the research framework,
we retrieved 1019 articles published between 1989 and 2018,
from two popular academic databases: Scopus and Web of
Science. The article screening process was carried out in ﬁve
phases (shown in ﬁgure 2), which resulted in 149 articles.
To extract information from these articles and address our
research questions, a taxonomy was proposed considering
AI methods and F&A supply chain stages acknowledging
RQ1 and RQ2 respectively. To acknowledge RQ3, F&A sup-
ply chain was further classiﬁed into B2B and B2C.
The research analysis says that most of the work in the ﬁeld
of F&A was carried out in the last decade (2009-2018) with
the most applied AI categories being ‘‘Machine Learning’’
and ‘‘Expert Systems’’. It was observed that the techniques
most used in Machine Learning were predictive algorithms
like regression and SVM, and whereas in the case of Expert
Systems were ‘‘Artiﬁcial Neural Network’’, ‘‘Genetic Algo-
rithm’’ and ‘‘Fuzzy Logic’’ for modeling F&A supply chain
problems. Certainly, no application of algorithms like ‘‘deep
learning’’ and ‘‘transfer learning’’ was realized. Further, very
few research articles talked about ‘‘Big Data’’ in the ﬁeld
of F&A, which clearly states that the industry has not fully
realized the potential of data analytics and AI.
This research found that F&A supply chain stages:
‘‘Apparel
Production’’,
‘‘Fabric
Production’’
and
‘‘Distribution’’ received maximum attention when applying
AI techniques, whereas ‘‘Design’’ was the least focused.
Additionally, a signiﬁcant contribution was noted towards
B2B problems compared to B2C. Hence, research needs to
adopt a B2C perspective to be able to offer consumer-oriented
solutions to the industry.
A comprehensive review reveals the research gap and
implication presented in section VI stating that F&A needs a
transformation in their supply chain by using AI techniques at
the industrial level. With this, the industry can move towards
a digital and sustainable supply chain. The implications and
future directions proposed in this study can be beneﬁcial for
academic and industrial researchers, and industrial practition-
ers, who are willing to provide a substantial contribution to
the subject area.
Regardless of this valuable work, there are some lim-
itations to this study. First, the articles were searched in
two databases, while there could be other databases that
are relevant. Second, the publications apart from English
were excluded. There could be valuable research available in
other languages. Third, even though the review process was
completed rigorously, it could still be prone to human error.
Fourth, this study was restricted to researches with an empir-
ical validation of the proposed AI models. There could be
beneﬁcial theoretical and conceptual frameworks in research,
which were missed because of the exclusion criterion. Fifth,
even though the synonyms considered for article retrieval
were carefully decided, the study could have missed some
articles due to different terminology being used. Seventh,
grey literature was excluded from the review process, which
also includes industrial reports. These reports can provide
helpful insights and contribution in this domain.
ACKNOWLEDGMENT
The authors would like to thank and appreciate the support
of the expert researcher for helping us with validating the
proposed taxonomy.
REFERENCES
[1] Lenzing, Statista. Demand Share of Apparel Market Worldwide From
2005 to 2020, by Region. Accessed: May 10, 2019. [Online].
Available: https://www.statista.com/statistics/821457/demand-share-of-
global-apparel-market-by-region/
VOLUME 7, 2019
95391


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
[2] Statista. Worldwide Forecasted Sales Growth in the Fashion Indus-
try in 2019, by Region. Accessed: May 10, 2019. [Online]. Avail-
able: https://www.statista.com/statistics/802943/fashion-industry-sales-
growth-worldwide-by-region/
[3] G. Sweeny, ‘‘It’s the second dirtiest thing in the world—And you’re
wearing it,’’ AlterNet, Aug. 2015.
[4] X. Shang, X. Liu, G. Xiong, C. Cheng, Y. Ma, and T. R. Nyberg,
‘‘Social manufacturing cloud service platform for the mass customization
in apparel industry,’’ in Proc. IEEE Int. Conf. Service Oper. Logistics,
Informat., Jul. 2013, pp. 220–224.
[5] J. H. Thrall, X. Li, Q. Li, C. Cruz, S. Do, K. Dreyer, and J. Brink,
‘‘Artiﬁcial intelligence and machine learning in radiology: Opportunities,
challenges, pitfalls, and criteria for success,’’ J. Amer. College Radiol.,
vol. 15, no. 3, pp. 504–508, 2018.
[6] G. Xiong, F. Zhu, X. Liu, X. Dong, W. Huang, S. Chen, and K. Zhao,
‘‘Cyber-physical-social system in intelligent transportation,’’ IEEE/CAA
J. Autom. Sinica, vol. 2, no. 3, pp. 320–333, Jul. 2015.
[7] X. Xu and Q. Hua, ‘‘Industrial big data analysis in smart factory: Current
status and research strategies,’’ IEEE Access, vol. 5, pp. 17543–17551,
2017.
[8] Z. X. Guo, W. K. Wong, S. Y. S. Leung, and M. Li, ‘‘Applications of
artiﬁcial intelligence in the apparel industry: A review,’’ Text. Res. J.,
vol. 81, no. 18, pp. 1871–1892, 2011.
[9] R. Nayak and R. Padhye, ‘‘Artiﬁcial intelligence and its application
in the apparel industry,’’ in Automation in Garment Manufacturing.
Amsterdam, The Netherlands: Elsevier, 2018, pp. 109–138.
[10] C. K. H. Lee, K. L. Choy, K. M. Y. Law, and G. T. S. Ho, ‘‘An intel-
ligent system for production resources planning in Hong Kong garment
industry,’’ in Proc. IEEE Int. Conf. Ind. Eng. Eng. Manage., Dec. 2012,
pp. 889–893.
[11] G. M. Nasira and P. Banumathi, ‘‘An intelligent system for automatic
fabric inspection,’’ Asian J. Inf. Technol., vol. 13, no. 6, pp. 308–312,
2014.
[12] M.-K. Chen, Y.-H. Wang, and T.-Y. Hung, ‘‘Establishing an order allo-
cation decision support system via learning curve model for apparel
logistics,’’ J. Ind. Prod. Eng., vol. 31, no. 5, pp. 274–285, 2014.
[13] C. Giri, N. Harale, S. Thomassey, and X. Zeng, ‘‘Analysis of consumer
emotions about fashion brands: An exploratory study,’’ in Proc. Data Sci.
Knowl. Eng. Sens. Decis. Support, 2018, pp. 1567–1574.
[14] A. Acharya, S. K. Singh, V. Pereira, and P. Singh, ‘‘Big data, knowledge
co-creation and decision making in fashion industry,’’ Int. J. Inf. Manage.,
vol. 42, pp. 90–101, Oct. 2018.
[15] S. Jain, J. Bruniaux, X. Zeng, and P. Bruniaux, ‘‘Big data in fashion
industry,’’ IOP Conf., Mater. Sci. Eng., vol. 254, no. 15, Oct. 2017,
Art. no. 152005.
[16] E. W. T. Ngai, S. Peng, P. Alexander, and K. K. L. Moon, ‘‘Decision
support and intelligent systems in the textile and apparel supply chain:
An academic review of research articles,’’ Expert Syst. Appl., vol. 41,
no. 1, pp. 81–91, 2014.
[17] P. Yildirim, D. Birant, and T. Alpyildiz, ‘‘Data mining and machine
learning in textile industry,’’ Wiley Interdiscip. Rev. Data Mining Knowl.
Discovery, vol. 8, no. 1, p. e1228, Jan. 2018.
[18] A. Booth, A. Sutton, and D. Papaioannou, Systematic Approaches to a
Successful Literature Review. Newbury Park, CA, USA: Sage, 2016.
[19] S. A. AlRyalat, L. W. Malkawi, and S. M. Momani, ‘‘Comparing biblio-
metric analysis using pubmed, scopus, and Web of science databases,’’ J.
Vis. Express, to be published.
[20] A.
Martín-Martín,
E.
Orduna-Malea,
M.
Thelwall,
and
E. D. López-Cózar, ‘‘Google scholar, Web of science, and scopus:
A systematic comparison of citations in 252 subject categories,’’ J.
Informetrics, vol. 12, no. 4, pp. 1160–1177, Nov. 2018.
[21] B. Mihm, ‘‘Fast fashion in a ﬂat world: Global sourcing strategies,’’ IBER,
vol. 9, no. 6, Jun. 2010.
[22] P. Sen, B2B Marketing Evolution: Customers Demand B2C Experiences.
Accessed: May 10, 2019. [Online]. Available: https://www.the-future-of-
commerce.com/2019/03/14/b2b-marketing-evolution/
[23] J. M. Kozar and K. Y. H. Connell, ‘‘Barriers to socially responsible
apparel purchasing behavior: Are consumers right?’’ in Marketing Ori-
entations in a Dynamic Business World. Cham, Switzerland: Springer,
2017, pp. 79–85.
[24] J. Manyika, M. Chui, B. Brown, J. Bughin, and R. Dobbs, Big Data: The
Next Frontier for Innovation, Competition, and Productivity. McKinsey
Global Institute, 2011.
[25] V. Bhardwaj and A. Fairhurst, ‘‘Fast fashion: Response to changes in the
fashion industry,’’ Int. Rev. Retail, Distrib. Consum. Res., vol. 20, no. 1,
pp. 165–173, Feb. 2010.
[26] R. L. Sandhusen, Marketing. Hauppauge, NY, USA: B.E.S. Publishing,
2008.
[27] G. B. Shelly and H. J. Rosenblatt, Systems Analysis and Design. Borton,
MA, USA: Course Technology, 2011.
[28] M. Singh, ‘‘E-services and their role in B2C e-commerce,’’ Manag.
Service Qual. Int. J., vol. 12, no. 6, pp. 434–446, Dec. 2002.
[29] L. J. Anderson-Connell, P. V. Ulrich, and E. L. Brannon, ‘‘A consumer-
driven model for mass customization in the apparel market,’’ J. Fashion
Marketing Manag. Int. J., vol. 6, no. 3, pp. 240–258, Sep. 2002.
[30] E. Brynjolfsson, Y. J. Hu, and M. S. Rahman, Competing in the Age of
Omnichannel Retailing, vol. 54, no. 4. Cambridge, MA, USA: MIT, 2013.
[31] L. B. Hales, M. L. Hales, and D. T. Collins, ‘‘Improving real-time expert
control systems through deep data mining of plant data and global plant-
wide energy monitoring and analysis,’’ in Proc. SME Annu. Meeting
Exhib., SME, Meeting Preprints, 2012, pp. 414–417.
[32] C.
Murray,
‘‘Retailers’
disconnect
with
shoppers
is
costing
them,’’
A
Forrester
Consulting
Thought
Leadership
Paper
Commissioned By Cognizant, Tech. Rep., 2017. [Online]. Available:
https://www.cognizant.com/whitepapers/retailers-disconnect-with-
shoppers-is-costing-them-codex2693.pdf
[33] Z.-H. Hu and X.-K. Yu, ‘‘Optimization of fast-fashion apparel transship-
ment among retailers,’’ Text. Res. J., vol. 84, no. 20, pp. 2127–2139, 2014.
[34] M. Y. Wong, Y. Zhou, and H. Xu, ‘‘Big data in fashion industry: Color
cycle mining from runway data,’’ in Proc. AMCIS, Surﬁng IT Innov.
Wave-22nd Amer. Conf. Inf. Syst., 2016, pp. 1–10.
[35] C. Bishop, Pattern Recognition and Machine Learning. Springer, 2006.
[36] R. Stuart and P. Norvig, Artiﬁcial Intelligence: A Modern Approach.
Upper Saddle River, NJ, USA: Prentice-Hall, 2009.
[37] M. Mohri, A. Rostamizadeh, and A. Talwalkar, Foundations of Machine
Learning. Cambridge, MA, USA: MIT Press, 2012.
[38] S. V. Kumar and S. Poonkuzhali, ‘‘Improvising the sales of garments
by forecasting market trends using data mining techniques,’’ Int. J. Pure
Appl. Math., vol. 119, no. 7, pp. 797–805, 2018.
[39] S.-W. Hsiao, C.-H. Lee, R.-Q. Chen, and C.-H. Yen, ‘‘An intelligent
system for fashion colour prediction based on fuzzy C-means and gray
theory,’’ Color Res. Appl., vol. 42, no. 2, pp. 273–285, Apr. 2017.
[40] Brahmadeep and S. Thomassey, ‘‘Intelligent demand forecasting systems
for fast fashion,’’ in Information Systems for the Fashion and Apparel
Industry. Woodhead Publishing, 2016, pp. 145–161. [Online]. Avail-
able: https://www.researchgate.net/publication/301345185_Intelligent_
demand_forecasting_systems_for_fast_fashion
[41] A. Ghosh, T. Guha, R. B. Bhar, and S. Das, ‘‘Pattern classiﬁcation
of fabric defects using support vector machines,’’ Int. J. Clothing Sci.
Technol., vol. 23, nos. 2–3, pp. 142–151, 2011.
[42] D. Z. Pavlinić and J. Geršak, ‘‘Design of the system for prediction of
fabric behaviour in garment manufacturing processes,’’ Int. J. Cloth. Sci.
Technol., vol. 16, nos. 1–2, pp. 252–261, 2004.
[43] P. G. Keen, ‘‘Decision support systems: A research perspective,’’ in
Decision Support Systems: Issues and Challenges: Proceedings of an
International Task Force Meeting, 1980, pp. 23–44.
[44] R. H. Sprague, Jr., ‘‘A framework for the development of decision support
systems,’’ MIS Quart., vol. 4, no. 4, pp. 1–26, 1980.
[45] Y. Tu and E. H. H. Yeung, ‘‘Integrated maintenance management sys-
tem in a textile company,’’ Int. J. Adv. Manuf. Technol., vol. 13, no. 6,
pp. 453–462, 1997.
[46] W. K. Wong and S. Y. S. Leung, ‘‘Genetic optimization of fabric uti-
lization in apparel manufacturing,’’ Int. J. Prod. Econ., vol. 114, no. 1,
pp. 376–387, 2008.
[47] P. Jackson, Introduction to Expert Systems, vol. 2. Reading, MA, USA:
Addison-Wesley, 1990.
[48] C. T. Leondes, Expert Systems: The Technology of Knowledge Manage-
ment and Decision Making for the 21st Century. New York, NY, USA:
Academic, 2002.
[49] N. N. Stella and A. O. Chuks, ‘‘Expert system: A catalyst in
educational development in Nigeria,’’ 2011. [Online]. Available:
http://hrmars.com/admin/pics/261.pdf
[50] K. Metaxiotis, ‘‘RECOT: An expert system for the reduction of environ-
mental cost in the textile industry,’’ Inf. Manage. Comput. Secur., vol. 12,
no. 3, pp. 218–227, 2004.
95392
VOLUME 7, 2019


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
[51] W. K. Wong, X. H. Zeng, and W. M. R. Au, ‘‘A decision support tool for
apparel coordination through integrating the knowledge-based attribute
evaluation expert system and the T-S fuzzy neural network,’’ Expert Syst.
Appl., vol. 36, no. 2, pp. 2377–2390, 2009.
[52] G. F. Luger and W. A. Stubbleﬁeld, Artiﬁcial Intelligence: Structures
and Strategies for Complex Problem Solving. San Francisco, CA, USA:
Benjamin Cummings, 1993.
[53] D. Poole, A. Mackworth, and R. Goebel, Computational Intelligence: A
Logical Approach. New York, NY, USA: Oxford Univ. Press, 1998.
[54] N. J. Nilsson, Artiﬁcial Intelligence: A New Synthesis. San Mateo, CA,
USA: Morgan Kaufmann, 1998.
[55] G. Tecuci, ‘‘Artiﬁcial intelligence,’’ Wiley Interdiscip. Rev. Comput.
Statist., vol. 4, no. 2, pp. 168–180, Mar./Apr. 2012.
[56] J. H. Holland, Adaptation in Natural and Artiﬁcial Systems: An Intro-
ductory Analysis With Applications to Biology, Control, and Artiﬁcial
Intelligence. Cambridge, MA, USA: MIT Press, 1992.
[57] J. H. Holland, Genetic Programming Complex Adaptive Systems Genetic
Programming On the Programming of Computers by Means of Natural
Selection. Cambridge, MA, USA: MIT Press, 1992.
[58] R. Guruprasad and B. K. Behera, ‘‘Genetic algorithms and its application
to textiles,’’ Textile Asia, vol. 40, nos. 4–5, pp. 35–38, 2009.
[59] Z.-J. Lu, Q. Xiang, Y.-M. Wu, and J. Gu, ‘‘Application of support
vector machine and genetic algorithm optimization for quality predic-
tion within complex industrial process,’’ in Proc. IEEE Int. Conf. Ind.
Inform. (INDIN), Jul. 2015, pp. 98–103.
[60] P. C. L. Hui, K. C. C. Chan, K. W. Yeung, and F. S. F. Ng, ‘‘Application
of artiﬁcial neural networks to the prediction of sewing performance of
fabrics,’’ Int. J. Cloth. Sci. Technol., vol. 19, no. 5, pp. 291–318, Oct. 2007.
[61] D. H. Ballard and C. M. Brown, Computer Vision. Upper Saddle River,
NJ, USA: Prentice-Hall, 1982.
[62] M. Sonka, V. Hlavac, and R. Boyle, Image Processing: Analysis and
Machine Vision. Boston, MA, USA: Thompson Learning, 2008.
[63] B. Jahne, Computer Vision and Applications: A Guide for Students and
Practitioners. Amsterdam, The Netherlands: Elsevier, 2000.
[64] D. Forsyth and J. Ponce, Computer Vision: A Modern Approach.
Upper Saddle River, NJ, USA: Prentice-Hall, 2003.
[65] T. Morris, Computer Vision and Image Processing—Tim Morris–
Macmillan
International
Higher
Education.
Palgrave
Macmillan.
Accessed:
May
10,
2019.
[Online].
Available:
https://www.
macmillanihe.com/page/detail/computer-vision-and-image-processing-
tim-morris/?sf1=barcode&st1=9780333994511
[66] C. Steger, M. Ulrich, and C. Wiedemann, Machine Vision Algorithms and
Applications. Hoboken, NJ, USA: Wiley, 2018.
[67] C.-F. J. Kuo, C.-L. Lee, and C.-Y. Shih, ‘‘Image database of printed
fabric with repeating dot patterns part (I)—Image archiving,’’ Text. Res.
J., vol. 87, no. 17, pp. 2089–2105, Oct. 2017.
[68] M. Yuan, I. R. Khan, F. Farbiz, S. Yao, A. Niswar, and M.-H. Foo,
‘‘A mixed reality virtual clothes try-on system,’’ IEEE Trans. Multimedia,
vol. 15, no. 8, pp. 1958–1968, Dec. 2013.
[69] G. A. Cushen and M. S. Nixon, ‘‘Markerless real-time garment retextur-
ing from monocular 3D reconstruction,’’ in Proc. IEEE Int. Conf. Signal
Image Process. Appl. (ICSIPA), Nov. 2011, pp. 88–93.
[70] Y. Zhao, J. Song, A. Montazeri, M. M. Gupta, Y. Lin, C. Wang, and
W. J. Zhang, ‘‘Mining affective words to capture customer’s affec-
tive response to apparel products,’’ Text. Res. J., vol. 88, no. 12,
pp. 1426–1436, Jun. 2018.
[71] K. Liu, J. Wang, E. Kamalha, V. Li, and X. Zeng, ‘‘Construction of a
prediction model for body dimensions used in garment pattern making
based on anthropometric data learning,’’ J. Textile Inst., vol. 108, no. 12,
pp. 2107–2114, Apr. 2017.
[72] A. F. Tehrani and D. Ahrens, ‘‘Modiﬁed sequential k-means clustering
by utilizing response: A case study for fashion products,’’ Expert Syst.,
vol. 34, no. 6, Dec. 2017, Art. no. e12226.
[73] B.-R. Li, Y. Wang, and K.-S. Wang, ‘‘A novel method for the evaluation of
fashion product design based on data mining,’’ Adv. Manuf., vol. 5, no. 4,
pp. 370–376, Dec. 2017.
[74] M. Hamad, S. Thomassey, and P. Bruniaux, ‘‘A new sizing system based
on 3D shape descriptor for morphology clustering,’’ Comput. Ind. Eng.,
vol. 113, pp. 683–692, Nov. 2017.
[75] K. Liu, X. Zeng, P. Bruniaux, J. Wang, E. Kamalha, and X. Tao, ‘‘Fit
evaluation of virtual garment try-on by learning from digital pressure
data,’’ Knowl.-Based Syst., vol. 133, pp. 174–182, Oct. 2017.
[76] A. Fallahpour, K. Y. Wong, E. U. Olugu, and S. N. Musa, ‘‘A predictive
integrated genetic-based model for supplier evaluation and selection,’’ Int.
J. Fuzzy Syst., vol. 19, no. 4, pp. 1041–1057, Aug. 2017.
[77] K. J. Ferreira, B. H. A. Lee, and D. Simchi-Levi, ‘‘Analytics for an online
retailer: Demand forecasting and price optimization,’’ Manuf. Service
Oper. Manage., vol. 18, no. 1, pp. 69–88, 2016.
[78] A. F. Tehrani and D. Ahrens, ‘‘Supervised regression clustering: A case
study for fashion products,’’ Int. J. Bus. Anal., vol. 3, no. 4, pp. 21–40,
2016.
[79] P. Q. Brito, C. Soares, S. Almeida, A. Monte, and M. Byvoet, ‘‘Customer
segmentation in a large database of an online customized fashion busi-
ness,’’ Robot. Comput. Integr. Manuf., vol. 36, pp. 93–100, Dec. 2015.
[80] V. Mozafary and P. Payvandy, ‘‘Application of data mining technique
in predicting worsted spun yarn quality,’’ J. Text. Inst., vol. 105, no. 1,
pp. 100–108, 2014.
[81] C.-C. Chen, ‘‘RFID-based intelligent shopping environment: A compre-
hensive evaluation framework with neural computing approach,’’ Neural
Comput. Appl., vol. 25, nos. 7–8, pp. 1685–1697, 2014.
[82] S. M. Darwish, ‘‘Soft computing applied to the build of textile defects
inspection system,’’ IET Comput. Vis., vol. 7, no. 5, pp. 373–381,
Oct. 2013.
[83] C.-Y. Tsai and C.-H. Hsu, ‘‘Developing standard elderly aged female
size charts based on anthropometric data to improve manufacturing using
artiﬁcial neural network-based data mining,’’ Theor. Issues Ergon. Sci.,
vol. 14, no. 3, pp. 258–272, 2013.
[84] J.-F. Liang, J.-M. Liang, and J.-P. Wang, ‘‘Empirical study on B/C apparel
consumption behavior based on data mining technology,’’ J. Donghua
Univ. (English Ed.), vol. 30, no. 6, pp. 530–536, 2013.
[85] H. L. Viktor, I. Peña, and E. Paquet, ‘‘Who are our clients: Consumer
segmentation through explorative data mining,’’ Int. J. Data Mining,
Model. Manage., vol. 4, no. 3, pp. 286–308, 2012.
[86] Y. Yu, T.-M. Choi, and C.-L. Hui, ‘‘An intelligent fast sales forecast-
ing model for fashion products,’’ Expert Syst. Appl., vol. 38, no. 6,
pp. 7373–7379, 2011.
[87] B. Karthikeyan and L. M. Sztandera, ‘‘Analysis of tactile perceptions
of textile materials using artiﬁcial intelligence techniques: Part 1: For-
ward engineering,’’ Int. J. Clothing Sci. Technol., vol. 22, nos. 2–3,
pp. 187–201, 2010.
[88] C.-H. Hsu, ‘‘Data mining to improve industrial standards and enhance
production and marketing: An empirical study in apparel industry,’’
Expert Syst. Appl., vol. 36, no. 3, pp. 4185–4191, 2009.
[89] C. Altinoz, ‘‘Supplier selection for industry: A fuzzy rule-based scoring
approach with a focus on usability,’’ Int. J. Integr. Supply Manage., vol. 4,
nos. 3–4, pp. 303–321, 2008.
[90] A. E. Amin, A. S. El-Geheni, I. A. El-Hawary, and R. A. El-Beali,
‘‘Detecting the fault from spectrograms by using genetic algorithm tech-
niques,’’ Autex Res. J., vol. 7, no. 2, pp. 80–88, 2007.
[91] P. N. Koustoumpardis, J. S. Fourkiotis, and N. A. Aspragathos, ‘‘Intelli-
gent evaluation of fabrics’ extensibility from robotized tensile test,’’ Int.
J. Clothing Sci. Technol., vol. 19, no. 2, pp. 80–98, 2007.
[92] C.-H. Hsu and M.-J. J. Wang, ‘‘Using innovative technology to establish
sizing systems,’’ Int. J. Innov. Learn., vol. 2, no. 3, pp. 233–245, 2005.
[93] I. Soufﬂet, M. Calonnier, and C. Dacremont, ‘‘A comparison between
industrial experts’ and novices’ haptic perceptual organization: A tool
to identify descriptors of the handle of fabrics,’’ Food Qual. Preference,
vol. 15, nos. 7–8, pp. 689–699, 2004.
[94] K.-Y. Jung, Y.-J. Na, and J.-H. Lee, ‘‘Creating user-adapted design rec-
ommender system through collaborative ﬁltering and content based ﬁlter-
ing,’’ in Proc. Portuguese Conf. Artif. Intell. Berlin, Germany: Springer,
2003, pp. 204–208.
[95] S. Sette and L. Boullart, ‘‘An implementation of genetic algorithms for
rule based machine learning,’’ Eng. Appl. Artif. Intell. , vol. 13, no. 4,
pp. 381–390, 2000.
[96] C. K. Park, D. H. Lee, and T. J. Kang, ‘‘A new evaluation of seam pucker
and its applications,’’ Int. J. Clothing Sci. Technol., vol. 9, nos. 2–3,
pp. 252–255, 1997.
[97] A. Aksoy and N. Öztürk, ‘‘Design of an intelligent decision support
system for global outsourcing decisions in the apparel industry,’’ J. Text.
Inst., vol. 107, no. 10, pp. 1322–1335, 2016.
[98] C. K. H. Lee, Y. K. Tse, G. T. S. Ho, and K. L. Choy, ‘‘Fuzzy association
rule mining for fashion product development,’’ Ind. Manage. Data Syst.,
vol. 115, no. 2, pp. 383–399, 2015.
VOLUME 7, 2019
95393


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
[99] Z.-H. Hu, C. Wei, and X.-K. Yu, ‘‘Apparel distribution with uncertain try-
on time by evolutionary algorithm,’’ Int. J. Clothing Sci. Technol., vol. 27,
no. 1, pp. 75–90, 2015.
[100] A. S. Kumar and V. M. Bhaskaran, ‘‘Multidirectional product decision
support system for user activation assessment in textile industry using
collaborative ﬁltering methods,’’ Int. J. Appl. Eng. Res., vol. 10, no. 20,
pp. 17205–17209, 2015.
[101] C. K. H. Lee, K. L. Choy, K. M. Y. Law, and G. T. S. Ho, ‘‘Application of
intelligent data management in resource allocation for effective operation
of manufacturing systems,’’ J. Manuf. Syst., vol. 33, no. 3, pp. 412–422,
2014.
[102] D. Nakandala, P. Samaranayake, and H. C. W. Lau, ‘‘A fuzzy-based
decision support model for monitoring on-time delivery performance:
A textile industry case study,’’ Eur. J. Oper. Res., vol. 225, no. 3,
pp. 507–517, 2013.
[103] B. Rabenasolo and X. Zeng, ‘‘A risk-based multi-criteria decision sup-
port system for sustainable development in the textile supply chain,’’ in
Handbook on Decision Making (Intelligent Systems Reference Library),
vol. 33, J. Lu, L. C. Jain, and G. Zhang, Eds. Berlin, Germany: Springer,
2012.
[104] A. Aksoy, N. Ozturk, and E. Sucky, ‘‘A decision support system for
demand forecasting in the clothing industry,’’ Int. J. Clothing Sci. Tech-
nol., vol. 24, no. 4, pp. 221–236, 2012.
[105] D. Kumar, J. Singh, and O. P. Singh, ‘‘A decision support system for
supplier selection for Indian textile industry using analytic hierarchy
process based on fuzzy simulation,’’ Int. J. Bus. Perform. Supply Chain
Model., vol. 3, no. 4, pp. 364–382, 2011.
[106] A. Majumdar, R. Mangla, and A. Gupta, ‘‘Developing a decision support
system software for cotton ﬁbre grading and selection,’’ Indian J. Fibre
Text. Res., vol. 35, no. 3, pp. 195–200, 2010.
[107] S. Chakraborty and K. Prasad, ‘‘A quality function deployment-based
expert system for cotton ﬁbre selection,’’ J. Inst. Eng. E, vol. 99, no. 1,
pp. 43–53, Jun. 2018.
[108] V. Istrat and N. Lalić, ‘‘Association rules as a decision making model in
the textile industry,’’ Fibres Text. Eastern Eur., vol. 25, no. 4, pp. 8–14,
2017.
[109] K.
Santiago-Santiago,
A.
L.
Laureano-Cruces,
J. M. A. Antuñano-Barranco,
O.
Domínguez-Pérez,
and
E. Sarmiento-Bustos, ‘‘An expert system to improve the functioning
of the clothing industry,’’ Int. J. Clothing Sci. Technol., vol. 27, no. 1,
pp. 99–128, 2015.
[110] C. K. H. Lee, G. T. S. Ho, K. L. Choy, and G. K. H. Pang, ‘‘A RFID-based
recursive process mining system for quality assurance in the garment
industry,’’ Int. J. Prod. Res., vol. 52, no. 14, pp. 4216–4238, 2014.
[111] S. Jamal, H. Esmaeil, and S. E. Maryam, ‘‘Developing a hybrid intelligent
model for constructing a size recommendation expert system in textile
industries,’’ Int. J. Clothing Sci. Technol., vol. 25, no. 5, pp. 338–349,
2013.
[112] C. K. H. Lee, K. L. Choy, G. T. S. Ho, K. S. Chin, K. M. Y. Law, and
Y. K. Tse, ‘‘A hybrid OLAP-association rule mining based quality man-
agement system for extracting defect patterns in the garment industry,’’
Expert Syst. Appl., vol. 40, no. 7, pp. 2435–2446, 2013.
[113] Y. Yu, C.-L. Hui, and T.-M. Choi, ‘‘An empirical study of intelligent
expert systems on forecasting of fashion color trend,’’ Expert Syst. Appl.,
vol. 39, no. 4, pp. 4383–4389, 2012.
[114] W. K. Wong, S. Y. S. Leung, Z. X. Guo, X. H. Zeng, and P. Y. Mok,
‘‘Intelligent product cross-selling system with radio frequency identi-
ﬁcation technology for retailing,’’ Int. J. Prod. Econ., vol. 135, no. 1,
pp. 308–319, 2012.
[115] W.-S. Lo, T.-P. Hong, and R. Jeng, ‘‘A framework of E-SCM multi-agent
systems in the fashion industry,’’ Int. J. Prod. Econ., vol. 114, no. 2,
pp. 594–614, 2008.
[116] C. Rong-Chang, L. Chih-Chang, and L. Shiue-Shiun, ‘‘An automatic
decision support system based on genetic algorithm for global apparel
manufacturing,’’ Int. J. Soft Comput., vol. 1, no. 1, pp. 17–21, 2006.
[117] T. W. Lau, P. C. L. Hui, F. S. F. Ng, and K. C. C. Chan, ‘‘A new
fuzzy approach to improve fashion product development,’’ Comput. Ind.,
vol. 57, no. 1, pp. 82–92, 2006.
[118] I. P. Tatsiopoulos, S. T. Ponis, and E. A. Hadzilias, ‘‘An e-releaser of
production orders in the extended enterprise,’’ Prod. Planning Control,
vol. 15, no. 2, pp. 119–132, 2004.
[119] Y. Liu and Z.-F. Geng, ‘‘Three-dimensional garment computer aided
intelligent design,’’ J. Ind. Text., vol. 33, no. 1, pp. 43–54, 2003.
[120] W. D. Cooper and C. Saydam, ‘‘A general decision support systems
approach to the port scheduling problem for pressure beck operations,’’
J. Text. Inst., vol. 94, nos. 1–2, pp. 1–11, 2003.
[121] C. Saydam and W. D. Cooper, ‘‘A decision support system for scheduling
jobs on multi-port dyeing machines,’’ Int. J. Oper. Prod. Manage., vol. 22,
nos. 9–10, pp. 1054–1065, 2002.
[122] C. Jarvis, S. Davis, B. Kernodle, W. Masuchun, and S. AngannaMuthu,
‘‘Decision support for balanced inventory ﬂow replenishment system,’’
Int. J. Clothing Sci. Technol., vol. 12, no. 6, pp. 100–102, 2000.
[123] R. Convert, L. Schacher, and P. Viallier, ‘‘An expert system for the dyeing
recipes determination,’’ J. Intell. Manuf. , vol. 11, no. 2, pp. 145–155,
2000.
[124] C. Eckert, I. A. N. Kelly, and M. Stacey, ‘‘Interactive generative systems
for conceptual design: An empirical perspective,’’ Artif. Intell. Eng. Des.
Anal. Manuf., vol. 13, no. 4, pp. 303–320, 1999.
[125] C. A. B. e Costa, L. Ensslin, E. C. Corrêa, and J.-C. Vansnick, ‘‘Deci-
sion support systems in action: Integrated application in a multicriteria
decision aid process,’’ Eur. J. Oper. Res., vol. 113, no. 2, pp. 315–335,
1999.
[126] L. J. Anderson, C. Warﬁeld, M. Barry, and C. Emery, ‘‘Toward a national
model of an electronic decision support system for domestic sourcing of
textiles and apparel,’’ Clothing Text. Res. J., vol. 15, no. 2, pp. 65–75,
1997.
[127] C. K. Park, D. H. Lee, and T. Kang, ‘‘Knowledge-base construction of
a garment manufacturing expert system,’’ Int. J. Clothing Sci. Technol.,
vol. 8, no. 5, pp. 11–28, 1996.
[128] E. K. Bye and M. R. DeLong, ‘‘A visual sensory evaluation of the results
of two pattern grading methods,’’ Clothing Text. Res. J., vol. 12, no. 4,
pp. 1–7, 1994.
[129] G. Martino, R. Iannnone, M. Fera, S. Miranda, and S. Riemma, ‘‘Fashion
retailing: A framework for supply chain optimization,’’ Uncertain Supply
Chain Manage., vol. 5, no. 3, pp. 243–272, 2017.
[130] C. K. H. Lee, K. L. Choy, G. T. S. Ho, and C. H. Y. Lam, ‘‘A slip-
pery genetic algorithm-based process mining system for achieving better
quality assurance in the garment industry,’’ Expert Syst. Appl., vol. 46,
pp. 236–248, Mar. 2016.
[131] G. Martino, B. Yuce, R. Iannone, and M. S. Packianather, ‘‘Optimisation
of the replenishment problem in the fashion retail industry using Tabu-
Bees algorithm,’’ IFAC-PapersOnLine, vol. 49, no. 12, pp. 1685–1690,
2016.
[132] F. Caro and J. Gallien, ‘‘Inventory management of a fast-fashion retail
network,’’ Oper. Res., vol. 58, no. 2, pp. 257–273, 2010.
[133] S.-S. Li, R.-C. Chen, and C.-C. Lin, ‘‘A genetic algorithm-based decision
support system for allocating international apparel demand,’’ WSEAS
Trans. Inf. Sci. Appl., vol. 3, no. 7, pp. 1294–1299, 2006.
[134] N. Werghi, Y. Xiao, and J. P. Siebert, ‘‘A functional-based segmentation
of human body scans in arbitrary postures,’’ IEEE Trans. Syst., Man,
Cybern., B, Cybern., vol. 36, no. 1, pp. 153–165, Feb. 2006.
[135] S. Sette and L. Boullart, ‘‘Genetic programming: Principles and applica-
tions,’’ Eng. Appl. Artif. Intell., vol. 14, no. 6, pp. 727–736, 2001.
[136] N. I. Karacapilidis and C. P. Pappis, ‘‘Production planning and control in
textile industry: A case study,’’ Comput. Ind., vol. 30, no. 2, pp. 127–144,
1996.
[137] Y. Shin, Y. Kim, and E. Y. Kim, ‘‘Automatic textile image annotation by
predicting emotional concepts from visual features,’’ Image Vis. Comput.,
vol. 28, no. 3, pp. 526–537, 2010.
[138] C. W. M. Yuen, W. K. Wong, S. Q. Qian, L. K. Chan, and
E. H. K. Fung, ‘‘A hybrid model using genetic algorithm and neural
network for classifying garment defects,’’ Expert Syst. Appl., vol. 36,
no. 2, pp. 2037–2047, 2009.
[139] W. K. Wong, C. W. M. Yuen, D. D. Fan, L. K. Chan, and E. H. K. Fung,
‘‘Stitching defect detection and classiﬁcation using wavelet transform and
BP neural network,’’ Expert Syst. Appl., vol. 36, no. 2, pp. 3845–3856,
Mar. 2009.
[140] C. W. M. Yuen, W. K. Wong, S. Q. Qian, D. D. Fan, L. K. Chan, and
E. H. K. Fung, ‘‘Fabric stitching inspection using segmented window
technique and BP neural network,’’ Text. Res. J., vol. 79, no. 1, pp. 24–35,
2009.
[141] Q. Lu, Z.-J. Lyu, Q. Xiang, Y. Zhou, and J. Bao, ‘‘Research on data mining
service and its application case in complex industrial process,’’ in Proc.
IEEE Int. Conf. Autom. Sci. Eng., Aug. 2017, pp. 1124–1129.
[142] D. Banerjee, N. Ganguly, S. Sural, and K. S. Rao, ‘‘One for the road:
Recommending male street attire,’’ in Proc. Paciﬁc–Asia Conf. Knowl.
Discovery Data Mining, 2018, pp. 571–582.
95394
VOLUME 7, 2019


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
[143] D. Venkataraman, N. Vinay, T. V. Vamsi, S. P. Boppudi, R. Y. Reddy,
and P. Balasubramanian, ‘‘Yarn price prediction using advanced analytics
model,’’ in Proc. IEEE Int. Conf. Comput. Intell. Comput. Res. (ICCIC),
Dec. 2016, pp. 1–8.
[144] C. Fiarni, H. Maharani, and R. Pratama, ‘‘Sentiment analysis system
for Indonesia online retail shop review using hierarchy Naive Bayes
technique,’’ in Proc. 4th Int. Conf. Inf. Commun. Technol. (ICoICT),
May 2016, pp. 1–6.
[145] W. Lin and Z. Miao, ‘‘The construction of fabric grading model based
on SOM algorithm,’’ in Proc. Int. Conf. Intell. Transp., Big Data Smart
City (ICITBS), Dec. 2015, pp. 841–843.
[146] M. Wong, Y. Zhou, and H. Xu, ‘‘Big data in fashion industry: Color cycle
mining from runway data,’’ in Proc. 22nd Amer. Conf. Inf. Syst., 2016,
pp. 1–10.
[147] A. P. Martins, P. Bruniaux, and S. Thomassey, ‘‘Cluster-based sales
forecasting of fast fashion using linguistic variables and ELM,’’ in Proc.
12th Int. FLINS Conf. Uncertainty Modeling Knowl. Eng. Decis. Making,
2016, pp. 978–983.
[148] D. Siegmund, A. Kuijper, and A. Braun, ‘‘Stereo-image normalization
of voluminous objects improves textile defect recognition,’’ in Proc. Int.
Symp. Vis. Comput. Cham, Switzerland: Springer, 2016, pp. 181–192.
[149] J. B. Pérez, A. G. Arrieta, A. H. Encinas, and A. Q. Dios, ‘‘Textile
engineering and case based reasoning,’’ in Proc. 13th Int. Conf. Distrib.
Comput. Artif. Intell., vol. 474, 2016, pp. 423–431.
[150] D. P. P. Mesquita, A. N. A. Neto, J. F. de Queiroz Neto, J. P. P. Gomes,
and L. R. Rodrigues, ‘‘Using robust extreme learning machines to predict
cotton yarn strength and hairiness,’’ in Proc. 24th Eur. Symp. Artif. Neural
Netw. (ESANN), 2016, pp. 65–70.
[151] C. D. Kreyenhagen, T. I. Aleshin, J. E. Bouchard, A. M. I. Wise, and
R. K. Zalegowski, ‘‘Using supervised learning to classify clothing brand
styles,’’ in Proc. IEEE Syst. Inf. Eng. Design Symp. (SIEDS), Apr. 2014,
pp. 239–243.
[152] A. Kitipong, W. Rueangsirasak, and R. Chaisricharoen, ‘‘Classiﬁcation
system for traditional textile: Case study of the batik,’’ in Proc. 13th
Int. Symp. Commun. Inf. Technol., Commun. Inf. Technol. New Life Style
Beyond Cloud (ISCIT), Sep. 2013, pp. 767–771.
[153] P. F. Li, J. Wang, H. H. Zhang, and J. F. Jing, ‘‘Automatic woven fabric
classiﬁcation based on support vector machine,’’ in Proc. Int. Conf.
Autom. Control Artif. Intell. (ACAI), no. 598, Mar. 2012, pp. 581–584.
[154] N. A. Khalifa, S. M. Darwish, and M. A. El-Iskandarani, ‘‘Automated
textile defects recognition system using computer vision and interval
type-2 fuzzy logic,’’ in Proc. 1st Int. Conf. Innov. Eng. Syst. (ICIES),
Dec. 2012, pp. 148–153.
[155] E. Yesil, M. Kaya, and S. Siradag, ‘‘Fuzzy forecast combiner design for
fast fashion demand forecasting,’’ in Proc. Int. Symp. Innov. Intell. Syst.
Appl., Jul. 2012, pp. 1–5.
[156] X. G. Wang, X. Z. Li, and Y. Li, ‘‘Application of cluster algo-
rithm in clothes shape classifying,’’ Appl. Mech. Mater., vols. 55–57,
pp. 1058–1062, May 2011.
[157] X. Chen, Y. Luo, and F. Zhu, ‘‘The application of data mining in FFE
of the fashion product development,’’ in Proc. Int. Symp. Comput. Intell.
Design (ISCID), vol. 1, Oct. 2010, pp. 215–217.
[158] L. Z. Fan and Q. Qiao, ‘‘Research on a fashion knowledge management
platform for women garment development,’’ in Proc. Int. Conf. Manage.
Service Sci. (MASS), Aug. 2010, pp. 1–3.
[159] Y. Li, V. E. Kuzmichev, Y. Luo, and X. Wang, ‘‘Garment industry ori-
ented clothes shape classifying by cluster,’’ in Proc. 2nd Int. Conf. Ind.
Mechatronics Automat. (ICIMA), vol. 2, May 2010, pp. 472–475.
[160] M. Selvanayaki, M. S. Vijaya, K. S. Jamuna, and S. Karpagavalli,
‘‘Supervised learning approach for predicting the quality of cotton using
WEKA,’’ in Proc. Int. Conf. Bus. Admin. Inf. Process., vol. 70, 2010,
pp. 382–384.
[161] I. Peña, H. L. Viktor, and E. Paquet, ‘‘Explorative data mining for the
sizing of population groups,’’ in Proc. 1st Int. Conf. Knowl. Discovery
Inf. Retr. (KDIR), 2009, pp. 152–159.
[162] L. Koehl, X. Zeng, M. Camargo, C. Fonteix, and F. Delmotte, ‘‘Analysis
and identiﬁcation of fashion oriented industrial products using fuzzy logic
techniques,’’ in Proc. 3rd Int. Conf. Intell. Syst. Knowl. Eng. (ISKE),
Nov. 2008, pp. 465–470.
[163] J. De Armas, C. León, G. Miranda, and C. Segura, ‘‘Remote service to
solve the two-dimensional cutting stock problem: An application to the
canary islands costume,’’ in Proc. 2nd Int. Conf. Complex, Intell. Softw.
Intensive Syst. (CISIS), Mar. 2008, pp. 971–976.
[164] S. Ierace, R. Pinto, and S. Cavalieri, ‘‘Application of neural networks to
condition based maintenance: A case study in the textile industry,’’ IFAC
Proc. Vols., vol. 40, no. 3, pp. 147–152, 2007.
[165] N. Y. Kim, Y. Shin, and E. Y. Kim, ‘‘Emotion-based textile indexing using
neural networks,’’ in Proc. Int. Symp. Consum. Electron. (ISCE), 2007,
pp. 349–357.
[166] S. Da Silva Camargo and P. M. Engel, ‘‘MiRABIT: A new algorithm
for mining association rules,’’ in Proc. Int. Conf. Chilean Comput. Sci.
Soc. (SCCC), Nov. 2002, pp. 162–166.
[167] Y. Kita and N. Kita, ‘‘A model-driven method of estimating the state of
clothes for manipulating it,’’ in Proc. IEEE Workshop Appl. Comput. Vis.,
Dec. 2002, pp. 63–69.
[168] T. Sano and H. Yamamoto, ‘‘Intelligent CAD system for Japanese
kimono,’’ in Proc. 26th Annu. Conf. IEEE Ind. Electron. Soc. (IECON),
vol. 1, Oct. 2000, pp. 942–947.
[169] J. Shao, Z. Zhao, J. Wang, and P. Song, ‘‘Production management and
decision system oriented to the textile enterprise based on multi-agent,’’
in Proc. Int. Conf. Comput. Design Appl. (ICCDA), vol. 4, Jun. 2010,
pp. V445–V449.
[170] Y. Chen and L.-C. Wang, ‘‘Fuzzy logic of matching sense on fashion
image,’’ in Proc. 4th Int. Conf. Natural Comput. (ICNC), vol. 7, Oct. 2008,
pp. 85–89.
[171] M. Min, ‘‘A rule based expert system for analysis of mobile sales data
on fashion market,’’ in Proc. Int. Conf. Inf. Sci. Appl. (ICISA), Jun. 2013,
pp. 1–2.
[172] Z.-J. Lv, Q. Xiang, and J.-G. Yang, ‘‘A novel data mining method on
quality control within spinning process,’’ Appl. Mech. Mater., vol. 224,
pp. 87–92, Nov. 2012.
[173] Z. Xue, X. Zeng, L. Koehl, and Y. Chen, ‘‘Development of a fuzzy
inclusion measure for investigating relations between visual and tactile
perception of textile products,’’ in Proc. IEEE Int. Conf. Multisensor
Fusion Integr. Intell. Syst., Sep. 2012, pp. 108–113.
[174] B. S. Villanueva and M. Sànchez-Marrè, ‘‘Case-based reasoning applied
to textile industry processes,’’ in Proc. Int. Conf. Case-Based Reasoning.
Berlin, Germany: Springer, 2012, pp. 428–442.
[175] L.-C. Wang, Y. Chen, and Y. Wang, ‘‘Formalization of fashion sensory
data based on fuzzy set theory,’’ in Proc. 4th Int. Conf. Natural Com-
put. (ICNC), vol. 7, Oct. 2008, pp. 80–84.
[176] J. L. Su, Z. Ouyang, and Y. Chen, ‘‘Design of agile infrastructure for
manufacturing system with FNN based Web-enabled technology solu-
tions,’’ in Proc. 7th Int. Conf. Intell. Syst. Design Appl. (ISDA), Oct. 2007,
pp. 79–83.
[177] R.-C. Chen, S.-S. Li, C.-C. Lin, and T.-S. Chen, ‘‘Application of
self-adaptive genetic algorithm on allocating international demand to
global production facilities,’’ in Proc. World Congr. Intell. Control
Automat. (WCICA), vol. 2, Jun. 2006, pp. 7152–7156.
[178] R.-C. Chen, S.-S. Li, C.-C. Lin, and C.-C. Feng, ‘‘A GA-based global
decision support system for garment production,’’ in Proc. Int. Conf.
Neural Netw. Brain (ICNNB), vol. 2, Oct. 2005, pp. 805–809.
[179] M. H. F. Zarandi and M. Esmaeilian, ‘‘A systematic fuzzy model-
ing for scheduling of textile manufacturing system,’’ in Proc. Annu.
Conf. North Amer. Fuzzy Inf. Process. Soc. (NAFIPS), Jul. 2003,
pp. 359–364.
[180] G. S. Loo, B. C. P. Tang, and L. Janczewski, ‘‘An adaptable human-
agent collaboration information system in manufacturing (HACISM),’’
in Proc. Int. Workshop Database Expert Syst. Appl. (DEXA), Sep. 2000,
pp. 445–449.
[181] G. Gonçalves, J. B. De Sousa, and F. L. Pereira, ‘‘The development of
an integrated decision support system for a textile company: A systems
engineering approach,’’ in Proc. Eur. Control Conf. (ECC), Jul. 1997,
pp. 3543–3548.
[182] G. Brewka and C. Habel, ‘‘KI-97: Advances in artiﬁcial intelligence,’’ in
Proc. 21st Annu. German Conf. Artif. Intell., vol. 21. Freiburg, Germany:
Springer, Sep. 1997.
[183] D. A. Xerokostas and K. G. Aravossis, ‘‘A solution procedure for solving
the nonrectangular cutting stock problem of the clothing industry using
expert knowledge within an intelligent CAD environment,’’ in Proc. Int.
Conf. Database Expert Syst. Appl. Berlin, Germany: Springer, 1994,
pp. 214–224.
[184] P. T. Kleeman, T. A. Calogero, C. L. Cromwell, J. D. Nan,
P. F. Sanborn, and P. B. Wright, ‘‘A computer integrated system for
autonomous management of production (illustrated by applications in
textile manufacturing),’’ in Proc. Rensselaer’s 2nd Int. Conf. Comput.
Integr. Manuf., May 1990, pp. 324–330.
VOLUME 7, 2019
95395


---

C. Giri et al.: Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry
[185] N. Klement, C. Silva, and O. Gibaru, ‘‘Solving a discrete lot siz-
ing and scheduling problem with unrelated parallel machines and
sequence dependent setup using a generic decision support tool,’’
in Proc. IFIP Int. Conf. Adv. Prod. Manage. Syst., vol. 513, 2017,
pp. 459–466.
[186] A. Uber, Jr., P. J. de Freitas Filho, and R. A. Silveira, ‘‘E-HIPS: An
extention of the framework HIPS for stagger of distributed process in pro-
duction systems based on multiagent systems and memetic algorithms,’’
in Proc. Mex. Int. Conf. Artif. Intell. Cham, Switzerland: Springer, 2015,
pp. 413–430.
[187] P. Y. Mok, ‘‘Intelligent apparel production planning for optimizing man-
ual operations using fuzzy set theory and evolutionary algorithms,’’ in
Proc. 5th Int. Workshop Genetic Evol. Fuzzy Syst. Symp. Comput. Intell.
(IEEE GEFS SSCI), Apr. 2011, pp. 103–110.
[188] L. S. Admuthe and S. D. Apte, ‘‘Computational model using ANFIS
and GA: Application for textile spinning process,’’ in Proc. 2nd
IEEE Int. Conf. Comput. Sci. Inf. Technol. (ICCSIT), Aug. 2009,
pp. 110–114.
[189] L. Suyi and Z. Leduo, ‘‘Textile pattern generation technique based
on quasi-regular pattern theory and their transform,’’ in Proc. Paciﬁc-
Asia Workshop Comput. Intell. Ind. Appl. (PACIIA), vol. 2, Dec. 2008,
pp. 264–266.
[190] D. Wen, G. Liu, Y. Zhou, and S. Jin, ‘‘The study of enhancing authenticity
of cloth surface intersection processing,’’ in Proc. Paciﬁc-Asia Workshop
Comput. Intell. Ind. Appl. (PACIIA), vol. 1, Dec. 2008, pp. 977–981.
[191] S. Vorasitchai and S. Madarasmi, ‘‘Improvements on layout of garment
patterns for efﬁcient fabric consumption,’’ in Proc. IEEE Int. Symp.
Circuits Syst., vol. 4, May 2003, pp. IV552–IV555.
[192] J. Távora and H. Coelho, ‘‘A path planner for the cutting of nested
irregular layouts,’’ in Proc. Portuguese Conf. Artif. Intell., in Lecture
Notes in Computer Science, vol. 390, 1989, pp. 246–256.
[193] B. Kalra, K. Srivastava, and M. Prateek, ‘‘Computer vision based person-
alized clothing assistance system: A proposed model,’’ in Proc. 2nd Int.
Conf. Next Gener. Comput. Technol. (NGCT), Oct. 2016, pp. 341–346.
[194] M. T. Habib, S. B. Shuvo, M. S. Uddin, and F. Ahmed, ‘‘Automated
textile defect classiﬁcation by Bayesian classiﬁer based on statistical
features,’’ in Proc. Int. Workshop Comput. Intell. (IWCI), Dec. 2016,
pp. 101–105.
[195] Y.-I. Ha, S. Kwon, M. Cha, and J. Joo, ‘‘Fashion conversation data on
instagram,’’ in Proc. 11th Int. Conf. Web Social Media (ICWSM), 2017,
pp. 418–427.
[196] D. Siegmund, T. Samartzidis, B. Fu, A. Braun, and A. Kuijper, ‘‘Fiber
defect detection of inhomogeneous voluminous textiles,’’ in Proc. Mex.
Conf. Pattern Recognit., 2017, pp. 278–287.
[197] S. Jiang, M. Shao, C. Jia, and Y. Fu, ‘‘Consensus style centraliz-
ing auto-encoder for weak style classiﬁcation,’’ in Proc. AAAI, 2016,
pp. 1223–1229.
[198] L. Fan and G. Jiang, ‘‘Optimized Gabor ﬁlter parameters for uniform
texture ﬂaw detection,’’ in Proc. IEEE Int. Conf. Intell. Syst. Knowl.
Eng. (ISKE), Nov. 2010, pp. 173–176.
[199] V. Carvalho, F. Soares, and R. Vasconcelos, ‘‘Artiﬁcial intelligence and
image processing based techniques: A tool for yarns parameterization
and fabrics prediction,’’ in Proc. IEEE Conf. Emerg. Technol. Factory
Automat. (ETFA), Sep. 2009, pp. 1–4.
[200] I. Amed, A. Balchandani, M. Beltrami, A. Berg, S. Hedrich, and
F. Rölkens, ‘‘The state of fashion 2019: A year of awakening,’’
McKinsey
&
Company,
Nov.
2018.
[Online].
Available:
https://www.mckinsey.com/industries/retail/our-insights/the-state-
of-fashion-2019-a-year-of-awakening
[201] T. G. Dietterich, ‘‘Ensemble learning,’’ Handbook Brain Theory Neural
Netw., vol. 2, pp. 110–125, Mar. 2002.
[202] C. Zhang and Y. Ma, Ensemble Machine Learning: Methods and Appli-
cations. New York, NY, USA: Springer, 2012.
[203] K. Ramasubramanian and A. Singh, ‘‘Deep learning using keras and
tensorﬂow,’’ in Machine Learning With R. Berkeley, CA, USA: Apress,
2019, pp. 667–688.
[204] C. Szegedy, V. Vanhoucke, S. Ioffe, J. Shlens, and Z. Wojna,
‘‘Rethinking the inception architecture for computer vision,’’ in Proc.
IEEE Conf. Comput. Vis. Pattern Recognit. (CVPR), Jun. 2016,
pp. 2818–2826.
[205] M. Boeckhout, G. A. Zielhuis, and A. L. Bredenoord, ‘‘The FAIR guiding
principles for data stewardship: Fair enough?’’ Eur. J. Hum. Genet.,
vol. 26, no. 7, pp. 931–936, May 2018.
CHANDADEVI GIRI received the M.Sc. degree in
big data systems from National Research Univer-
sity, Moscow, in 2015. She is currently pursuing
the Ph.D. degree through the framework of Era-
mus Mundus Joint Doctorate Program-Sustainable
Management and Design of Textile (SMDTex).
She was a Senior Analyst for a multinational IT
consultant company Cognizant Technology Solu-
tions, Mumbai, for three years. She has been an
Erasmus Scholar, since 2017. Her research was
supported by the European Commission. She is afﬁliated with three univer-
sities including the ENSAIT, Lille University of Science and Technology,
France, the University of Boras, Sweden, and Soochow University, China.
Her current research interests include artiﬁcial intelligence, recommendation
systems, big data analytics, predictive modeling, machine learning, and
expert systems.
SHEENAM JAIN received the B.Tech. degree
from BMIET, India, in 2014, and the master’s
degree in fashion technology from NIFT, New
Delhi, India, in 2016. She is currently pursu-
ing the Ph.D. degree through the framework
of Erasmus Mundus Joint Doctorate Program-
Sustainable Management and Design of Textile
(SMDTex) afﬁliated by three universities, includ-
ing ENSAIT/GEMTEX, the Lille University of
Science and Technology, France, the University of
Boras, Sweden, and Soochow University, China. She is also an Erasmus
Scholar. Her research was supported by the European Commission. Her
current research interests include big data, artiﬁcial intelligence, recommen-
dation systems, apparel industry, digitalization, and the mass customization
of apparel.
XIANYI
ZENG
received the B.Eng. degree
from Tsinghua University, Beijing, China, in
1986, and the Ph.D. degree from the Centre
d’Automatique, Université des Sciences et Tech-
nologies de Lille, Villeneuve-d’Ascq, France, in
1992. He is currently a Professor with the Ecole
Nationale Supérieure des Arts et Industries Tex-
tiles (ENSAIT), Roubaix, France, and the Direc-
tor of the GEMTEX Laboratory, Roubaix. His
research interests include intelligent decision sup-
port systems for fashion and material design, and the modeling and analysis
of human perception and cognition on industrial products and their integra-
tion into virtual products.
PASCAL BRUNIAUX was born in Denain, France,
in 1959. He received the Ph.D. degree in auto-
matics from the Lille University of Science and
Technology, Villeneuve d’Ascq, France, in 1988.
In 2007, he became a Full Professor in computer,
automatic, and signal processing. He has published
over 17 scientiﬁc book chapters, one scientiﬁc
book, and 42 papers in reviewed international jour-
nals. He has presented over 97 papers at interna-
tional conferences. He is a Supervisor of 22 Ph.D.
students. His research interests include the modeling of textile structures,
the modeling and virtualization of the human being, the analysis of textile
comfort and consumer well-being, supervised and unsupervised classiﬁca-
tion of 3-D morphologies, the analysis of the process of customization of
clothing, and setting up the virtual tailor.
95396
VOLUME 7, 2019
