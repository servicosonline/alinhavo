---
title: 'IOP Conference Series:'
id: iop-conference-series
tags:
- modelista-producao-moda-dores-0698af
- locus-prototipagem-virtual-3d-vs-peca-piloto-fisica
created: '2026-11-27T04:21:25.323643Z'
source: https://iopscience.iop.org/article/10.1088/1757-899X/1031/1/012039/pdf
source_domain: iopscience.iop.org
fetched_at: '2026-11-27T04:21:25.321633Z'
fetch_provider: builtin
status: draft
type: note
tier: institutional
content_type: paper
deprecated: false
raw_file: raw/iop-conference-series.pdf
doi: 10.1088/1757-899X/1031/1/012039
---

*Suggested by [[como-citar-este-artigo]] — Primary case study (Spahiu et al., 2021) on 3D body scanning, Lectra Modaris, and CLO 3D prototyping*

IOP Conference Series:
Materials Science and
Engineering
     
PAPER • OPEN ACCESS
Industry 4.0 for fashion products – Case studies using 3D technology
To cite this article: T Spahiu et al 2021 IOP Conf. Ser.: Mater. Sci. Eng. 1031 012039
 
View the article online for updates and enhancements.
This content was downloaded from IP address 189.113.253.252 on 27/11/2026 at 04:21


---

Content from this work may be used under the terms of the Creative Commons Attribution 3.0 licence. Any further distribution
of this work must maintain attribution to the author(s) and the title of the work, journal citation and DOI.
Published under licence by IOP Publishing Ltd
ICTTE 2020
IOP Conf. Series: Materials Science and Engineering
1031 (2021) 012039
IOP Publishing
doi:10.1088/1757-899X/1031/1/012039
1
 
 
 
 
 
 
Industry 4.0 for fashion products – Case studies using 3D 
technology 
T Spahiu1, A Manavis2, Z Kazlacheva3, H Almeida4, P Kyratsis2 
1 Polytechnic University of Tirana, Faculty of Mechanical Engineering, Textile and 
Fashion Department, Albania 
2 University of Western Macedonia, Department of Product and Systems Design 
Engineering, Kila Kozani, GR50100, Greece 
3 Faculty of Technics and Technologies, Trakia University, Bulgaria  
Graf Ignatiev 38, 8600 Yambol, Bulgaria 
4 School of Technology and Management, Polytechnic Institute of Leiria, Leiria, 
Portugal 
e-mail: tspahiu@fim.edu.al 
Abstract. The Fourth Industrial Revolution is based on digitalization where virtual and 
physical systems of manufacturing are linked and operate together. Fashion products are of a 
great interest not only as items used to cover and protect the body but even to express 
individuality, personality and attractiveness. Due to the high interest of consumers for fashion 
items or products, fashion industry is one of the most important industries globally due to its 
effect on economic growth. As a result, companies try to invest continually on new 
technologies by implementing them in various processes of production. The aim of this paper 
is to present here the implementation of advanced technologies for various fashion products as 
garments, jewelery and accessories. These products are modelled, evaluated and produced by 
using 3D modelling software, simulation and additive manufacturing as some of the pillars of 
Industry 4.0 will be presented. The reduced time, waste and advantages to create, visualize and 
evaluate products at early stages of product creation are some of the advantages of these 
technologies, part of Industry 4.0 in the fashion industry. 
1. Introduction 
Fashion products are used in everyday life and they cover a wide range of items or goods as clothing, 
footwear, jewellery, handbags, accessories, etc. These products are in continuous changes according to 
consumer demands and functionality, which change frequently. They are of a great interest not only as 
items used to cover and protect the body as clothing and footwear but even to express individuality, 
personality and attractiveness. Due to the high interest of consumers for fashion items or products, 
fashion industry is one of the most important industries globally with a huge effect in economic 
growth. As a result, companies try to invest continually on new technologies by implementing them in 
various process of production. 
Due to technological advances the way of product development has undergone many changes. 
These changes are reflected in style, quality, personalization and even innovation. In its traditional 
way of product development there are different steps till the realization of the final product. But 
advanced technologies and their widespread use for product design, following by its assessment 
through simulation and equipment involved in manufacturing show their importance in various steps 
of product development, from conceptualization to the final product. 


---

ICTTE 2020
IOP Conf. Series: Materials Science and Engineering
1031 (2021) 012039
IOP Publishing
doi:10.1088/1757-899X/1031/1/012039
2
 
 
 
 
 
 
Technological trends identified to be primarily instrumental in shaping industrial production are 
Big Data and Analytics, Autonomous Robots, Simulation, Horizontal and Vertical System Integration, 
Internet of Things (IoT), Cyber-Security, The Cloud, Additive Manufacturing, and Augmented Reality 
[1]. According to a study conducted by da Silva et al., the results reveals several factors as technical, 
organizational, project based or external should be considered in the implementation of digital 
manufacturing in a company [2]. 
Impact of new technologies are evident with applications in every area of production by 
accelerating production time, reduction of material wastage and increasing the quality of products or 
systems through process shorting, automation simulation. Although these attempts are at a low rate, 
they show the raising awareness of companies and stakeholders to contribute to a sustainable fashion 
industry, where the role of designers to create sustainable fashion products is mostly related by 
choosing sustainable materials. As a result, researchers propose closer collaboration between 
academics, industrial practitioners, policymakers and consumers. This will result in fostering the rapid 
transformation of fashion industry [3]. 
Innovations in production are part of the Industry 4.0 and with the current state it requires the 
integration of 3D printing as part of Industry 4.0 into engineering teaching and fashion disciplines [4, 
5]. The results are a student gradually trained and more conscious of the environment and economy 
[6]. So it is convenient that the supply-side actors of industry 4.0 continue to provide education and 
training, establishing users groups and networks can promote organizational learning for Industry 4.0 
[7].Moreover younger generations are able to pay to sustainability and circular economy by causing 
fashion companies to redirect their strategic approach toward transforming social responsibility and 
sustainability into a competitive opportunity to beneﬁt both the individual companies and the overall 
sector [8]. 
The rising demand for customized products and linked with the geometrical complexity are more 
valuable in digital manufacturing [9]. Combining mass production and custom made according to 
consumer preferences by 3D printing can contribute to sustainability [10]. The cases of 3D printing in 
fashion industry still remain scarce, due to the lack of material properties still far away from the ones 
used in traditional clothing manufacturing. But the promises are high for jewellery and shoe 
production, especially the sole due to similarities with materials used in the traditional manufacturing 
process. Moreover, 3D printing on textile is one of the most used where additional characteristics can 
be added to this multi-material system [11]. There are still concerns if it becomes available at the 
household level, related with the increase use by prosumers to experiment designs [12, 13]. The 
technological and digital transformation shows that the fashion industry will undergo profound 
changes as the case of smart clothes, where products should generate value by technical and digital 
characteristics and on the same time with a good design to establish a strong emotional relationship 
with consumers [14, 15]. 
 
2. Garment design and simulation 
Garment design is a process to include all the design elements and to create a product visually 
attractive and offering comfort to the wearer. Fashion designers tries to express their art through 
garment flats and pattern makers tries to translate these designs by using anthropometric data 
according to sizing tables and bearing in mind the type of textile that is going to be used for 
production. In its traditional way of garment construction, it requires time, trials and errors that are 
part of this process leading to higher costs related to material waste and labour. But advancement of 
computer graphics has led to a more reliable process of virtual garment construction. These 
advancements try to simulate the whole process of garment from concept to production in a virtual 
environment. There is wide range of software used for garment design from open source to 
professional CAD which offers various tools to simplify the process of pattern development in fashion 
industry [16]. These tools have become more sophisticated, and engineers/researchers consider this 
challenge as an opportunity for more accurate design, manufacturing, and simulations [17]. 
Garment simulation is a process to create virtual replicas of models and access the garment fit 
before creating the physical sample. Accessing the garment drape and fit over 3D avatar or 
personalized body models are realized simultaneously on the 3D window. Simulation as one of the 


---

ICTTE 2020
IOP Conf. Series: Materials Science and Engineering
1031 (2021) 012039
IOP Publishing
doi:10.1088/1757-899X/1031/1/012039
3
 
 
 
 
 
 
pillars of Industry 4.0 is of a great interest for this industry and its integration is seen to have a pivotal 
role and even named as at the heart of Industry 4.0 [18]. Integration of ICT technologies in the process 
of garment design can have a huge impact in fashion industry and customers behaviours [19]. 
Trials and errors requiring times and costs now can be avoided by the implementation of these 
systems. Standard methods used for pattern making of various items are based on standard human 
body models. But due to the differences that exist between human bodies these are translated to a poor 
fit. As a result, companies try to use their own method to create various items according to their target 
group, by updating their sizing tables according to their measurements, including garment simulation. 
 
3. Jewelery design based on nature  
Jewelery products are items used since antiquity to decorate the body. They vary in shapes and 
materials used for manufacturing. Due to the advancements of technology, the method used for 
production has undergone different changes. Computer aided design offers powerful tools for the 
designing process of jewellery by reducing costs and optimizing the whole production efficiency [20], 
[21]. Among 3D modelling software developed specifically for jewelery design, there are cases of 
implemented 3D modelling software applications. The packages of CAD jewelery offer detailed tools 
for designing and photorealistic images. These are a key element used for marketing and product 
assessment by avoiding the physical model. Jewelery design is a process of expressing creativity, 
during which several designs with minor changes are created. Generative design systems for jewelery 
applications can support designers to generate designs [22] and how industrial designers can use the 
field of parametric and computational modelling to foster their creativity [23]. 
Recently, 3D printing also known as Additive manufacturing technology has been used to print 
objects from a digital template, using several materials, including metals, among hundred other 
materials, plastic, metal, nylon [24]. 
 
4. Materials and methods 
This work deals with the use of advanced technologies for fashion products. The workflow proposed 
and followed in this work is presented in Figure 1. 
 
 
Figure 1.Workflow for garment production. 
 
These case studies are garments, jewelery and accessories. Garment design and simulation are 
realized on 3D modelling software CLO 3D from CLO Virtual Fashion Inc.3D body models are 
personalized with anthropometric data according to the participants part of this study.  
The other products realized in this work are jewellery and accessories. By using engineering and 
reverse engineering processes 3D models are created. In reverse engineering a real object is digitized 
using a 3D laser scanner system Konica Minolta Vivid 910 and by following various steps to conclude 
with precise 3D model. In the other process of engineering a product is created by modelling in CAD 
software. In this work a 3D modelling Tinkercad from Autodesk Inc is used for creating the products.  


---

ICTTE 2020
IOP Conf. Series: Materials Science and Engineering
1031 (2021) 012039
IOP Publishing
doi:10.1088/1757-899X/1031/1/012039
4
 
 
 
 
 
 
Final products are realized by using additive manufacturing technology. A 3D printer Geeetech 
A30 3D printer based on Fused Deposition Technology is used for 3D printing real objects. Preparing 
3D models for 3D printing is done on CURA slicing software and exported as a G-code. In Figure 2, a 
view of 3D printer used is depicted. 
 
 
Figure 2.Geeetech A30 3D printer. 
 
5. Results and discussion 
 
5.1. Virtual vs. Real garments 
3D technology and computer graphics offer great tools in the whole process of garment production. In 
order to fulfil customer’s requirements, 3D software give the possibility to simulate, evaluate and 
modify within the same environment, by shortening time and realizing a virtual presentation of 
garment prototypes. Starting from an idea to a virtual garment design, sewn, draped over 3D body 
model and evaluated in terms of fit can contribute even in sustainable fashion. This is evident by 
realizing adjustments, modifications, and reducing the number of prototypes evaluated as not 
attractive. As an example, to bring here the advantages of virtual prototyping, three different types of 
garments are depicted. The process starts with digital anthropometric data generated from 3D body 
scanning of the participants, which will then be used to personalise the 3D body models that exist in 
the software’s library. The patterns of two dresses and one jumpsuit are modelled on garment pattern 
making software Lectra Modaris, exported and imported in CLO 3D. The real time interactivity by 
performing instantly changes as 2D pattern modifications, and other details related to colours or textile 
improves quality of garment design at early stages of the process of garment production. The 
generated pressure maps of each model confirm the garment fit over 3D body models personalized 
with anthropometric data. Interacting by pattern modification and evaluating models in early steps of 
production makes the whole process attractive for the user with a faster virtualization of modelled 
product and in the same time by serving as inspirations to create new designs. Moreover, the virtual 
process of garment production contributes to time and cost reduction by avoiding creation of physical 
garments and waste generated from it and in the same time contributing to sustainability. 
At the end 2D patterns are exported, cut and used for the process of real garment production. 
Comparisons of real versus virtual garment samples are presented in Figure 3. As can be seen from the 
images the similarities between real and virtual garments are evident by confirming again the 
important role of virtual simulation for garment products. 
 


---

ICTTE 2020
IOP Conf. Series: Materials Science and Engineering
1031 (2021) 012039
IOP Publishing
doi:10.1088/1757-899X/1031/1/012039
5
 
 
 
 
 
 
 
Figure 3. From virtual model to real garment. 
 
 
 


---

ICTTE 2020
IOP Conf. Series: Materials Science and Engineering
1031 (2021) 012039
IOP Publishing
doi:10.1088/1757-899X/1031/1/012039
6
 
 
 
 
 
 
5.2. Jewelery and accessories 
Inspirations taken from nature for various applications are evident in a wide number of applications. 
Known as Biomimicry or biomimetics is the practise to learn and imitate nature regarding forms, 
process and systems with the goal to solve human problems. Biomimicry is derived from the Greek 
word, where bios mean life and mimesis means imitation. Based on nature inspiration the case of 
flowers for jewellery design is not a new topic. But our focus is to present new technologies as 3D 
modelling and rapid prototyping as two pillars of Industry 4.0. 
Earrings are accessories used by women’s in everyday life. Their shapes, colours and materials 
vary. In this work, inspirations taken by flower models are presented. Based on the flower image, the 
2D concept is realized, which is then modelled on a web-based 3D modelling software Tinkercad from 
Autodesk Inc. Exported 3D models are further imported on the slicing software Cura from Ultimaker 
produced through additive manufacturing based on FDM technology. The material Polylactic Acid) 
known as PLA, which is a vegetable based plastic material and known as one of the most 
environmentally friendly material. It is a fully biodegradable thermoplastic polymer, usually produced 
from corn and sugarcane. Figure 4 and Figure 5 present flowcharts followed to create earrings models. 
By taking inspirations from the real flower images, to 2D shapes and after 3D modelling of flower 
models. At the end the final products generated through the use of additive manufacturing technology. 
 
 
Figure 4. Flowchart from real flower to 2D shapes, the 3D model and real model taken by 3D 
printing. 
 
 
Figure 5. Flowchart from real flower to 2D shapes, the 3D model and real model taken by 3D 
printing. 
 
Another case within creative design presented in this work is the walnut model. The ancient 
Greeks, about 2800 years ago found that walnuts are very similar to brain shape in a small size as they 
have folds and divided halves with distinct left and right hemispheres. Moreover, they are covered by 
a hard shell like our skull. Taking into account their shape, a walnut fruit is taken to create various 
products from it. By using advanced technologies as 3D scanning allows us to capture the 3D shape of 
a model and create virtual replicas of it, which can be further elaborated, modified and used to create 
various products. The scanning system used in this work is a laser scanning system Konica Minolta 


---

ICTTE 2020
IOP Conf. Series: Materials Science and Engineering
1031 (2021) 012039
IOP Publishing
doi:10.1088/1757-899X/1031/1/012039
7
 
 
 
 
 
 
VIVID 910. Following with data elaboration and merging the single scans, to create the digital copy of 
the walnut model. This digital model is further taken as a base for the other products. 
The first case is the one of the earrings model taken from dividing the walnut model in halves. In 
the other case the shape of the walnut inside is included by resulting in another variant of earring 
model. The other products created inspired by walnut model are the ring models. In the first model of 
the ring, a hollow with the ring size is created. In the second and third cases, half of the walnut is used 
as the upper part of the ring model. Two other products are button and medallion. Again, here using as 
a base the 3D walnut model the resulting models are presented. Each one the models can now by 
manufactured by additive manufacturing technologies as FDM, a non-expensive technology compared 
to the other types of technologies. 
 
 
Figure 6. From product digitalization used for designing jewelery and accessories to the final product 
taken through 3D printing technology. 
 


---

ICTTE 2020
IOP Conf. Series: Materials Science and Engineering
1031 (2021) 012039
IOP Publishing
doi:10.1088/1757-899X/1031/1/012039
8
 
 
 
 
 
 
6. Conclusions 
The role of the Industry 4.0 in the fashion industry is obviously evident from production, 
merchandizing, retailing and customer. Implementation of advanced technology as some of the pillars 
of Industry 4.0 shows again the short time to realize fashion products, from concept to 3D model, by 
taking inspirations from various sources. The work presented here is part of a project to realize fashion 
products through advanced technologies. The cases of garments, jewelery and accessories presented 
here with all the steps from concept to production, as digitizing, 3D modelling, simulation and 
produced by additive manufacturing. Inspirations taken from nature are a great source of inspiration to 
create unique products at lower prices. 
Reducing lead times, waste, and advantages to create, visualize and evaluate products at early 
stages of product creation are some of the advantages of these technologies as part of Industry 4.0 in 
the fashion industry. Product evaluation at early stages of creation contributes to sustainability in 
fashion industry. Virtual prototyping brings to the fashion industry as in other industrial sectors great 
advantages compared to traditional way of garment design. Innovative tools developed by companies 
are able to create a realistic presentation of virtual garment ensuring a better visualisation of product at 
early stages before its physical production. Companies should try to embrace this technology in their 
product development. As a result, additional skills are required for operators in this process in order to 
accelerate production and to be competitive on the market. 
3D printing technology also known with the general name additive manufacturing brings great 
advantages for product creation with lower cost and the possibility to produce customised fashion 
products even with complex geometry, bringing again the advantages of these technologies as part of 
Industry 4.0 in the fashion industry. Using 3D printing technologies for jewellery production seems to 
have great advantages. 
 
References 
[1] 
Gilchrist A 2016 Introducing Industry 4.0 Industry 4.0 (Berkeley, CA: Apress) pp 195-215 
[2] 
Ribiero da Silva E H D, Angelis J, Pinheiro de Lima E 2019 In pursuit of Digital Manifacturing 
Procedia Manufacturing 28 pp 63-69 https://doi.org/10.1016/j.promfg.2018.12.011  
[3] 
Karell E, Niinimäki K 2020 A Mixed-Method Study of Design Practices and Designers’ Roles 
in 
Sustainable-Minded 
Clothing 
Companies 
Sustainability 
12 
(11) 
4680 
https://doi.org/10.3390/su12114680 
[4] 
Kwon Y M, Lee Y, Kim S J 2017 Case study on 3D printing education in fashion design 
coursework Fash Text 4 (26) https://doi.org/10.1186/s40691-017-0111-3 
[5] 
Sun L, Zhao L 2017 Envisioning the era of 3D printing: a conceptual model for the fashion 
industry Fash Text 4 (25) https://doi.org/10.1186/s40691-017-0110-4 
[6] 
Chong S, Pan G T, Chin J, Show P L, Yang T C K, Huang C M 2018 Integration of 3D Printing 
and 
Industry 
4.0 
into 
Engineering 
Teaching 
Sustainability 
10 
(11) 
3960 
https://doi.org/10.3390/su10113960 
[7] 
Madsen D Ø 2019 The Emergence and Rise of Industry 4.0 Viewed through the Lens of 
Management Fashion Theory Adm. Sci.  9 (3) 71 https://doi.org/10.3390/admsci9030071 
[8] 
Gazzola P, Pavione E, Pezzetti R, Grechi D 2020 Trends in the Fashion Industry. The 
Perception of Sustainability and Circular Economy: A Gender/Generation Quantitative 
Approach Sustainability 12 (7) 2809 https://doi.org/10.3390/su12072809 
[9] 
Paritala P K, Manchikatla S, Yarlagadda P 2017 Digital Manufacturing- ApplicationsPast, 
Current, and Future Trends Procedia Engineering 174 pp 982-991 
[10] Nadasbaş S E, Çileroğlu B 2016 The use of 3D printers in fashion design for different models 
and sizes Global Fashion 
[11] Sitotaw D B, Ahrendt D, Kyosev Y, Kabish K A 2020 Additive Manufacturing and Textiles - 
State of the Art Appl. Sci. 10 (15) 5033 https://doi.org/10.3390/app10155033 
[12] Fan Z, Meixner L 2020 3D Printing: A Guide for Decision-Makers World Economic Forum, 
Geneva, Switzerland  
[13] Elmelegy N A 2017 3D Printing The Future of Innovative Shapes and Materials in Women 
Fashion Design Eurasian Journal of Analytical Chemistry 13 (3) 


---

ICTTE 2020
IOP Conf. Series: Materials Science and Engineering
1031 (2021) 012039
IOP Publishing
doi:10.1088/1757-899X/1031/1/012039
9
 
 
 
 
 
 
[14] Bertola P and Teunissen J 2018 Fashion 4.0. Innovating fashion industry through digital 
transformation Research 
Journal 
of 
Textile 
and 
Apparel 
22 
(4) 
pp 
352-
369 https://doi.org/10.1108/RJTA-03-2018-002 
[15] Papachristou E, Bilalis N 2015 How to Integrate Recent Development in Technology with 
Digital Prototype Marmara Journal of Pure and Applied Sciences special issue 1 pp 32-39 
[16] Papachristou E, Kyratsis P, Bilalis N 2019 A Comparative Study of Open-Source and Licensed 
CAD Software to Support Garment Development Learning Machines 7 (2) 30 
https://doi.org/10.3390/machines7020030 
[17] Kyratsis P, Kakoulis K, Markopoulos A P 2020 Advances in CAD/CAM/CAE Technologies 
Machines 8 (1) 13 https://doi.org/10.3390/machines8010013 
[18] Gunal M M 2019 Simulation and the Fourth Industrial Revolution In: Gunal M. (eds) 
Simulation for Industry 4.0 (Cham: Springer, Springer Series in Advanced Manufacturing) 
https://doi.org/10.1007/978-3-030-04137-3_1 
[19] Carulli M, Vitali A, Caruso G, Bordegoni M, Rizzi C, Cugini U 2017 ICT Technology for 
Innovating the Garment Design Process in Fashion Industry. In: Chakrabarti A., Chakrabarti 
D. (eds) Research into Design for Communities volume 1 ICoRD 2017 Smart Innovation, 
Systems and Technologies 65 (Singapore: Springer) https://doi.org/10.1007/978-981-10-
3518-0_46 
[20] Lin F, Wong M C, Ge M 2018 Development of the digita lmodel of the jewellery production 
process for resourceoptimisation and prediction HKIE Transactions 25 (4) pp 229-236 
[21] Matos J, Almeida H A, Ascenso R M T, Novo C, Freire M 2016 Development of a sustainable 
toothbrush with the aid of additive manufacturing technologies. In Moreira da Silva F, 
Bártolo HM, Bártolo P, Almendra R, Roseta F, Almeida HA, et al., editors. Challenges for 
Technology Innovation: An Agenda for the Future (Lisbon, Portugal: Taylor & Fransis 
Group) pp 45-50 
[22] Kielarova S W, Pradujphongphet P, Bohez E L J 2015 New Interactive-Generative Design 
System: Hybrid of Shape Grammar and Evolutionary Design - An Application of Jewelry 
Design. In: Advances in Swarm and Computational Intelligence ICSI 2015 Lecture Notes in 
Computer Science 
[23] Demarco F, Bertacchini F, Scuro C, Bilotta E, Pantano P 2020 Algorithms for Jewelry Industry 
4.0. In: Sergeyev Y., Kvasov D. (eds) Numerical Computations: Theory and Algorithms 
NUMTA 
2019 
Lecture 
Notes 
in 
Computer 
Science 
11973 
(Cham: 
Springer) 
https://doi.org/10.1007/978-3-030-39081-5_37 
[24] Mpofu T P, Mawere C, Mukosera M 2014 The Impact and Application of 3D Printing 
Technology International Journal of Science and Research 3 (6) pp 2148-52 
 
 
 
 
 
 
 
