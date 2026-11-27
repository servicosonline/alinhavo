---
title: ISTANBUL TECHNICAL UNIVERSITY « GRADUATE SCHOOL OF SCIENCE
id: istanbul-technical-university-graduate-school-of-science
tags:
- modelista-producao-moda-dores-0698af
- modelagem
- desenvolvimento-de-produto
created: '2026-11-27T02:49:38.838294Z'
updated: '2026-11-27T02:55:01.407675Z'
source: https://polen.itu.edu.tr/bitstream/11527/18623/1/544114.pdf
source_domain: polen.itu.edu.tr
fetched_at: '2026-11-27T02:49:38.835170Z'
fetch_provider: crawl4ai
status: draft
type: note
tier: institutional
content_type: paper
deprecated: false
summary: 'Büyükaslan (2018, PhD Dissertation, Istanbul Technical University & Cornell
  University, 46,703 words) investigates real vs. virtual garment fit satisfaction
  (RFS vs. VFS) using 14 woven fabrics tested for thickness, weight, bending rigidity,
  shear rigidity, elongation, drape, and friction, clustered into 7 physical and Optitex
  3D virtual skirts evaluated on 45 3D-scanned female subjects (N=180 fit evaluations).
  Finds strong correlation between overall VFS and RFS (r=0.63, p<0.01) and builds
  a cross-validated multilevel linear model predicting RFS (r=0.83 on test set), where
  VFS (beta=0.543) and weft bending rigidity (beta=-0.369) are the strongest predictors.
  Exposes critical 3D CAD pattern/simulation pain points: commercial 3D software (Optitex
  O/Dev) clamped fabric thickness at a minimum of 0.05 cm (0.5 mm), had ambiguous
  Fabric Converter unit conversions, failed to reflect 3D fabric property variations
  in VFS (no significant ANOVA difference across virtual skirts, p=0.92, vs significant
  difference in real skirts, p=0.003), and struggled with extreme weft bending rigidities
  (<3 or >7 microNm) and hip/hem fit zones.'
raw_file: raw/istanbul-technical-university-graduate-school-of-science.pdf
---

*Suggested by [[tekstilna-industrija-broj-4-2021]] — Primary thesis on virtual garment fit satisfaction and pattern adjustment vs actual garment fit*

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
ISTANBUL TECHNICAL UNIVERSITY « GRADUATE SCHOOL OF SCIENCE 
ENGINEERING AND TECHNOLOGY 
Ph.D. THESIS 
EXPLORING CONSUMERS’ VIRTUAL GARMENT FIT SATISFACTIONS TO 
PREDICT THEIR ACTUAL SATISFACTIONS 
 
Evrim BÜYÜKASLAN 
Department of Textile Technology 
 
Textile  Engineering Programme 
DECEMBER 2018 


---

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Department of Textile Technology 
 
Textile Engineering Programme 
 
DECEMBER 2018 
ISTANBUL TECHNICAL UNIVERSITY « GRADUATE SCHOOL OF SCIENCE 
ENGINEERING AND TECHNOLOGY 
EXPLORING CONSUMERS’ VIRTUAL GARMENT FIT SATISFACTIONS TO 
PREDICT THEIR ACTUAL SATISFACTIONS 
Ph.D. THESIS 
Evrim BÜYÜKASLAN 
 (503122809) 
Thesis Advisor: Prof. Dr. Fatma KALAOGLU 
Thesis Co-Advisor: Assist. Prof. Dr. Fatma BAYTAR 
 


---

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Tekstil Teknolojisi Anabilim Dalı 
 
Tekstil Mühendisliği Programı 
 
ARALIK 2018 
İSTANBUL TEKNİK ÜNİVERSİTESİ « FEN BİLİMLERİ ENSTİTÜSÜ 
SANAL GİYSİ DURUŞU MEMNUNİYETİNİN GERÇEK GİYSİ DURUŞU 
MEMNUNİYETİNİ TAHMİN ETMEK İÇİN KULLANILMASI  
 
DOKTORA TEZİ 
Evrim BÜYÜKASLAN 
(503122809) 
Tez Danışmanı: Prof. Dr. Fatma KALAOĞLU 
Eş Danışman:  Yrd. Doç. Dr. Fatma BAYTAR 
 


---

 
 
 v 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Thesis Advisor :  
Prof. Dr. Fatma KALAOGLU 
 
 
İstanbul Technical University 
 
Co-advisor :   
Assist. Prof. Dr. Fatma BAYTAR  
 
 
                 
 
 Cornell University 
Jury Members :  
Prof. Dr. Binnaz KAPLANGIRAY 
 
Uludag University 
Assoc. Prof. Dr. Selin Hanife ERYURUK 
 
İstanbul Technical University 
Assoc. Prof.  Dr. Canan SARICAM 
 
 
İstanbul Technical University 
              
 
Dr. Deniz AKDEMIR 
 
            
                                  Cornell University 
 
            Dr. Belgin GORGUN 
 
        
                                  Istanbul Technical University 
Evrim BÜYÜKASLAN, a Ph.D. student of İTU Graduate School of Science 
Engineering and Technology student ID 503122809 successfully defended the 
thesis/dissertation entitled “EXPLORING CONSUMERS’ VIRTUAL GARMENT 
FIT SATISFACTIONS TO PREDICT THEIR ACTUAL SATISFACTIONS”, which 
she prepared after fulfilling the requirements specified in the associated legislations, 
before the jury whose signatures are below. 
Date of Submission : 30 October 2018 
Date of Defense 
: 14 December 2018 


---

 
 
 vi 
 
 


---

 
 
 vii 
 
 
 
 
To my mom and dad, 
 
 
 


---

 
 
 
viii 
 


---

 
 
 ix 
FOREWORD 
I wish to express my gratitude to my advisors Dr. Fatma Kalaoglu and Dr. Fatma 
Baytar not only for their guidance and  all the hours of patience to shape this research, 
but also giving me the opportunity to establish my research by being able to use 
resources and equipment of two prestigious universities. Istanbul Technical University 
has been my home university since my undergraduate degree and gave me all the gear 
to be a researcher, and Cornell University has widened my horizon and sharpened my 
determination to work. I would like to also present my sincere thanks to Dr. Simona 
Jevsnik as this work wouldn’t be possible if her invaluable advices and counseling was 
not there while I was structuring the content of this research. Another important 
contributor of this research was Dr. Deniz Akdemir. He was always there when I 
needed guidance about statistical methods and applications conducted in this 
dissertation. I would also like to thank to my committee members Dr. Selin Hanife 
Eryuruk and Dr. Binnaz Kaplangiray for their time and support. Dr. Kivanc Umut 
Sahin has a very meaningful place in the accomplishment of this dissertation with his 
advices and directions which played the very key roles for my academic progress. 
Finally, I appreciate Dr. Recep Eren and Uludag University for allowing me to use 
some of their test equipment. 
I had very precious company partners throughout my research journey. Kipas Tekstil 
and Bahariye Tekstil was my fabric sponsors. They provided unlimited access to their 
fabric storehouse. Busra Cavusoglu from Kipas Tekstil, and Sansal Cetin from 
Bahariye Tekstil allocated some of their valuable time to deliver the test fabrics of this 
research. Moreover, Unzile Hacioglu from Mektas Makina was always available when 
I had questions about the Optitex 3D garment simulation software. Nazim Turk, Satiye 
Kizilaslan, Mustafa Yildirim and Catherine Devine were very professional to provide 
me the technical assistance that I needed during my experiments. 
I believe that motivational support that I received during my studies has the most 
important place for the accomplishment of this dissertation. Many parties have part in 
this accomplishment. First of all, not only my colleagues but also my very precious 
friends, Nese, Hadiye and Serpil, supported and backed me up all these times. I feel 
very lucky to have friends whom I built a stronger bond with during the years passing 
by and always had their motivational words during my PhD journey. These friends are 
no one else other than Cigdem, Zeynep, Ozlem, Sibel, and Ozge.  
Finally, I can’t explain how grateful I am to have my most precious ones by my side, 
my mom and my dad. The utter sentence that I heard from them for the entire of my 
life was: “Whatever you decide, there is nothing else for us to do but to support you”. 
This was the strongest motivation for whatever I had achieved in my life. My little 
brother grew up throughout these years and now he is more appreciative to my humble 
accomplishments and more generous to show his sincere brotherhood. I am grateful to 
have such a brother and I feel so safe to have his unconditional support. There is one 
more person that I would like to thank. I have always postponed or was a bit unlucky 


---

 
 
 x 
to find my partner in crime, but at the very last year of my life as a student (hopefully), 
I found him. Thank you very much Sander; for your kindness, sincere love and 
becoming by best friend. 
At the very end of my words, I would like to thank to “The Scientific and 
Technological Research Council of Turkey” (TUBITAK) for funding my research. I 
was financially supported by TUBITAK 2214-A program and so could have conducted 
my research in Cornell University for twelve months. I hope to pay back to my country 
with my services.  
 
 
 
 
December 2018 
Evrim BÜYÜKASLAN 
Textile Engineer 
 
 
 
 
 
 
 
 
 
 
 
 
 


---

 
 
 xi 
 
TABLE OF CONTENTS 
Page 
 
 Garment fit ............................................................................................... 5 
1.3.1.1 Definition .......................................................................................... 5 
1.3.1.2 Evaluation of garment fit ................................................................... 7 
 Consumers’ garment fit satisfaction and its components ......................... 10 
1.3.2.1 External factors ............................................................................... 11 
1.3.2.2 Internal factors ................................................................................ 13 
 Online apparel shopping and approaches to minimize garment fit issues 
during online shopping .......................................................................... 15 
1.3.3.1 Improving sizing systems ................................................................ 16 
1.3.3.2 Online size and fit recommendation ................................................. 17 
1.3.3.3 Online visualisation of garment fit ................................................... 19 
 3D garment simulation ........................................................................... 20 
1.3.4.1 Modeling the cloth ........................................................................... 21 
1.3.4.2 Mechanical properties of fabrics ...................................................... 22 
1.3.4.3 Commercial 3D garment simulation software .................................. 26 
 Virtual body models ............................................................................... 29 
1.3.5.1 Approaches to create virtual body models ........................................ 29 
1.3.5.2 Latest 3D body scanners .................................................................. 30 
 Garment simulation for fit assessment .................................................... 32 
1.3.6.1 Objective fit evaluation of a garment simulation .............................. 33 
1.3.6.2 Subjective fit evaluation of a garment simulation ............................. 37 
 Target group ........................................................................................... 44 
 Garment Samples ................................................................................... 45 
2.2.2.1 Designing the garments ................................................................... 45 
2.2.2.2 Fabric selection ............................................................................... 47 
2.2.2.3 Making the garments ....................................................................... 49 


---

 
 
 xii 
 Experiments ........................................................................................... 50 
2.2.3.1 Fabric experiments .......................................................................... 50 
2.2.3.2 Fabric clustering .............................................................................. 55 
 Garment fit experiments ......................................................................... 56 
2.2.4.1 Preparing for virtual fit .................................................................... 56 
2.2.4.2 Data collection ................................................................................ 60 
2.2.4.3 Garment fitting ................................................................................ 63 
2.2.4.4 Post-experimental processes ............................................................ 65 
 Fabric properties .................................................................................... 67 
 Fabric clustering..................................................................................... 67 
 Demographics ........................................................................................ 76 
 Online shopping frequencies .................................................................. 76 
 Fit satisfactions for RTW garments ........................................................ 77 
 Skirt style preferences ............................................................................ 79 
 Body measurements ............................................................................... 80 
 Body satisfactions .................................................................................. 81 
 Interaction with 3D fit technologies ........................................................ 85 
3.3.7.1 3D body scanning ............................................................................ 85 
3.3.7.2 Virtual try-on technology ................................................................ 86 
 Skirt fit satisfactions ............................................................................... 87 
3.3.8.1 Descriptives .................................................................................... 87 
3.3.8.2 One-way ANOVA ........................................................................... 90 
3.3.8.3 Paired t-tests and Pearson’s correlations between participants’  RFSs 
and VFSs (regardless of the skirt codes) ........................................... 91 
3.3.8.4 Paired t-tests and Pearson’s correlations between participants’ RFSs 
and VFSs (regarding the skirt codes) ................................................ 93 
 3D fabric properties and VFS ................................................................. 96 
 Interaction with 3D fit technologies and VFS ......................................... 96 
 Body measurements and VFS ................................................................. 96 
 Virtual body satisfaction and VFS .......................................................... 97 
 Other factors .......................................................................................... 97 
 Building the statistical model ................................................................. 98 
 Validity of the developed model ........................................................... 102 


---

 
 
 
xiii 


---

 
 
 
xiv 
 
 
 
 
 
 
 
 
 
 
 
 
 


---

 
 
 xv 
 
ABBREVIATIONS 
BMI 
: Body Mass Index  
BS 
: Body Satisfaction  
CAD 
: Computer Aided Design  
CAD 
: Computer Aided Manufacturing 
FAB 
: Fabric Analyzer by Browzwear  
SiroFAST 
: Fabric Assurance for Simple Testing  
FOM 
: Fabric Objective Measuring  
FS 
: Fit Satisfaction  
FTU 
: Fabric Testing Utality 
HCA 
: Hierarhical Cluster Analysis 
KES 
: Kawabata Evaluation System  
KMO 
: Kaiser-Meyer-Olkin  
MLM 
: Multilevel Linear Model 
PCA 
: Principle Component Analysis  
PDS 
: Pattern Design System  
RBS 
: Real Body Satisfaction  
RFS 
: Real Fit Satisfaction  
RTW 
: Ready to Wear 
SCT 
: Social Comparison Theory 
VBS 
: Virtual Body Satisfaction  
VFS 
: Virtual Fit Satisfaction  
 
 
 
 
 


---

 
 
 
xvi 
 
 
 
 
 
 
 
 


---

 
 
 
xvii 
 
LIST OF TABLES 
Page 
Table 1.1 : Summary of SiroFAST tests and measured fabric properties (De Boos & 
Tester, 1994), (Wang et al., 2008). ....................................................... 26 
Table 1.2 : Apparel focused 3D body scanners. ...................................................... 30 
 
 Properties of the collected fabrics. ........................................................ 49 
 Measurements of the garment samples ................................................. 49 
 Alternative simulation properties applied in O/Dev for pre-testing. ...... 58 
 Body measurements used for the study. ................................................ 66 
 
Table 3.1 : Fabric Properties .................................................................................. 69 
Table 3.2 : 3D fabric properties for simulations. .................................................... 70 
Table 3.3 : Skirts used for garment fit experiments................................................. 71 
Table 3.4 : Virtual skirts with alternative simulation properties. ............................. 72 
Table 3.5 : Images of real and virtual skirt samples. ............................................... 73 
Table 3.6 : Participants’ online shopping frequencies for various garment types. ... 77 
Table 3.7 : Participants’ online shopping frequencies for skirts. ............................. 77 
Table 3.8 : Participants’ RTW garment fit satisfactions for various apparel items. . 78 
Table 3.9 : Participants’ RTW skirts fit satisfactions. ............................................. 78 
Table 3.10 : Paired t-test between participants’ RTW skirts fit satisfactions and other 
garment types. ...................................................................................... 79 
Table 3.11 : Participants’ preferences for different skirt styles. .............................. 79 
Table 3.12 : Participants’ preference frequencies for circular skirt style. ................ 80 
Table 3.13 : Paired t-test between participants’ circular skirt preferences  and other 
skirt styles. .......................................................................................... 80 
Table 3.14 : Body measurements of participants. ................................................... 81 
Table 3.15 : Real and virtual fit satisfactions of participants. .................................. 82 
Table 3.16 : PCA of body satisfaction scale. .......................................................... 83 
Table 3.17 : Real and virtual body satisfactions of participants for specific body 
areas. ................................................................................................... 84 
Table 3.18 : Paired t-test between participants’ real and virtual body satisfactions for 
specific body parts. .............................................................................. 85 
Table 3.19 : Participants’ interaction with 3D body scanning. ................................ 85 
Table 3.20 : Participants’ acceptance of virtual try-on. ........................................... 86 
Table 3.21 : Participants’ average RFSs and VFSs for different skirts (overall and 
specific fit areas). ................................................................................. 89 
Table 3.22 : Paired t-tests between RFSs and VFSs of participants (regardless of the 
skirt codes). ......................................................................................... 92 
Table 3.23 : Pearson’s correlations between overall and specific RFSs and VFSs of 
participants (regarding skirt differences). ............................................. 94 
Table 3.24 : Paired t-tests between RFS and VFS of participants (regarding skirt 
differences). ......................................................................................... 95 


---

 
 
 
xviii 
Table 3.25 : Pearson’s correlations between participants’ overall VFSs and 3D fabric 
properties . ........................................................................................... 96 
Table 3.26 : Pearson’s correlations between participants’ overall VFSs, and 
interaction with virtual try-on and 3D body scanning. .......................... 96 
Table 3.27 : Pearson’s correlations between participants’ overall VFSs and body 
measurements. ..................................................................................... 97 
Table 3.28 : Pearson’s correlations between VFSs and participants’ virtual body 
satisfactions (VBSs). ............................................................................ 97 
Table 3.29 : Pearson’s’ correlations between VFS and other factors. ...................... 98 
Table 3.30 : Type III test of fixed effects (all data)............................................... 100 
Table 3.31 : Estimates of fixed effects (all data). .................................................. 100 
Table 3.32 : Estimates of fixed effects (training data: 80 percent of the total data).
 ..................................................................................................................... 103 
Table 3.33 : Pearson’s correlation between predicted RFSs and measured RFSs (test 
data). ................................................................................................. 104 
Table 3.34 : Paired t-test between measured RFSs and predicted RFSs of test data.
 ..................................................................................................................... 104 
  


---

 
 
 
xix 
LIST OF FIGURES 
Page 
Figure 1.1 : Conceptual model of consumers’ fit perception ( Shin & Damhorst, 
2018). .................................................................................................... 7 
Figure 1.2 : Factors affecting consumers’ garments fit satisfactions (LaBat & 
DeLong, 1990). .................................................................................... 11 
Figure 1.3 : Forces acting on particles in mass-spring model used for cloth 
simulation (Jiang et al., 2018). ............................................................. 22 
Figure 1.4 : Forces applied on fabric surfaces to measure their mechanical properties 
(Chan et al., 2006). ............................................................................... 23 
Figure 1.5 : Schematic diagram of SiroFAST-2 (De Boos & Tester, 1994)............. 25 
Figure 1.6 : Principle of structured light systems (Sarbolandi, Lefloch, & Kolb, 
2015). .................................................................................................. 31 
Figure 1.7 : Objective measuring procedure for fit evaluation (Loker et al., 2005). 34 
Figure 1.8 : Ease values measured by a simulation software according to alternative 
fabric properties (Ancutiene & Sinkevičiute, 2011). ............................. 36 
Figure 1.9 : Fit evaluation of six different dresses created by using alternative fabric 
properties (Ancutiene et al., 2014). ....................................................... 38 
Figure 1.10 : Virtual fit images of a pants created by using 3D body scan image of a 
subject, and pictures of the real pants fitted by the same subject (Kim & 
LaBat, 2013a). ..................................................................................... 39 
 
 Extended model offered for the factors affecting consumers’ garment fit 
satisfactions (derived from LaBat and DeLong (1990)’s study). ........... 42 
 Theoretical model to explore the factors affecting consumers’ virtual 
garment fit satisfactions. ...................................................................... 43 
 Research model. .................................................................................. 44 
 Best seller skirt styles on Amazon.com (Amazon.com, 2017). ............ 47 
 Inspiration picture and its sketch. ........................................................ 47 
 Visual comparison of the real and virtual drape of five woven fabrics 
(Buyukaslan, Kalaoglu, & Jevsnik, 2017). ............................................ 48 
 2D patterns of the garment samples. .................................................... 50 
 Fabric experiments and garment fit experiments schema. .................... 50 
 Stress-strain diagram of  Fabric 16 (weft direction). ............................ 52 
 Shear testing of the fabric samples. ................................................... 53 
 Drape image on Cusick drape meter. ................................................. 55 
 O/Dev simulation properties window. ............................................... 57 
 FAST conversion interface of Fabric Converter for O/Dev. ............... 58 
 Fabric editor interface to create virtual fabrics in O/Dev.................... 60 
 Data collection during garment fit experiments. ................................ 60 
 Garment fit evaluation guideline. ...................................................... 62 
 Skirt fit evaluation scale. ................................................................... 62 


---

 
 
 xx 
 Protocol of garment fit experiments. ................................................. 63 
 Processed 3D body scan image. ........................................................ 64 
 Snapshots of a virtual try-on on a subject. ......................................... 65 
 
Figure 3.1 : PCA plot of fabrics according to their properties. ............................... 67 
Figure 3.2 : Distribution of skirt samples between subjects. ................................... 76 
Figure 3.3 : Scatter diagram of participants’ weight by their body height. .............. 81 
Figure 3.4 : P1’s fit evaluations for a skirt sample. ................................................ 88 
Figure 3.5 : Participants’ overall RFSs and overall VFSs for different skirts. ......... 90 
Figure 3.6 : Scatter diagram of overall VFSs and RFSs of participants (regardless of  
the skirt codes, N=180). ....................................................................... 92 
Figure 3.7 : Pearson’s correlations for factors affecting virtual fit satisfactions 
(Summary from Table 25-29). ............................................................. 98 
Figure 3.8 : Pearson’s correlation between measured and predicted RFSs (all data, 
N=180). ............................................................................................. 102 
Figure 3.9 : Scatter diagram of measured and predicted RFSs (test data, N=32) ... 104 
Figure A.1 :  Surface scans of fabrics ……………………………...………......…135 
Figure A.2 :  Simulations created by V-Stitcher ………………………………….137 
Figure A.3 :  Notice of expedited approval from Institutional Review Board for 
Human Participants…………………………………..…….............. 138 
Figure A.4 :  Survey…………..………………………………………..…….....…139 
 
 
 
 
 
 
 
 


---

 
 
 
xxi 
EXPLORING CONSUMERS’ VIRTUAL GARMENT FIT SATISFACTIONS 
TO PREDICT THEIR ACTUAL SATISFACTIONS 
SUMMARY 
Garment fit satisfaction is a very complicated phenomena due to its numerous 
components and has always been a problem for clothing companies since consumers 
often complain about poor fitting. However, this issue became more significant due to 
high return rates of online shopping which is often associated with the fit of the 
garment. Virtual try-on technology is a useful tool to minimize fit issues encountered 
during and after online purchasing. Virtual try-on technology enables consumers to 
see and evaluate how a specific cloth would actually look on their own bodies. During 
a virtual try-on experience, consumers are expected to evaluate the garment fit by 
looking at a virtual image. This image consists of a virtual cloth created by a simulation 
software and a virtual model that represents consumer’s body.  For a life-like 
experience, virtual model must be an accurate and realistic simulation of consumer’s 
body which is often attained by 3D body scanning. 
Occasions for the virtual try-on technology to be used for online shopping have been 
already discussed in academia and industry during the last decade, but these 
expectations have not been met due to expensive and inaccessible 3D body scanners. 
However, 3D body scanning technology has evolved since then. Nowadays, to scan an 
object, a surface or a human body, is as easy as using a mobile phone or a portable 
scanner. Even though, it is not yet that common, using virtual try-on technology for 
online shopping is now around the corner. When the virtual try-on technology is fully 
ready for the market, it can be possible for consumers to decide whether to buy a cloth 
depending on their fit satisfactions of a virtual garment. This anticipation makes virtual 
fit satisfaction as important as real fit satisfaction. 
In this dissertation, factors affecting consumers’ virtual fit satisfactions were heeded 
and a further exploration of virtual fit satisfaction notion was pursued. The research 
model offered by LaBat and DeLong (1990) was the keystone when exploring the 
factors that affect consumers’ virtual fit satisfactions. According to their research, 
consumers’ garment fit satisfactions depend on some internal factors (directly related 
to the cloth and the consumer) and external factors (related to the fashion trends and 
beauty perception of societies and fashion industry). The model offered by LaBat and 
DeLong cannot be directly implemented to understand the factors that affect 
consumers’ virtual fit satisfactions since the virtual try-on conditions are considerably 
different than actually wearing the cloth and assessing its actual fit. Hence, for this 
dissertation, these internal and external factors were modified and additional factors 
which are only applicable for virtual context were included. These novel factors 
offered in this dissertation were consumers’ virtual body satisfactions, virtual try-on 
acceptance, 3D body scanning experience and the 3D fabric properties which are 
derived from actual fabric properties. The relationship between these novel factors and 
consumers’ virtual fit satisfactions were questioned and tested by an experimental set-
up. Moreover, the association between consumers’ virtual fit satisfactions and other 


---

 
 
 
xxii 
factors which are also present during an actual try-on scenario, such as consumers’ 
body measurements, product liking and online shopping attitudes were also 
investigated.  
Although virtual fit satisfaction is important and influential, it is actually a tool to 
ensure consumer’s satisfaction with the real fit of the garment. Before the virtual try-
on technology, it was almost impossible to predict whether the consumer would be 
satisfied with the fit of the garment or to what extend he/she would be satisfied after 
an online purchase. In this study, consumer’s virtual fit satisfaction was sought as a 
useful tool to predict consumer’s actual fit satisfaction by incorporating internal factors 
(consumers’ body measurements, body satisfactions and fabric properties). Ultimately, 
in this dissertation, a research model to predict consumers’ real fit satisfactions was 
offered, experimentally measured, and statistically tested.  
Garment fit satisfaction is highly subjective since personal preferences are involved. 
People may like or dislike the fit of a garment due to its design that consists of its 
silhouette, line, color and texture (or fabric).  In this study, the impact of fabric 
properties on consumers’ fit satisfactions was particularly investigated. To do that, 
other design elements (silhouette, line and color) were fixed, and only fabrics have 
been altered. Eventually, fourteen woven fabrics were collected, and their critical 
properties (thickness, weight, bending rigidity, shear rigidity, elongation, drape 
coefficient, surface friction and roughness) were measured by various testing 
instruments. Afterwards, fabrics were statistically clustered into four groups according 
to their measured fabric properties.  Following this objective clustering, seven of the 
fabrics were extracted due to their subjective alikeness to the other fabrics within the 
same cluster. Finally, seven circular skirts which have the same color (black) and same 
measurements (medium size), but different woven fabrics were produced by a 
professional seamstress.  
For the garment fit experiments, forty-five medium size subjects were recruited in 
Cornell University. Subjects’ body satisfactions, product likenesses, online shopping 
attitudes were measured by an online survey. Then, each subject was 3D body scanned 
with their underwear, and their 3D body scans were exported to a commercial 3D 
garment simulation software to be assigned as virtual models during virtual try-on. 
After 3D body scanning, each subject tried on four different skirts (one skirt from each 
cluster) and evaluated their actual fits. Subjects also saw the simulation of each skirt 
before wearing and evaluated their virtual fit on their own avatar. By doing so, subjects 
were intended to have an ideal virtual try-on experience during an online shopping 
scenario. At the end of the experiments, subjects’ i virtual fit technologies used 
throughout the experiments (3D body scanner and virtual try-on) were measured.  
Collected data was analyzed by using SPSS v.25 statistical software. The first 
objective of this research was to investigate the factors affecting the virtual fit 
satisfactions of the consumers. Pearson’s correlation test was conducted to explore the 
correlation between subjects’ virtual fit satisfactions and; body measurements, virtual 
body satisfactions, liking of the cloth design, interaction with virtual fit technologies, 
attitudes toward product type, and 3D fabric properties. The strongest correlation of 
subjects’ virtual fit satisfactions was found with their virtual body satisfactions at hips 
level (r (180) = .50). It was followed by their belly, hip-thigh and waist measurements 
(r (180) = -. 34, -. 29,-.28, respectively), and finally their liking of the cloth design (r 
(180) = .33). A weak correlation was found between consumers’ virtual fit satisfactions 
and their interaction with 3D body scanner and virtual try-on technology (r (180) = .26 


---

 
 
 
xxiii 
and .24, respectively) (All correlations were significant at p=0.01 level). On the other 
hand, no significant correlation was found between consumers’ virtual fit satisfactions 
and 3D fabric properties. 
The second objective of the study was to develop a statistical model to predict 
consumers’ real fit satisfactions and to test its validity. In this study, various skirts 
were fitted on numerous subjects hence, it was appropriate to use multilevel linear 
regression instead of simple regression. Therefore, a multilevel linear model (MLM) 
with maximum likelihood estimation was developed. Subjects’ real garment fit 
satisfaction was assigned as dependent variable; and subjects’ body measurements, 
body satisfactions, virtual fit satisfactions, and fabric properties were assigned as 
predictor variables. The results of the analysis showed that subjects’ virtual fit 
satisfaction was the strongest predictor of their real fit satisfaction (F (1, 80.72) = 
55.00, p< .01, β= 0.54). The second-best predictor was fabrics’ bending rigidity in weft 
direction (F (1, 155.26) = 13.33, p< 0.01, β = - 0.37). Subjects’ waist height and overall 
body satisfactions were also significant to predict their real fit satisfactions (F (1, 
37.67) =6.23, p< 0.01, β=0.28, F (1, 41.58) =5.71, p< 0.05, β= 0.24, respectively). 
Ultimatly, subjects’ real fit satisfactions were predicted by the developed MLM by 
using their virtual fit satisfactions, body measurements, body satisfactions and fabric 
properties. According to the results, subjects’ real fit satisfactions and their predicted 
fit satisfactions were strongly correlated (r (180) = .775, p < .01). Furthermore, cross 
validation was established to test the efficacy of the developed prediction model. For 
cross validation, collected data were partitioned into two groups randomly. 80 percent 
(N=148) of the data were used for training the model and 20 percent (N=32) were used 
for testing.  A linear regression equation was obtained by running the developed MLM 
with the training data. Afterwards, obtained regression equation was used to predict 
subjects’ real fit satisfactions in the preserved test data. According to the cross-
validation, the predicted and actually measured real fit satisfactions were strongly 
correlated (r(32)= .83, p< 0.01). In addition to correlation analysis, a paired t-test was 
conducted between subjects predicted and actually measured real fit satisfactions. 
According to the paired t-test results, no significant difference was found between 
these two groups (t(1, 31)= 1.86, d=.23, p= 0.073). The correlation and paired t-test 
analysis are strong indicators that the developed MLM works well to predict 
consumers’ real fit satisfactions. 
Another objective of this study was to compare consumers’ real and virtual fit 
satisfactions. The correlation between subjects’ real and virtual garment fit 
satisfactions were explored by Pearson’s correlation test and the means were compared 
by paired t-test. The results showed that subjects’ real and virtual garment fit 
satisfactions were highly correlated (r (180) = .63, p< 0.01). Even though the 
correlation was high, a significant difference between subjects’ real and virtual fit 
satisfactions were detected for some of the skirts particularly. This brings an answer 
to the final objective of the study which was to understand how different fabrics affect 
consumers’ garment fit satisfactions in real and virtual context. The results showed 
that whilst consumers’ grasp the fabric related fit alterations in real context, they do 
not perceive it in virtual context.  
Finally, the decline of subjects’ body satisfaction level after being exposed to their 3D 
body scan images was also notable. This decrease was remarkable especially for waist 
and hips area. 


---

 
 
 
xxiv 
In this dissertation, garment simulation technology was used to create an online 
purchasing scenario. Moreover, consumers’ garment fit satisfactions were measured 
with respect to the subjectivisms of the garment fit whereas literature often adopt an 
objective approach. Factors affecting the virtual fit satisfaction of consumers were 
empirically explored, and a statistical model to predict consumers’ real fit satisfactions 
were successfully developed by incorporating their virtual fit satisfactions. 
The research methodology used in this dissertation study can be used to predict 
consumers’ real fit satisfactions for other cloth types or styles by adjusting variables, 
and consequently increase online shopping and reduce garment returns related to fit 
issues.  
 
 
 
 
 
 
 
 


---

 
 
 
xxv 
 
SANAL GİYSİ DURUŞU MEMNUNİYETİNİN GERCEK GİYSİ DURUŞU 
MEMNUNIYETINI TAHMİN ETMEK İCİN KULLANILMASI  
ÖZET 
Kıyafet gibi denenerek satın alınması tercih edilen ürünlerin internet satışı nispeten 
yeni ve bir o kadar da problemli bir konudur. İnternet üzerinden satın alınan her dört 
kıyafetten biri iade edilmektedir (Briggs, 2013). İade sebeplerinin başında kıyafetlerin 
giyen kişinin bedenine uygun olmaması ve duruşu gösterilmektedir (Kim, 2008).  
Son yıllarda, sanal giyinme (virtual try-on) teknolojisi, internet üzerinden yapılan 
kıyafet alışverişlerinde giysi durusuna (fit) bağlı olan sorunların giderilmesi için 
çözüm olarak önerilmektedir. Sanal giyinme; tüketicinin vücudunun sanal 
benzetiminin (simulation) oluşturulması ve bu benzetimin bilgisayar ortamında sanal 
kıyafetlerle giydirilmesi olarak tanımlanabilir. Sanal giyinme teknolojisinin giyim 
sektöründe kullanılması henüz sık karşılaşılan bir durum olmasa da önümüzdeki 
yıllarda giderek yaygınlaşacağı düşünülmektedir. Sanal giyinme teknolojisini test eden 
İngiliz perakende firması ASOS, internet alışverişlerinde  ürün  iade oranlarının  yüzde 
elli oranında azalttığını belirtmiştir (Dunn, 2015).  
İnternet alışverişinin giderek yaygınlaşması ve buna bağlı olarak giysi duruşunun daha 
sık karşılaşılan bir problem olarak ortaya çıkması bu tezin motivasyonu olmuştur. Son 
on yıl içerisinde internet alışverişlerinde karşılaşılan giysi duruşu sorununu ele alan 
pek çok akademik araştırma yapılmıştır. Ancak bu araştırmaların çoğunda, giysi 
duruşu tüketiciler tarafından değil, giyim tasarımı veya teknolojileri konularında 
uzman kişiler tarafından değerlendirilmiştir. Bir diğer dikkat çeken nokta da üç 
boyutlu giydirme teknolojisinin internet alışverişi için kullanılmasından ziyade ürün  
geliştirme amacıyla kullanımına yönelik araştırmaların yaygınlığıdır. Bu doktora tezi, 
tüketici bakış açısının dikkate alınması ve sanal giyinme teknolojisinin internet 
alışverişine yönelik değerlendirilmesi açısından farklılık göstermektedir.  
Giysinin bedene uygunluğu, farklı ve pek çok sayıda faktöre bağlı olduğu için oldukça 
karmaşık bir konudur. 1990 yılında LaBat ve DeLong, tüketicilerin giysinin 
duruşundan memnuniyetlerini etkileyen faktörleri içsel ve dışsal faktörler olarak 
sınıflandırmışlardır (LaBat & DeLong, 1990).  İçsel faktörler; kıyafet, tüketici ve bu 
ikisinin etkileşimine bağlı olan faktörler olarak tanımlanabilir. Dışsal faktörler ise 
moda endüstrisi ve toplum tarafından belirlenen, güzellik algısına bağlı olan ancak 
giysiyi giyen kişiden bağımsız olan faktörlerdir. Dışsal faktörlerin giysi duruşu 
memnuniyetine etkisinin ölçülmesi döneme ve topluma bağlı olduğu için daha zordur. 
LaBat ve DeLong (1990) tarafından önerilen modeldeki  içsel faktörler göz önünde 
bulundurarak deneylerin planlaması yapılmıştır. Bu sebeple tüketicilerin giysi durusu 
memnuniyetine etki eden içsel faktörleri detaylandırma ihtiyacı doğmaktadır. İçsel 
faktörler kişiye bağlı olarak beden memnuniyeti; kıyafet-kişi ilişkisine bağlı olarak da 
beden ölçüleri ve kıyafet olarak sınıflandırılabilinir. Kıyafet etkeni ise kendi içinde alt 
kavramları olan bir başlıktır. Kıyafetin ölçüleri ve kıyafet tasarımı (siluet, kontur, renk 


---

 
 
 
xxvi 
ve doku özellikleri) giysi duruşu memnuniyetine etki eden bu alt faktörler olarak 
sayılabilir.  
Yakın zamanda sanal giyinme kavramı tüketicilerin bilgisayar ekranına bakarak giysi 
duruşundan memnuniyetlerine karar verme durumunu beraberinde getirecektir. Sanal 
giysinin duruşuna bağlı olarak tüketiciler ürünü satın almaya veya almamaya karar 
vereceklerdir.   Sanal giysi duruşu memnuniyeti bu sebeple başlı başına yeni bir 
kavramdır ve bugüne kadar sanal giysi duruşu memnuniyetine etki eden faktörler 
üzerine henüz bir araştırma yapılmamıştır. Bu doktora tezinde, tüketicilerin sanal giysi 
duruşu memnuniyetine etki eden faktörler, DeLong ve LaBat’in gerçek kıyafet duruşu 
memnuniyetine yönelik önerdikleri model esas alınarak geliştirilmiş ve etkileri istatik 
yöntemlerle test edilmiştir. Sanal giyinme gerçek hayatta kıyafeti denemekten oldukça 
farklı bir tecrübedir. Dolayısıyla bu model için yeni faktörler önerilmiştir. Bu yeni 
faktörlerin başında sanal beden memnuniyeti gelmektedir. Sanal giyinme esnasında, 
ideal durumda, kişi kendi bedenini bilgisayar ortamında üç boyutlu olarak 
görmektedir. Kişinin sanal ortamdaki bu görüntüsünden memnuniyeti; sanal giysi 
duruşundan memnuniyetini etkileyen bir faktör olarak önerilmiştir. Bunun dışında, 
sanal giyinme sürecinde kişi üç boyutlu giydirme teknolojileriyle etkileşim halindedir 
ve bu teknolojilere karşı tutumları sanal giysi duruşu memnuniyetine etki edebilir. Bu 
teknolojilerin başında üç boyutlu vücut tarayıcıları gelmektedir. Mevcut teknolojilerle, 
kişinin vücut benzetiminin en gerçekçi şekilde oluşturulması için üç boyutlu 
tarayıcıyla taranması gerekmektedir. Etkileşim halinde olunan bir diğer teknoloji de 
üç boyutlu giydirme programı aracılığıyla sağlanan sanal giydirmenin kendisidir. Son 
olarak sanal giyinme esnasında kumaşlara dokunup hissetme imkânı yoktur. Normal 
şartlarda bu kumaşların tutum özelliklerini objektif olarak değerlendirmek için bazı 
mekanik ve fiziksel özellikleri kullanılmaktadır. Bu özellikler giydirme programlarına 
üç boyutlu kumaş özellikleri olarak aktarılmakta ve algoritmalarında sanal kıyafeti 
oluştururken kullanılmaktadır. Farklı kumaş özelliklerinin sanal ortamda da gerçek 
hayatta olduğu gibi farklı giysi duruşu göstermeleri beklenmektedir. Dolayısıyla üç 
boyutlu kumaş özellikleri de sanal giysi duruşu memnuniyetini etkileyen bir diğer 
faktör olarak önerilmiştir.   
Tüketicilerin sanal giysi duruşundan memnun olması durumunda ürünü satın alması 
olasıdır. Daha sonrasında ürünü temin eden tüketici, ürünü deneyecek ve gerçek giysi 
duruşunu değerlendirecektir. Bu değerlendirmenin sonucu da gerçek giysi duruşu 
memnuniyeti olarak adlandırılabilir.  Dolayısıyla sanal giysi duruşu memnuniyetinin 
gerçek giysi duruşu memnuniyeti ile pozitif yönde bir ilişkisinin olması beklenir. Bu 
doktora tezinde de, sanal giysi duruşu memnuniyetinin, gerçek giysi duruşu 
memnuniyetini tahmin etmek için kullanılması öngörülmüştür. Sanal giysi duruşu 
memnuniyeti tek başına tahmin eden değişken (predictor variable) olarak 
kullanılabilir. Ancak bu değişkenin LaBat ve DeLong’un önerdiği modelde diğer içsel 
faktörlerle (kumaş özellikleri, beden ölçüleri ve beden memnuniyeti) birleştirilmesi, 
ve bu değişkenlerin de tahmin eden değişken olarak kullanılması durumunda gerçek 
giysi duruşu memnuniyetini daha iyi/yakın tahmin edeceği öngörülmüştür. Dolayısıyla 
gerçek giysi duruşunu yüksek oranda tahmin edecek bir istatistiksel modelin 
geliştirilmesi hedeflenmiştir.  
Bu tezin temel iki amacı: 1) tüketicilerin sanal giysi duruşu memnuniyetlerine etki 
eden faktörlerin belirlenmesi/test edilmesi; 2) tüketicilerin gerçek giysi duruşu 
memnuniyetlerinin, sanal giysi duruşu memnuniyetlerini kullanarak tahmin edilmesi 
olarak özetlemek mümkündür. Bu amaçlar  göz önünde bulundurularak deneylerin 
tasarımı gerçekleştirilmiştir. Deney tasarımı gerçekleştirilirken dikkat edilen bir diğer 


---

 
 
 
xxvii 
nokta da sanal giydirme teknolojisinin gerçek kumaş özelliklerini yeterince 
yansıtamaması yönündeki araştırma ve tespitlerdir. Dolayısıyla farklı özelliklerdeki 
kumaşların gerçekte ve sanal ortamda nasıl bir giysi duruşu sergiledikleri ve tüketiciler 
tarafından giysi duruşlarının nasıl değerlendirildiği önemsenmiştir. Daha önce de izah 
edildiği gibi, giysi duruşuna etki eden içsel faktörlerden biri de kıyafetin tasarımıdır. 
Tasarım ise siluet, kontur, renk ve doku özelliklerinin bir bileşimidir. Eğer kumaş 
özelliklerinin giysi duruşuna etkisi araştırılmak isteniyor ise, diğer bileşenlerin 
sabitlenmesi deneysel tasarım açısından gereklidir.  
Deneyler için, giysi duruşu problemlerinin daha çok alt beden kıyafetlerde yaşanması 
sebebiyle, alt beden kıyafet gruplarından birinin seçilmesi uygun görülmüştür. 
Kumaşların dökümlülük özellikleri giysi duruşuna etki eden temel özelliklerden 
biridir. Dolayısıyla farklı dökümlülük özelliklerine sahip kumaşların kullanılması 
benimsenmiştir. Bu sebepten ötürü de dökümlülük özelliğinin ortaya çıkacağı dairesel 
etek modeli kıyafetin silueti için uygun görülmüştür. Renk olarak ise nötr bir renk olan 
siyah tercih edilmiştir. Ürün  grubu ve renk belirlendikten sonra on dört farklı dokuma 
kumaş temin edilmiştir. İlk olarak bu dokuma kumaşların özellikleri farklı test 
yöntemleriyle ölçülmüştür. Kumaşların üç boyutlu giydirme programlarında gerçeğe 
en yakın olarak oluşturulması için bükülme ve kayma dirençlerinin, ve esneme 
özelliklerinin atkı ve çözgü yönünde ayrı ayrı tespit edilmesi ve programa girilmesi 
gerekmektedir (Bu programlar kendi kütüphanelerinden uygun kumaşın seçilmesi 
seçeneğini de sunmaktadırlar. Ancak, kumaş özelliklerinin yarattığı farkların bu 
çalisma için esas alınması sebebiyle, gerçekte ölçülen değerlerinin kullanılması uygun 
görülmüştür). Bahsedilen özellikler dışında kumaş kalınlığı, gramajı ve sürtünme 
katsayısının da programa girilmesi gerekmektedir. Kumaşların esneme ve kayma 
özellikleri, mukavemet cihazıyla; bükülme özellikleri, Shirley kumaş sertlik test 
cihazıyla; sürtünme katsayısı ve yüzey pürüzlülük özellikleri ise bu ölçüm amaçları 
için geliştirilen test cihazlarıyla ölçülmüştür. Bunun dışında kumaşlarin dökümlülük 
katsayısı değeri de Cusick dökümlülük cihazı kullanılarak hesaplanmıştır. Daha sonra 
bu on dört kumaş, ölçülen özelliklerine göre R programında hiyerarşik olarak 
(hierarchical cluster) dört grupta kümelenmiş, her gruptaki kumaşların tutum 
özellikleri iki tekstil teknoloji uzmanı tarafından sübjektif olarak değerlendirilmiş, ve 
grup içerisinde birbirine çok benzer olan kumaşlar elenmiştir. Sübjektif eleme 
yapılmasının sebebi, etekleri deneklerin giyecek olması ve birbirine çok benzer olan 
kumaşların giysi duruşu değerlendirmelerinin de çok benzer olacağıdır. Sonuç olarak 
dört farklı kümeye dahil yedi farklı kumaş, giysi duruşunu değerlendirmek üzere, aynı 
ölçülere sahip daire etekler olmak üzere dikilmiştir. Daire etekler baz bedeni olarak 
tercih edilen Medium (M) beden olarak dikilmişlerdir. 
18-35 yaş aralığı arasında M beden giyen kadınlar en sık internet alışverişi yapan yaş 
grubu olması sebebiyle tercih edilmiştir. Deneylere farklı etnik gruplarda ve eğitim 
düzeylerinde, kırk beş kadın denek katılmıstır. Deneyler Cornell Üniversitesi’nin etik 
kurul onayıyla, Cornell BodyScan Lab’da uygulanmıştır. Her bir denek laboratuvara 
tek tek çağırılmıştır. Denek laboratuvara geldiğinde ilk olarak kendi iç çamaşırlarıyla 
üç boyutlu vücut taraması yapılmış; demografik özellikleri, beden memnuniyeti, 
internet alışveriş alışkanlıkları, hazır giyim kıyafetlerinin kendi bedenlerine 
uygunluğu, moda zevki gibi değişkenler çevrimiçi bir anketle ölçülmüştür. Daha sonra 
deneğe kendi bedeni üç boyutlu olarak ekrandan gösterilmiş ve sanal beden 
memnuniyeti buna bağlı olarak ölçülmüştür. Sonraki etapta, deneğe her bir kumaş 
kümesinden bir etek olacak şekilde toplamda dört farklı etek verilmiş ve etekleri 
giymesi istenmiştir.  Deneğin vücut tarayıcısından elde edilen avatarına bu dört etek 


---

 
 
 
xxviii 
ayrı ayrı sanal olarak giydirilmiştir. Sanal etekler oluşturulurken daha önceden ölçülen 
kumaş özellikleri kullanılmıştır. Denekler her bir eteğin önce sanal giydirmesini 
görmüş ve etek duruşunu 7’li Likert ölçeğinde bel, karın, basen ve etek ucu bölgeleri 
için ayrı ayrı değerlendirmiştir. Daha sonra aynı eteğin gerçeğini giymiş ve aynı 
değerlendirmeyi bu sefer aynaya bakarak yapmıştır.  Bu işlem dört etek için 
tekrarlanmıştır. Deneyin sonunda deneğin üç boyutlu giysi duruşu teknolojilerine 
yönelik değerlendirmeleri ölçülmüştür. Her bir deney yaklaşık bir saat sürmüş ve 
deneklere deney sonunda on beş dolar ödeme yapılmıştır.  
Elde edilen veriler SPSS v.25 istatistik analiz programında analiz edilmiştir. 
Araştırmanın ilk amacı olan sanal giysi duruşu memnuniyetini etkileyen faktörleri 
tespit edebilmek için ölçülen her bir bağımsız değişkenin (beden ölçüleri, sanal beden 
memnuniyeti, etek tasarımına karşı tutumu, sanal giyinme teknolojilerine karşı 
tutumu, ürün  grubuna karşı tutumu, ürün  grubu internetten satın alma davranışı ve 3 
boyutlu kumaş özellikleri), bağımlı değişken (sanal giysi duruşu memnuniyeti) ile 
ilişkisi Pearson’s korelasyon testi ile ölçülmüştür. En yüksek korelasyonun, basen 
bölgesi için ölçülen sanal beden memnuniyeti olduğu tespit edilmiştir (r(180)= .50). 
Daha sonra karın, basen-kalça ve bel çevresi ölçüleri ile negatif yönlü ilişkisi tespit 
edilmiştir (sırasıyla: r(180)= -. 34, -. 29, .-28). Deneklerin etek tasarımına karşı tutumu, 
sanal giysi duruşu memnuniyetleriyle pozitif ilişkili bir değişken olarak saptanmıştır 
(r(180)= .33). Deneklerin sanal giyinme teknolojilerine karşı tutum ve sanal giydirme 
memnuniyeti arasında ilişki tespit edilmiş olsa da bu ilişkinin derecesi azdır (r(180)= 
.26). (Tüm korelasyonlar için p değeri 0.01’den küçüktür). Bir diğer tespit edilen 
durum da, giydirme programına girilen kumaş özelliklerinin sanal giysi duruşu 
memnuniyeti ile ilişkisi olmadığıdır. Başka bir deyişle, farklı kumaşlara göre 
oluşturulan sanal giysilerin, giysi duruşu memnuniyetleri  kumaş farklılığından 
etkilenmemiştir.  
Bu araştırmanın bir diğer temel amacı da tüketicilerin gerçek giysi duruşu 
memnuniyetini tahmin edecek bir istatistik model geliştirmek ve başarı oranını test 
etmektir. Farklı etekler farklı denekler tarafından giyilip değerlendirildiği için çoklu 
doğrusal regresyon modelinin (multilevel linear regression model) kullanılması uygun 
görülmüştür. Çoklu regresyon modellerinin hiyerarşik yapısına göre etekler birinci 
katmanda, denekler ikinci katmanda yer almaktadır.  Bu analizde tahmin yöntemi 
olarak  en büyük olabilirlik kestirimi (maximum likelihood estimation) yöntemi 
kullanılmıştır. En nihayetinde,  gerçek giysi duruşu memnuniyeti tahmin değişkeni 
olarak; denek numarası rassal değişken olarak; beden ölçüleri, beden memnuniyeti, 
kumaş özellikleri ve sanal giysi duruşu memnuniyeti tahmin eden değişkenler olarak 
tanımlanmış ve analiz gerçekleştirilmiştir. Tahmin modelinin geçerliliğini test 
edebilmek için çapraz geçerlilik (cross validation) yöntemi uygulanmıştır. Bu amaçla 
verinin yüzde sekseni (N=148) ile çoklu regresyon modeli kurulmuş ve kalan yüzde 
yirmisi (N=32) ile de modelin geçerliliği test edilmiştir. Çoklu regresyon modeline 
göre, en kuvvetli tahmin eden değişkenin sanal giysi duruşu memnuniyeti olduğu 
tespit edilmiştir (F(1, 88.720=49.292, p<0.01, β= .55). Kumaşların atkı yönünde 
bükülme direncinin en iyi ikinci tahmin eden değişken olduğu gözlenmiştir (F(1, 
131.055)=11.174, p< 0.01, β= -.38). Oluşturulan çoklu regresyon modeli, verinin 
kullanılmayan yüzde yirmilik kısmını tahmin etmek için kullanılmıştır. Tahmin edilen 
ve gerçekte ölçülen giysi duruşu memnuniyeti arasında çok yüksek korelasyon 
bulunmuştur (r(32)= .83, p< 0.01). Ayrıca tahmin edilen ve gerçekte ölçülen giysi 
duruşu memnuniyeti arasında eşleştirilmiş t-testi (paired t-test) yapılmış ve iki grubun 
aritmetik ortalamaları arasında istatistiksel olarak bir fark gözlenmemiştir (t(1, 31)= 


---

 
 
 
xxix 
1.86, d=.23, p= 0.07). Ölçülen aritmetik ortalama farkının (d= .23) düşük olması da 
modelin tahmin etme basarisinin yüksek olduğunu göstermektedir. 
Ayrıca, deneklerin sanal giysi duruşu memnuniyetlerinin gerçek giysi duruşu 
memnuniyetlerinden istatistiksel olarak daha düşük olduğu görülmüştür (t(1, 180)= 
2.69, p< 0.01, d= .21 ). Oldukça dökümlü (bükülme direnci 0.5-3 mikroNm civarı) 
veya oldukça sert (bükülme direnci 7 mikroNm üzerinde) olan kumaşlardan 
oluşturulan sanal ve gerçek eteklerin giysi duruşu değerlendirmesi arasında 
istatistiksel olarak fark gözlenirken, orta derecede dökümlü kumaşlarda (3-7 
mikroNm) fark gözlenmemiştir. Bu araştırmada kullanılan kumaşlara göre, 3 boyutlu 
giydirme programının 3-7 mikroNm  aralığında bükülme direnci gösteren kumaş 
benzetimlerinde başarılı olduğu, ancak diğer kumaşlarda yeterince başarılı olamadığı 
gözlenmiştir. Ayrıca gerçek eteklerin giysi duruşu değerlendirmeleri, kumaş 
farklılıklarından ötürü, birbirlerinden farklı iken ayni eteklerin sanal giysi duruşu 
değerlendirmelerinin farklı olmadığı sonucu istatistiksel olarak tespit edilmiştir. Bu da 
giydirme programlarının kumaş özelliklerini yansıtmakta henüz yeterince başarılı 
olmadığı sonucunu beraberinde getirir. Bir diğer tespit de deneklerin kendi vücutlarını 
üç boyutlu ortamda gördükleri zaman özellikle bel, kalça ve basen bölgeleri 
memnuniyetlerinin anlamlı bir oranda azaldığı tespit edilmiştir. 
Sonuç olarak, bu araştırma literatürden farklı olarak giysi duruşunu değil daha 
sübjektif bir kavram olan giysi duruşu memnuniyetini sanal ve gerçek ortamlarda 
tüketici perspektifini esas alarak ölçmüştür. Üç boyutlu tarayıcıların daha ulaşılabilir 
olması sebebiyle önümüzdeki yıllarda internet alışverişlerinde kullanımı çok olası olan 
sanal giyinme ve tüketicinin sanal giysi memnuniyetine etki eden faktörler araştırılmış 
ve etkileri ölçülmüştür. Sanal giyinme teknolojisinin nihai hedefi gerçek hayatta 
kişilerin giysi duruşundan memnun olmasını sağlamaktır. Bu amaçla sanal giysi 
duruşu memnuniyeti ve diğer içsel faktörler kullanılarak, kişilerin giysi duruşunu 
başarıyla tahmin edebilecek bir istatistiksel model geliştirilmiştir.  
Bu çalışmanın, tüketicilerin gerçek hayattaki giysi duruşu memnuniyetlerini tahmin 
edebilecek bir model geliştirmesi açısından hem tüketiciye hem de giyim sektörüne 
fayda sağlayabileceği düşünülmektedir. Örneğin bir giyim firması, bu çalışmadaki 
metotları kullanarak, müşterisinin giysi duruşundan memnuniyetini sanal giydirme 
teknolojileriyle internet aracılığıyla ölçtüğü takdirde, giysinin kumaş özelliklerini 
kullanarak, kişinin kıyafeti gerçekten denediğinde ne kadar memnun olabileceğini 
tahmin edebilir. Bu sayede internet üzerinden satın almalarda geri dönüş oranlarını 
minimize edip, maliyetlerini ciddi oranda azaltabilir. Bu çalışma ile giyim ve tekstil 
ürünlerinin internet üzerinden alışverişlerinde en yaygın ürün  iadesi sebebi olan giysi 
duruşunun optimize edilmesi hedeflenmiş, deneylerle oluşturulan senaryoda bu hedef 
gerçekleştirilmiştir.  
 
 
 
 
 
 
 
 


---

 
 
 
XXX 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


---

 
 
 1 
 INTRODUCTION  
After the debut of internet, retailing strategies of companies had started to shift to 
electronic commerce (e-commerce). U.S. Department of Commerce (www.doc.gov) 
reported e-commerce sales in U.S. in 2016 as $391 billion. The largest product 
category of e-commerce sales was computer and consumer electronics ($76 billion) 
and it was followed by apparel and accessories category ($60 billion) (Miller & 
Washington, 2017). Online shopping was found convenient by consumers because it 
sweeps away the necessity to go to a physical store to buy a certain product. However,  
high return rates are one of the biggest limitations of online shopping. A research done 
by Internet Retailer in 2013, reviewed the return rates of top merchants’ online 
activities and found  that the highest  return rates belonged to apparel industry with a 
statistics of 20-30 percent  of the products being returned (Briggs, 2013). Another 
study revealed that return costs of apparel sector reached up to $ 1.4 billion by 2016 
(Rivero & Zhu, 2016).  
Poor garment fit is one of the main reasons of the product returns (Kim, 2008), and 
majority of consumers hesitate to  buy garments online due to their  fit concerns ( Kim, 
2008). Various technologies such as 3D body scanning and virtual try-on have been 
offered over years to reduce return rates by increasing consumers’garment fit 
satisfaction (Sayem, Kennon, & Clarke, 2010). Some studies show that 3D 
visualization of products decreases consumers’ perceived risk during online shopping 
and increases their purchase intention (Park, Lennon, & Stoel, 2005). Garment fit 
satisfaction is a very complicated phenomena as it depends on internal and external 
factors. External factors  are shaped by apparel industry and society while internal 
factors are self-centric and depend on one’s self (LaBat & DeLong, 1990). Virtual 
garment fit is relatively a new notion that emerged after introduction of 3D fit 
technologies. Virtual garment fit can be described as the fitness of the virtual cloth on 
a virtual body. Virtual body can be either a direct avatar (virtual model) created by 
using a 3D body scanner; a parametric body model obtained by manually inserting 
body measurements of the model to the simulation software; or a statistical body model 


---

 
 
 2 
created by learning from a scan database (Istook, 2011), (Pishchulin, Wuhrer, Helten, 
Theobalt, & Schiele, 2017). Currently, there are some commercial software to display 
garment fit virtually  (Sayem et al., 2010), and some apparel companies (e.g. Target, 
Kohl’s and JCPenney) already use these software for their product development (Lee 
& Park, 2017). Aside their product development attribute, these software offer 
solutions for various end-users such as online apparel retailers and online shoppers ( 
Kim & LaBat, 2013b). Loker and her colleagues’ scenario (2008) describes how these 
technologies could be beneficial for consumers and clothing companies. In their 
scenario, they encourage readers to imagine that they possess a smart card with their 
3D body scan file in it, and they can just plug the smart card into the computer and go 
online, select the  style they want to virtually try-on, and finally view the virtual 
garment on their own virtual body model (Loker, Ashdown, & Carnrite, 2008). In this 
dissertation study, this scenario was actualized in order to see how a virtual garment 
fit would actually be assessed by consumers. The objectives of this study were 
developed by reviewing the literature, considering customer demands and trajectory 
of the apparel industry. One of the main objectives was to understand factors that affect 
virtual garment fit satisfaction of consumers and compare it with their real garment fit 
satisfaction. This first objective brought an important question along with it: Why 
should we investigate consumers’ virtual fit satisfaction mechanism? The fundamental 
purpose of this thesis emanates as an answer to this question. It is important to 
understand consumers’ virtual fit satisfactions to have a prediction about their actual 
garment fit satisfactions. Thus, the other objective was to predict consumers’ real 
garment fit satisfactions.  
 Purpose of the Thesis 
The fundamental purpose of this dissertation is: 
1) To predict consumers’ real garment fit satisfactions by employing a statistical 
model. 
Consumers’ garment fit satisfaction is a long discussed and studied phenomena. 
However, consumers’ virtual garment fit satisfaction is relatively new. Therefore, the 
other study objectives are: 
2) To explore factors affecting consumers’ virtual garment fit satisfactions, 


---

 
 
 3 
3) To compare consumers’ virtual garment fit satisfactions and real garment fit 
satisfactions. 
As mentioned in introduction part, fabric simulation is very challenging, and it is one 
of the biggest concerns of simulation software users and providers. During an online 
shopping, consumers are not able to touch or feel the fabric, so they cannot sense the 
fit differences that stem from the fabric itself.  Hence, the other objective is:  
4) To understand how different fabrics, affect consumers’ garment fit 
satisfactions in real and virtual environment. 
 Significance of the Thesis  
Real and virtual fit comparison of garments have been explored and reported in 
journals, conferences as well as thesis studies (Lim, 2009), (Jevsnik, Pilar, 
Stjepanovic, & Rudolf, 2012), (Kim & LaBat, 2013a), (Song & Ashdown, 2015). 
However, they are often either objective comparisons, or subjective comparisons of 
experts or study participants who view virtual garments on someone else`s virtual body 
model, but not on their own. On the other hand, most of these studies compare real fit 
and virtual fit. However,  consumers’ garment fit satisfaction is a more complex and 
subjective term than the garment fit itself as consumers and their individualities are 
involved to the evaluation process.  
Another significant, yet undiscovered, aspect of virtual try-on technology is its 
correlation with fabric properties. It is expected that fabrics drape well and fit 
realistically on consumers’ virtual bodies during virtual try-on. 3D garment simulation 
software enable users to create virtual fabrics by inserting their actual fabric properties. 
But it is still a question how consumers perceive virtual fit of the garments created by 
using different fabric properties. Is virtual try-on technology adequate to display the 
fit differences of garments made from different fabrics? How does consumers fit 
satisfaction vary for different fabrics during virtual try-on? Virtual garment fit is 
relatively a new phenomenon and yet there aren’t many systematic researches to 
analyze fabric properties and their influences on virtual garment fit satisfaction.  
As explained in the introduction part, virtual try-on is expected to be used for online 
shopping in the next few years. According to this anticipation, understanding virtual 
garment fit and its components will become more important for clothing companies.  


---

 
 
 4 
Hopefully, academia and clothing industry will benefit from the outcomes of this study 
by having an insight of the factors affecting consumers’ virtual fit satisfactions. On the 
other hand, in this study, a statistical model is offered to predict consumers’ real fit 
satisfactions by using their virtual fit satisfactions and some other variables. Since the 
product returns after online shopping are mostly due to poor garment fit, a close 
prediction of consumers’ real fit satisfactions can be very critical to reduce return rates, 
increase online sales and finally elevate profits.   
 Theoretical Background 
Textile and apparel industry have been using computer technology for many years (Hu, 
2011). However, 3D technology applications are relatively new. 3D technologies draw 
textile and apparel researchers’ attention during the last decade because, efficient 
utilization of this technology is expected to speed up the production and reduce the 
manufacturing costs (Hu, 2011).  
3D  technologies influence clothing industry by transforming the product development 
stage and  introducing new practices  such as virtual try-on (Lee & Park, 2017). Product 
development is strategic, creative, technical, production and distribution planning of 
the goods with respect to the delivery time (Keiser & Garner, 2012). Fashion industry 
is being challenged by the shortened fashion cycles and rapidly changing consumer 
demands. Thus, optimizing product development is crucial to reduce costs and 
diminish production spans. 3D technologies emerge as an optimization tool by 
minimizing the number of samples required before production. It was predicted in 
1998 that, 3D technologies would reduce the number of samples required before 
production and eventually cut down the production time and costs (Hardaker & 
Fozzard, 1998). This prediction was actualized to a certain extent in the last twenty 
years (Song & Ashdown, 2015). However, this progression has been  relatively slow 
for apparel industry due to challenges in fabric simulation (Papahristou & Bilalis, 
2017). 
E-retailing has been another  platform where 3D technologies are expected to boost 
online apparel sales by reducing number of returns (Kim, 2008). ASOS, the biggest e-
retailer in UK, reported that adapting virtual try-on technologies to their online store 
reduced the return rates by fifty percent (Dunn, 2015).  Currently, there are a few 
commercial 3D technology providers and start-ups trying to minimize fit and size 


---

 
 
 5 
related issues of online shopping (Gill, 2015). However, prevalence of  3D 
technologies for online shopping is not very high yet, and by 2018 there aren’t  many 
apparel retailers that offer 3D technologies to their customers to overcome the fit 
related issues during online shopping (Brook, 2015).  
3D body scanners have been thought as an auxiliary tool for online shopping to 
improve garment fit since the early days of online apparel shopping ( Ashdown, Loker, 
Schoenfelder, & Lyman-clarke, 2004), (D’Apuzzo, 2007). In the last ten years, 
scanned body images were integrated with CAD systems to create virtual simulations. 
Nowadays, many fashion companies use 3D garment simulation software such as 
Modaris (by Lectra), O/Dev (by Optitex), V-stitcher (by Browzwear), Vidya (by 
Assyst), Clo 3D and Marvelous Designer,  and using 3D body scanners to develop 
their products (Gill, 2015). Even though fashion companies are familiar with garment 
simulation, fashion consumers are still not familiar with  this technology. It is still not 
clear how consumers would adapt to virtual try-on technology. By 2018, the essential 
issues that needs to be answered for consumers to accept this new technology are 
summarized as: 
1) To understand consumers’ garment fit perceptions in virtual and real settings 
and minimize the discrepancy of these two mediums, 
2) To understand consumers’ psychology and shopping attitudes when imposed 
to their body image in virtual environment, 
3) To implement tactile features of different fabrics to virtual environment. 
This dissertation study purposes to embrace a large scope by investigating the issues 
stated above.  Accordingly, literature review was designed according to the key 
concepts related to these issues.  
Garment fit  
1.3.1.1 Definition 
Garment fit is a very complicated notion because fabrics which are 2D materials in 
nature are compelled to drape over a 3D human body form during fitting (Bona, 1994). 
It is defined as the relationship between garment dimensions and body dimensions 
(Daanen & Reffektrath, 2007), and it evolves with time, hinges on fashion culture and 
subjective perception of fit (Yu, 2004). A cloth should conform to the body surface 


---

 
 
 6 
while having enough space for movement though being wrinkle free and look neutral 
to give the sensation that it is a part of the wearer (Chambers & Moulton, 1961). 
According to Frost (1988), fit accommodates visual, physical and functional 
evaluation of a cloth (Frost, 1988). Hazen (1998) says that a good fitting garment  
should be manipulative by showing wearer’s body  to be more symmetrical and 
proportional than it actually is (Hazen, 1998).  Ashdown and Locker’s definition is a 
combination of Frost’s and Erwin’s definition, and it states that a well-fitting garment 
should be wrinkle-free while having  some design ease and functional ease (Ashdown 
& Loker, 2010).  When dressed up, consumers are probably not aware of these garment 
fit definitions. However, some cloths still looks good and feels right to them. As the 
words imply,  visual evaluation of a cloth is usually described with look, whereas the 
interaction with the body is described with the word feel (Frost, 1988). Appearance of 
a cloth, being associated with the look, can be either assessed by the wearer herself or 
by an external spectator. However, feel can be only assessed by the wearer (Frost, 
1988). In other words, an external spectator judges the fit of a cloth only by looking at 
its appearance on the wearer, while the wearer includes her feelings. This distinction 
introduces two different fit evaluation approaches (Shin, 2013):     
1) Fit according to the wearer,  
2) Fit according to the observer, 
During product development, observers (often designers or fit technicians) plays a key 
role for garment fit, whereas  the key role belongs to the weaver when purchasing the 
garment. In literature, garment fit from consumer  perspective has been explored way 
less than the observer perspective (Pisut & Connell, 2007), (Gill, 2015), (Shin, 2013). 
Eventhough online apparel shopping  has gradually expanded over the last five years, 
there aren’t  enough studies to explore virtual garment fit from consumer perspective 
(Kim & LaBat, 2013b). Thus, a need to study virtual garment fit from consumer 
perspective still exists. 
Majority of female consumers decide whether a garment fits well by monitoring if the 
garment allows them to move freely and drape smoothly on their bodies (Howarton & 
Lee, 2010). Technical evaluations like seam and grain line orientation are less 
important for consumers  (Howarton & Lee, 2010). The definition of good and bad 
fitting garments varies for consumers as well. According to some consumers, a bad 


---

 
 
 7 
fitting garment makes them look thicker while a good fitting garment shows them 
slimmer. On the other hand, for some consumers, a gratifying length and tightness of 
the garment determine its fit quality (Shin, 2013). 
Shin (2013) studied consumers’ garment fit perception and identified five prominent 
themes: aesthetic fit, physical fit, functional fit, social context and social comfort ( 
Shin, 2013), (Shin & Damhorst, 2018). Physical fit is associated with tightness and 
length of the garment while functional fit is more related to its comfort features.  
Aesthetic fit  is described as overall appearance of the garment on the wearer’s body 
and it is associated with attractiveness and fashion trends (Shin, 2013). Some 
consumers include social context to their fit perceptions by saying that the cloth should 
be appropriate for the occasion. Consequently, according to these consumers, 
appropriateness/misappropriateness  of the cloth generates a social comfort/ 
discomfort (Shin, 2013). The conceptual model of consumers’ fit perception identified 
in Shin’s study (2018) is given in Figure 1.1. 
                  
 
Figure 1.1 : Conceptual model of consumers’ fit perception ( Shin & Damhorst, 
2018). 
1.3.1.2 Evaluation of garment fit 
Fit evaluation can be classified according to the testing protocol where the test subject 
can  be either in dynamic state, quasi-static state or static state (Zakaria & Gupta, 
2014). During dynamic fit evaluation test, subjects are asked to conduct several tasks 
and perform any forms of motion while static evaluation requires the subjects to stand 
still at a  specific position (Zakaria & Gupta, 2014).  
The garment fit evaluation can be also classified according to the nature of the 
evaluation method such as objective or subjective evaluation (Yu, 2004).  Objective 
fit evaluation requires a deep technical knowledge and a set of equipment to measure 
Functional 
fit 
Aesthetic 
fit 
Physical 
fit
Social 
comfort 
Social 
context 


---

 
 
 8 
the fit quantitatively. Hence, it is widely used for academic purposes, whereas 
subjective fit  evaluation is steadily established by apparel manufacturers, fashion 
brands and finally by the consumers (Fan, Hunter, and Yu , 2004) 
Objective fit evaluation 
Numerous instrumental analysis methods have been offered over years to objectively 
measure garment fit (Yu, 2004). Objective fit evaluation methods may be classified 
as: Moiré optics, waveforms, pressure mechanics, computer fit modelling and 
algebraic evaluations (Yu, 2004). Moiré optics is a non-contact system that is used to 
measure the contours of a cloth (Meadows, Johnson, & Allen, 1970). In this system, a 
light source and a moving frame with grid plates are used in order to create moiré 
fringes on the person that is wearing the cloth. The contours of the cloth  is extracted 
according to the moiré fringes map by calculating the depth of the fringes on certain 
body locations (Yu, Yeung, & Lam, 1998). Algebraic evaluation is essentially the 
distances, areas and volumes between the cloth and the body. In other terms it is the 
mathematical calculation of the total ease allowance (Ng, Chan, Pong, & Au, 1996). 
Waveforms are similar to algebraic evaluation in principle. Waveforms are derived 
from the cross-sectional distances between the body and the cloth in certain areas such 
as bust, waist line and hips. These distances are measured with alternative techniques 
in  literature such as digitizing by Vectron measuring apparatus, acoustic theory or 
symmetrized dot patterns (Taya, Shibuya, & Nakajima, 1995). 
The methods stated above are non-contact methods to measure the garment fit. In 
2002, a new method was introduced by Yu et.al. (2001) which is an in-contact 
measuring system (Yu, Fan, Qian, & Tao, 2001). In their research, Yu et. al. (2001) 
manufactured a soft mannequin from flexible polyurethane and soft rubber to 
substitute the soft form of lower body. They suggested that the cloth pressure on an 
actual body can be predicted by using linear equations derived from the measured 
pressure on this soft mannequin. This technique was later adopted by scholars that 
explore  compression garments  especially (Yu, Fan, Qian, & Tao, 2004), (Wang et 
al., 2011). 
In 2004, Ashdown and her colleagues used 3D body scanners to analyze the fit of a 
garment (Ashdown et al., 2004). In their study, they 3D scanned subjects with a pair 
of pants and assessed the garment fit  by looking at their 3D scans (Ashdown et al., 
2004). In that study, the measurement was done objectively but the fit evaluation was 


---

 
 
 9 
done subjectively. Later, in 2008, Petrova and Ashdown (2008) carried on the work, 
and this time they objectively measured the ease allowance of pants from the 3D scans 
(Petrova & Ashdown, 2008). Scholars often benefited 3D body scanners to measure 
ease allowances, develop customized garment patterns and evaluate garment fit (Xu, 
J. , Zhang, 2008), (Song & Ashdown, 2010), (Bye & McKinney, 2010), (Lu, Song, & 
Li, 2013), (Gu, Xu, Su, & Liu, 2015). 
Subjective fit evaluation 
Objective fit evaluation is considered to be a quantitative assessment while subjective 
evaluation is qualitative (Yu, 2004). Geršak (2002) stated that the garment fit is 
qualitatively assessed according to aesthetic appearance of a garment drape and the 
visual form of its 3D shape (Geršak, 2002).  
Apparel manufacturers and brands use often live models or dress forms to evaluate 
garment fit subjectively (Bye & LaBat, 2005). Fit evaluations with live models are 
more reliable than the dress forms since actual human bodies involve to assessment 
(Song & Ashdown, 2010).  Whether the dress is displayed on a dress form or a live 
model, the subject rating scales are  often engaged  to evaluate the garment fit (Yu, 
2004). 
Subjective fit evaluation scales 
Users  associate garment fit often with its tightness and length (Shin, 2013). Parallel 
with this statement, developed garment fit evaluation scales were often designed to 
assess tightness and length of a garment. To best of our knowledge, the oldest garment 
fit evaluation scale  in literature dates back to a master thesis published in 1973 
(Vanderpoorten, 1973). In this thesis, Vanderpoorten (1973) developed a garment fit 
rating scale, as she named it back then, for a dress. In this scale, the dress was viewed 
from side, back and front, and evaluators were asked to rate certain elements of the 
dress (e.g. front length of bodice part, bust tightness, sleeve length) on a three points 
scale (good, fair or poor) (Vanderpoorten, 1973). Later, Lesco (1982) developed a fit 
evaluation scale for a bodice. In that study, subjects evaluated tightness/looseness and 
shortness/lengthiness of various parts of the bodice (i.e. neck, front, back and sleeves). 
Additionally, scale included questions about the sizes and angles of the darts, drop of 
the neckline, and seam lengths and positions (Lesko, 1982).   


---

 
 
 10 
Fit evaluation scales alter according to the garment type and the style. Therefore, it is 
not possible to find an all-inclusive fit evaluation scale in literature. The majority of 
the garment fit evaluation scales were designed for performance garments since fit is 
assumed to be critical especially for this type of garments. Most of these performance 
based scales evaluate dynamic fit where participants are asked to do specific tasks with 
respect to the design purposes of the garments (Tan, Crown, & Capjack, 1998), (Huck, 
Maganga, & Kim, 2006), (Gordon, Lastovich, Bye, & LaBat, 2014).   
Consumers’ garment fit satisfaction and its components  
Garment fit  is defined as the relationship between garment dimensions and body 
dimensions (Daanen & Reffektrath, 2007), whereas garment fit satisfaction 
corresponds to consumers’ evaluation of a particular garment on their particular body 
parts such as waist, hips etc. (LaBat & DeLong, 1990), (Shin & Damhorst, 2018). Fit 
satisfaction and fit preferences are highly correlated notions as consumers make free 
choices (preferences) to maximize their satisfactions (Shim & Bickle, 1993). 
Consumer satisfaction is defined as the evaluation of the outcomes occurred after using 
a product or  a service, and if the outcomes meet the expectations or standards of the 
consumer, product/service is assumed to be satisfactory (Conant, Brown, & Mokwa, 
1985). On the other hand, consumer dissatisfaction occurs when the outcomes are 
negative and the expectations of the consumer are not met (Engel, Blackwell, & 
Miniard, 1990).  
It should be noted that garment fit satisfaction is not identical to clothing satisfaction. 
Clothing evaluation has three dimensions according to Francis and Dickey (1984), 
namely: expressive satisfaction, instrumental satisfaction and market satisfaction 
(Francis & Dickey, 1984). Style and color represent expressive meaning, while fit and 
size are instrumental, and finally price is a marketing attribute (Francis & Dickey, 
1984). According to this definition, fit satisfaction embraces instrumental satisfaction 
level of individuals, and it shouldn’t be confused with clothing satisfaction. 
In 1990’s, numerous scholars studied the factors that affect fit preferences of 
individuals (LaBat & DeLong, 1990), (Hwang, 1996), (Anderson et al., 1999). As 
mentioned in the introduction part, LaBat and DeLong’s study is a keystone to 
systematically analyze the fit preferences of individuals (LaBat & DeLong, 1990). In 
their study, LaBat and DeLong (1990) questioned the factors affecting the fit 


---

 
 
 11 
satisfaction/dissatisfaction of consumers in all aspects. According to their model in 
Figure 1.2, consumers’ satisfaction/dissatisfaction of a garment fit is influenced by 
external and internal factors. Internal factors mainly depend on the consumer herself 
while external factors depend on time and society (LaBat & DeLong, 1990) .  
 
Figure 1.2 : Factors affecting consumers’ garments fit satisfactions (LaBat & 
DeLong, 1990). 
1.3.2.1 External factors 
The impact of physical dimensions of a cloth on consumers’ fit satisfaction has been 
the main research area of the scholars before 1990s. However, as mentioned by Shim 
and Bickle (1994), looking into only physical features of a product may hinder 
psychological effects and motives behind consumer behavior ( Shim & Bickle, 1994). 
After 1990s, the connections between consumers’ fit satisfaction and notions like body 
image, ideal beauty and fashion figure started to be stressed.  
According to Solomon (1983), products may have a symbolic meaning and these 
meanings may stimulate the society, and eventually this interaction may affect the 
product satisfaction (Solomon, 1983). In other words, for clothing aspect, the 
interaction of society and the wearer may have an impact on garment fit satisfaction. 
Ideal body image 
It is important to understand ideal body image because it has an impact on garment fit 
satisfaction (LaBat & DeLong, 1990). As LaBat and DeLong suggested, when a 
fashionable garment do not fit, the consumer may accuse her own body which causes 
negative feelings about herself ( LaBat & DeLong, 1990). 
Consumer perceived satisfaction of garment fit
Internal Factors
Body Satisfaction
Physical dimensions
External Factors
Ideal body image in society and in 
fashion industry


---

 
 
 12 
Ideal beauty perception had transformed over three thousand years and had distinct 
meanings for different societies (Yang, Celestino, & Koeppel, 2015). Beauty 
perception changes parallel with the advances in societies. For instance, emanation of 
social protests and feminism in 60s brought androgynous look as the beauty norm of 
the day (Romm, 1987). On the other hand, scholars agree that  each society generates 
an ideal body figure itself (LaBat & DeLong, 1990). For instance, a study done in 2002 
showed that Caucasians favor a thinner body while African American has less 
tendency to do so (Gluck & Geliebter, 2002).  
The differentiation of ideal beauty between societies diminished due to  the impact  of 
social media (Ridolfi, Myers, Crowther, & Ciesla, 2011). Celebrities have millions of 
followers from all over the world and they are influential for them. Social media or in 
general mass media now impose how the perfect body should look like (Pritchard & 
Cramblitt, 2014). On the other hand, people who are entitled by media to have ideal 
bodies that do not represent the majority of the public (Bell, 2016).  
There are many studies in the literature that demonstrate positive association between 
body dissatisfaction and fashion media exposure (Grabe, Ward, & Hyde, 2008), 
(Hawkins, Richards, Granley, & Stein, 2004), (Swiatkowski, 2016). Nowadays, 
millions of people follow the fashion models and take them as role models. For 
example in 2017, only in US, almost 24 million people watched Victoria Secret 
(intimate wear company) fashion shows (Statista, 2017b).  
Ready to wear (RTW) companies, probably the biggest influencer of the fashion 
industry, also play an important role for the perception of ideal body by the sizing 
standards they develop and the advertisements they use (Kinley, 2010).  McVey’s 
(1984) study is an early example to show  how apparel brands influence consumers’ 
perceptions (McVey, 1984). This study suggests that consumers tend to blame 
themselves when they encounter a poor-fitting but expensive and fashionable garment, 
and eventually they start to believe that they are not good enough (McVey, 1984). For 
RTW companies, fit models represent the average costumer and base size is shaped 
according to the fit models, and  bigger/smaller sizes are graded according to the base 
size  (Bougourd, 2007). As a consequence, the sizing system developed according to 
a fit model brings an issue that it only fits a specific body type.   


---

 
 
 13 
It should be noted that there is a positive movement at the moment to endorse diversity 
of body figure and appearance. Two luxury fashion houses (LVMH and Kering) 
announced in September 2017  that they won’t hire  any super-skinny models  for their 
fashion shows and adds (Samuel, 2017). Pirelli calendar, which is well-known for 
being publicized every year with nearly nude pictures of the famous and beautiful 
women, debuted with a new issue in 2016. The pictures  in 2016 calendar were not 
supermodels but successful women with diversified professions, and they weren’t  
actually representing the ideal beauty perception of today (Rodulfo, 2015). Serena 
Williams (professional tennis player), an African American with a muscular body, 
being the cover of Vogue America (April 2015) is another example of this movement 
to alter ideal body perception of societies (Joseph, 2016).  
Eventhough there is a positive movement, ideal beauty perception remains as a 
constant problem for societies.  Hwang’s study (1996) confirms that women between 
18-25 are dissatisfied with their bodies and pursuit of the ideal body has a significant 
effect on this dissatisfaction (Hwang, 1996). Internalization of the standards imposed 
by the society is one of the main reason for body dissatisfaction (Johnson, Lennon, & 
Rudd, 2014). The foundation of this dissatisfaction is explained mostly by social 
comparison theory (SCT). According to SCT, people have a propensity to compare 
themselves to others to endeavor “the ideal” or “the normal” (Festinger, 1954). As 
explained so far, the comparison with the ideal body may cause a dissatisfaction about 
one’s self and this dissatisfaction may consequently decrease the garment fit 
satisfaction of the person. 
1.3.2.2 Internal factors 
Body satisfaction  
Body satisfaction notion has been used interchangeable with body cathexis in the 
literature. Body cathexis notion was first used by Jourard and Secord and defined as 
the satisfaction or dissatisfaction of one’s own body (Secord & Jourard, 1953). After 
Secord and Jourard’s study (1953), scholars started to focus on factors affecting the 
body satisfaction levels of individuals. A study done in 1976 suggested that face 
accounts most for the general appearance satisfaction and it is followed by the weight 
(Mahoney & Finch, 1976). However, a following study found that weight was the 
essential antecedent for general appearance satisfaction (Garner, 1997).  


---

 
 
 14 
Kaiser (1990) mentioned that self-feelings  may influence the clothing preferences and 
attitudes of the consumers (Kaiser, 1990). Fit preferences of two women with same 
height, weight and body measurements may be different (Alexander, Connell, & 
Presley, 2005). Later, LaBat (1987) associated these self-feelings with body 
satisfaction and linked it to the garment fit satisfaction for the first time (LaBat, 1987). 
In her studies she showed that, women are less satisfied with their lower body parts 
and, consequently, they have the highest  dissatisfaction with the garment fit at thigh, 
hips and buttocks ( LaBat, 1987), ( LaBat & DeLong, 1990).  
After 1990s, numerous researchers focused on the body satisfaction/dissatisfaction 
correlation to garment fit satisfaction, clothing preferences and body shape (Shim, 
Kotsiopulos, & Knoll, 1991), (Hwang, 1996) (Alexander et al., 2005), (Pisut & 
Connell, 2007), (Manuel, Connell, & Presley, 2010). Hwang’s dissertation (1996) 
elaborately investigated the association of body satisfaction with clothing benefits 
sought and clothing behavior (Hwang, 1996). This study found that women that are 
satisfied with their weight and lower body parts tend to be more satisfied with garment 
fit at thigh and hips areas (Hwang, 1996). Kim and Damhorst (2010) proved that 
women with higher body dissatisfaction is more likely to have concerns with garment 
fit during an online shopping ( Kim & Damhorst, 2010).  Shim et. al.’s (1991) study 
distincts from others as it explored the correlation between body satisfaction and 
clothing attitude,  and shopping behavior of male consumers and it still confirmed a 
positive correlation between body satisfaction and clothing attitude of men (Shim et 
al., 1991).  
Alexander et. al. (2005) studied the correlation between clothing fit preferences of 
women between 18 to 30 years old and their garment fit satisfactions. She found that 
female participants with a higher body satisfaction at certain body parts were more 
confident to wear garments which reveal those parts of their bodies (Alexander et al., 
2005).  Since fitted garments reveal the body features, studies confirm that women 
with higher body satisfaction appreciate tight clothes more than the women with lower 
body satisfaction (Pisut & Connell, 2007). 
Since studies showed that women have different satisfaction levels for different body 
parts, researchers questioned if body satisfaction level significantly varies also for 
different body shapes. According Manuel et.al. (2010) study, women with a 
rectangular body shape were  more satisfied with their lower and upper body than the 


---

 
 
 15 
women with a pear- shaped body (Manuel et al., 2010). Another study reports that 
body satisfaction level of women with inverted triangular and hourglass body shapes 
were significantly higher than those with rectangular and pear shaped bodies (Pisut & 
Connell, 2007). 
Physical dimensions 
Physical fit (dimensional fit) notion emanates from the dimensional relation between 
the cloth and the wearer (Yu, 2004). Tightness,  length and size of the cloth are the 
three most common words used by the consumers to describe the physical fit (Shin, 
2013).  Tightness of a garment is closely related to garment ease. As mentioned earlier, 
garment ease can either depend on the design or the necessary space for the wearer to 
function easily. Design ease is more subjective as one consumer may prefer a loose fit 
design while another one prefers a skinny fit design (Presley, Connell and Alexander, 
2005).  Studies prove that the clothing preferences are  related to body measurements 
and body shape of the subject as well as her fashion taste (Apeagyei, 2008), (Pisut & 
Connell, 2007). However, the garment ease needed for the wearer to function 
comfortably (functional ease) is more objective. Functional ease is highly correlated 
to fabric properties and  these fabric properties determine the physical fit of a garment 
(Yu, 2004). Two garments with same measurements and same style may look and 
function differently if their fabrics are different. In other words, garment fit is also a 
function of fabrics’ mechanical and drape properties (Thi, Ngoc, & Anh, 2010).  
Online apparel shopping and approaches to minimize garment fit issues 
during online shopping 
Clothing online sales were always behind electronics, hardware and office supplies 
until 2014 (Russell, 2017). However, apparel industry started to transform lately. For 
instance, regardless of the product category, global online retail value is estimated to 
be  almost $3000 billion by 2018  (Garcia, 2018), and surprisingly more than 10 
percent of it is  expected to account for clothing and apparel category (Orendorff, 
2018).  Eventhough apparel online shopping numbers are increasing, studies show that 
consumers still prefer in-store shopping over online shopping when clothing and 
footwear is considered (PwC, 2017). For instance, H&M, one of the biggest apparel 
retailers in the world, reported that their online sales’ value was $3.7 billion  in 2017 


---

 
 
 16 
which is only 12.5 percent of their total sales for that year (Business Insider Nordic, 
2018).  
One of the biggest obstacles of online apparel shopping, and probably the biggest 
reason why in-store shopping is still greater than online shopping, is that; in retail 
shopping, information gathering and desire for the product is strongly connected to 
touching the product (Peck & Childers, 2003). However, as mentioned by Rodrigues 
et.al. (2017), this feature is missing for online shopping (Rodrigues, Silva, & Duarte, 
2017). 
For online sales, fashion brands often prefer to display their products as a picture which 
consists of a fashion model wearing the product. This state brings an issue together:  
consumers consistently struggle during online shopping because they cannot see 
bodies similar to their own. On the other hand, this situation may cause a discrepancy 
on consumer perception of her own body and the ideal body offered by the retailer 
(Kim & Damhorst, 2010), (Shin & Baytar, 2013).   
Return rates of apparel online shopping is an indicator that consumers are not very 
satisfied with the product information they gather during online shopping. Online 
shopping return rates of apparel products are five times more than actual store returns 
(Winkler, 2017).  According to industrial and academic researches garment fit is one 
of the biggest reason of apparel returns (Kim, 2008), (Shin, 2013), (Rivero & Zhu, 
2016), (Ratcliff, 2014), (Winkler, 2017). 
1.3.3.1 Improving sizing systems 
Unfortunately, the sizing of clothing is quite complicated, especially for the 
consumers. The main reason of this complication is that sizing labels vary for 
countries, genders, companies and product groups (Chun, 2007). In addition to 
complicacy of labeling systems, consumers are also confused as they fit into different 
sizes of different brands due to vanity sizing. Size specifications of an apparel brand 
are determined according to the demographics of the target customers. After selecting 
a fit model that reflects the average measurements of target customers, the 
smaller/bigger sizes are graded according to brand’s target costumers’ measurements 
(Chun, 2007). As a result of this process,  consumers encounter clothes from different 
brands that has the same size label but  different measurements (Ashdown, 2007).  To 
minimize this confusion, size standardization is offered by multiple standards 


---

 
 
 17 
organizations such as ASTM in US. Establishing a reliable size standardization 
requires a large-scale and long-term anthropometric study. ASTM 5585-11 (Standard 
Tables of Body Measurements for Adult Female Misses Figure Type, Size Range 00–
20) was first developed in 1994 based on O’Brien and Shelton’s study (O’Brein & 
Shelton, 1941) and the earlier sizing system which dates back to 1950s (U.S. 
Department of Commerce, 1958). 
Following the technological innovations, especially the  3D body scanning technology, 
size standardizations were updated with more recent anthropometric data (Robinette, 
Daanen, & Paquet, 1999). At the beginning of 2000s, some leading apparel brands 
sponsored a project named SizeUSA. Over ten thousands subjects from twelve 
different cities in US were scanned by 3D body scanners (The Textile Clothing 
Technology Corporation, 2003). These large-scale body scanning projects provided a 
deeper understanding of the average anthropometry of the society. After national 
studies such as SizeUSA, SizeFrance, SizeMexico, some companies adjusted their size 
specifications according to the outcomes of these studies (Zernike, 2004).  
Recently, human body has been subjected to alterations due to changing ideal beauty 
perception and eating habits (Bozsik & Bennett, 2018).  Human Solutions Company 
is working on Size North America, to obtain most recent body measurements of 
Americans and scan eighteen thousand men, women and children (Human Solutions, 
2018).  
1.3.3.2 Online size and fit recommendation 
A couple of years ago, apparel brands were only providing their size charts as a guide 
in their web sites. However, some costumers didn’t know their body measurements 
precisely or wasn’t sure how to measure their bodies.  Nowadays, some apparel brands 
are offering alternative solutions to their customers. These new solutions are mostly 
based on 3D scan data provided from earlier large scale surveys (Gill, 2015). Some 
fashion brands, for instance Mango, ASOS and Zara, are collaborating with several 
online technology providers to offer the correct size to their consumers during online 
shopping. These interfaces usually ask costumers to enter some of their body 
measurements (mostly height, weight, bust, waist and hip girth) to offer the most 
appropriate size of the product.  


---

 
 
 18 
After 2010, there have been many start-ups to offer solutions for online fitting issues. 
The leader online technology providers were listed by Gill (2015) as Fits me, Metail, 
Fit Analytics GmbH, Model My Outfit, Qvit and TrueFit (Gill, 2015). However, the 
ground has been slippery and some of these start-ups closed down while some of them 
changed strategy. By 2018, the leading companies offering size and fit 
recommendation interfaces to the consumers are given below:  
Fit Analytics GbBH 
Fit Analytics is a Berlin based company established in 2010. Fit Finder is the size 
recommendation interface that uses the big data provided by collaborating brands and 
costumers. Fit Finder uses machine learning to analyze the data. Previous shopping 
history of costumers are recorded and used for the future shopping activities. Many 
fashion retailers (e.g. Mango, ASOS, North Face, Puma, Tommy Hilfiger)   work with 
Fit Finder to recommend proper garment size to their costumers (Fit Analytics GmbH, 
2018). To be able to get a size recommendation, costumers are asked to enter their 
height, weight, age and body shape. This information is saved by Fit Finder and 
matching size is recommended to the costumer. Fit Finder saves data from different 
retailers and collects them in a data pool. When a costumer enters her body 
specifications, Fit Finder scans this pool to find similar customers and their previous 
purchases with an information about their return rates. Finally, Fit Finder offers the 
costumer the best size by making a deduction of these information (Fit Analytics 
GmbH, 2018). 
True Fit 
True Fit company has named their size recommendation interface as True Fit 
Confidence Engine. Similar to Fit Finder, costumers are asked to insert their height, 
weight and age. However, costumers are also asked to select an apparel brand which 
they think its products fit best to their body figure. True Fit collects data (size specs, 
style attributes etc.) from hundreds of apparel brands worldwide and stores it through 
TrueFit Genome interface. According to their web site, they have the largest connected 
apparel fit and style data (True Fit, 2018) in the world. Macy’s, Levi’s, American Eagle 
Outfitters, Nordstrom are some of the big brands that collaborate with True Fit to 
recommend size to their costumers (True Fit, 2018).  
 


---

 
 
 19 
Rakuten Fitsme 
UK/Estonian based start-up Fitsme was acquired by Rakuten (Japanese e-commerce 
company) in 2015. Rakuten Fitsme offers several services for apparel sector. Fit Origin 
is the size recommendation interface driven by body data and garment data similar to 
the other companies explained above.  Gant and Mud Jeans are some apparel brands 
that utilize Fit Origin to recommend sizes to their online costumers (Rakuten Fitsme, 
2018).  
1.3.3.3 Online visualisation of garment fit  
3D garment fit simulation technology has been often used by apparel companies during 
product development. Garment manufacturers and designers have been using 3D 
garment fit simulation technology to speed up product development stage and 
eventually minimize their costs (Park, Kim and Sohn, 2011). Target, Kohl’s, JCPenney 
are only a few of the apparel brands to use this technology for product development 
(Lee & Park, 2017). Although garment fit simulation technology found a wide 
acceptance among the apparel brands, its presence for online shopping has been 
limited. Online visualization technologies aim to create the most accurate virtual 
models of the consumers and simulate a realistic garment on them, in other words they 
propose the consumer to virtually try-on the garment (Kim & LaBat, 2013b). Virtual 
try-on is described as an online (web)  activity where users can choose garments online 
and try-on the virtual garments on the created/exported 3D models (mannequins) 
(Cordier, Seo, & Magnenat-Thalmann, 2003), (Volino, Cordier, & Magnenat-
Thalmann, 2005) .  
For online shopping, creating avatars of costumers is very critical and challenging.  
The most realistic avatars can be obtained by 3D body scanning technology 
(Magnenat-Thalmann, 2010). Other approaches  to create avatars either depend on the 
photographs of the body or the size charts ( Liu, Zhang, Ming, & Yuen, 2010). The 
photographic approach is based on taking pictures of orthogonal views (side, front etc.) 
of the body and extracting body silhouette by using image processing technique 
(Wang, Wang, Chang, & Yuen, 2003). However, size chart method is more feasible 
for online interfaces, thus it is often preferred by companies that offer online virtual 
try-on technologies (Liu et al., 2010).   


---

 
 
 20 
In Gill’s review published in 2015, four companies were mentioned to offer virtual 
try-on technologies online (Fitsme, Qvit, Metail and Model My Outfit), (Gill, 2015). 
However, in 2018, only Metail is operating. Metail is a UK based company, and it 
aims to corporate with apparel brands to extend virtual try-on experience to their 
customers during online shopping. In order to virtually try-on a garment, users are 
asked to enter several information about their bodies such as height, weight, bra size 
and body shape, and pick a profile photo from the offered library to create their avatar. 
After creating their avatar, they can scroll down in the brand’s website to pick a 
garment they would like to virtually try-on. When the garment is selected, Metail 
interface displays how the garment will look on the virtual model of the user. Aside 
the virtual try-on, the interface also gives size recommendation and fit information 
(tight/loose) of the recommended size (Metail, 2018). 
3D garment simulation  
Garment simulation, 3D garment simulation and virtual garment simulation notions 
have been used interchangeably in textiles and clothing researches to define the 
creation process of virtual garments or 3D garments. Garment simulation is described 
as the three dimensional depiction of a cloth in virtual environment (Magnenat-
Thalmann, 2010). 
Researchers have been working on garment simulations almost over three decades. 
The early attempts to simulate a cloth dates back to 1987 (Terzopoulos, Platt, Barr, & 
Fleischer, 1987). Garment simulation  favors the computer graphics, animation and 
game sectors to create virtual garments on animated characters (Volino et al., 2005). 
Besides graphic designing, garment simulation has significant advantageous for 
garment manufacturers, retailers and apparel consumers. 
First of all, garment simulation technology is an effective tool for product 
development. Traditionally, product development starts with a 2D sketch and it is 
followed by prototyping until a final decision is made on the product design and the 
garment fit (Keiser & Garner, 2012). The traditional method for product development 
is time consuming and expensive due to multiple prototypes prepared during the 
process (Bye & Labat, 2005) . Besides, most of the manufacturers are located overseas 
which makes the communication and sample transaction between apparel 
manufacturers and the retail companies troublesome (Magnenat-Thalmann, 2010). 


---

 
 
 21 
Adoption of garment simulation technology helps manufacturers and retailers to see 
the garment on a computer screen before actually producing it and to make any 
necessary amendments digitally (Park, Kim, & Sohn, 2011), therefore it is already 
being used by some of the leading apparel retailers (Lee & Park, 2017).  
Secondly, there is a growing demand  for customized garments that embrace specific 
needs of consumers ( Lu, Wang, Chen, & Wu, 2010). Mass customization is a 
marketing approach to overcome this demand (Kotler, 1989), (Pine, 1993). For mass 
customization three steps are prominent:  body dimension collection, garment pattern 
generation and fabric cutting (Lu et al., 2010). Garment pattern generation has long 
been achieved by CAD/CAM systems (Hu, 2011). However, with the integration of 
3D technologies , now it is possible to simulate garments on individual customers in 
virtual environment (Lim, 2009), (Satam, Liu, & Lee, 2011).  
Finally, garment simulation technology emerges as the most sophisticated technology 
to boost online shopping for clothing (Bohnhoff, 2016). Garment simulation 
technology can offer consumers a  dressing room experience without actually going to 
a store and enhance their  shopping involvement during an online purchase ( Loker et 
al., 2008), (Kim & LaBat, 2013b). 
1.3.4.1 Modeling the cloth 
Since 1980’s researchers have embraced alternative models to simulate clothes (House 
& Breen, 2000), (Magnenat-Thalmann, 2010). As stated by Magnenat-Thalmann : 
“The mechanical properties of fabrics account for how the fabric will react to a 
deformation” (Magnenat-Thalmann, 2010). Breen et.al.’s study (1994) was a pioneer 
to incorporate fabric mechanical properties to create fabric simulations. In their study, 
a cloth was modelled as a  collection of particles that were the intersection points of 
warp and weft yarns and these intersections were subjected to mechanical forces such 
as gravity, bending, trellising (shearing), stretching and collision (Breen, House, & 
Wozny, 1994). Other studies followed  this particle-based simulation principle and 
benefitted from the mechanical and drape behavior of fabrics to create fabric 
simulations (Bottino, Laurentini, & Scalabrin, 2001), (Volino & Magnenat-Thalmann, 
2005).  
Most of the contemporary commercial 3D garment simulation software use mass- 
spring (particle-based) models  to create garment simulations (Power, 2013). Users of 


---

 
 
 22 
these software are either asked to insert fabrics’ mechanical properties or, select a 
fabric from the software library. This library has fabric alternatives with predetermined 
mechanical properties. The modelling principle of the mass-spring simulation was well 
presented by Jiang and peers (Jiang, Guo, Ma, & Shi, 2018). In mass-spring model, 
fabric surface is thought as a mash of warp and weft yarns. The vertices of this mash 
are imagined as particles that are vulnerable to the impact of the forces. According to 
the model, each particle has its own coordinates, mass and velocities. In this theoretical 
approach, particles are thought to connect with linear springs. Each spring is 
responsible of different forces (external and internal) acting on fabric. The external 
forces are gravity, air resistance and friction, and the internal forces are tension, 
shearing and bending (Jiang et al., 2018). This relationship is illustrated in Figure 1.3. 
 
Figure 1.3 : Forces acting on particles in mass-spring model used for cloth 
simulation (Jiang et al., 2018). 
As summarized by Luible and Magnenat-Thalmann (2007), realistic fabric simulations 
depend on two factors: accurate computational models and explicit input of fabric 
mechanical properties (Luible & Magnenat-Thalmann, 2007). Hence in the following 
section, fabrics’ mechanical properties and the systems to measure these properties are 
summarized. 
1.3.4.2 Mechanical properties of fabrics 
Mechanical properties of fabrics are the measures to understand fabrics’ behaviors 
under various forces. These mechanical properties are often categorized into four 
groups: Compression, tensile, bending and shear properties. The forces applied on a 
fabric to measure these properties are simply illustrated in Figure 1.4.  
 


---

 
 
 23 
 
Figure 1.4 : Forces applied on fabric surfaces to measure their mechanical 
properties (Chan et al., 2006). 
Thickness of fabric under various loads reflects its fullness and softness  properties 
and it is correlated with its compression properties (Wang, Liu, & Hurren, 2008). 
Tensile properties of fabrics give an insight about the strength and elongation 
properties of the fabrics.  Elongation is the extension percentage (%) of the fabric on 
its axial direction, and it is calculated by measuring the sample length increase when 
it is subjected to a force.  Shearing is  critical for garment fit, since it contributes to the 
fabrics’ conformation behavior on complex surfaces such as body counters (Skelton, 
1976). Shear is often pronounced for woven fabrics because it is a result of  yarn 
slippage at the interlacing points of warps and wefts (Wang et al., 2008). When a 
woven fabric’s two parallel edges are subjected to equal but opposite stresses, the warp 
and weft yarns rotate (shear) along the fabric plane axis and yarn slippages occur at 
their intersections (Skelton, 1976), (Sanad & Cassidy, 2015).  Bending is described as 
the flexing capability of a material, and resistance to this bending action is called 
bending rigidity (or flexural rigidity). Bending rigidity is correlated to the aesthetic 
and the comfort properties of the fabrics (Wang et al., 2008). Finally, the smoothness 
and softness properties of fabrics are associated with the surface characteristics of the 
fabrics (Moorthy & Kandhavadivu, 2015). Resistance to sliding motion when being 
pulled over a surface is described as fabric’s surface friction (Sanad & Cassidy, 2015), 
and it has considerable importance on subjective assessment of a cloth (Moorthy & 
Kandhavadivu, 2015). Surface friction properties of a fabric can be either measured as 
static friction or dynamic friction. Static frictional force is the maximum force required 
to move and slide a static fabric under a load, and the dynamic frictional force is the 
average force required to sustain sliding (Moorthy & Kandhavadivu, 2015). For the 
wear conditions, dynamic friction is critical because fabrics do not stay still on human 
body and there is a constant friction among the human body and the fabric (Moorthy 
& Kandhavadivu, 2015). The friction coefficient alone may not be enough to describe 


---

 
 
 24 
the fabric smoothness or surface properties (Kim & Slaten, 1999), (Moorthy & 
Kandhavadivu, 2015). Therefore, surface roughness is also measured often along with 
the surface friction. The surface roughness is defined as the average distances between 
the throughs and peaks on the fabric surface (Cassidy, 2002).  
Fabric objective measuring (FOM) systems 
Over years, researchers developed some instruments to objectively measure fabrics 
properties. Kawabata Evaluation System (KES-FB) and Fabric Assurance by Simple 
Testing (SiroFAST) are widely accepted instruments to measure fabrics’ mechanical 
properties (Postle, 1999). These instruments are often used for research purposes due 
to their high costs and difficult interpretation of their test reports (Kim & Slaten, 1999). 
Therefore, usage and acceptance of FOM systems are small among the apparel 
industry. On the other hand, some researchers also advise that hand properties of 
fabrics should  be evaluated subjectively since the hand assessment of fabrics is an 
aesthetical preference of individuals (Brand, 1964).  
Kawabata evaluation system (KES-FB) 
KES-FB is actually a set of instruments that measure sixteen different mechanical 
properties of fabrics. KES-FB consists of four different instruments, and each 
instrument measures particular behavior of fabrics (Kawabata & Niwa, 1991).  
Tensile and shear properties of the fabrics are measured with KES-FB1 (tensile and 
shear tester). The only difference between shear and tensile testing is the orientation 
and the magnitude of the force applied on the fabric sample. For shear testing, a fabric 
sample at dimensions of 5 cm x 20 cm are cut and clamped along one of the longer 
edges. Thereafter, the fabric is subjected to a constant tension (10 gf/cm) until it 
reaches to a shear angle of 80. The same sample that was used for shear testing is now 
pulled in  the vertical direction to the long edges to measure tensile properties 
(Kawabata & Niwa, 1991), (Postle, Kawabata, & Niwa, 1983).  
For bending test, KES-FB2 (bending tester) is used. For this test a 20 cm long test 
sample is clamped between two chucks which are located 1 cm apart. One of the 
chucks is stable while the other one moves to bend the fabric sample with a speed of 
5 mm/sec. At the end of the test, the bending moment- curvature curve is plotted to 
show the bending behavior of the fabric.  


---

 
 
 25 
Compression is tested by KES-FB3 (compression tester), and it actually is the opposite 
concept of the tensile testing. In this test, a fabric sample is placed between two plates, 
and the upper plate slowly (approximately 1mm/min) moves to compress the fabric 
until the pressure on the fabric reaches up to 50 gf/cm2. When the pressure reaches up 
to 50 gf/cm2, the force is removed, and fabric is allowed to recover.  
Finally, KES-FB4 (surface tester) measures, friction and roughness properties of the 
fabric surface. To measure these properties, a sample is place on a surface and the 
surface is moved slowly. During this motion, a probe measures the surface roughness 
while a tension device measures the required force to overcome the friction force to 
move the fabric.   
Fabric assurance by simple testing (SiroFAST) 
SiroFAST is advantageous over KES-FB since it is less expensive, easy to operate and 
interpret the results (De Boos & Tester, 1994). However, unlike KES-FB, SiroFAST 
instruments are not designed to measure the surface properties (surface friction and 
roughness) of the fabrics. SiroFAST system consists of three individual instruments to 
measure fabrics’ mechanical properties. 
SiroFAST-1 (Compression meter) is designed to measure fabric thickness under two 
different loads (2 gf/cm2 and 100 gf/cm2). SiroFAST-2 (Bending meter) measures 
bending properties of fabrics. There are alternative standards to measure fabrics’ 
bending properties such as cantilever method and hanging loop method (ASTM 
International, 2014). SiroFAST-2 uses cantilever bending method. In this method a 
strip of fabric slowly slides over a flat surface. One edge of the fabric is allowed to 
hang freely under its own weight until it makes a 41.50 angle with the edge of the flat 
surface. The bending length is measured automatically by an auxiliary light detector 
attached to the device.  The schematic diagram of SiroFAST-2 bending meter is given 
in Figure 1.5 . 
 
Figure 1.5 : Schematic diagram of SiroFAST-2 (De Boos & Tester, 1994).   


---

 
 
 26 
Finally, SiroFAST-3 (extensibility meter) measures elongation of fabrics under three 
different loads (5, 20 and 100 gf/cm). The elongation can be measured in warp and 
weft directions. To measure elongation of the fabrics in warp and weft directions, 15 
cm x 5 cm fabric samples are prepared at the first place.  Elongation under different 
loads are automatically calculated by the displacement meter and reported to the user. 
The elongation is denoted as E5, E20 and E100 in SiroFAST. SiroFAST-3 is also used 
to measure the shear rigidity of the fabrics. To measure the shear rigidity, bias cut 
fabric samples are pulled with a load of 5 gf/cm (or ~5 N/m). The bias elongation of 
the samples are used to calculate the shear rigidity (CSIRO, 1990), (Wang et al., 2008). 
Table 1.1 shows the tests that can be conducted by using SiroFAST. 
Table 1.1 :  Summary of SiroFAST tests and measured fabric properties (De Boos & 
Tester, 1994), (Wang et al., 2008). 
Test 
Instrument 
Property 
Description 
Unit 
Compression 
SiroFAST-1 
T 
Thickness of fabric under   
2 gf/cm2 and 100 gf/cm2 pressure 
mm 
Bending 
SiroFAST-2 
B 1 
Bending stiffness of fabric (warp 
direction) 
µN
m 
B 2 
Bending stiffness of fabric (weft 
direction) 
µN
m 
Shear 
SiroFAST-3 
G 
Shear rigidity at 5 gf/cm 
extension in bias direction 
N/m 
Tensile 
SiroFAST-3 
E5-1, E20-
1 and 
E100-1 
Fabric extension in warp direction 
under 5, 20 and 100 gf/cm stress, 
respectively 
% 
E5-2, E20-
2 and 
E100-2 
Fabric extension in weft direction 
under 5, 20 and 100 gf/cm stress, 
respectively 
% 
1.3.4.3 Commercial 3D garment simulation software 
Parallel with the developments in garment simulation and 3D scanning technologies, 
various companies have started to offer commercial 3D garment simulation software  
for two different aspects: animations & graphics or garment fit (Volino et al., 2005). 
The graphics & animation applications require much computing power than garment 
fit applications because the graphic characters move and interact with each other. On 


---

 
 
 27 
the other hand, accuracy of the simulation for graphic applications is not as critical as 
garment fit  applications (Loker et al., 2008).  As mentioned in Volino and Magnenat-
Thallmann’ s early review (2005), the simulation software for animation & graphics 
were based on mass-spring  models (mechanical model) operating with some of the 
mechanical properties of the fabrics but they didn’t have any additional function for 
designing a garment (Volino et al., 2005). These types of simulation software were 
listed as MayaCloth, Reactor, Stitch, SimCloth, 3d Studio Max and Dynamics (Volino 
et al., 2005). Currently Maya and 3ds Max software are owned by the same company 
(AutoDesk) and the garment simulation function on Maya is called “nCloth”  and 
“Cloth” on 3ds Max (AutoDesk®, 2018). “Cloth” is now integrated with a design 
function called  Garment Maker which allows user to create basic 2D garment patterns 
by the software and virtually stitch them together (AutoDesk®, 2018). Finally, Blender 
is an open source software which is especially designed for game and animation 
purposes but  users can also create simple clothing for their animated characters 
(Blender, 2018).  
As mentioned earlier, for more complex garment designs and simulations, there are 
alternative commercial software packages which are specifically developed for apparel 
purposes (Sayem et al., 2010), (Gill, 2015). Some of them are given below.  
Marvelous designer 
Marvelous Designer was especially designed to create complicated garment designs 
for animation and game industry. Since the software is suitable for complex garment 
designs, it is appropriate for fashion and apparel use as well, and consequently this 
feature makes it a transition software between the animation and apparel practices.  
The software allows users to create 2D patterns and virtually stitch them to create a 
3D garment. It has all of the design functions that is necessary for pattern creation and 
it is compatible with 3ds max and Maya, thus, virtual characters could be exported 
through these external software (Marvelous Designer, 2018). 
Clo 3D 
Eventhough Clo 3D is relatively newer than the other simulation software, it has 
successfully penetrated to fashion industry and fashion education. They vary from their 
competitors by enabling its users to create simulations for alternative product groups 
which has a fabric content such as hats (Clot3D, 2018). 


---

 
 
 28 
O/Dev by Optitex 
Optitex is one of the pioneer companies to develop 3D garment simulation software 
for apparel purposes. Optitex offers O/Dev software to create 2D patterns by its pattern 
making suite  and simulating the garment on the virtual model by its 3D product 
creation suite. The software enables its users to create a parametric model or export a 
3D body scan (Optitex, 2017). There are multiple fabric options in their fabric library, 
and users are entitled to change the fabric properties manually. An add-in, Fabric 
Testing Utility (FTU), could be additionally purchased to test  the fabric properties 
(Optitex, 2016). 
Modaris 3D by Lectra 
Lectra is one of the early adopters to offer CAD systems for apparel practices, and in 
2013 they expanded their business by introducing Modaris 3D to the market. As 
similar to other software, Modaris allows user to change fabric properties and create 
realistic 3D garment simulations. One of their advantage is that many companies have 
a familiarity with the Lectra CAD systems that makes their transition to its 3D 
simulation software easier (Lectra, 2014). 
V-stitcher by Browzwear 
V-stitcher is the 3D garment simulation software of Browzwear Company. Adidas, 
Nike and Columbia are listed under their client list (Browzwear, 2018). Browzwear 
company has also developed its fabric measuring instrument named Fabric Analyzer 
by Browzwear (FAB). Users can easily measure thickness, bending and extension 
properties of the fabrics and directly use the measured data to create more realistic 
simulations (Browzwear, 2018). 
Vidya by Human Solutions 
Human Solutions Company, which is actually specialized in 3D body scanning, has 
introduced its 3D garment simulation software Vidya before 2008 (Luible, 2008). 
Human Solution integrates its  pattern making and body scanning experience gained 
over years to their 3D garment simulation software ,Vidya  (Human Solutions, 2018c). 
 
 
 


---

 
 
 29 
Virtual body models 
1.3.5.1 Approaches to create virtual body models 
For an effective virtual try-on experience, it is necessary to have an accurate and 
realistic human body model. There are alternative methods to model the human body. 
As summarized by Wang and Shen (Wang & Shen, 2018) ; these methods are: 
Virtual body models based on anatomy 
In an anatomical approach, as the name implies, human body is modelled according to 
its anatomical structure which consists of four layers: skeleton, muscle, fatty tissue and 
skin. Geometry, deformation and the texture of each layer is modelled individually to 
represent their anatomical features (Dong, Clapworthy, Krokos, & Yao, 2002). 
Virtual body models based on photographic images 
In this method, researchers capture the body image often with taking pictures from 
different perspectives and obtaining the cross-section of the body at various 
coordinates in order to interpret the 3D shape of the body (Seo & Magnenat-Thalmann, 
2003), (Liu et al., 2010), (Zhu, Mok, & Kwok, 2013). 
Virtual body models by 3D modeling programs 
Some CAD programs such as Maya, 3ds Max, Blender are used to create virtual body 
models. Usually  side, front and back photographs of a reference model is viewed in 
the software, and the 3D model is usually created by modifying a cylindrical shape 
according to the reference photograph (Crossley, Cornelissen, & Tovée, 2012).  
Virtual body modeling by using parametric data 
Parametric modeling systems use multiple body measurements to create 3D body 
models. In earlier attempts of parametric approach, created body models were very 
much cartoon-like. However, recently scanned body databases have started to be used 
to create parametric models. In this novel approach, thousands of 3D body scans are 
collected and statistically analyzed in terms of body measurements and shapes. While 
creating a brand-new 3D body model, the body measurements of the real model are 
matched to the 3D scans in the database. Afterwards, the matching 3D scans are 
assembled and modified to create the 3D body model of the real model (Baek & Lee, 
2012).  


---

 
 
 30 
Virtual models obtained by 3D body scanning 
3D body scanners have been investigated by scholars for their usage for apparel 
purposes since 1995 (Jones, Li, Brooke-Wavell, & West, 1995). Earlier 3D body 
scanners were very expensive ($40.000-$410.000)  and immobile (Ashdown et al., 
2004). Recently, with the introduction of depth perception cameras to create human 
body models (Tong, Zhou, Liu, Pan, & Yan, 2012) , prices and mobility of the 3D 
body scanners transformed tremendously. In the following section, contemporary 3D 
body scanning technologies are summarized. 
1.3.5.2 Latest 3D body scanners  
The latest 3D body scanners on the market capture the 3D body surface most often by 
using light projection or image capturing techniques (Gill, 2015). Modern 3D body 
scanner prices vary between $1.000-$20.000 and they can scan as fast as 1 to 10 
seconds (Gill, 2015).  
Table 1.2 presents contemporary 3D body scanners often used for apparel purposes, 
and the following section summarizes the working principles of these 3D body 
scanners. 
Table 1.2 : Apparel focused 3D body scanners.  
Company 
Name 
 Model 
Number 
of sensors 
Scanning 
System 
Source of 
information 
Human 
Solutions 
Vitus  
8 
Laser light 
(Human Solutions, 
2018b) 
Human 
Solutions 
Ditus MC 
12 
Structure light 
(infra-red) 
(Human Solutions, 
2018a) 
Size Stream 
SS20 3D  
20 
Structure light 
(infra-red) 
(Size Stream, 2018) 
Styku 
Styku 
1 
Structure light 
(infra-red) 
(Styku, 2016) 
TC2 
TC2-19R  
3 
Structure light 
(infra-red) 
(TC2, 2018b) 
TC2 
TC2-105  
8 
Structure light 
(white light) 
(TC2, 2018a) 


---

 
 
 31 
 
Laser line systems 
In this system a strip of laser light is projected onto the human body in a chamber 
which is surrounded by cameras in every corner. The laser line deforms by the object’s 
shape, and cameras record the deformation. The recorded images are digitized by the 
3D body scanner’s software in X-Y-Z coordinates and displayed on the computer 
screen. Finally, the images from multiple cameras are dispatched to create one single  
body model (Ashdown et al., 2004). Earlier versions of this type of scanners were 
extremely expensive, however, technology providers reduced the costs after the 
introduction of cheaper alternatives (Gill, 2015). The laser line scanners are generally 
used for research purposes as they are very accurate and have high resolutions (Yu, 
2004).  
Structured light systems 
This kind of scanning systems are sometimes called white light scanning systems 
because they use a  regular light source often white and sometimes red (Daanen & Ter 
Haar, 2013). These systems work according to optic principles as illustrated in Figure 
1.6. A grating (a grid like object) is placed in front of the light source and the light is 
projected onto the body surface. Part of the light is blocked due to grid structure of the 
grating while the unblocked light creates some patterns (fringes) on the body surface. 
Irregular shape of human body deteriorates these fringes and the resulting fringe 
patterns are captured by a camera. Finally the captured images of deteriorated fringe 
patterns are used to depict the body contour (Yu, 2004). 
 
Figure 1.6 : Principle of structured light systems (Sarbolandi, Lefloch, & Kolb, 
2015). 


---

 
 
 32 
The introduction of  Kinect camera in 2010, which is an add-on for Microsoft game 
council X-box, was a ground breaking innovation for 3D body scanning technologies 
which actually is a developed version of structure light system scanners (Tong et al., 
2012). Kinect uses near-infrared light as the light source which is not visible to human 
eye, whereas the sensors that the device is equipped with, can detect the infra-red light. 
Instead of stripe grids, Kinect uses a grid of dots.  In addition to surface countering, 
device is competent to capture the color of the scan surface (Sarbolandi et al., 2015). 
After Microsoft introduced Kinect in 2010, other companies also developed in-depth 
cameras working according to the same principle. Most of the hand-hold scanners 
currently available  use infra-red light  to capture the 3D shapes of the objects 
(Alexandrea, 2018). These type of scanners provide easy access as the equipment 
required for scanning is mobile and inexpensive, however, their resolution is not as 
good as a laser line scanning (Daanen & Ter Haar, 2013).  
For apparel applications, pioneers of 3D body scanning technology directed their 
attention to structure light system since the competition in the market has considerably 
challenged by the debut of Kinect type cameras. For instance, Styku, one of the sector 
leaders, uses a single Kinect camera for scanning (Styku, 2016). Many of the 3D 
scanner companies revised their products by adding in-depth cameras, and  most of the 
contemporary 3D scanners are based on structure light system (Daanen & Ter Haar, 
2013), (Gill, 2015) .  
3D scanning technology is developing with an incredible pace. Apple introduced its 
mobile phone iPhone X in November 2017, and this phone actually has an in-depth 
sensor working according to the same principles as Kinect and the other in-depth 
sensors. With iPhone X, it is now possible to get a very detailed scan of a human face 
in seconds (Miller, 2017) and probably in near future it will be possible to get a very 
detailed body scan with a mobile phone. 
Garment simulation for fit assessment 
Virtual fitting is a notion that emanated from the literature of 3D garment simulation 
researches. However, there is no official description for virtual fitting. Magnenat-
Thalmann (2010), one of the pioneers of 3D garment simulation studies, has used 
virtual fitting as the forced assembly of the 2D fabric patterns along the side seams in 


---

 
 
 33 
a virtual context and fabrics’ deformation according to the shape of the virtual model 
(Magnenat-Thalmann, 2010). 
In the past decade, as commercial 3D garment simulation software became more 
accessible, the evaluation of virtual garment fit has been investigated by scholars. In 
literature, virtual garment fit assessment is classified according to the method used for 
the process. These methods can be either  objective such  quantitatively 
measuring/calculating the strain on the garment (tension maps)  or the distance/area/ 
volume between body and virtual garment, or subjective as visually analyzing  a 
virtually dressed body model (Loker et al., 2008).  
1.3.6.1 Objective fit evaluation of a garment simulation 
Measuring distance/area/volume between the virtual model and the garment 
The linear distances between the 3D scanned body model and the virtual cloth is a 
quantifiable data. Two-dimensional and three-dimensional data such as circumference 
slices, surface areas, and volumes between the body scan and the cloth can be used to 
provide comprehensive and objective analyses of  the garment fit (Song & Ashdown, 
2010).  
Initial attempts to objectively evaluate virtual fit is attributed to Loker, Ashdown and 
Schoenfelder (Loker, Ashdown, & Schoenfelder, 2005). In their study, they offered an 
improved sizing system by using the information gathered from 3D body scan data 
(Loker et al., 2005). According to their objective, they scanned female subjects with 
pants and measured the volume and the area between body and the virtual pants (Figure 
1.7). They also evaluated the virtual fit visually. Therefore, their study is actually a 
combination of objective and subjective virtual fit evaluation (Loker et al., 2005).  
Lee et.al. adopted a similar approach (Lee, Nam, Cui, Choi, & Choi, 2007). In their 
research they produced two different garments and they assigned three female 
participants. Each participant tried the garment on and they got scanned with the 
garment. At the same time, researchers created virtual garment on the scanned body 
model by using a simulation software. Finally, vacant space areas, the areas between 
body scan and the garment at cross-sections, are obtained for certain body locations 
such as waist, hips etc. by using some special software. Eventually the calculated 
vacant spaces of real garments and the virtual garments were used to statistically 
compare the similarity of the fits (Lee et al., 2007).  


---

 
 
 34 
 
Figure 1.7 : Objective measuring procedure for fit evaluation (Loker et al., 
2005). 
Vacant space area is used by some researchers to develop a fit index (F) (Equation 1.1) 
which is expected to help garment fit evaluations (Xu & Zhong, 2003). Lin and Wang 
(2016) took the fit index  as a ground and suggested fit index relation  (Frelation) 
(Equation 1.2) which is a measurable parameter to compare real fit to virtual fit (Lin 
& Wang, 2016) .  
 " = 
$%&'()*+, $-./0
$-./0
 
(1.1) 
 
F: fit index, Agarment – Abody: the area between the body and the garment, Abody : total 
body area. 
"12345678 =
9:;'+<&=,9')&=
9')&=
 
(1.2) 
Frelation: fit index percentage for real fit and virtual fit, Fvirtual: fit index of garment 
simulation, Freal: fit index of real garment . 
Distance, area and volume between body model and the virtual garment are used to 
develop methods for production of customized garments with a better fit as well.  
Apeagyei and Otieno (2007) first tested the usability of a 3D simulation software for 
mass customization (Apeagyei & Otieno, 2007). The virtual ease values (the cross-
sectional distance between virtual model and virtual garment) at hips, waist and bust 
Volume 
Surface Area 
Circumference 
Slice Area 


---

 
 
 35 
were used to assess the fit of a skirt and a jacket simulation visually (Apeagyei & 
Otieno, 2007). In 2010, Wang and his peers developed a method to involve customers 
to the  production cycle for a customized garment (Wang, Lu, Chen, Geng, & Deng, 
2010).   In their method, customers were allowed to tweak style curves and cross-
sectional distances between the garment and the model on the 3D simulation software 
(Wang et al., 2010).   
Measuring stretch on the virtual fabric 
With the developments in 3D garment simulation technology, commercial software 
are now able to display the tension values on the virtual fabrics (Gill, 2015).  Some 
researchers thought to use these tension values for assessment of garment fit (Liu et 
al., 2017). 
Earlier works of using tension maps for garment fitting dates back to 2000’s. Kim and 
Park (2007) engaged 3D body scans to develop basic garment patterns (Kim & Park, 
2007). In their study, they used the strain reduction method to optimize the distance 
between the basic garment patterns and the body in a virtual context. Initially, they 
created 3D garments on the scanned bodies and determined the placement of the darts 
on 3D form, after, they projected the patterns on 2D plane. During this projection a 
certain amount of strain has occurred as the 3D pattern is forced to deform to a 2D 
plane. The optimum level of strain guided the researchers to determine  ideal basic 
patterns of  skirt and bodice ( Kim & Park, 2007). In 2011, Istook also benefited the 
stretch  values displayed  by the simulation software to compare the garment fit on two 
different body models (Istook, 2011). In Istook’s study (2011), one of the body model 
was obtained by 3D body scanning the subject and the other one was created by 
inserting the measured body measurements of the subject to the simulation software. 
However, even though she utilized  the  stretch maps displayed by the software, she 
had visually assessed the stretch maps for comparison (Istook, 2011). Ancutiene and 
Sinkevičiute (2011) also measured strain and ease values of tight fitting dresses on a 
virtual model created by a 3D garment simulation software (Ancutiene & Sinkevičiute, 
2011). The researchers aimed to explore the impact of fabrics mechanical properties 
on garment fit in virtual environment. Thus, they simulated ten dresses on the same 
model by inserting the mechanical properties of  ten different fabrics and eventually 
compared the ease and strain values of each simulation (Ancutiene & Sinkevičiute, 
2011). Figure 1.8 shows dress simulations and the ease values in Ancutiene and 


---

 
 
 36 
Sinkevičuite’s work that was obtained by using mechanical properties of alternative 
fabrics. 
 
 
Figure 1.8 : Ease values measured by a simulation software according to 
alternative fabric properties (Ancutiene & Sinkevičiute, 2011). 
Sayem and Bednall (2017) used Optitex’s 3D garment simulation software to create  
basic bodice patterns and to simulate the garment on a virtual model (Sayem & 
Bednall, 2017). They graded the bust measurement of bodice and obtained thirteen 
virtual garments which varied by 1 cm at bust. Finally, they calculated the average 
tension, stretch and collision pressure values of each garment to interpret their 
correlation with the alteration of the pattern measurement at bust. They suggested that 
the correlation between the real ease and tension values obtained from simulations 
might be used to predict a good fit (Sayem & Bednall, 2017). Sayem and Bednall’s  
(2017) suggestion was experimented by Liu and her colleagues (Liu et al., 2017). For 
their experiment, they selected nine females that represent the average female figures 
and sizes in China. Each participant was asked to select and try-on eight pants among 
seventy-two pants and decide if the pants they have tried are a good fit or a bad fit. At 
the same time, researchers created the 3D garment simulation of the pants on 
parametric body models in Clo 3DTM and measured the virtual pressure on each 
simulation. Finally, they used machine learning to predict the fit evaluation of women 
by using the virtual pressure data (Liu et al., 2017).  
Some researchers utilized garment simulation and virtual fit to design special garments 
for disabled.  For instance, Jin (2016) developed a shirt for a wheelchaired tennis 
player (Jin, 2016). For the product development, tennis player was 3D body scanned 
in various postures and the shirt was simulated on his body scans by using a 3D 


---

 
 
 37 
garment simulation software. Eventually, Jin (2016) determined optimum ease values 
of the shirt according to the tension values displayed by the software (Jin, 2016).   
Combining motion capture systems with 3D garment simulation software allowed 
researchers to explore virtual garment fit during motion. Mert and her colleagues 
(2018) simulated a top and a sweatpants on a  walking model (Mert et al., 2018).  In 
their study they displayed tension maps of the virtual garments for thirteen snapshots 
and compared the distances between the model and the garment for actual and virtual 
cases. Consequently, they analyzed the differences statistically (Mert et al., 2018). 
Some researchers use visual interpretation of tension maps displayed by 3D garment 
simulation software to understand virtual garment fit (Power, 2013), (Lee, Hwang, & 
Baytar, 2018). For instance,  Lee, Hwang and Baytar (2018) incorporated 3D garment 
fitting technology to develop better fitting garments for older women ( Lee et al., 
2018). They drafted virtual patterns on 3D body models and obtained 2D patterns by 
flattening method. Eventually they evaluated the fitness of developed patterns on 
virtual models by visually exploring tension maps displayed by the 3D garment 
simulation software (Lee et al., 2018).  
1.3.6.2 Subjective fit evaluation of a garment simulation 
Subjective analysis of the virtual garment fit is a common research approach since the 
beginning of the garment simulation studies. Some researchers actually propose that 
garment fit and drape are aesthetic concepts that depend on people’s preferences, 
hence, they should be evaluated by people (Brand, 1964). Another asset of subjective 
evaluation is that people can identify and process complicated stimuli such as complex 
forms of pattern recognitions where objective measurements are insufficient  
(Leibowitz & Post, 1982). Many researchers have followed Brands’s approach (Brand, 
1964) and explored virtual garment fit by visual assessment. For instance, in 2012, 
Jevsnik and her colleagues used visual fit assessment to compare the real fit and virtual 
fit of a jacket (Jevsnik et al., 2012). In their study, a group of clothing and textiles 
experts evaluated the pictures of jackets on a  real person and also on the virtual models 
of this person. The evaluation was done for different zones (sleeves, bust, bottom edge 
etc.)  of the jacket on a three-point scale, namely; insufficient, appropriate, good. The 
total scores given by the judges were used to compare the jacket fits for real and virtual 
environment (Jevsnik et al., 2012). In a similar study, a six-piece A-line skirt was 


---

 
 
 38 
produced and tried on by a fifty-five  years old female subject. The subject was 3D 
scanned and virtual fit of the garment were created in Optitex on the 3D scanned model 
and the parametric model of the subject and the real fit images and virtual fit images 
were visually assessed by the researchers (Buyukaslan et al., 2015). Ancutiene and her 
colleagues (2014) also employed an expert panel to evaluate virtual garment fit of 
dresses created by a 3D garment simulation software. In their study, twenty experts 
from textile industry viewed simulations of six dresses from front, back, armhole, bust 
and side. Figure 1.9 shows the simulation pictures of these six dresses. The expert 
panel ranked each image from 1 to 6 (1: best and 6: worst). Finally, researchers 
analyzed the ranking results to draw out a conclusion (Ancutiene, Strazdiene, & 
Lekeckas, 2014).  
 
Figure 1.9 : Fit evaluation of six different dresses created by using alternative 
fabric properties (Ancutiene et al., 2014). 
On the other hand, Hong et. al. (2018) explored the 3D to 2D design systems for 
customized bodice pattern for scoliosis patients (Hong, Bruniaux, Zeng, Curteza, & 
Liu, 2018). For this purpose, they 3D scanned twenty patients and developed basic 
bodice patterns on their 3D scanned body models. The evaluation of the fitting of the 
bodice patterns on 3D models were performed by fashion experts. According to the 
virtual garment fit evaluation protocol, each fashion expert viewed the virtual bodice 
on the 3D scanned model and evaluated fit for certain body parts such as bust etc. The 
evaluation was done on a Likert scale according to tightness and length 
appropriateness ( short/long and tight/fit) (Hong et al., 2018). Kim and LaBat’s (2013) 
study is one of the studies that has been referred often by researchers working on 
subjective fit evaluation of virtual garments (Kim & LaBat, 2013a). Their study is 


---

 
 
 39 
particularly different than other studies in two means. Many of the studies about 3D 
garment simulation software focus on product development aspect of virtual 
prototyping. Hence, they rely on expert evaluation of virtual garments. Whereas, Kim 
and LaBat’s (2013) study focuses on an online shopping scenario and employs users 
for fit evaluation of virtual garments (Kim & LaBat, 2013a). In their study, they 3D 
body scanned thirty-seven female participants at different sizes (2 to 20). Afterwards, 
researchers simulated a pair of pants on each participant’s  3D scanned body model. 
The virtual pants sizes varied between 2 to 20 to match participants’ sizes. Each 
participant viewed and selected the best fitting size on their own 3D scanned model 
and evaluated the virtual fit of that pants for thirteen fit locations on a 7-point Likert 
scale. Finally, participants are asked to try-on the real pants (the same size that the 
participant has selected during virtual garment) and evaluate the real fit of the same 
pants (Kim & LaBat, 2013a). Figure 1.10 shows the virtual fit of the pants created by 
using the 3D body scan of one of the subjects, and next to the virtual images, real 
pictures of the same subject wearing the actual pants are given. 
 
Figure 1.10 : Virtual fit images of a pants created by using 3D body scan image 
of a subject, and pictures of the real pants fitted by the same subject (Kim & LaBat, 
2013a). 
 


---

 
 
 40 
 
 


---

 
 
 41 
 
 METHODOLOGY 
 Theoretical Model 
As explained in theoretical background, garment fit satisfaction in real environment 
depends on two main factors: internal and external factors (Figure 1.2). Internal factors 
mainly depend on the wearer, and the external factors depend on the time and the 
society (LaBat & DeLong, 1990).  In this dissertation, exploring the impact of all 
internal factors affecting consumers’ fit satisfaction was embraced as the research 
approach. External factors were excluded due to culture, society and time dependence. 
The essential internal factors were identified in DeLong and LaBat’s study (1990) as 
body satisfaction and physical dimensions; and physical dimensions were described as 
the dimensional relationship between the body and the garment (Figure 1.2). To 
explore and test the factors affecting the real and virtual garment fit satisfactions of 
consumers, body satisfaction and physical dimensions titles were broken down into 
their components. The garment component is expanded by adding the design elements  
that form a garment. (Figure 2.1). A garment is composed of four design elements: 
silhouette, line, color and texture (Ellinwood, 2011). Texture of a fashion garment is 
often  defined by its material and in most cases this material is the  fabric (Ellinwood, 
2011). After all, fabrics are identified by their  tactile and physical properties since 
these properties are essential to define  aesthetic and comfort features of  a garment 
(Bassett & Postle, 1990). Hand properties such as fabric softness or stiffness are 
sensory and subjective features, whereas mechanical properties such as compression 
and bending rigidity are measurable and objective. Therefore, mechanical properties  
are often used instead of  fabrics’ tactile properties (Behery, 2005). For instance, 
stiffness of a fabric is attributed to its bending property while softness is attributed to 
its compression (Ozcelik, Supuren, Gulumser, & Tarakcioglu, 2008).  Figure 2.1 is the 
extended  model offered to display  the factors affecting consumers’ garment fit 
satisfactions.   


---

 
 
 42 
 
 Extended model offered for the factors affecting consumers’ 
garment fit satisfactions (derived from LaBat and DeLong (1990)’s study). 
This model (Figure 2.1) explains the garment fit satisfaction of real garments. 
However, with the advances in garment simulation technologies, it is  necessary to 
divert this model to a virtual context. Because, in near future, virtual try-on technology 
would be used for online shopping, and consumers’ virtual garment fit satisfactions 
would become conclusive for their purchase decisions.   
Figure 2.2 shows the suggested factors that would affect consumers’ virtual garment 
fit satisfactions. This model is derived from the factors that affect consumers’ actual 
fit satisfactions.  
During a virtual try-on experience, subjects are exposed to a visual stimulus which is 
the 3D image of a virtual garment on their own avatar. This avatar can be  either a 
parametric body model created by plugging in the body measurements of the subject, 
or a body model obtained  by 3D scanning the subject. For this dissertation, avatars 
were created by scanning the subjects by 3D body scanner in order to achieve their 
most realistic body models. Virtual try-on diverges from the real try-on by the 
existence of the interaction of the subjects with novel technologies such as 3D body 
scanners and virtual try-on. Thus, impacts of these novel technologies on consumers’ 
virtual fit satisfactions were included in the research model (Figure 2.2).  
 
Consumer satisfaction of  garment ﬁt
Internal factors
External factors
Physical Dimensions
Real body satisfaction 
Ideal body image in society
and in fashion industry
Body measurements
Garment
Silhouette
Line
Color
Fabric 
Garment  
measurements
Design 


---

 
 
 43 
%3CmxG rap hModel %3E%3Cr oot %3E%3CmxCell%2 0id%3D %220 %22% 2F% 3E% 3CmxC ell%20i d%3D% 221% 22%2 0pa ren t%3D% 220% 22% 2F%3 E%3C mxCell% 20id %3D%2 22%2 2%2 0value %3D%2 2Cons ume r%2 0satis facti on%2 0of %20vi rtual %20 gar men t%20 fit%2 2%20 style% 3D%22 rou nde d%3D 0%3Bwhi teSpa ce%3Dw rap %3Bht ml%3D 1%3B%2 2%2 0ver tex%3D %221 %22% 20 pare nt%3D %22 1%22 %3E%3CmxGeo met ry%2 0x%3D% 222 40% 22%2 0y%3D% 221 00%2 2%20 widt h%3D% 2224 0%2 2%20 heig ht%3D% 223 0%2 2%20 a s%3D%22 geo met ry%2 2%2 F%3 E%3C% 2FmxCell%3 E%3C mxCell% 20id% 3D%22 3%2 2%20v alue% 3D%22I nte rnal% 20fa cto rs%2 2%20 style% 3D%22 rou nde d%3D 0%3Bwhi teSpa ce%3Dw rap %3Bht ml%3D 1%3B%2 2%2 0ver tex%3D %22 1%22% 20 pare nt% 3D%22 1%22 %3E%3CmxGeo met ry%2 0x%3D% 221 20% 22%2 0y%3D% 221 80%2 2%2 0widt h%3D% 221 20
%22%2 0heig ht% 3D%22 20%2 2%2 0as%3D% 22g eo met ry%22 %2F% 3E%3C%2 FmxC ell%3 E%3C mxCell%2 0id% 3D%22 4%22 %20val ue%3D %22 Exte rnal% 20f acto rs%2 2%2 0style% 3D%22 rou nd ed%3D 0%3Bw hiteSpa ce%3Dw ra p%3Bht ml%3D 1%3B% 22%2 0ver tex% 3D%22 1%22 %20 par ent% 3D%22 1%22 %3E%3C mxGeo me try% 20x%3D %22 460% 22%2 0y%3D% 221 80%2 2%2 0widt h%3D% 221 20%2 2%2 0heig ht% 3D%22 20%2 2%20 as%3D% 22g eo metr y%22 %2F% 3E% 3C%2 FmxC ell%3E%3C mxCell%2 0id%3D %225 %22% 20val ue% 3D%22% 22%2 0style% 3D%22 en dArro w%3Dn one% 3Bht ml%3D1 %3Ben try X%3D0. 579 %3Ben tryY%3D 1.03 3%3Bexi tX% 3D0.5 %3BexitY%3D 0%3Be ntryPe rime ter %3D0% 3B%22% 20e dge %3D%2 21%2 2%20 sou rce% 3D%22 3%22 %20 tar get% 3D%22 2%22 %20 par ent% 3D%22 1%2 2%3 E%3C mxGe ome try% 20wid th% 3D%22 50%2 2%2 0heig ht% 3 
 
 Theoretical model to explore the factors affecting consumers’ 
virtual garment fit satisfactions.  
Body satisfaction affects real garment fit satisfaction of individuals ( LaBat & DeLong, 
1990). During virtual try-on, subjects are exposed to their own 3D body scan images. 
Hence, for the virtual try-on, body satisfaction factor was replaced with virtual body 
satisfaction (Figure 2.2).  Moreover, during virtual try-on, subjects are not able to 
touch or see the real fabric, but instead of it, they interact with fabric’s simulation 
which is created by using its 3D fabric properties. 3D fabric properties are actually 
derived from the measured fabric properties (i.e. bending rigidity, weight etc.),  
however, they are not the same due to the unit conversions and software limitations. 
Finally, body measurements were  another factor in the model (Figure 2.2) that was 
expected to impact consumers’ virtual fit satisfactions.  
 Experimental Design 
While designing the experiments, the objectives of this study were reviewed, and each 
stage of the experiments were optimized to embrace the research objectives. The 
research model was explored in two phases as given in Figure 2.3 to investigate the 
research objectives. According to this schema, in the first phase of the study, 
correlations between some of the independent variables (body measurements, virtual 
body satisfaction, 3D fabric properties and interactiong with 3D fit technologies) and 
Consumer satisfaction of virtual garment ﬁt
Internal factors
External factors
Physical Dimensions
Virtual body satisfaction 
Interaction with 3D ﬁt
technologies 
Ideal body image in society
and in fashion industry
Body measurements
Garment
Silhouette
Line
Color
3D fabric
properties
Attitude towards 3D
body scanners
Attitude toward
virtual try-on
technology
Garment  
measurements
Design 


---

 
 
 44 
their impact on consumers’ virtual garment fit satisfactions were explored. In the 
second phase of the study, consumers’ virtual fit satisfactions were used as input 
parameter with other parameters (body measurements, body satisfaction and fabric 
properties) to predict consumers’ real fit satisfactions. 
  
 Research model. 
Target group 
First of all, increasing garment fit satisfaction of consumers was a motive and the target 
group was selected by keeping this motive in mind. According to Shin (2013), there 
isn’t any significant difference between male and female consumers’ overall garment 
fit satisfactions. Since a significant difference of garment fit satisfaction due to gender 
wasn’t detected, the size of the apparel market for each gender was considered.  
According to statistics, women are more likely to purchase an apparel item online  
when compared to men (Statista, 2016).  Therefore, women were determined as the 
target gender of this study. Moreover, age range was determined to be between 18 to 
35, because statistics show that this age group is more likely to purchase an apparel 
product online  (Statista, 2017a). Another criterium was the body measurements of the 
subjects. Medium (M) size was determined as the sample size since it is usually used 
as a base size by the companies and many apparel brands work with medium size fit 
models for fit sessions (Armstrong, 2010). To determine the body measurements of a 
medium size, ASTM D5585 - 11e1 standards were used (ASTM International, 2011). 
As a result, the target group was determined as females between 18 to 35 years old 
with a waist girth between 25-28 inches and a hip girth between 36-39 inches.  


---

 
 
 45 
Garment Samples 
2.2.2.1 Designing the garments 
Various studies show that women are less satisfied with their lower body parts,  hence 
they are less satisfied with the fit of lower body garments  (LaBat & DeLong, 1990), 
(Song & Ashdown, 2013). Therefore, a lower body garment was considered as the 
garment type. To be able to test the impact of fabric properties only, the test garments 
were designed to have the same silhouette, line and the color, but different fabrics.  
Drape and the aesthetic fit aspect of the test garments  
Drape is one of the significant problems of 3D garment simulation software 
(Pandurangan, Eischen, Kenkare, & Lamar, 2008). As mentioned by Lim and Istook 
(2011), the garment simulation has to mirror the actual garment in terms of fabric drape 
(Lim & Istook, 2011). Drape is very important for the aesthetic appearance of the 
fabrics (Jiang, Cui, & Hu, 2012), and it affects the aesthetic fit evaluations of the 
consumers (Kadolph, Langford, Hollen, & Saddler, 1993). Therefore, reflecting drape 
properties of a garment during its simulation is critical.  
The drape feature of a fabric might be observed best on a loose fitting garment as it 
doesn’t cling on the wearer (Pandurangan et al., 2008). Various scholars have preferred 
either flare or circular skirts to study the effect of fabric drape on garment fit evaluation 
(Kenkare, 2005), (Thi et al., 2010) , (Wu, Mok, Kwok, Fan, & Xin, 2011), (Jevšnik, 
Kalaoğlu, Eryuruk, & Stjepanovic, 2015).  
Consumers evaluate garment fit according to multidimensional aspects: functional, 
aesthetic and socio-psychological (Tselepis & Klerk, 2004). A garment should have 
enough room for movement and this aspect of the garment defines its functional fit. 
However, consumers have other expectations from garments such as flattering the 
body and hanging well (Tselepis & Klerk, 2004). These aspects of a garment define 
its aesthetic fit, and it is closely related to its intrinsic factors. Instrinsic factors such 
as fabric, style, design and construction could affect the aesthetic fit of a garment 
(Tselepis & Klerk, 2004).  Fabric is one of the most important intrinsic factors and it 
may affect the aesthetic appearance of the garment as well as the physical comfort 
(Kadolph et al., 1993). Hanging of a fabric , in other words drape of a fabric, 
contributes to the aesthetic fit of a garment and garments made from alternative fabrics 


---

 
 
 46 
may vary drastically in terms of aesthetic fit (Tselepis & Klerk, 2004), (Thi et al., 
2010). 
In this study, alternative fabrics were studied in order to see their impact on garment 
fit. While doing this, the impact of fabric drape on aesthetic fit was the focal point. 
Therefore, the garment design was determined to stress its drape attribute. The other 
intrinsic factors (style, design and construction) were kept identical for all of the test 
samples. Consequently, to highlight the function of drape on aesthetic fit satisfaction, 
a circular skirt style was appropriate. 
Reference garment design  
In order to understand the impact of fabric on aesthetic fit, the intrinsic impact of 
design and style should be minimized. Therefore, the selected design should be 
accepted and liked by majority of the population, otherwise a particular disliking of 
the design could dominate the aesthetic fit, and fabric impact may be hindered.  
Details of the design were determined by a market research. A web search of the word, 
circular skirt, was conducted through Amazon.com, which is the biggest online retailer 
in U.S. (Gensler, 2017). The search brought more than six hundred results, and most 
of these results were skater skirts. Skater skirt is the name used to define the shorter 
length circle skirts (Koester & Bryant, 1991). On the other hand, according to the best 
seller skirt style list of Amazon.com, the skater skirt was the #1 on the list (Figure 2.4).  
The details of the skater skirt and its sketch that was used as the reference design is 
given in Figure 2.5. According to the technical pack of the skirt on the website, the 
length of the skirt was 45 cm, and the waist circumference was 72 cm. The length of 
the skirt is a part of its design function. Skater skirts are often preferred by younger 
costumers (Schuessler, 2015), and since the target age of this study was young female 
between 18 to 35 years old, it was appropriate for the purpose of this study. 
By considering all design criteria mentioned above, a skater skirt with 45 cm length, 
72 cm waist was selected as the sample design.  
 
 


---

 
 
 47 
 
 Best seller skirt styles on Amazon.com (Amazon.com, 2017). 
 
 Inspiration picture and its sketch. 
2.2.2.2 Fabric selection 
After deciding the garment style, the fabrics that will be used for this study was 
determined. Knitted fabrics are often used for snugging garments (i.e. socks and tights) 
or sportswear and casual wear (i.e. sweatshirts and t-shirts), on the other hand, woven 
fabrics are often used for pants, shirts, skirts and outwear garments (Hu, 2004). Since 
a skirt style was selected for this study, woven fabrics were a better alternative.  
Simulations of  similar fabrics 
Fabrics with similar fabric properties display very similar drape simulations 
(Buyukaslan, Kalaoglu, & Jevsnik, 2017), (Buyukaslan, Jevsnik, & Kalaoglu, 2018).  


---

 
 
 48 
Buyukaslan et al. (2017) measured the mechanical properties of five woven fabrics by 
SiroFAST and created their drape simulations by O/Dev on a virtual disc. At the same 
time, real drape behaviors of these fabrics were observed on a real disc. 
 
 Visual comparison of the real and virtual drape of five woven 
fabrics (Buyukaslan, Kalaoglu, & Jevsnik, 2017). 
Twenty-seven human subjects were asked to match the simulations with the real drape 
pictures (Figure 2.6). This study showed that the simulations of fabrics with similar 
drape properties were distinguished hardly by the subjects. Subjects could only 
distinguish the simulations of fabrics which have relatively different drape properties. 
In other words, human eye is not very sensitive to slight drape changes (Buyukaslan, 
Kalaoglu, & Jevsnik, 2017). Therefore, the fabrics of this study were selected in order 
to show distinctive drape properties. Among other mechanical properties of fabrics, 
bending rigidity has the highest correlation with drape properties (Frydrych, 
Dziworska, & Cieslinska, 2000). However, while providing the fabrics, it wasn’t 
convenient to seek fabrics according to their bending rigidities as many of the fabric 
suppliers didn’t have information about bending rigidity of their fabrics. On the other 
hand,  drape properties of fabrics are higly correlated to their weights as well (Frydrych 


---

 
 
 49 
et al., 2000), and it is much more practical to seek fabrics from suppliers according 
their weights.   
As a result, fourteen fabrics with a wide weight range were collected from two different 
fabric manufacturers. Properties of the test fabrics are given in Table 2.1. 
 Properties of the collected fabrics. 
# 
Fabric Code 
Weight 
(g/m2) 
Thickness 
(mm) 
Composition* 
Weave 
1 
Fabric 2 
111 
0.10 
100% Cotton 
Plain  
2 
Fabric 22 
143 
0.20 
100 % Wool 
Plain 
3 
Fabric 5 
193 
0.22 
98/2 %, Co/Ea 
Twill 
4 
Fabric 6 
224 
0.31 
98/2 %, Co/Ea 
Twill 
5 
Fabric 1 
258 
0.44 
68/28/4 % Co/PES/Ea 
Twill 
6 
Fabric 13 
291 
0.48 
98/2 %, Co/Ea 
Twill 
7 
Fabric 16 
291 
0.56 
98/2 %, Co/Ea 
Twill 
8 
Fabric 7 
300 
0.78 
95/5 %, Co/Ea 
Plain 
9 
Fabric 9 
325 
0.57 
96/4%, Co/Ea 
Plain 
10 
Fabric 8 
337 
0.64 
96/4%, Co/Ea 
Twill 
11 
Fabric 21 
344 
1.27 
100% Wool 
Plain  
12 
Fabric 20 
354 
1.09 
100% Wool 
Plain 
13 
Fabric 14 
359 
0.66 
95/5 %, Co/Ea 
Twill 
14 
Fabric 15 
385 
0.62 
96/4%, Co/Ea 
Twill 
*Co: Cotton, Ea: Elastane, PES: Polyester 
2.2.2.3 Making the garments 
A professional seam stresses was assigned to tailor the test garments. The 
measurements given in Table 2.2  were followed to prepare the patterns of the skirts.  
 Measurements of the garment samples 
Feature 
Measurement 
(cm) 
Waist band width 
2 
Waist circumference 
72 
Skirt length at the side seam 
43 
Skirt length at the center front 
42 
Skirt length at the center back 
42 
Patterns were created digitally by using O/Dev Pattern Design Suite (PDS) (Figure 
2.7). The same patterns were used for the production of all test skirts. All skirt samples 
had a black invisible zipper (18 cm) at the left side seam for easy donning on and off. 
For the production of the skirts, same type of interfacing and thread were used. All the 
skirt samples had the identical details (measurements and trims) except for their 
fabrics.    


---

 
 
 50 
 
 2D patterns of the garment samples. 
Experiments 
Experiments are organized as fabric experiments and garment fit experiments. Figure 
2.8 shows the schema of fabric experiments and garment fit experiments conducted in 
this study. As illustrated in  Figure 2.8, first of all properties of the test fabrics were 
measured and later garment fit experiments were conducted.  
 
 Fabric experiments and garment fit experiments schema. 
2.2.3.1 Fabric experiments 
Measuring mechanical properties of fabrics 
Fabrics’ mechanical properties were measured to create realistic garment simulations 
and exploring the impact of mechanical properties on garment fit in virtual and real 
environment. As stated in the literature part, fabrics’ mechanical properties are often 


---

 
 
 51 
measured with SiroFAST or KES-FB instruments. However, alternative instruments 
were used for this study instead of KES-FB and SiroFAST due to accessibility. A 
further study was established to compare the garment simulations created by using  
traditional testing equipment versus using KES-FB or SiroFAST (Buyukaslan, Baytar, 
& Kalaoglu, 2018). According to the results of this study, no significant differences 
were found between garment simulations created by traditional, KES-FB and 
SiroFAST equipment, and it was concluded that traditional test equipment would be 
adequate to create garment simulations ( Buyukaslan, Baytar, et al., 2018).    
Working principles of SiroFAST instrument were considered and reproduced by 
traditional test equipment. Because KES-FB instruments are more complicated when 
compared to SiroFAST instruments, it would be more difficult to implement KES-FB 
tests. However, SiroFAST tests can be implemented by using traditional fabric test 
equipment (Frydrych et al., 2000). Therefore, mechanical properties of fabrics were 
measured by using traditional textile testing equipment. 
Measuring extension 
A tensile testing machine (James Heal-Titan), was used to measure extension of 
fabrics. Three fabric samples were cut at 15 x 5 cm sizes for warp and weft directions 
each, and samples were conditioned before conducting the tests. The load cell used for 
the experiments was 120 N, the distance between the clamps were 10 cm, and the 
pulling speed was 50 mm/min.  
During the tests, fabric samples were slowly pulled until the force on the fabrics 
reached up to 120 N. When 120 N was reached, clamps released the samples and the 
jaws returned back to their former positions. Meantime, extensions of the fabrics were 
measured according to the displacement of jaws, and stress/strain diagrams were 
plotted by the computer attached to the tensile tester. It is possible to determine the 
extension values of the samples under any stress value from x-y coordinates of the 
stress/strain diagrams. O/Dev software requires the stretch values of warp and weft 
yarns under 100 gf/cm (Kuijpers, 2017). Therefore, the extension values under 100 
gf/cm were recorded. This value is obtained by recording the extension value at 500 
gf (=5N) (100 gf/cm x width of the fabric sample) on the stress-strain diagram 
(Frydrych et al., 2000). An example of a stress-strain diagram obtained from one of 
the test fabrics is given in Figure 2.9. 


---

 
 
 52 
 
 Stress-strain diagram of  Fabric 16 (weft direction).  
Measuring shear rigidity 
In this study, a tensile testing machine (James Heal-Titan), was used to measure 
extension of fabrics in bias direction, and the extension was used to calculate shear 
rigidity. Three fabric samples were cut bias in 15 cm x 5 cm sizes and conditioned 
before conducting the tests. The load cell used for the experiments was 120 N, the 
distance between the clamps were 10 cm, and the pulling speed was 50 mm/min 
Shear rigidity values were derived from fabrics’ bias extensions. The same testing 
method explained for extension measuring was applied. Bias cut fabric samples were 
pulled until the force on the fabrics reach upto 120 N. To calculate shear rigidity, 
SiroFAST-3 testing method was referred. In SiroFAST-3 system, bias cut fabric 
samples’ extension values at 5 gf/cm are used to calculate their shear rigidities. To 
implement the same method, fabrics’ bias extensions at  5 gf/cm were  recorded. This 
value was obtained by recording the extension values at 25 gf (=0.25 N) (5 gf/cm x 
width of the fabric sample) on the stress-strain diagram  which is obtained from Titan 
tensile tester (Frydrych et al., 2000). An illustration of the testing procedure is given 
in Figure 2.10. 
 
 
 
 
 


---

 
 
 53 
 
 Shear testing of the fabric samples. 
Finally, measured extensions were used to calculate shear rigidities of the fabrics 
according to the equation 2.1 (CSIRO, 1990), (Wang et al., 2008), ( De Boos & Tester, 
1994).  
 > = 
?@A
BC 
(2.1) 
G: shear rigidity (gf/cm or N/m), E5: bias extension of the sample (%). 
Measuring bending rigidity 
Shirley fabric stiffness tester was used to measure bending lengths of the fabrics. For 
the fabric stiffness testing with Shirley tester, three fabric samples in warp and weft 
directions each (at total six samples) were cut at 15 cm x 2.5 cm sizes, and they were 
conditioned before conducting the tests. Studies show that there is a significant 
difference between bending lengths on the face and back sides of a fabric due to the 
fabric finish and the weave (Peirce, 1930). Accordingly, bending length of each fabric 
sample was measured two times for the face and two times for the back, and the 
average of them were recorded as the average bending length.  Finally, these bending 
lengths were used to measure the bending rigidities of fabrics as described in 
BSI3356:1990 (British Standart Institution, 1990)  by using the Equation 2.2. 
0.25 N 
0.25 N 
clamps 
10 cm 
5 cm 


---

 
 
 54 
D = E × GA × 9.81 × 10,M 
(2.2) 
B: bending rigidity (µNm), W : area density of the fabric (g/m2), l: bending length 
(mm) 
 
Measuring surface properties of fabrics 
Surface friction 
Static and dynamic friction of the  face and the  back of the fabrics were measured 
with MXD-02 Coefficient of Friction Tester (Labthink Company, 2017). The ASTM 
D1894 Standards (ASTM, 2008) were applied during friction testing. It is possible to 
measure friction in many different ways (i.e. fabric-fabric friction, fabric-metal 
friction, fabric-felt friction). For this study, fabric-felt friction was considered. Fabric 
pulling speed was 100 mm/min.  
Surface roughness 
Compact Surface Measuring Instrument, SurfCom 130A (Zeiss Company, 2016), was 
used to measure surface roughness. ISO 4287-1997 standards (International 
Organization for Standardization, 1997) were followed during testing. The probe 
speed was 5 cm/min and the evaluation range was 5 cm.  
The measurements were conducted separately for the back and front of the fabrics 
since surface properties of the fabrics are often different on the face and the back 
(Peirce, 1930). Similarly, fabrics’ surface properties vary for warp and weft directions. 
The surface roughness for the face of the fabrics were measured by taking the means 
of roughness’s values measured for warp and weft directions, and the surface 
roughness’s for the back of the fabrics were measured per se.  
Measuring drape properties of fabrics 
A Cusick drapemeter was used to test fabric drape due to its well-acceptance and 
accessibility (Chu, Cummings, & Teixeira, 1950), (Cusick, 1965), (Cusick, 1968). BS 
5058:1974 standards  were implemented to test the drape (BS 5058:1973, 1974). One 
sample, at a size of 36 diameter, was prepared for each fabric  and placed on the Cusick 
drape meter. A camera was centrally mounted over the Cusick drape meter to capture 
the drape images. A sample of captured drape image is given in Figure 2.11. 


---

 
 
 55 
 
 Drape image on Cusick drape meter. 
The tests were performed three times for the face and three times for the back of the 
fabric samples and drape coefficient (DC) of each fabric was calculated by taking the 
average of drape coefficients measured at the back and face of the corresponding 
fabric. To calculate DC of the fabrics, image analysis technique was used (Vangheluwe 
& Kiekens, 1993), (Robson & Long, 2000). Drape images of fabrics were transferred 
to the computer and opened with an open-access image analysis program, ImageJ 
(Schneider, Rasband, & Eliceiri, 2012). This program can measure distances between 
points, areas of the surfaces, and volumes of the objects from the captured images. To 
do that, it is necessary to introduce a known measurement to the program, which was 
the diameter of the Cusick disc (18 cm) in this case. The drape areas of each sample 
were measured by using ImageJ program and the measured values  were  used to 
calculate the drape coefficients of the samples according to the Equation 2.3 (Cusick, 
1968). 
 NO = 
P14Q2 4124,Q3452 4124
94R16S 4124,Q3452 4124 
(2.3) 
2.2.3.2 Fabric clustering  
Although fourteen fabrics were provided from suppliers, each participant tried on four 
different skirts due to two reasons. First reason was the experiment time. If subjects 
were to try-on fourteen skirts, and evaluate their real and virtual fit, they would have 
committed almost a whole day for the experiment which wouldn’t be feasible. The 
other reason was the efficiency and reliability. A long experiment  would have been 
overwhelming for the subjects resulting in slack answers to fit questions. Eventually, 


---

 
 
 56 
trying-on four skirts during the garment fit experiments was found reasonable in terms 
of experiment time and experiment reliability.  
The skirts for try-on  were determined by clustering skirts according to their fabric 
properties and each subject was asked to try-on one of the skirts from each cluster. 
Hierarchical clustering analysis (HCA) by using the Ward criterion with a pre-defined 
cluster number (four) was applied to the Euclidean distance matrix by using R software 
(Boehmke, 2018). At each step the pair of clusters with minimum between-cluster 
distance are merged, generating clusters that were more equal in size. 
Garment fit experiments  
2.2.4.1 Preparing for virtual fit 
There are alternative software to create garment simulations and these software were 
summarized in literature part. In this study, two of these commercial software were 
considered: O/Dev by Optitex and V-Stitcher by Browzwear. However, only O/Dev 
software was used for garment fit experiments due to various reasons listed below. 
Although V-Stitcher was not used for fit experiments, virtual simulations created by 
using the same 3D fabric properties in V-Stitcher were reported in the Appendix B.  
Optitex’s 2D/3D CAD system (O/DevTM) was selected because of its widely 
acceptance in fashion and apparel industry. Adidas, GAP, Under Armor, Target and 
Roberto Cavalli and Li&Fung are some costumers that use O/Dev for their product 
development (Optitex, 2018). O/Dev is also used by various fashion schools (Parsons 
School of Design, London College of Fashion and Cornell University). In addition to 
the penetration superiority,  Lim (2009)  observed that Optitex 3D CAD system gave 
more similar simulations to the real garment when compared to V-stitcher for instance 
(Lim, 2009). However, the simulation technologies are constantly developing, and 
companies are improving their algorithms by incorporating more of the fabrics 
mechanics. Therefore, for this study a pre-test was conducted by using O/Dev and V-
Stitcher.  
Pre-tests with O/Dev 
To create virtual garments; 2D skirt patterns (Figure  2.7) were used and virtual stitches 
were defined between pattern pieces.  
 


---

 
 
 57 
Selection of simulation properties in O/Dev 
O/Dev simulation software enables users to change the simulation properties. The 
simulation properties window with its default settings are given in Figure 2.12.  
 
 O/Dev simulation properties window. 
Simulation properties were systematically changed to explore their influence on 
simulation quality. For this purpose, the circular skirt developed for this study was 
simulated on the default model, Eva, with alternative simulation properties. The fabric 
properties were kept the same and only simulation properties have been altered for 
each simulation. The simulation properties that were inserted to find the optimum 
simulation for this research are given in Table 2.3. 
Unit conversion of the fabric properties for O/Dev 
O/Dev enables users to enter/change the fabric properties to create more accurate 
simulations. For this study, measured fabric properties were plugged into the software 
for this objective. However, the units of the fabric properties required by the software 
were different than the units measured by either KES-FB, SiroFAST or the test 
instruments used for this study. Hence, measured fabric properties were converted with 
the Fabric Converter program as in earlier researches (Lim & Istook, 2011), (Yan, 
2011). This converter is actually designed to convert either KES-FB or SiroFAST 
measured fabric properties. FAST conversion window of the Fabric Converter (see 
Figure 2.13) was used for this study since the test methods used in this study were 


---

 
 
 58 
implemented from SiroFAST system, and thefore the units of measured fabric 
properties were compatible with FAST units, but incompatible with KES units. 
 Alternative simulation properties applied in O/Dev for pre-testing. 
Feature 
Default  Trial 
1 
Trial 
2  
Trial 
3 
Trial 
4 
Trial 
5 
Trial 
6 
Trial 
7 
Trial 
8 
Ignore 
symmetry 
No 
Yes 
No 
Yes 
No 
No 
No 
No 
No 
Collision 
post 
process  
No 
No 
Yes 
Yes 
No 
Yes 
No 
No 
Yes 
Distance to 
avatar 
0.2 
0.2 
0.2 
0.2 
0.2 
0.2 
0.1 
2 
0.2 
Use 
regular 
tessellation 
No 
No 
No 
No 
No 
No 
No 
No 
No 
Size of 
time steps 
0.02 
0.02 
0.02 
0.02 
0.02 
0.02 
0.02 
0.02 
0.01 
Number of 
time steps 
10 
10 
10 
10 
20 
20 
10 
10 
20 
 
 FAST conversion interface of Fabric Converter for O/Dev. 
While conducting the unit conversions, several issues about Fabric Converter were 
noticed. The first issue was the stretch property. Stretch values of fabrics should be 


---

 
 
 59 
denoted by percentage (%) since it is the extension percentage of the fabric at a certain 
tension (Kaynak, 2017). However, in the Fabric Converter it has a a unit of g/cm, and 
it is ambiguous how SiroFAST extensibility (or elongation) values are converted. 
Moreover, bending rigidities measured by SiroFAST have  µNm units (see Table 1.1), 
whereas, the required bending rigidity units in O/Dev software is dyne*cm. For the 
unit conversion, Fabric Converter multiplicates bending rigidities measured by 
SiroFAST by 100, however it should be  multiplicated by 10 as 1 µNm is equal to 10 
dyne*cm. This issue was communicated with Optitex Company, however, a 
clarificiation couldn’t be compromised. Due to the ambiguity of units and unit 
conversions, Fabric Converter was used as is by taking the previous studies as a 
reference (Lim & Istook, 2011),  (Yan, 2011). 
Creating virtual fabrics by O/Dev 
First of all, fabrics’ surfaces were scanned by a flatbad scanner and exported to O/Dev 
to use as the texture for simulations. Afterwards, converted properties of experiment 
fabrics were entered to the fabric editor window (Figure 2.14)  in O/Dev. However, 
while creating virtual fabrics, further issues were encountered. Software doesn’t allow 
users to enter any fabric thickness value smaller than 0.05 cm. When any thickness 
smaller than 0.05 is inserted, the software automatically changes it to 0.05. Therefore, 
the thickness values lower than 0.05 were automatically changed to 0.05 cm by the 
software. Second of all, the fabric scans were opened in O/Dev to give texture to virtual 
fabrics. However, the fabric textures were not very visible when displayed on the 
software due to their dark colors (see Appendix A). Therefore, for the fabric displays, 
90 percent grey color from software’s color palette was selected for all skirt 
simulations.  Finally, friction value required by O/Dev was ambiguous. As explained 
detailed in methodology part, there are various friction coefficients. It can be either 
static or dynamic friction. Besides, fabrics’ friction properties vary for face and back 
of the fabric as well as warp and weft directions.  To determine which friction value 
should be assigned, a document provided by Optitex company was used as reference 
(Optitex, 2016). Even though, the ambiguity of the required friction value remained, 
dynamic friction coefficient of the back of the fabric in warp direction was determined 
to be used for this study. 


---

 
 
 60 
 
 Fabric editor interface to create virtual fabrics in O/Dev. 
2.2.4.2 Data collection  
A questionnaire was developed in an online survey software, Qualtrics, to measure the 
variables to understand the research questions of this study. The survey questions were 
all measured with 7-point Likert scales. 
The questionnaire was consisted of seven parts. Figure 2.15 illustrates the 
questionnaire parts.  
 
 Data collection during garment fit experiments. 


---

 
 
 61 
First part of the questionnaire included demographic questions (age, education level, 
ethnicity and fashion knowledge).  
Second part of the questionnaire was designed to measure online shopping behaviors 
of subjects such as online shopping frequency and RTW garment satisfaction for 
various garment types such as skirts, t-shirts, jeans. 
Third part was designed to understand subjects’ skirt style preferences. For this 
purpose, three types of skirts (pencil skirt, circular skirt and A-line skirt) were 
demonstrated to subjects and they were asked to answer three questions (if they had 
liked the silhouette, overall fit of the skirt and their purchase intention) for each skirt 
style. Subjects’ liking of the color of the skirt was also measured by showing a black 
circular skirt image on the computer screen and asking subjects to rate their liking of 
the skirt color.  
Fourth part of the questionnaire was a body satisfaction scale. There are several scales 
in the literature used to measure  body satisfaction levels of subjects (Secord & 
Jourard, 1953), (Rosen & Ross, 1968), (Mahoney & Finch, 1976), (LaBat & DeLong, 
1990). In this study, the body satisfaction scale used by Shin and Baytar was adopted 
(Shin & Baytar, 2013). This scale measured the body satisfaction level of subjects for 
twenty-one items on a 7-point Likert scale. In the fifth part, virtual body satisfactions 
of subjects were measured by using the same scale only after showing their 3D body 
scan images.  
Sixth section of the questionnaire was designed to measure garment fit satisfaction of 
the subjects. Therefore, subjects were asked to evaluate the fit of the real and virtual 
garments on four different areas (waistline, abdomen level, hip level and hem level) 
for three different views (front, back and side). Subjects evaluated the virtual fit first, 
and later, they evaluated the real fit of the skirt. Below guide (Figure 2.16) was used 
to help participants to clearly interpret the fit locations.  The questionnaire that was 
used during the experiments for fit evaluation is given in Figure 2.17.   


---

 
 
 62 
 
 Garment fit evaluation guideline. 
 
 Skirt fit evaluation scale. 
The seventh and the final section of the questionnaire was designed to measure 
subjects’ interactions with 3D fit technologies (3D body scanning technology and 
virtual try-on technology). The questions to measure interactions with 3D body 
scanning was derived from Loker and her colleagues’ study (Loker, Cowie, Ashdown, 
& Lewis, 2004). In Loker et.al.’ s study, participants’ were asked five questions about 
3D scanning process: comfort with scanning process, comfort with viewing the scan 
file, comfort with showing the scan file to familes and friends, willingness to pay for 
the 3D body scan, and willingness to be 3D scanned again. From this questions, only 
three of them (comfort with scanning process, comfort with viewing the scan file and  
willingness to be scanned again) were used. On the other hand, participants’ 
acceptance of virtual try-on experience was measured by a five items scale which was 


---

 
 
 63 
derived from  Kim and LaBat’s study (Kim & LaBat, 2013b) . This scale consisted of 
questions to understand if subjects had enough information to evaluate the garment fit, 
satisfied with the virtual model for evaluating the garment fit, whether they were likely 
to use virtual try-on technology in the future and use virtual model for apparel online 
shopping purposes, and finally, if they would pay more to use a virtual model to get 
garments that actually fit.  
2.2.4.3 Garment fitting 
The protocol used during the experiments is given in Figure 2.18.  Each subject tried 
on four different skirts.  As illustrated in Figure 2.18, subjects were first scanned with 
a 3D body scanner and their scans were used for 3D garment simulations of the skirts. 
The skirts that the subject would try-on were pre-determined by the researcher. The 
pre-determination was done according to the results of fabric clustering. Researcher 
gave one of the skirts from each cluster to ensure that subjects try-on at least one of 
the skirts from each cluster.  
Before subjects try on each skirt, they saw its virtual counterpart on their own body 
model on a computer screen and evaluated its virtual fit first. After virtual fit 
evaluation, they tried on the actual skirt and evaluated the real fit of the skirt. This 
procedure was repeated for four different skirts.  
 
 Protocol of garment fit experiments. 
 
3D Body Scanner
3D garment simulation of the skirt
Virtual fit 
evaluation
Real fit 
evaluation
Repeat for four different skirts
1st
3rd
4th
4th
2nd
samples


---

 
 
 64 
3D body scanning the subjects 
For garment fit experiments, each subject was asked to come to the 3D BodyScan Lab 
at an appointed time. When subjects arrived the lab, first of all, their waist and hips 
measurements were taken by a measuring tape to verify that subject was within the 
limits of recruiting criteria. Suitable subjects were scanned with their underwear in 
standing position.  
A laser light 3D body scanner (Human Solutions Vitus XXL) in the BodyScan Lab at 
Cornell University was used for the experiments. This scanner has eight cameras and 
captures approximately  three hundred thousand points at a single scan to ensure an a 
hundred percent identical scan of the body (3D BodyScan Lab, 2018).  However, it  
does not capture colored scans and the captured body scans were in grey scale.  
Processing the 3D body scan image 
The 3D body scanner software (ScanWorX) allows users to reconstruct the scan 
surface to achieve more realistic body images. Scan surfaces were reconstructed by 
using human standard posture selection and saved as STL (binary) files. Afterwards, 
STL body scan files were smoothed and scaled to fifty percent by GeoMagicTM 
software to achieve the final look given in Figure 2.19. These body scan images were 
saved in obj. format to open easily in 3D garment simulation software.   
 
 Processed 3D body scan image. 
 
 
 
 


---

 
 
 65 
Virtual try-on 
3D body scan images of the subjects (Figure 2.19) were opened in the simulation 
software, and skirt patterns were  placed on the subject’s virtual model. Created virtual 
fabrics were called for each simulation. For instance, if the virtual try-on of Skirt 2 
would be examined, 3D fabric properties of Fabric 2 was called in the software to 
create its virtual correspondent. Finally, the simulations were shown to the subjects on 
the computer screen. Researcher rotated, zoomed in/ out for subjects to see the virtual 
skirts from all perspectives. Researcher also set the rotate function to continuously 
rotate the simulation. In Figure 2.20, snapshots of the simulations on a subject from 
several views were given for  readers’ interpretation of the process.      
 
 Snapshots of a virtual try-on on a subject. 
Real try-on 
After each virtual try-on, subjects were asked to try-on the actual skirt in a dressing 
room. Subjects could keep their own upper garment, or if they required, a tank top was 
provided.  Subjects were provided a mirror to look at the fit of the skirt.  
2.2.4.4 Post-experimental processes 
Obtaining body measurements of subjects 
Body measurements of subjects were extracted from their 3D body scan images. 3D 
body scanner software (ScanWorX) allows users to collect anybody measurement by 


---

 
 
 66 
taking vertices or measuring distances on the body surface.  For this study, lower body 
measurements were defined to be prominent since the garment type adopted for this 
study was a skirt. Accordingly, seven body measurements were considered for this 
study. These measurements are given in Table 2.4. 
 Body measurements used for the study. 
Feature 
Measurement  
Vertical 
Overall height, waist height, hip height 
Horizontal 
Waist girth, belly circumference, hip girth, thigh girth 
Analyzing the data 
The data were collected from Qualtrics in xsl. file format and restructured for 
convenience of analysis. The statistical analysis was conducted by using IBM SPSS 
Version 25 (IBM Corp. Released 2017. IBM SPSS Statistics for Windows, Version 
25.0. Armonk, NY: IBM Corp).  
The statistical methods used for this study were descriptive, Pearson’s correlation tests, 
paired t-tests, one-way ANOVA, Post Hoc tests, multilevel linear regression models 
and cross validations.  
 
 
 
 
 
 
 
 
 
 
 
 
 


---

 
 
 67 
 
 RESULTS 
 Fabric Experiments 
Fabric properties 
Fabrics’ properties measured by test instruments are given in Table 3.1. To create 
virtual fabrics, fabric units were converted as described in methodology part. The 3D 
fabric properties that were used for fabric simulations are given in Table 3.2. 
Fabric clustering  
Fourteen fabric samples were clustered according to their fabric properties, and skirts 
for try-on were determined according to the results of this clustering. Four clusters 
were extracted by hierarchical cluster analysis (HCA). 
Principal components analysis (PCA) was used to visualize the clustering of the skirts. 
According to PCA plot (Figure 3.1): Fabric 2, 22 and 5 clustered together (cross 
symbol); Fabric 1, 6, 13 and 16 clustered together (circle symbol); Fabric 8, 9, 14 and 
15 clustered together (triangle symbol); and finally, Fabric 7, 20 and 21 clustered 
together (x symbol).  
 
Figure 3.1 : PCA plot of fabrics according to their properties. 


---

 
 
 68 
After clustering the fabrics objectively, some of the fabrics in each cluster were 
eliminated. The reason of this elimination was the fabric alikeness. Some of the fabrics 
were subjectively very similar to another fabric in the same cluster. Since the skirts’ 
fits were designed to be done subjectively by human; feel and vision of the fabrics for 
subjects were considered to be important. Accordingly, two textile experts evaluated 
the hand properties of fabrics subjectively and eliminated the fabrics which were very 
similar to another fabric in the same cluster. Fabric 5 was eliminated from the 1st  
cluster; Fabric 13 and Fabric 16 were eliminated from the 2nd cluster; Fabric 14 and 
Fabric 9 were eliminated from the 3rd cluster, and finally Fabric 7 and Fabric 20 were 
eliminated from the 4th cluster.  


---

 
 
 69 
 
Table 3.1 : Fabric Properties 
# 
Fabric 
Code 
Weight 
(g/m 2) 
Thickness 
(mm) 
Drape 
Coeffici
ent  
Elongation (%) 
(at 500 grf) 
Shear 
Rigidity 
(N/m) 
Bending Rigidity 
(µNm) 
Surface 
Roughness(µm) 
Surface Friction 
 
Warp 
Weft 
Warp 
Weft 
Face 
Back 
Face 
Back 
1 
Fabric 2 
111 
0.10 
0.344 
3.329 
9.410 
43.195 
1.069 
0.584 
10.055 
10.635 
0.713 
0.623 
2 
Fabric 22 
143 
0.20 
0.420 
13.222 
13.143 
18.102 
0.890 
0.940 
11.755 
11.125 
0.634 
0.702 
3 
Fabric 5 
193 
0.22 
0.443 
3.245 
11.035 
144.478 
2.585 
1.125 
14.330 
8.400 
0.790 
0.811 
4 
Fabric 6 
224 
0.31 
0.774 
2.997 
13.434 
206.486 
7.603 
2.683 
12.380 
12.874 
0.870 
0.934 
5 
Fabric 1 
258 
0.44 
0.673 
3.142 
19.004 
122.673 
7.324 
3.976 
17.085 
12.200 
0.650 
0.914 
6 
Fabric 13 
291 
0.48 
0.731 
2.894 
11.873 
154.982 
10.187 
5.702 
10.175 
8.885 
0.933 
1.018 
7 
Fabric 16 
291 
0.56 
0.726 
3.188 
7.711 
208.649 
12.391 
5.830 
13.325 
12.090 
0.961 
0.950 
8 
Fabric 7 
300 
0.78 
0.526 
1.054 
13.217 
119.807 
6.011 
4.736 
22.240 
12.160 
1.211 
0.842 
9 
Fabric 9 
325 
0.57 
0.484 
2.952 
20.491 
141.761 
6.854 
2.068 
13.770 
12.687 
0.855 
1.044 
10 
Fabric 8 
337 
0.64 
0.774 
1.615 
24.007 
231.261 
23.126 
6.802 
10.380 
10.635 
0.895 
1.026 
11 
Fabric 21 
344 
1.27 
0.350 
2.826 
4.349 
121.906 
8.395 
2.922 
21.455 
20.285 
0.919 
0.996 
12 
Fabric 20 
354 
1.09 
0.667 
5.558 
7.783 
45.270 
4.782 
3.097 
21.140 
20.186 
1.069 
1.064 
13 
Fabric 14 
359 
0.66 
0.733 
2.432 
19.783 
195.552 
15.731 
4.239 
11.340 
13.285 
0.827 
0.886 
14 
Fabric 15 
385 
0.62 
0.632 
2.538 
26.022 
142.198 
15.707 
7.589 
13.725 
12.975 
0.694 
0.905 


---

 
 
 70 
 
Table 3.2 : 3D fabric properties for simulations. 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
  
# 
Fabric 
Code 
Weight 
(g/m 2) 
Thickness 
(cm) 
Stretch  
(g/cm) 
 
Shear 
(gf/cm) 
Bend 
 (dyne*cm) 
Surface 
Friction  
Warp 
Weft 
Warp 
Weft 
Back 
1 
Fabric 2 
111 
0,050* 
1155 
408 
43 
107 
58 
0.6 
2 
Fabric 22 
143 
0,050* 
290 
292 
18 
89 
94 
0.7 
3 
Fabric 5 
193 
0,050* 
1185 
348 
144 
259 
112 
0.8 
4 
Fabric 6 
224 
0,050* 
4669 
1286 
206 
760 
268 
0.9 
5 
Fabric 1 
258 
0,050* 
1224 
202 
123 
732 
398 
0.9 
6 
Fabric 13 
291 
0,050* 
1330 
325 
155 
1019 
570 
1.0 
7 
Fabric 16 
291 
0,056 
1209 
498 
209 
1239 
583 
0.9 
8 
Fabric 7 
300 
0,078 
3649 
291 
120 
601 
474 
0.8 
9 
Fabric 9 
325 
0,057 
1303 
187 
142 
685 
207 
1.0 
10 
Fabric 8 
337 
0,064 
2374 
160 
231 
2313 
680 
1.0 
11 
Fabric 21 
344 
1,027 
1359 
884 
122 
840 
292 
1.0 
12 
Fabric 20 
354 
1,009 
688 
494 
45 
478 
310 
1.1 
13 
Fabric 14 
359 
0,066 
1435 
208 
196 
1578 
460 
0.9 
14 
Fabric 15 
385 
0,062 
1514 
147 
142 
1571 
759 
0.9 


---

 
 
 71 
 Skirt Samples 
After clustering the fourteen fabrics and eliminating some of them, seven skirts were 
used for the garment fit experiments. The skirts used for the garment fit experiments 
are given in Table 3.3. The skirt codes were determined according to their fabric codes. 
Finally, each subject tried-on one of the skirts from each cluster.  
Table 3.3 : Skirts used for garment fit experiments. 
Cluster 
Skirt Code 
1 
Skirt 2 and Skirt 22 
2 
Skirt 1 and Skirt 6 
3 
Skirt 8 and Skirt 15 
4 
Skirt 21 
Simulation properties of virtual skirts 
As mentioned in methodology, alternative simulation properties were suggested 
(Table 2.3) and tested on default avatar (Eva) to find the optimum simulation 
properties for creating the virtual skirts.  Obtained virtual skirts according to the 
entered simulation properties are given in Table 3.4. 
According to the virtual skirt images in Table 3.4, the skirt folds on Trial 1-4 were still 
looking dynamic, hence it was concluded that the default number of time steps should 
be increased to allow enough time for simulation to be completed. The software 
instructions suggest that selecting collision post process gives more accurate 
simulation, however, it requires smaller size of time steps. Thus, it was concluded to 
select collision post process option, decrease the size of time steps to 0.01 and increase 
the number of time steps to 20. The simulation obtained according to these setting  are 
marked in Table 3.4. 
 
 
 
 
 


---

 
 
 72 
Table 3.4 : Virtual skirts with alternative simulation properties. 
Default  
Trial 1  
Trial 2 
Trial 3 
Trial 4 
 
 
 
 
 
Trial 5 
Trial 6  
Trial 7 
Trial 8 
 
 
 
 
 
 
Real and virtual skirts on a dress form 
The pictures of real skirt samples that were used for garment fit experiments are given 
in Table 3.5 (left column) on a dress form for presentation purpose. On the other hand, 
the same dress form was scanned by the 3D body scanner and the scan image was used 
in O/Dev as the model for the skirt simulations. Simulations of each skirt on the dress 
form are given in Figure 3.5 (right column). These simulations were created by using 
the 3D fabric properties given in Table 3.2. 
 
 
 
 
 
 


---

 
 
 73 
 
Table 3.5 : Images of real and virtual skirt samples. 
Skirt 
Code 
Real Skirt 
Virtual Skirt 
Skirt 2 
 
 
 
 
 
Skirt 22 
 
 
 
 
Skirt 1 
 
 
 


---

 
 
 74 
 
 
Table 3.5(continued) : Images of real and virtual skirt samples. 
Skirt 
Code 
Real Skirt 
Virtual Skirt 
 
 
 
 
 
 
 
 
 
Skirt 6 
 
 
 
 
Skirt 8 
 
 
 
 
Skirt 15 
 
 
 


---

 
 
 75 
 
Table 3.5(continued) : Images of real and virtual skirt samples. 
Skirt 
Code 
Real Skirt 
Virtual Skirt 
Skirt 21 
 
 
 Garment Fit Experiments 
Garment fit experiments were conducted in the 3D BodyScan Lab in Fiber Science 
and Apparel Design Department at Cornell University between April -June 2018. The 
study was first approved by Institutional Review Board of Cornell University 
(Appendix C).  
For recruiting subjects, e-mails and flyers were used. Subjects e-mailed the researcher 
to set an appointment for the experiment. Each experiment took approximatly sixty 
minutes and participants were awarded $15 at the end of the study.  
Subjects were 3D body scanned first and answered some questions. Try-on session 
started afterwards. Each subject was given one skirt from each skirt cluster (Table 3.3). 
As there were four clusters and seven skirts, each subject tried-on different skirts from 
each cluster. Figure 3.2 illustrates how the samples were distributed to subjects. For 
instance, P1 wore Skirt 2, Skirt 1, Skirt 8 and Skirt 21; and P2 wore Skirt 22, Skirt 6, 
Skirt 15 and Skirt 21. Each skirt was distributed among clusters to be worn at similar 
number of times. In Cluster 1: skirt 2 was worn 22 times and Skirt 22 was worn 23 
times; in Cluster 2: Skirt 1 was worn 23 times  and Skirt 6 was worn 22 times; in 
Cluster 3: Skirt 8 was worn 24 times and Skirt 15 was worn 21 times;  and finally in 
Cluster 4: Skirt 21 was worn by all subjects, so 45 times since it is the only skirt in this 
cluster. 


---

 
 
 76 
 
Figure 3.2 : Distribution of skirt samples between subjects. 
Demographics 
Forty-seven participants attended to the experiments, however after an initial 
examination of the data, two participants were dismissed due to unreliability and 
inconsistency of their answers. Eventually, forty-five participants’ data were used and 
analyzed. 
Participants’ age varied between 18 to 35, and 71 percent of the participants were 
younger than 25 years old. Overall, calculated mean of participants’ age was 23.6 with 
a standard deviation of 4.75. Fifty-six percent of the participants were 
European/European American, 33 percent were Asian/Asian American, 7 percent were 
Hispanic, 2 percent were Middle Eastern/North African, and 2 percent were African 
American. Majority of the participants were undergraduate students (44 percent), and 
the rest of them were either graduate students or participants with a graduate degree. 
Seventy three percent of the participants stated that they haven’t had any classes about 
textiles or fashion, whereas 27 percent said that they attended at least to one class about 
textiles or fashion.   
Online shopping frequencies 
Participants’ online apparel shopping frequencies were measured for various garment 
types with a 7-point Likert scale (1: never, 7: always). Online shopping frequencies of 
participants for different garments are given in Table 3.6. According to this table, 
sweatshirts were the most purchased item online while trousers were the least 
purchased item. Online shopping frequencies for all items were below 4: sometimes.   
Cluster 1
Skirt 2
Skirt 22
Cluster 2
Skirt 1
Skirt 6
Cluster 3
Skirt 8
Skirt 15
Cluster 4
Skirt 21
P2
P1
Cluster 1
Cluster 2
Cluster 3
Cluster 4
Skirt 2
Skirt 22
Skirt 1
Skirt 6
Skirt 8
Skirt 15
Skirt  21
P1
X
X
X
X
P2
X
X
X
X
P3
X
X
X
X
.
X
X
X
X
.
X
X
X
X
.
X
X
X
X
P45
X
X
X
X
X
TOTAL*
N= 22
N=23
N=23
N=22
N=24
N=21
N=45
Real and Virtual Try-on of Participants
* N is the number of times that each skirt has been worn in total.


---

 
 
 77 
Table 3.6 : Participants’ online shopping frequencies for various garment types. 
Item 
N 
Min 
Max 
Mean 
Std. Dev. 
Sweatshirts 
45 
1 
7 
3.67 
1.462 
T-shirt 
45 
1 
7 
3.56 
1.531 
Skirts 
45 
1 
6 
3.33 
1.365 
Blouses 
45 
1 
6 
3.33 
1.261 
Jeans 
45 
1 
7 
3.20 
1.817 
Hoodies 
45 
1 
7 
3.04 
1.678 
Trousers 
45 
1 
6 
2.62 
1.435 
The results of participants’ online shopping frequencies for skirt item is given in Table 
3.7. According to the Table 3.7, there were five subjects that never purchase a skirt 
item online. Only eight of the participants mentioned that they frequently or usually 
buy skirts online. On the other hand, the majority of the participants (n=25) stated that 
they occasionally or sometimes purchase skirts online. This result showed that sample 
group was adequette for the purpose of the skirt fit study.  
Table 3.7 : Participants’ online shopping frequencies for skirts. 
 
Frequency 
Percent 
 
Cumulative 
Percent 
Never 
5 
11.1 
11.1 
Rarely 
7 
15.6 
26.7 
Occasionally 
12 
26.7 
53.3 
Sometimes 
13 
28.9 
82.2 
Frequently 
5 
11.1 
93.3 
Usually 
3 
6.7 
100.0 
Total 
45 
100.0 
 
In addition to descriptive statistics, paired sample t- tests were conducted to figure out 
if participants’ shopping frequencies for skirts have varied significantly for any of the 
items. The analysis showed that participants’ shopping frequency for skirts was not 
very much different than the shopping frequencies of other items. Participants’ online 
shopping frequency for skirts (M=3.33, SD=1.37) was only significantly higher than 
the shopping frequency for trousers (M=2.62, SD=1.46), t(45)= 2.90, p< .05, r =0.31). 
Fit satisfactions for RTW garments 
Participants’ general fit satisfactions with multiple RTW garments were measured 
with a 7 -point Likert scale (1: extremely dissatisfied, 7: extremely satisfied). The 
results are given in Table 3.8. According to the Table 3.8, participants were most 
satisfied with the fit of RTW t-shirts and least satisfied with the fit of RTW trousers. 


---

 
 
 78 
Participants’ average satisfactions varied between somewhat satisfied (5) and satisfied 
(6) for upper body garments (T-shirts, sweaters, cardigans and blouses), whereas 
participants’ satisfactions with lower body garments were less.   
Table 3.8 : Participants’ RTW garment fit satisfactions for various apparel items. 
Item 
N 
Min 
Max 
Mean 
Std. Dev. 
T-shirts 
45 
3 
7 
5.53 
1.036 
Sweaters 
45 
2 
7 
5.36 
1.151 
Cardigans 
45 
3 
7 
5.24 
1.090 
Blouses 
45 
2 
7 
5.22 
1.106 
Skirts 
45 
1 
6 
4.51 
1.254 
Jeans 
45 
2 
7 
3.96 
1.580 
Trousers 
45 
2 
7 
3.91 
1.505 
Participants’ RTW garment fit satisfactions for skirt item is given in Table 3.9. 
According to this table, most of the participants were somewhat satisfied with the fit 
of RTW skirts, and a significant percent of the participants (more than thirty-five 
percent) were either neutral or dissatisfied at a certain extend.  
Table 3.9 : Participants’ RTW skirts fit satisfactions. 
 
Frequency 
Percent 
Cumulative 
Percent 
Extremely dissatisfied 
1 
2.2 
2.2 
Dissatisfied 
2 
4.4 
6.7 
Somewhat dissatisfied 
8 
17.8 
24.4 
Neither satisfied nor 
dissatisfied 
5 
11.1 
35.6 
Somewhat satisfied 
20 
44.4 
80.0 
Satisfied 
9 
20.0 
100.0 
Total 
45 
100.0 
 
Later, paired sample t- tests were conducted to figure if participants’ RTW skirts fit 
satisfactions were significantly different than any of the other items. The paired t-test 
results are reported in Table 3.10. Table 3.10 shows that, participants’ fit satisfaction 
for RTW skirts was significantly lower than their fit satisfactions for T-shirts, blouses 
, sweaters and cardigans. Whereas, participants’ fit satisfaction for RTW skirts was 
significantly higher than jeans and trousers.   
 


---

 
 
 79 
Table 3.10 : Paired t-test between participants’ RTW skirts fit satisfactions and 
other garment types. 
Pair 
Mean 
Diff. 
Std. 
Dev. 
Std.Err. 
Mean 
Lower Upper 
t 
df 
Sig. 
(2-
tailed) 
Skirts - T-shirts 
-1.022 
1.644 
.245 
-1.516 
-.528 
-4.170 44 
.000 
Skirts - Blouses 
-.711 
1.456 
.217 
-1.148 
-.274 
-3.277 44 
.002 
Skirts - Sweaters 
-.844 
1.651 
.246 
-1.340 
-.348 
-3.431 44 
.001 
Skirts - Cardigans 
-.733 
1.558 
.232 
-1.201 
-.265 
-3.158 44 
.003 
Skirts - Jeans 
.556 
1.589 
.237 
.078 
1.033 
2.345 
44 
.024 
Skirts - Trousers 
.600 
1.498 
.223 
.150 
1.050 
2.686 
44 
.010 
Skirt style preferences 
Participants answered three questions about their skirt style preferences. These 
questions were designed to understand to what extend participants like the silhouette,  
overall fit and color of  the three different skirt styles (A-line, pencil and circular) on 
a 7-point Likert scale (1: dislike a great deal, 7: like a great deal). In addition, one 
question was asked to understand participants’ purchase intention for the 
corresponding skirt style. Factor analysis showed that participants’ silhouette and 
overall fit liking were loaded on the same factor, however color and purchase intention 
questions were irrelevant. Therefore, purchase intention and color liking questions 
were not included in data analysis. Skirt style preferences of participants in Table 3.11 
were calculated by taking the average of the scores for the silhouette and overall fit 
questions for the corresponding skirt style. According to Table 3.11, the most preferred 
skirt style were pencil skirt style and the least preferred style was A-line skirt.   
Table 3.11 : Participants’ preferences for different skirt styles.  
Item 
N 
Min. 
Max. 
Mean 
Std. Dev. 
Pencil skirt  
45 
2.00 
7.00 
5.63 
1.184 
Circular skirt  
45 
2.00 
7.00 
5.23 
1.237 
A-line skirt  
45 
1.00 
7.00 
4.18 
1.624 
The results of participants’ preference frequencies for circular skirt style are given 
individually in Table 3.12  in order to interpret how participants liked the skirt style 
that was used for this study.  Table 3.12 shows that, only few participants (n=2) 
disliked the circular skirt style to different extends while three of the participants 
neither like nor dislike the style. Majority of the participants (n=40) liked the circular 
skirt style to different extends.  


---

 
 
 80 
Table 3.12 : Participants’ preference frequencies for circular skirt style. 
 
Frequency 
Percent 
Cumulative 
Percent 
Dislike a moderate amount 
1 
2.2 
2.2 
Dislike a little 
1 
2.2 
4.4 
Neither like nor dislike 
3 
6.7 
11.1 
Like a little 
5 
11.1 
22.2 
Like a moderate amount 
21 
46.7 
68.9 
Like a great deal 
14 
31.1 
100.0 
Total 
45 
100.0 
 
Paired sample t-tests were conducted to figure if participants’ circular skirt preferences  
were significantly different than the other skirt styles. Table 3.13 points that, 
participants preferred circular skirts significantly more than the A-line skirts and less 
than the pencil skirts.  
Table 3.13 : Paired t-test between participants’ circular skirt preferences  and 
other skirt styles. 
Pair 
Mean 
Diff. 
Std. 
Dev. 
Std.Err. 
Mean 
Lower 
Upper 
t 
df 
Sig. 
(2-
tailed) 
Circular - Pencil  
-.400 
1.691 
.252 
-.908 
.108 
-1.587 
44 
.120 
Circular - A-line  
1.056 
2.185 
.326 
.399 
1.712 
3.240 
44 
.002 
Body measurements 
During participant recruitment, subjects with 25-28 inches waist girth,  and 35-38 
inches hip girth were seeked.  However, some participants were not within the required 
limits (See Table 3.14 for waist and hips girths of participants). Especially hip 
measurements of some participants were higher than the required measurements. As 
the skirt style is a circular style and has some design ease at hips area, the participants 
with slightly larger hips and waist were allowed to participate in the experiment if they 
could easily don-on and off the skirt and zip it up. Participants with significantly 
different body measurements than the recruiting criteria were excluded. 
 
 
 
 


---

 
 
 81 
Table 3.14 : Body measurements of participants. 
Item 
N 
Min. 
Max. 
Mean 
Std. Dev. 
Weight*  
45 
105 
154 
130.73 
12.689 
Body height  
45 
59.85 
70.03 
64.69 
2.495 
Waist height 
44 
36.75 
44.65 
40.78 
1.857 
Hip girth 
45 
33.99 
43.87 
38.19 
1.964 
Belly circ. 
44 
27.89 
37.10 
31.64 
2.148 
Waist girth 
45 
24.56 
30.88 
28.02 
1.616 
Thigh girth  
45 
19.62 
27.22 
23.66 
1.602 
Weight-height scatter diagram of participants is given in Figure 3.3 for interpreting the 
average body mass index (BMI) of participants. BMI is the measure of body fat based 
on height and weight. According to Figure 3.3, body height /weight diagram, all of the 
participants had similar BMI and none of the participants had exceptional BMI, which 
confirms the appropriateness of sample group for trying on a  M size garment.   
 
Figure 3.3 : Scatter diagram of participants’ weight by their body height. 
Body satisfactions 
Body satisfactions of participants were measured on a 7-point Likert scale (1: 
extremely dissatisfied, 7: extremely satisfied). Means of real and virtual body 
satisfactions of participants for corresponding body parts are given in Table 3.15. 
According to the real and virtual body satisfactions, participants were most satisfied 
with their wrists. For the real body satisfaction, thighs were the least satisfied body 
part.  Whereas, for the virtual case, abdomen was the least satisfied body part. 


---

 
 
 82 
Participants’ virtual body satisfactions were often lower than their actual body 
satisfactions.  
Table 3.15 : Real and virtual fit satisfactions of participants. 
 
Real  
Virtual 
Item 
Mean 
Std.D. 
Mean 
Std.D. 
wrist 
6.00 
.826 
5.87 
.968 
neck 
5.80 
1.160 
5.62 
1.154 
height 
5.49 
1.236 
5.50 
1.355 
shoulder width 
5.38 
1.370 
5.51 
1.308 
ankle 
5.27 
1.452 
5.36 
1.480 
back 
5.22 
1.312 
4.96 
1.595 
feet 
5.20 
1.325 
5.36 
1.313 
knees 
5.11 
1.247 
5.32 
1.290 
appearance 
5.07 
1.232 
4.40 
1.615 
arms 
5.02 
1.305 
5.13 
1.471 
bust 
4.87 
1.546 
5.00 
1.665 
posture 
4.84 
1.224 
5.07 
1.698 
profile 
4.84 
1.205 
4.64 
1.708 
waist 
4.82 
1.353 
4.18 
1.542 
legs 
4.82 
1.556 
4.55 
1.677 
torso 
4.80 
1.272 
4.42 
1.672 
body build 
4.73 
1.355 
4.00 
1.784 
buttocks 
4.60 
1.558 
4.45 
1.663 
weight 
4.33 
1.462 
3.80 
1.812 
hips 
4.33 
1.314 
4.00 
1.624 
abdomen 
4.29 
1.325 
3.53 
1.471 
thighs 
4.27 
1.558 
3.91 
1.668 
Principle Component analysis (PCA) of body satisfaction scale 
Using overall body satisfactions of participants are more convenient than using body 
satisfaction for single body parts. Therefore, principle component analysis (PCA) with 
Oblimin rotation was conducted to reduce dimensions of the body satisfaction scale. 
According to the analysis; appearance, profile, back, torso and body build items were 
removed after several PCAs due  to their low communalities and loading on several 
factors at a time. After removing these items, a final PCA was conducted with the rest 
of the items. According to the results, five factors with Eigen values higher than 1  
were extracted as given in Table 3.16. These factors explained 71.67 percent of the 
total variance. The KMO and Bartlett’s test result was significant and high enough 
(KMO= . 73, p< 0.01).  Finally, Cronbach’s alphas were calculated to test reliability 
of each scale.  Cronbach’s alpha of factor 4 was relatively low (.581). The items loaded 


---

 
 
 83 
on Factor 4 were bust, height and posture. Since these items were not essential for the 
purpose of the skirt fit study, a further PCA was not conducted.  
Table 3.16 : PCA of body satisfaction scale. 
Component* 
 
1: 
around 
hips 
2: 
 upper 
body 
3:  
lower 
body 
4: 
stance 
5: 
around 
waist 
hips 
.811 
 
 
 
 
buttocks 
.688 
 
 
 
 
thighs 
.611 
 
 
 
 
weight 
.538 
 
 
 
 
neck 
 
.688 
 
 
 
shoulder w. 
 
.800 
 
 
 
arms 
 
.671 
 
 
 
wrist 
 
.800 
 
 
 
legs 
 
 
-.670 
 
 
knees 
 
 
-.908 
 
 
ankle 
 
 
-.919 
 
 
feet 
 
 
-.725 
 
 
bust 
 
 
 
.747 
 
height 
 
 
 
.765 
 
posture 
 
 
 
.587 
 
waist 
 
 
 
 
.780 
abdomen 
 
 
 
 
.884 
Cronbach’s 
alpha 
.850 
.770 
.864 
.581 
.850 
   *After extraction of appearance, profile, back, torso and body build items. 
 
As shown in Table 3.16; hips, buttocks, thighs and weight items loaded on factor 1, 
hence factor 1 was named as: satisfaction around hips. Neck, shoulder width, arms and 
wrist satisfactions loaded on factor 2, hence factor 2 was named:  upper body 
satisfaction. Legs, knees, ankle and feet items loaded on factor 3, hence factor 3 was 
named as lower body satisfaction. Bust, height and posture loaded on factor 4, hence 
factor 4 was named as stance satisfaction. Finally, waist and abdomen items loaded on 
factor 5, hence factor 5 was named as satisfaction around waist.  


---

 
 
 84 
Body satisfactions for specific areas 
As mentioned earlier, the reason of reducing the dimension of body satisfaction scale 
was the convenience of using overall body satisfactions instead of single body parts. 
After reducing dimensions of the scale into five factors, participants’ body 
satisfactions for each factor were calculated separately.  For instance, lower body 
satisfaction level of each participant was calculated by taking the mean of their body 
satisfactions for each item that had loaded on this factor;  in this case legs, knees,ankles 
and feet satisfactions (see Table 3.16). Each participants’ upper body, lower body, 
around waist, around hips and stance satisfactions were calculated one by one 
according to the explained procedure.  
In addition to real body satisfaction, the same procedure was applied to virtual body 
satisfactions in order to calculate participants’ virtual body satisfactions for each 
factor.  
A further descriptive statistics was conducted to interpret the data. Mean of the real 
and virtual body satisfactions of all participants for each factor were calculated 
individually. Table 3.17 shows the mean real and virtual body satisfactions of 
participants for each body area. Participants had the highest satisfaction with their 
upper bodies for virtual and real cases.  Participants’ virtual body satisfactions for 
waist and hips area were lower than their actual satisfactions. Participants lowest body 
satisfaction for real case was with their hips area, whereas, the lowest satisfaction for 
virtual case was with the waist area.  
Table 3.17 : Real and virtual body satisfactions of participants for specific body 
areas. 
 
Real  
Virtual 
 
Mean 
Std.D. 
Mean 
Std.D. 
Upper body 
5.55 
.916 
5.53 
1.041 
Lower body 
5.10 
1.180 
5.10 
1.180 
Stance 
5.07 
.991 
5.17 
1.162 
Around waist 
4.56 
1.249 
3.86 
1.397 
Around hips 
4.38 
1.226 
4.02 
1.256 
Later, paired sample t-tests were conducted to figure whether participants’ real fit 
satisfactions were significantly different than their virtual body satisfactions for 
specific body areas. The results are given in Table 3.18.  


---

 
 
 85 
Table 3.18 : Paired t-test between participants’ real and virtual body satisfactions 
for specific body parts. 
Pair 
(RBS-VBS) 
Mean 
Diff.* 
(d) 
Std. 
Dev. 
Std.Err. 
Mean 
Lower Upper 
t 
df 
Sig. 
(2-
tailed) 
Around hips 
.349 
1.188 
.181 
-.017 
.714 
1.926 
42 
.061 
Upper body 
.0167 
.747 
.111 
-.208 
.241 
.150 
44 
.882 
Stance 
-.129 
.857 
.129 
-.3898 
.132 
-.996 
43 
.325 
Around waist 
.700 
1.125 
.168 
.362 
1.038 
4.174 
44 
.000 
*d= Mean RBS - Mean of VBS 
Table 3.18 shows that, participants’ virtual body satisfactions for waist area was 
significantly lower than their real body satisfactions for the same area. On the other 
hand, virtual body satisfactions and real body satisfactions at other areas were not 
significantly different. 
Interaction with 3D fit technologies 
3.3.7.1 3D body scanning  
Participants were asked three questions in this section. Each question was measured 
on a 7-point Likert scale. The results are given in Table 3.19.  
Table 3.19 : Participants’ interaction with 3D body scanning.  
Item 
N 
Min. Max. Mean 
Std. 
Dev. 
Comfort with 3D body scanning 
45 
5 
7 
6.58 
.543 
Comfort with viewing the 3D scan image 
45 
2 
7 
5.67 
1.477 
Willingness to be scanned again 
45 
4 
7 
6.24 
.957 
According to the Table 3.19, 60 percent of the participants were extremely comfortable 
with 3D body scanning process, 38 percent were comfortable, and 2 percent were 
somewhat comfortable, none of the participants were uncomfortable with the scanning 
process. On the other hand, 38 percent of the participants were extremely comfortable 
to view their 3D scan image, 29 percent were comfortable, 13 percent were somewhat 
comfortable, 4 percent were neither, 13 percent were somewhat uncomfortable and 2 
percent were uncomfortable. Finally, 89 percent of the participants were willing to be 
scanned in the future while 11 percent were neutral. None of the participants had 
negative approach to be 3D scanned again in the future.   
 


---

 
 
 86 
 
Principle Component Analysis of 3D body scanning questions 
A PCA with Oblique rotation was conducted further to determine if there were any 
underlying factors of these three questions. A single factor with Eigen value 1.963 
explained the 65 percent of the total variance. However, KMO and Bartlett’s test result 
was quite low (KMO measure = .59) and comfort with scanning process  item had a 
low communality (.38). The reliability of the scale was assessed according to 
calculated Cronbach’s alpha ( .70). Even though, a = .70 is referred to be adequate in 
many sources (Field, 2013), due to its low communality,  comfort with 3D body 
scanning variable was excluded. Eventually, a new variable, attitude towards 3D body 
scanning was calculated for each participant by taking the mean of the other two items 
(willingness to be scanned again and comfort with viewing the 3D scan image). 
3.3.7.2 Virtual try-on technology 
Participants’ acceptance of virtual try-on technology was measured with a five items 
scale (Kim & LaBat, 2013b). The scale measured participants’ agreements for each 
item on a 7-point scale (1: strongly disagree, 7: strongly agree).  Calculated means for 
each item is given in Table 3.20. 
Table 3.20 : Participants’ acceptance of virtual try-on. 
Item 
N Min. Max. Mean 
Std. 
Dev. 
Use virtual try-on for online shopping 
45 
2 
7 
5.29 
1.424 
Use virt. try-on in the future for fit evaluation 45 
1 
7 
5.16 
1.623 
Satisfaction with using virtual try-on for fit 
evaluation 
45 
1 
7 
4.56 
1.778 
Visual information obtained from simulation 
45 
1 
7 
4.27 
1.643 
Willingness to pay for virtual try-on tech. 
45 
1 
7 
3.82 
1.696 
Eighty percent of the participants were positive (above 4) to use virtual try-on 
technology for online apparel shopping. Seventy-three percent of participants were 
eager to use virtual try-on technology in the future to evaluate garment fit. Sixty-two 
percent of participants were satisfied with using virtual try-on for fit evaluation in 
different respects, while 33 percent of the participants were not satisfied (below 4) and 
5 percent were neither satisfied nor dissatisfied. Fifty-one percent of the participants 
were positive for the visual information gathered by the virtual try-on technology, 


---

 
 
 87 
whereas, 42 percent of the participants were negative. Finally, only 24 percent of the 
participants were willing to pay extra money for virtual try-on technology, more than 
half of the participants mentioned that they wouldn’t pay extra for virtual try-on 
technology.  
Principle Component Analysis of acceptance of virtual try-on technology scale 
A PCA with Oblique rotation was conducted to determine the factors of the  scale. A 
single factor with Eigen value 3.83 was extracted and it explained 77 percent of the 
total variance which is fairly good (Field, 2013). KMO value was .78 and 
communalities were high for each item (higher than .60). Factor loadings of each item 
were higher than .80 except willingness to pay extra (.77). Finally, the Cronbach’s 
alpha value was calculated as 0.92 which confirms that the scale was good to measure 
the construct (Field, 2013). Eventually, a new variable, acceptance of virtual try-on, 
was calculated for each participant by taking the mean of their answers to these five 
questions. 
Skirt fit satisfactions 
3.3.8.1 Descriptives 
Skirt fit satisfactions of participants were measured on a 7-point Likert scale for  four 
fit locations (waistline, abdomen level,  hips level and hem level) at three different 
views (front, back and sides of the skirts). Thus, each participant had twelve fit 
evaluations (four fit locations at three views) for each skirt as described in 
methodology (Figure 2.17).  Each participant’s fit satisfactions for each location were 
measured by taking the mean of participant’s fit evaluations for front, back and side of 
the skirt at corresponding location, and overall fit satisfaction of each participant for 
the corresponding skirt was measured by calculating the mean of her fit satisfaction at 
waist, abdomen, hips and hem. This procedure was followed for real skirts and virtual 
skirts. For instance; participant-1 (P1)’s fit satisfaction of a real skirt is given in Figure 
3.4. According to the evaluations in Figure 3.4, P1’s RFS for waistline was calculated 
by taking the mean of evaluations at front, back and side view. Accordingly, P1’s RFS 
at waistline was 5.33. Similarly, P1’s RFSs for abdomen level, hips level and hem 
level were 4.33, 6 and 4.67; respectively. On the other hand, overall RFS of P1 for this 
skirt was calculated by taking the mean of twelve evaluations. In Figure 3.4, P1’s 
overall RFS for this skirt was 5.08.  


---

 
 
 88 
 
Figure 3.4 : P1’s fit evaluations for a skirt sample. 
Table 3.21 shows participants’ overall fit satisfactions for each skirt  in real and virtual 
context. Participants’ fit satisfaction results are reported for specific fit areas ( i.e. 
waist, abdomen level, hips level, hem level) and for overall. According to Table 3.21, 
participants had the maximum fit satisfaction for Skirt 2 and the minimum satisfaction 
for Skirt 15. Their overall fit satisfactions with skirts varied between M=5.33 and 
M=3.94. On the other hand, for the virtual case, participants were most satisfied with 
the Skirt 6 and least satisfied with the Skirt 2. However, participants’ fit satisfactions 
varied  between M=4.83 and M=4.43 for the virtual case. The lowest virtual fit 
satisfaction with Skirt 2 was particularly due to low satisfaction scores for the hemline. 
For most of the skirts (Skirt 2, Skirt 22, Skirt 6, Skirt 8 and Skirt 21), overall fit 
satisfaction scores for real cases were higher than the virtual cases. For the real fit, 
participants were mostly least satisfied with abdomen and waistlines of the skirts. 
However, for the virtual cases, it was not possible to observe such a trend.  
 
 
 
 
 


---

 
 
 89 
Table 3.21 : Participants’ average RFSs and VFSs for different skirts (overall 
and specific fit areas). 
 
 
 
RFS 
VFS 
Skirt 
Cluster 
Skirt Code 
Item 
Mean 
Std.D. 
Mean 
Std.D. 
 
 
1 
Skirt 2 
waist 
4.88 
1.873 
4.71 
1.261 
abdomen 
5.29 
1.183 
4.52 
1.116 
hips 
5.35 
1.232 
4.30 
1.399 
hem 
5.79 
.894 
4.23 
1.561 
Overall 
5.33 
1.119 
4.44 
1.110 
 
 
1 
 
 
Skirt 22 
waist 
5.00 
1.570 
4.90 
1.253 
abdomen 
5.26 
1.146 
4.75 
1.120 
hips 
5.39 
1.254 
4.71 
1.220 
hem 
5.39 
1.336 
4.93 
1.263 
Overall 
5.26 
1.150 
4.82 
1.023 
 
 
2 
 
 
Skirt 1 
waist 
4.57 
1.591 
5.13 
1.192 
abdomen 
4.28 
1.653 
4.71 
1.574 
hips 
4.70 
1.414 
4.51 
1.470 
hem 
4.80 
1.388 
4.64 
1.708 
Overall 
4.58 
1.249 
4.75 
1.216 
 
 
2 
 
 
Skirt 6 
waist 
5.12 
1.503 
4.83 
1.320 
abdomen 
4.77 
1.370 
4.62 
1.335 
hips 
5.06 
1.528 
4.56 
1.572 
hem 
5.62 
1.218 
5.29 
1.502 
Overall 
5.14 
1.171 
4.83 
1.168 
 
 
3 
 
 
Skirt 8 
waist 
5.01 
1.749 
4.61 
1.371 
abdomen 
4.42 
1.781 
4.40 
1.373 
hips 
4.58 
1.628 
4.82 
1.322 
hem 
5.101.652 
5.14 
1.304 
Overall 
4.78 
1.505 
4.74 
1.174 
 
 
3 
 
 
Skirt 15 
waist 
4.40 
1.649 
4.65 
1.356 
abdomen 
3.65 
1.319 
4.54 
1.077 
hips 
3.76 
1.257 
4.68 
.840 
hem 
3.95 
1.42 
4.65 
1.344 
Overall 
3.94 
1.161 
4.63 
.897 
 
 
4 
 
 
Skirt 21 
waist 
4.96 
1.488 
4.63 
1.393 
abdomen 
4.96 
1.160 
4.53 
1.111 
hips 
5.13 
1.274 
4.72 
1.265 
hem 
5.21 
1.258 
4.79 
1.360 
Overall 
5.06 
1.178 
4.67 
1.080 
Histogram of overall RFS and VFS for each skirt is given in below Figure 3.5 for 
visualization and easier interpretation. Figure 3.5 clearly shows that participants’ real 
fit satisfactions varied considerably among the skirts while virtual fit satisfaction 
scores  were relatively close to each other (M=4.82 for Skirt 2 and Skirt 21, and M= 
4.83 for Skirt 6). The highest discrepancy for participants’ virtual and real fit 
satisfaction scores were observed for Skirt 2. Participants were most satisfied with 
Skirt 2 for real case and least satisfied with the same skirt for virtual case.  


---

 
 
 90 
 
Figure 3.5 : Participants’ overall RFSs and overall VFSs for different skirts. 
3.3.8.2 One-way ANOVA  
One-way ANOVA between participants’ RFSs for the test skirts 
In this study, seven skirts made from different fabrics were used for fitting tests. To 
understand if participants’ overall RFSs were significantly different between these test 
skirts, a one-way ANOVA was conducted. According to the one-way ANOVA, there 
was a significant difference between overall RFSs of different skirts, ANOVA ( 
F(6,173) = 3.515, p = .003).  
A further Post-Hoc analysis was carried out to figure which skirt/skirts was different 
in terms of overall RFSs.  Since each skirt was worn for different number of times, for 
instance Skirt 21 was worn by 45 participants while Skirt 2 was worn by 23 
participants, Hochberg Post-Hoc test  was appropriate for this study (Field, 2013). 
According to Post-Hoc analysis, participants’ overall RFSs for Skirt 15 (M= 3.94, 
SD:1.161) were statistically different than Skirt 2 (M= 5.33, SD= 1.119, p=0.006), 
Skirt 6 (M=5.14, SD=1.171, p=0.031) , Skirt 21 (M=5.26, SD=1.149, p=0.013) and 
Skirt 22 (M=5.26, SD=1.149, p=0.009) 
One-way ANOVA between participants’ VFSs for the test skirts 
To understand if participants’ overall VFSs were significantly different between 
virtual skirts, a one-way ANOVA was conducted. According to the one-way ANOVA, 
there was no significant difference between overall VFSs of different skirts, 
ANOVA(F(6,173) = .333, p = 0.92). Since no difference was determined, a further 
Post-Hoc analysis was not necessary.  
5.33
5.26
4.58
5.14
4.78
3.94
5.26
4.44
4.82
4.75
4.83
4.74
4.63
4.82
0
1
2
3
4
5
6
Skirt 2
Skirt 22
Skirt 1
Skirt 6
Skirt 8
Skirt 15
Skirt 21
Skirt Fit Evaluations
Overall RFS
Overall VFS


---

 
 
 91 
3.3.8.3 Paired t-tests and Pearson’s correlations between participants’  RFSs 
and VFSs (regardless of the skirt codes) 
In this study, seven different skirts were clustered in four groups, and each participant 
tried one of the skirt from each cluster resulting each participant to try-on four different 
skirts. Since each participant wore four different skirts, number of cases (N) were 180 
(Number of participants=45, number of skirts that each participant wore=4; 45 x 4 = 
180) which means that there were 180 RFS scores and 180 VFSs scores at total, and 
Pearsons’ correlation analysis and paired t-test analysis were conducted among these 
180 cases. So, in this section, participants’ RFSs and VFSs correlation and mean 
difference analysis are conducted regardless of the differences among the skirts. As 
the only difference between the skirts is their fabrics, this section gives information 
how garment simulation was effective regardless of the fabric differences. 
Pearson’s’ correlation 
A Pearson’s correlation test and paired t-test were conducted between overall RFSs 
and VFSs of participants regardless of skirt code.  In addition to overall fit 
satisfactions, specific fit locations  such as waist line, abdomen level were also paired.  
According to Pearson’s correlation analysis between overall RFSs and VFSs of 
participants, a significant correlation was spotted (r= .63, N= 180, p< 0.01).  Moreover, 
Pearson’s correlation analysis between RFSs and VFSs at abdomen was r= .42 (N= 
180, p< 0.01) ; RFS and VFS at waist was r= .48 (N= 180, p< 0.01); RFS and VFS at 
hips was r= .60 (N= 180, p< 0.01);  RFS and VFS at hem was r= .65 (N= 180, p< 0.01). 
The correlation coefficient scatter diagram of overall RFS and VFS of participants is 
given in Figure 3.6. Figure 3.6 shows each participants’ overall RFS and VFS for all 
of the skirts they had tried on. Hence, there are N=180 cases (dots) in the diagram. In 
this diagram, a positive linear correlation between overall RFSs and VFSs was 
observed. The correlation coefficient of this data r= .63 (N=180, p< .01) and calculated 
R2 was 0.40. In other words this linear model explains the 40 percent of the variability 
of the participants’ RFS around its mean and VFS is a good variable to relate to RFS 
(Field, 2013).   


---

 
 
 92 
 
Figure 3.6 : Scatter diagram of overall VFSs and RFSs of participants 
(regardless of  the skirt codes, N=180). 
Paired t-tests 
A paired t-test between overall RFSs and VFSs of participants was conducted to see if 
there was any significant different between the means of these two groups. In addition, 
one by one paired t-tests were conducted for RFSs and VFSs at certain fit areas (i.e. 
waist, abdomen level) to see if there was any significant difference for RFSs and VFSs 
for any specific fit area. The paired t-test results between RFSs and VFSs of 
participants are given in Table 3.22. According to the Table 3.22, there was a 
significant difference between the overall RFSs and VFSs (t(6, 179)=2.690, p< 0.01). 
Participants’ fit satisfactions for hips and hem area were significantly different in real 
case than the virtual case (t(6, 179)=2.859 and t(6,179)=3.676 , respectively p<0.01), 
whereas, no significant differences were observed for abdomen and waist areas 
(r(6,179)= 1.188, r(6,179)= .921, respectively, p>0.05).  
Table 3.22 : Paired t-tests between RFSs and VFSs of participants (regardless of 
the skirt codes). 
Pair 
(RFS-VFS) 
Mean 
Diff.* 
(d) 
Std. 
Dev. 
Std.Err. 
Mean Lower Upper 
t 
df 
Sig. 
(2-
tailed) 
overall 
.206 
1.027 
.0766 
.055 
.36 
2.690 179 
.004 
waist 
.104 
1.600 
.113 
-.118 
.326 
.921 
179 
.179 
abdomen 
.128 
1.443 
.108 
-.085 
.340 
1.188 179 
.118 
hips 
.263 
1.234 
.0920 
.081 
.445 
2.859 179 
.003 
hem 
.328 
1.196 
.0892 
.152 
.504 
3.676 179 
.000 
 * d= Mean RFS - Mean of VFS 
 
 


---

 
 
 93 
3.3.8.4 Paired t-tests and Pearson’s correlations between participants’ RFSs and 
VFSs (regarding the skirt codes) 
In this section, the real and virtual fit satisfactions of participants were explored for 
each skirt individually. For instance, 22 of the participants wore Skirt 2 and evaluated 
its real and virtual fit (see Figure 3.2). Therefore, it was also critical to observe how 
real and virtual fit satisfactions were correlated and compared for individual skirts 
since the fabrics of each skirt were different than each other, and simulation software 
might be more sufficient to reflect drape properties of some fabrics better than the 
others. Therefore, RFS and VFS comparisons were also conducted within skirts by 
respecting their fabric differences. 
Pearson’s’ correlations 
Pearson’s correlation tests were conducted between RFSs and VFSs of each skirt for 
each body area that have been evaluated and results are given in Table 3.23. According 
to the Table 3.23, the highest correlation between overall RFSs and VFSs was 
observed for Skirt 22 (r= .84, N=23, p< .01) and the lowest correlation was observed 
for Skirt 2 (r= .42, N=22, p=0.05). Although this two skirts were clustered in the same 
group according to their fabric properties, their overall RFSs and VFSs correlations 
were considerably different. Similar pattern was also observed for Skirt 8 and Skirt 15. 
The correlation between overall RFSs and VFSs for Skirt 8 (r= .67, N=24, p< .01) was 
considerably different than the Skirt 15 (r= .52, N=21, p< .01) which is in the same 
cluster (Cluster 3). Participants’ RFSs and VFSs were correlated significantly for most 
of the skirts for specific fit locations too. The correlations between RFSs and VFSs at 
waist and abdomen were often lower than the correlations at other parts.   
 
 
 
 


---

 
 
 94 
Table 3.23 : Pearson’s correlations between overall and specific RFSs and VFSs 
of participants (regarding skirt differences). 
Skirt 
Cluster 
Skirt Code 
Item  
N 
Pearson’s 
Correlation 
Sig.  
(2-
tailed) 
 
 
1 
   Skirt 2 
waist 
22 
.09 
.698 
abdomen 
22 
.37 
.089 
hips 
22 
.48 
.024 
hem 
22 
.66 
.001 
 
   
Overall        22     
.42     . 052 
  
 
1 
 
 
 
 
Skirt 22 
waist 
23 
.67 
.000 
abdomen 
23 
.74 
.000 
hips 
23 
.75 
.000 
hem 
23 
.76 
.000 
Overall 
23 
.84 
.000 
 
 
2 
 
 
Skirt 1 
waist 
23 
.55 
.007 
abdomen 
23 
.45 
.033 
hips 
23 
.56 
.003 
hem 
23 
.85 
.000 
Overall 
23 
.71 
.00 
 
 
2 
 
 
Skirt 6 
waist 
22 
.46 
.022 
abdomen 
22 
.47 
.021 
hips 
22 
.76 
.006 
hem 
22 
.74 
.000 
Overall 
22 
.75 
.000 
 
 
3 
 
 
Skirt 8 
waist 
24 
.59 
.003 
abdomen. 
24 
.37 
.078 
hips 
24 
.54 
.007 
hem 
24 
.77 
.000 
Overall 
24 
.67 
.000 
 
 
3 
 
 
Skirt 15 
waist 
21 
.45 
.023 
abdomen 
21 
.29 
.199 
hips 
21 
.55 
.010 
hem 
21 
.53 
.013 
Overall 
21 
.52 
.016 
 
 
4 
 
 
Skirt 21 
waist 
45 
.56 
.000 
abdomen 
45 
.49 
.001 
hips 
45 
.79 
.000 
hem 
45 
.69 
.000 
Overall 
45 
.72 
.000 
Paired t-tests 
Paired t-tests between RFSs and VFSs for each skirt were conducted individually to 
see if there was any significant different between the means of the groups when fabric 
differences of the skirts were considered. In addition, one by one paired t-tests were 
conducted for RFSs and VFSs at certain fit areas (for instance, waist) to see if there 
was any significant difference for RFSs and VFSs of the skirt for any specific fit area, 
and the results are given in Table 3.24. According to the Table 3.24, significant 
differences between RFSs and VFSs were observed for Skirt 2, Skirt 22, Skirt 15 and 


---

 
 
 95 
Skirt 21 (p< .01). Whereas, no significant difference was observed for Skirt 1, Skirt 6 
and Skirt 8 (p> .05). The highest significant discrepency between its overall RFS and 
VFS mean scores was observed for Skirt 2 (d= .87) and minimum was observed for 
Skirt 21(d= .40). For particular fit locations, only RFSs and VFSs at waist showed no 
significant difference for each skirt (p > .05 in all cases). No particular pattern was 
observed for other fit locations.   
Table 3.24 : Paired t-tests between RFS and VFS of participants (regarding skirt 
differences). 
Skirt 
Code 
Pair 
(RFS-
VFS 
 
Mean 
Diff.* 
(d) 
Std. 
Dev. 
Std.Err. 
Mean 
Lower 
Upper 
t 
df 
Sig. 
(2-
tailed 
2 
 waist 
.167 
2.165 
.461 
-.793 
1.126 
.361 
21 
.722 
abd. 
.773 
1.291 
.275 
.201 
1.345 
2.808 
21 
.011 
 hips 
1.045 
1.350 
.288 
.447 
1.644 
3.632 
21 
.002 
  hem 
1.561 
1.179 
.251 
1.038 
2.083 
6.208 
21 
.000 
overall 
.886 
1.201 
.256 
.353 
1.418 
3.459 
21 
.002 
22 
 waist 
.101 
1.148 
.239 
-.395 
.598 
.424 
22 
.676 
abd. 
.507 
.822 
.171 
.152 
.863 
2.960 
22 
.007 
 hips 
.681 
.885 
.184 
.299 
1.064 
3.693 
22 
.001 
 hem 
.464 
.903 
.188 
.073 
.854 
2.463 
22 
.022 
overall 
.438 
.626 
.131 
.168 
.709 
3.357 
22 
.003 
1 
 waist 
-.565 
1.372 
.286 
-1.159 
.028 
-1.975 
22 
.061 
abd. 
-.435 
1.701 
.355 
-1.170 
.301 
-1.226 
22 
.233 
 hips 
.188 
1.298 
.271 
-.373 
.750 
.696 
22 
.494 
 hem 
.159 
.915 
.191 
-.236 
.555 
.836 
22 
.412 
overall 
-.163 
.938 
.196 
-.569 
.243 
-.833 
22 
.414 
6 
 waist 
.288 
1.441 
.307 
-.351 
.927 
.937 
21 
.359 
abd. 
.152 
1.368 
.292 
-.455 
.758 
.520 
21 
.609 
 hips 
.500 
1.083 
.231 
.020 
.980 
2.166 
21 
.042 
 hem 
.333 
1.018 
.217 
-.118 
.785 
1.535 
21 
.140 
overall 
.318 
.830 
.177 
-.050 
.686 
1.798 
21 
.087 
8 
 waist 
.403 
1.464 
.299 
-.216 
1.021 
1.347 
23 
.191 
abd. 
.014 
1.806 
.369 
-.749 
.776 
.038 
23 
.970 
 hips 
-.236 
1.443 
.295 
-.845 
.373 
-.802 
23 
.431 
 hem 
-.042 
1.051 
.215 
-.485 
.402 
-.194 
23 
.848 
overall 
.035 
1.130 
.231 
-.442 
.512 
.151 
23 
.882 
15 
 waist 
-.254 
1.531 
.334 
-.951 
.443 
-.760 
20 
.456 
abd. 
-.889 
1.439 
.314 
-1.544 
-.234 
-2.831 
20 
.010 
 hips 
-.921 
1.064 
.232 
-1.405 
-.436 
-3.965 
20 
.001 
 hem 
-.698 
1.341 
.293 
-1.309 
-.088 
-2.386 
20 
.027 
overall 
-.690 
1.036 
.226 
-1.162 
-.219 
-3.054 
20 
.006 
21 
 waist 
.333 
1.358 
.202 
-.075 
.741 
1.647 
44 
.107 
abd. 
.430 
1.145 
.171 
.086 
.774 
2.517 
44 
.016 
 hips 
.407 
.822 
.123 
.160 
.654 
3.323 
44 
.002 
 hem 
.415 
1.035 
.154 
.104 
.726 
2.688 
44 
.010 
overall 
.399 
.845 
.126 
.145 
.653 
3.164 
44 
.003 
    * d= Mean RFS - Mean of VFS 


---

 
 
 96 
 Factors Affecting VFSs of Participants 
3D fabric properties and VFS 
Association between overall VFSs of participants and 3D fabrics’ properties were 
explored by Pearson’s correlation test, and results are given in Table 3.25.. According 
to the Table 3.25, none of the 3D fabric properties (in Table 3.2)  were significantly 
associated with overall VFSs of participants.  
Table 3.25 : Pearson’s correlations between participants’ overall VFSs and 3D 
fabric properties . 
 
 
Weight 
T*  
(3D) 
B_warp 
(3D)  
B_weft  
(3D) 
E-warp 
(3D)  
E_ weft 
(3D)  
Fric. 
Coeff. 
(back) 
VFS 
Pears. Corr. 
.011 
-.016 
.017 
.013 
.035 
.018 
.041 
Sig.(2-tailed) 
.886 
.835 
.824 
.858 
.641 
.810 
.582 
N 
180 
180 
180 
180 
180 
180 
180 
   *T: thickness, B: bending rigidity, E: elongation are the 3D fabric properties in Table 3.2. 
Interaction with 3D fit technologies and VFS 
Association between overall VFSs of participants and their interaction with 3D virtual 
try-on and 3D body scanning were explored by Pearson’s correlation tests, and results 
are given in Table 3.26. According to the Table 3.26, interaction with virtual try-on 
and 3D body scanning  technologies were weakly  correlated with participants’ VFSs, 
r= .24, N=180, p< .01 and r= .29, N=180, p< .01, respectively.  
Table 3.26 : Pearson’s correlations between participants’ overall VFSs, and 
interaction with virtual try-on and 3D body scanning. 
 
 
VFS 
Virtual try-on 
3D body 
scanning 
VFS 
Pearson Correlation 
1 
.239 
.259 
 
Sig. (2-tailed) 
 
.001 
.000 
N 
180 
180 
180 
Virtual try-on 
Pearson Correlation 
.239 
1 
.292 
 
Sig. (2-tailed) 
.001 
 
.000 
 
N 
180 
180 
180 
3D body scanning 
Pearson Correlation 
.259 
.292 
1 
 
Sig. (2-tailed) 
.000 
.000 
 
 
N 
180 
180 
180 
Body measurements and VFS  
Association between overall VFSs of participants and their body measurements were 
explored by Pearson’s correlation test, and results are given in Table 3.27. According 


---

 
 
 97 
to the Table 3.27, all of the body measurements were significantly correlated to overall 
VFSs of participants except body height and waist height. Table 3.27 shows a negative 
correlation between VFSs of participants and their weight, waist girth, belly 
circumference and thight girth. The highest negative correlation between VFS and 
body measurements was observed for belly circumference (r= -.34, N=180,  p< .01).  
Table 3.27 : Pearson’s correlations between participants’ overall VFSs and body 
measurements. 
 
 
Weight 
Body 
height 
Waist 
girth 
Belly 
circ. 
Hip  
girth 
Thigh 
girth 
Waist 
height 
VFS 
Pearson Corr. 
-.225 
.007 
-.282 
-.343 
-.294 
-.291 
.059 
Sig.(2-tailed) 
.002 
.924 
.000 
.000 
.000 
.000 
.447 
N 
180 
180 
180 
180 
180 
180 
168 
Virtual body satisfaction and VFS 
Association between overall VFSs of participants and their virtual body satisfactions 
(VBSs) were explored by Pearson’s correlation test and results are given in Table 3.28. 
According to the Table 3.28, participants’ VBSs were positively correlated to their 
VFSs. The strongest correlation was between VBS around hips (r = .50, N= 180, p< 
0.01) and the lowest correlation was with the upper body (r= .22, N=180, p<0.01).  
Table 3.28 : Pearson’s correlations between VFSs and participants’ virtual body 
satisfactions (VBSs).  
 
 
VBS 
around 
hips 
VBS 
around 
waist 
VBS of 
lower 
body 
VBS 
upper 
body 
VBS of 
stance 
Overall 
VBS 
VFS 
Pearson Corr. 
.501 
.287 
.387 
.219 
.465 
.447 
Sig. (2-tailed) 
.000 
.000 
.000 
.003 
.000 
.000 
N 
180 
180 
180 
180 
180 
180 
Other factors 
In this study, participants’ preference of the circular skirt style, RTW garment 
satisfactions of the skirts, online shopping frequencies of the skirts were also 
measured. The correlations between these measured properties and overall VFSs of 
participants were also tested. Table 3.29 shows a significant correlation between VFSs 
of participants and their preference for the circular skirt style (r= 33, N=180, p< .01),  
and RTW fit satisfactions for the skirts (r= 25, N=180, p< .01). However no significant 
correlation was observed between participants’ VFSs and their online shopping 
frequencies for the skirts. 


---

 
 
 98 
Table 3.29 : Pearson’s’ correlations between VFS and other factors. 
 
 
Online 
Shop. 
Frequency 
(skirts) 
RTW fit 
satisfact. 
(skirts) 
Preference 
for the 
circular 
skirt 
VFS 
 
VFS 
 
Pearson C. 
-.029 
.250 
.329 
1 
Sig. (2-tailed) 
.696 
.001 
.000 
 
N 
180 
180 
180 
180 
Online Shop. 
Freq.(skirts) 
Pearson C. 
1 
.243 
-.162 
-.029 
Sig.(2-tailed) 
 
.001 
.030 
.696 
N 
180 
180 
180 
180 
RTW fit 
satisfaction 
(skirts) 
Pearson C. 
.243 
1 
-.262 
.250 
Sig.(2-tailed) 
.001 
 
.000 
.001 
N 
180 
180 
180 
180 
Preference for 
the circular skirt 
Pearson C. 
-.162 
-.262 
1 
.329 
Sig.(2-tailed) 
.030 
.000 
 
.000 
N 
180 
180 
180 
180 
Figure 3.7 is illustrated according to the Pearson’s correlation values obtained from 
Table 25 to Table 29. The correlation between each item and measured virtual fit 
satisfactions are given on the arrows.  
 
Figure 3.7 : Pearson’s correlations for factors affecting virtual fit satisfactions 
(Summary from Table 25-29). 
 Predicting Participants’ Real Fit Satisfactions (RFSs)  
Building the statistical model 
As illustrated in the Figure 3.2, each participant wore different skirts than each other. 
Hence a simple linear regression analysis was not appropriate  for this study (Field, 


---

 
 
 99 
2013). According to the research design, different skirts were distributed between 
participants. Therefore, a multilevel linear regression model (MLM) where kirts 
constitute the first level, and  participants constitute the second level was appropriate 
for the nature of the collected data. According the research model (Figure 2.3): VFS, 
body measurements (weight, height, waist height, belly circumference, waist girth, hip 
girth, thigh girth); real body satisfactions ( upper body, lower body, area around hips, 
area around waist, stance); actual fabric properties (W, T, Bwarp, Bweft, E warp , Eweft, G, 
friction coefficient(back), friction coefficient(face) , surface roughness, DC) were used as 
fixed factors and participant code was used as a random factor to predict the RFSs of 
the participants. Finally, RFS was the dependent factor in the statistics model.  
An initial MLM was conducted by using all parameters. After the first analysis, SPSS 
automatically excluded some of the fabric properties (W, T, G, surface roughness, 
friction coefficient (back) , DC ) due to redundancy. When variables are highly correlated 
this occurs as a common issue, and it is necessary to exclude highly correlated 
variables to prevent multicollinearity (Field, 2013). Finally, a MLM with maximum 
likelihood method was established. Results of the analysis is given in Table 3.30 and 
Table 3.31. 
 Table 3.30 shows the effects of each independent variable on the RFSs of partipants, 
and Table 3.31 shows the strength (β coefficients) of each independent variable to 
impact dependent variable which was RFSs of participants in this case.  
 
 
 
 
 
 
 
 


---

 
 
 
100 
Table 3.30 : Type III test of fixed effects (all data). 
Source 
Numerator 
df 
Denominator 
df 
F 
Sig. 
Intercept 
1 
50.480 
1.046 
.311 
Weight  
1 
38.138 
.359 
.553 
Body height 
1 
37.755 
3.867 
.057 
Waist girth 
1 
37.972 
.000 
1.000 
Belly circumference 
1 
37.571 
3.086 
.087 
Hip girth 
1 
37.417 
.928 
.342 
Thigh girth 
1 
38.201 
.009 
.926 
Waist height 
1 
37.666 
6.928 
.012 
RBS at waist area 
1 
37.769 
.071 
.791 
RBS at hips area 
1 
39.131 
1.573 
.217 
RBS at lower body 
1 
38.783 
2.205 
.146 
RBS at upper body 
1 
38.899 
.699 
.408 
RBS of stance 
1 
40.154 
.015 
.902 
B_warp 
1 
154.152 
3.643 
.058 
B_weft 
1 
155.263 
13.328 
.000 
E_warp 
1 
164.068 
.098 
.755 
E_weft 
1 
149.735 
.401 
.528 
Friction coeff. (Face) 
1 
160.285 
.454 
.502 
VFS 
1 
80.722 
55.005 
.000 
     *Dependent variable: Real fit satisfaction (RFS) 
Table 3.31 : Estimates of fixed effects (all data). 
Items 
Estimate 
Std. 
Error 
df 
t 
Sig. 
Lower 
Bound 
Upper 
Bound 
Intercept 
4.887 
4.780 
50.48 
1.023 
0.311 
-4.711 14.485 
Weight  
-0.011 
0.018 
38.138 
-0.599 
0.553 
-0.048 
0.026 
Body height 
-0.158 
0.080 
37.755 
-1.966 
0.057 
-0.321 
0.005 
Waist girth 
0.000 
0.117 
37.972 
0 
1 
-0.237 
0.237 
Belly circumference 
-0.143 
0.082 
37.571 
-1.757 
0.087 
-0.309 
0.022 
Hip girth 
0.093 
0.096 
37.417 
0.963 
0.342 
-0.102 
0.288 
Thigh girth 
-0.009 
0.093 
38.201 
-0.093 
0.926 
-0.198 
0.180 
Waist height 
0.275 
0.104 
37.666 
2.632 
0.012 
0.063 
0.486 
RBS at waist area 
0.019 
0.072 
37.769 
0.267 
0.791 
-0.126 
0.165 
RBS at hips area 
0.108 
0.086 
39.131 
1.254 
0.217 
-0.066 
0.283 
RBS at lower body 
0.119 
0.080 
38.783 
1.485 
0.146 
-0.043 
0.281 
RBS at upper body 
-0.074 
0.089 
38.899 
-0.836 
0.408 
-0.255 
0.106 
RBS of stance 
0.010 
0.084 
40.154 
0.123 
0.902 
-0.159 
0.180 
B_warp 
0.095 
0.050 
154.15 
1.909 
0.058 
-0.003 
0.194 
B_weft 
-0.369 
0.101 
155.26 
-3.651 
0.000 
-0.569 
-0.169 
E_warp 
-0.008 
0.025 
164.07 
-0.313 
0.755 
-0.058 
0.042 
E_weft 
-0.018 
0.028 
149.74 
-0.633 
0.528 
-0.073 
0.038 
Friction coeff. (Face) 
-1.262 
1.873 
160.29 
-0.674 
0.502 
-4.960 
2.437 
VFS 
0.543 
0.073 
80.722 
7.417 
0.000 
0.397 
0.688 
  *Dependent variable: Real fit satisfaction (RFS) 
 
 


---

 
 
 
101 
According to Table 3.31, participants’ VFSs significantly predicted their RFSs, F(1, 
80.722) = 55.005, p<  .01, β = 0.543. Among the body measurements, only waist height  
was found significant to predict participants’ RFSs, F(1, 37.666) = 6.928, p<  .05, β = 
0.275.  
On the other hand, participants’ RBSs for specific areas were not significant to predict 
their RFSs. However, another MLM was established by using the overall RBS instead 
of specific areas (all other variables were kept the same). Overall RBS of each 
participant was calculated by taking their mean RBSs for specific areas. In that 
particular analysis, participants’ overall RBSs were found significant to predict their 
RFSs, F(1, 41.578)=5.710 p< .05 , β = .235). Finally, among other fabric properties, 
only Bweft significantly predicted the RFSs of participants, F(1,155.263)=13.328 p< 
.01, β = -.369, Other fabric properties were not significant.  
Participants’ RFSs were predicted by using the developed MLM. The prediction scores 
were automatically generated by the SPSS. SPSS uses the estimates of fixed effects 
(Table 3.31) to predict the dependent variable. The beta coefficients of each 
independent variable are the numbers below the estimates coloumn. SPSS predicted 
RFS scores for each case according to the β coefficients and intercept given in Table 
3.31. The scatter diagram of predicted RFSs and measured RFSs is shown in Figure  
3.8. This result shows a significant positive association between the predicted RFSs 
which were obtained from the developed MLM, and the measured RFSs which were 
obtained from the experiments. Finally, Pearsons’ correlation between participants 
predicted RFSs and actually measured RFSs were tested, and the results showed a high 
correlation between predicted and measured RFSs of participants (r= .775, N=180, p 
< .01).  


---

 
 
 
102 
 
Figure 3.8 : Pearson’s correlation between measured and predicted RFSs (all 
data, N=180). 
Validity of the developed model 
Cross-validation is a method to evaluate predictive models by partitioning the original 
sample into a training set to train the model, and a test set to evaluate it (Refaeilzadeh, 
Tang, & Lui, 2018) . To evaluate the developed predictive model of this study, data 
set was randomly partitioned 20/80 percent (20 percent to be used as the test data, and 
80 percent to be used for the training data). Eighty percent of the data which were 
randomly selected were used to train MLM. For training: VFS, body measurements 
(weight, height, waist height, belly circumference, waist girth, hip girth, thigh girth); 
real body satisfaction for specific areas ( upper body, lower body, area around hips, 
area around waist, stance); actual fabric properties (W, T, Bwarp, Bweft, E warp , Eweft, G, 
friction coefficient(back), friction coefficient(face) , surface roughness, DC) were used as 
fixed factors and participant code was used as a random factor to predict the RFSs of 
the participants. Finally, RFS was the dependent factor. The results of this analysis are 
given in Table 3.32. 
 
 
Measured RFS 
Predicted RFS 


---

 
 
 
103 
Table 3.32 : Estimates of fixed effects (training data: Eighty percent of the total 
data). 
Items 
Estimate 
Std. 
Error 
df 
t 
Sig. 
Lower 
Bound 
Upper 
Bound 
Intercept 
5.124 
5.059 
54.860 
1.013 
.316 
-5.014 15.263 
Weight  
-.014 
.019 
41.998 
-.713 
.480 
-.052 
.025 
Body height 
-.095 
.084 
40.246 
-1.122 
.269 
-.265 
.076 
Waist girth 
-.010 
.125 
42.489 
-.081 
.935 
-.261 
.241 
Belly circumference 
-.108 
.089 
44.063 
-1.221 
.229 
-.288 
.071 
Hip girth 
.030 
.101 
38.981 
.300 
.766 
-.174 
.235 
Thigh girth 
.056 
.103 
47.971 
.545 
.588 
-.152 
.264 
Waist height 
.192 
.108 
37.408 
1.781 
.083 
-.026 
.409 
RBS at waist area 
.105 
.076 
39.121 
1.382 
.175 
-.049 
.259 
RBS at hips area 
.028 
.092 
41.871 
.301 
.765 
-.157 
.212 
RBS at lower body 
.117 
.082 
37.561 
1.430 
.161 
-.049 
.283 
RBS at upper body 
-.010 
.093 
40.854 
-.102 
.920 
-.198 
.179 
RBS of stance 
-.012 
.093 
50.242 
-.124 
.902 
-.199 
.176 
B_warp 
.098 
.055 
123.788 
1.786 
.076 
-.011 
.207 
B_weft 
-.381 
.114 
131.055 
-3.343 
.001 
-.607 
-.156 
E_warp 
-.031 
.029 
137.366 
-1.087 
.279 
-.088 
.026 
E_weft 
-.022 
.031 
121.275 
-.713 
.477 
-.083 
.039 
Friction coeff. (Face) 
-2.076 
2.053 129.558 
-1.011 
.314 
-6.137 
1.985 
VFS 
.550 
.078 
88.720 
7.021 
.000 
.394 
.705 
 *Dependent variable: Real fit satisfaction (RFS) 
According to the Table 3.32,  a regression equation to predict participants’ RFSs were 
generated.  The general linear regression equation is given in Equation 3.1. According 
to this equation, dependent variable (Yi ) is the RFS,  β0 is the intercept (5.124), βi are 
the numbers under estimate column, and Xi , independent variables are the items under 
the first column (i.e. weight, RBS at hips area etc.).  
 "# = %& + %1 )#   + ℰ# 
(3.1) 
Yi: Dependent variable, β0: intercept, β1: Coefficient (estimate), Xi: Independent 
variable, Ei: random error term. 
Afterwards, this  regression equation was used to calculate predicted RFSs of  the test 
data (Twenty percent of the data that was partitioned at the beginning). The results 
showed that predicted and measured RFSs of the test data were highly correlated (r= 
.83, N=32, p<0.01) as given in Table 3.33 and illustrated in Figure 3.9. According to 
the Figure 3.9, this mixed linear model explains the 69 percent of the variability of the 
participants’ measured RFSs around its mean.  


---

 
 
 
104 
Table 3.33 : Pearson’s correlation between predicted RFSs and measured RFSs 
(test data). 
 
 
Measured 
RFS 
Predicted RFS 
Pearson Correlation 
.828 
 
Sig. (2-tailed) 
.000 
 
N 
32 
 
 
Figure 3.9 : Scatter diagram of measured and predicted RFSs (test data, N=32). 
Moreover, paired t-test between measured RFSs and predicted RFSs of the test data 
was conducted to see if there was any significant different between their mean values, 
and the results are given in Table 3.34.  According to the Table 3.34, there was no 
significant difference between measured RFSs and predicted RFSs of the test data (t(1, 
31)= -1.885, p=0.073). 
Table 3.34 : Paired t-test between measured RFSs and predicted RFSs of test 
data. 
Pair 
Mean 
Diff. 
Std. 
Dev. 
Std.Err 
Mean 
Lower 
Upper 
t 
df 
Sig. 
(2-
tailed) 
Measured RFSs-
Predicted VFSs 
-.278 
.847 
.150 
-.583 
.028 
-1.855 
31 
.073 
 
 


---

 
 
 
105 
 
 DISCUSSION AND CONCLUSION 
Discussion and conclusion part was organized according to the research objectives.  
 Objective One:  Exploring Factors’ Affecting Consumers’ Virtual Fit 
Satisfactions 
One of the objectives of this study was to explore factors’ affecting consumers’ virtual 
fit satisfactions. For this purpose, a circular skirt was selected and fit experiments were 
conducted with circular skirts made from various fabrics. The offered independent 
variables that may be correlated to consumers’ virtual fit satisfactions were consumers’ 
body measurements, virtual body satisfactions, 3D fabric  properties and consumers’ 
interaction with 3D fit technologies. According to the results in the Table 3.28, the 
highest correlations were found between VFSs and VBSs. Especially participants’ 
VBSs around hips was correlated fairly good to their VFSs ( r= .50, N=180, p< .01). 
This result could be interpreted as; while trying to understand virtual fit satisfaction of 
consumers, virtual body satisfaction should be considered. In this study, virtual body 
satisfaction for hips area standed out due to the garment type selected for the study. 
However, for other garment types, virtual body satisfactions for different body areas 
might be more significant.   
In this study, real and virtual body satisfactions were measured seperatly. Because in 
a virtual fit context, consumers are exposed to their virtual bodies. Since in this study, 
factors effecting the virtual fit satisfactions of the consumers were examined, virtual 
body satisfactions were offered as a factor instead of real body satisfactions. The 
discrepancy between measured real and virtual body satisfactions of participants 
confirms this suggestion.  According to the paired t-test analysis between RBSs and 
VBSs (Table 3.18), participants’ body satisfactions around hips area and waist area 
dropped significantly after seeing their own 3D body scan images ( t(1,42)= 1.926, p< 
.05 ) and t(1,42)= 4.174, p< .01, respectively). An interesting result was that 
participants’ RBSs were lowest for the hips area but after seeing their 3D scan images, 


---

 
 
 
106 
the lowest VBSs were recorded for the waist area (Table 3.17). These results can also 
be interpreted as participants’ body satisfactions for their waist area (waist and 
abdomen) dropped considerably after viewing their 3D body scans. A recent study 
about the body satisfaction change after exposure to 3D body scan found that subjects 
became negative about their heights, buttocks and hips whereas, they were neutral for 
their waist and stomach (Park, 2018). The findings of this dissertation also confirm 
that participants’ body satisfactions for hips area dropped after seeing their 3D scans, 
however in contrast with Park’s study, participants were not neutral for their waist and 
stomach (or abdomen). On the contrary, the most significant body satisfaction drop 
after exposure to 3D scan image was observed for waist area. 
On the other hand,  VFSs of participants were weakly correlated to their body 
measurements (Table 3.27). The body measurements considered in this study was 
weight, height, waist height, belly circumference, waist girth, hips girths and thigh 
girth due to the selected garment type. The highest correlation was observed between 
participants’ belly circumference and VFSs (r= .34,  N=180, p< .01). It should be noted 
that participants also had a low virtual body satisfaction for their abdomen area (Table 
3.15). This may be interpreted as participants were more vulnarable for their abdomen 
appearance, and for a virtual try-on case they often evaluate the fit according to this 
area.  
Moreover, correlation between participants’ VFSs and their interaction with 3D fit 
technologies  and 3D fabric properties were also observed (Table 3.26). However, 
according to the results, only a little correlation between consumers interaction with 
3D fit technologies and their virtual fit satisfactions were recorded. The results show 
that if participants have positive interaction with 3D body scanning process and virtual 
try-on technology they tend to be satisfied with the virtual fit satisfaction of the 
garments as well. However, it should be noted that the correlations were weak (r= .26 
and r= .24, N=180 respectively)  and further studies are needed to confirm this finding.  
Finally, no significant correlation was found between the 3D fabric properties and 
participants’ VFSs (Table 3.25). 3D fabric properties (elongation, bending, shear, 
friction, thickness, weight)  of seven different fabrics were considered for this study, 
however for none of these properties a significant correlation was found. This may be 
due to two reasons: It may be either due to the fabrics selected for this study or due to 


---

 
 
 
107 
the simulation software. In an ideal case, it is expected that participants’ virtual fit 
satisfactions vary according to the changing 3D fabric properties.  
It should be also recalled that simulation software didn’t allow to insert any fabric 
thickness values lower than 0.05 cm, and any thickness value lower than 0.05 cm was 
automatically changed to 0.05 cm by the program. Therefore, even if some fabrics had 
different thickness values than each other, their 3D fabric properties were same and 
were 0.05 cm. Moreover, it was also ambigious how the extension values were 
converted in the Fabric Editor of the software.  
 Objective Two:  Comparing Consumers’ Virtual and Real Fit Satisfactions 
According to the RFS results (Table 3.21), participants were generally less satisfied 
with the skirt fit at abdomen and hips areas when compared to the fit at waist and hem 
areas. Similarly, participants’ VFSs  at abdomen and hips areas were lower than their 
VFSs at waist and hem areas. Even though, participants’ fit satisfactions were different 
for actual and virtual skirts, simulations were good to show poorly fitting areas which 
are in this case, the hips and abdomen areas.  
Moreover, a Pearson’s correlation test was conducted to  detect the association 
between participants’ real fit and virtual fit satisfactions regardless of their fabric 
differences. According to the results (Figure 3.6), a strong correlation between overall 
RFSs and overall VFSs were found ( r= .63, N=180,  p< 0.01). This is an indicator to 
confirm that participants’ VFS is a good predictor to estimate their RFSs. In addition 
to overall fit satisfactions, the correlations between participants’ real and virtual fit 
satisfactions for specific body areas (waist, abdomen, hips and hem) were also 
explored. According to the results, correlations between participants’ RFSs and VFSs 
at  hips (r= .60, N=180, p< 0.01) and hem level (r= .65, N=180, p< 0.01) were stronger 
when compared to their correlations at waist (r= .48, N=180, p< 0.01) and abdomen 
areas (r= .42, N=180, p< 0.01).  
It should be noted that Pearson’s correlation analysis tells about the relationships 
between the variables and how strong these relationships are. However, it doesn’t tell 
if there is a statistical difference between groups. Therefore, paired t-tests between real 
and virtual fit satisfactions were established to determine if these two groups were 


---

 
 
 
108 
significantly different (Field, 2013). According to the results (Table 3.21), 
participants’ overall VFSs were significantly lower than their overall RFSs  (t(179)= 
2.690, d= -.206, p=0.004).  On the other hand, paired t-tests, between participants’ 
RFSs and VFSs at different areas of the skirts (Table 3.22) showed that there were no 
significant differences between participants’ RFSs and VFSs for waist and abdomen 
areas, whereas there were significant differences between participants’ RFSs and VFSs 
for hips and hem areas. Ultimately, even though participants overall VFSs and RFSs 
were correlated as well as their specific fit satisfactions for certain areas, there were 
significant differences among them.  
 Objective Three:  Understanding How Different Fabrics, Affect Consumers’ 
Garment Fit Satisfactions in Real and Virtual Environment 
Seven skirts with same measurements, same silhouette and color were used as fit 
samples. The only difference between the skirts were their fabrics. One-way ANOVA 
results showed that participants’ fit satisfactions for actual skirts varied considerably 
due to their alternating fabrics, F(6,173) = 3.515, p = .003) and there were no 
significant difference between the fit satisfactions for virtual skirts , (F(6,173) = .333, 
p = 0.92). For instance, as illustrated in Figure 3.5, participants’ overall RFSs for Skirt 
2 and Skirt 8 was M=5.33 and M=3.94 on a 7-point scale. On the other hand, VFSs 
varied only slightly (VFSs of Skirt 2 and Skirt 8 was M=4.44  and M=4.74, 
respectively). This can be interpreted as participants were not very sensitive to 
simulation alterations as much as they were sensitive to their actual counterparts.  
Since the skirts were exactly same except their fabrics, the variation of the correlations 
could be interpreted to be related to their fabric differences. This may lead to an 
interpretation that simulation software may be more successful to reflect some fabrics’ 
simulations rather than others. According to the Pearson’s correlation tests (Table 
3.23), participants’ RFSs and VFSs  were correlated at different respects for each skirt.  
The highest correlation between participants’ overall RFSs and VFSs was recorded for 
Skirt 22 (r= .84, N= 23, p< 0.01), and the lowest correlation was recorded for Skirt 2 
(r= .42, N=23, p<0.05). Moreover, paired t-tests between overall RFSs and VFSs with 
respect to the fabric differences (Table 3.24) showed that participants’ overall RFSs 
and VFSs were  significantly different only for some of the skirts’ (Skirt 2, Skirt 22, 


---

 
 
 
109 
Skirt 21 and Skirt 15). For the rest of the skirts (Skirt 1, 6 and 8), no significant 
differences were observed. This result can be interpreted as virtual try-on was more 
successful for some of the skirts than the others. Since the only difference between the 
skirts is their fabrics, another way to put it out is to say that virtual try-on was more 
successful to simulate some of the fabrics when compared to some others. To 
understand the reason of this distinction, fabric properties were inspected carefully. 
According to the MLM analysis (Table 3.30 and Table 3.31)  , among other fabric 
properties, only bending rigidity in weft direction was significantly correlated to 
participants’ RFSs. As given in fabric properties table (Table 3.1); Fabric 2, 22, and 
21 have the lowest bending rigidities in weft directions (0.58, 0.94 and 2.92 microNm, 
respectively) where Fabric 15 has the highest bending rigidity (7.59 microNm). 
According to these results, it may be possible to say that simulations were successful 
for the fabrics that have moderate bending rigidities (between 3 and 7 microNm)  in 
their weft directions, and less successful for the fabrics with extreme bending rigidities 
(smaller than 3 microNm and bigger than 7 microNm).   
Fabrics’ bending rigidities are highly correlated with their drape properties (Frydrych 
et al., 2000), Fabrics with lower bending rigidities often drape better on 3D surfaces 
since they are keen to fold, bend and drape more than  stiff fabrics (Kenkare & May-
Plumlee, 2005). Skirt 2, 22 and 21 were more drapery than other skirts, and Skirt 15 
was the least drapery.  This conclusion was drawn from fabrics’ bending rigidities 
(Table 3.1) and skirts’ visual drape behaviors (Table 3.5). Since significant differences 
between participants’ RFSs and VFSs for Skirt 2, 22, 21 and 15 were detected, it may 
be possible to say that 3D garment simulation is more successful in terms of garment 
fit evaluation for fabrics with moderate draping behaviors, and less successful for 
highly or poorly draping fabrics.  
Finally, paired t-test analysis between participants’ RFSs and VFSs with respect to 
fabric differences and fit areas (Table 3.24) pointed that participants’ fit satisfactions 
for waist area didn’t show any significant different for the virtual and real skirts and 
showed significant difference only for some of the skirts at abdomen area. This result 
may be interpreted as regardless of the fabric type, simulation software is good to give 
reliable information about the fit at the waist area. However, participants’ RFSs and 
VFSs for hips and hem area were significantly different for all of the skirts.  


---

 
 
 
110 
 Objective Four:  Predicting Consumers’ Real Garment Fit Satisfactions by 
Employing a Statistical Model 
Predicting real fit satisfactions of subjects was the ultimate goal of this study. The 
factors that affect real fit satisfactions of consumers (LaBat & DeLong, 1990) were 
utilized to predict their real fit satisfaction. However, virtual fit satisfactions of subjects 
were also added to the research model (Figure 2.3). Consequently, real fit satisfactions 
of participants were tried to be predicted by using their body measurements, body 
satisfactions and virtual fit satisfactions in addition to  fabric properties. A multilevel 
linear model (MLM) was adopted for the research purpose. The MLM results (Table 
3.31) showed that virtual fit satisfaction was the strongest predictor of the real fit 
satisfaction (F(1, 80.722) = 55.005, p<  .01, β= 0.543). In addition to VFS, bending 
rigidity in weft direction was also found to be significant to predict RFS. This result 
matches to earlier literature that seeks to understand the relationship between fabrics’ 
mechanical properties and garments’ fit  (Postle et al., 1983). Bending rigidity is a 
substantial property for fabrics and it affects garments’ drape properties (Postle, 1999). 
Drape is essential especially for the skirt type that is used in this study,. Circular skirts 
are often made from drapery fabrics to ensure a smooth flow and eye-pleasing softer 
folds. Alike, in this study it is possible to see that skirts made from drapery fabrics had 
received higher garment fit satisfactions than the less drapery skirts (Table 3.21). On 
the other hand, drape coefficients of fabrics might be expected to be a variable to 
predict participants’ RFSs as well. However, in this study, it is not the case. The 
fabrics’ drape properties cannot be only explained by drape coefficients, because 
fabrics with very different drape properties may have same drape coefficient (Kenkare 
& May-Plumlee, 2005). Therefore, bending rigidity is  often a more reliable parameter 
to predict drape properties of a fabric rather than its drape coefficient (Frydrych et al., 
2000). This assumption was confirmed in this study. 
Furthermore, among seven different body measurements, only waist height was found 
significant to predict participants’ RFSs . The results show that there is a positive 
correlation between waist height and RFS (Table 3.31).  When waist height is higher 
the  RFS is higher. This might be due to the length of the skirt. The skirt is relatively 
a short skirt type. For the participants with lower waist line, skirt may feel a bit longer 


---

 
 
 
111 
than it actually should be. Therefore, they may think the skirt is too long for them and 
they may conclude that the style doesn’t fit them well.  
On the other hand, waist and body height of participants were not significantly 
correlated with their VFSs (Table 3.27), whereas, for RFS waist height was significant 
(Table 3.30). This might be interpreted as the  focal point has changed when  
participants were evaluating the real and virtual skirts. In other word, participants were 
maybe less  concerned with the length of the skirts while assessing the garment fit in 
virtual context, and when they actually wore the skirts their emphasis shifted to the 
length of the skirt. This is actually compatible with the studies investigating garment 
fit from consumers’ perspective. For instance, Shin and Damhorst study (2018) 
confirms that consumers essentially pay attention to the  tightness/looseness or length 
of the garments while assessing its actual fit (Shin & Damhorst, 2018).  
Finally, RFSs of participants were predicted by the developed multilevel linear model. 
Participants’ measured and predicted real fit satisfactions were analyzed by Pearson’s 
correlation test at the first place. Pearsons’ correlation test showed that  the correlation 
between participants predicted RFSs and measured RFSs were significantly high (r= 
.775, N=180, p < .01, R2 = 0.600). This result shows that a multilevel linear model was 
a useful statistical tool to predict RFSs of subjects when VFSs, body measurements, 
body satisfactions and fabric properties are used as predictors.  
To test the validity and reliability of this developed prediction model, a cross-
validation test was conducted. Experiment data (N=180) was partitioned as test and 
training data (N=32: test data, N=148: training data). An MLM with same predictors 
(body measurements, body satisfactions, fabric properties and virtual fit satisfactions) 
was applied to training data. Eventually, the β coefficients generated by MLM for each 
predictor was used to develop a regression equation to predict real fit satisfactions of 
participants. This equation was used to generate predictions of real fit satisfactions of 
test data. To do that, predictor values of test data were plugged in to the equation and 
real fit satisfaction predictions were calculated. Finally, a Pearson’s correlation test 
was conducted between the measured and predicted fit satisfactions of participant 
(Table 3.33). The correlation was significant, and it was remarkably high (r= .83, 
N=32, p< .01). However, even if the correlations are high, mean values of two groups 
might be significantly different. Therefore, a paired t-test between predicted and 


---

 
 
 
112 
measured real fit satisfaction values for the test data was observed (Table 3.34). 
According to the paired t-test results there were no significant difference between these 
two groups (t(1, 31)= -1.885, p=0.073). This result confirms that a statistical model 
was successfully developed to predict real fit satisfactions of consumers by using their 
virtual fit satisfactions as well as consumers’ body measurements, body satisfactions 
and fabric properties of the product.  
 Conclusion 
This doctoral study focused on women’s real and virtual garment fit satisfactions. 
Consumers’ real fit satisfaction (RFS) and factors effecting it have been explored in 
literature, however, virtual garment fit satisfaction (VFS) is relatively a new notion. 
With the recent developments in 3D body scanning technologies; using virtual try-on 
for online apparel shopping is no more a dream. When this scenario actualizes, 
consumers’ purchase decisions would depend on their VFSs. Therefore, to understand 
the factors affecting consumers’ VFS are as critical as their actual satisfaction. In this 
study, consumers’ virtual body satisfactions (VBSs), body measurements, interaction 
with 3D fit technologies (3D body scanning and virtual try-on), were measured and 
their correlation to consumers’ VFSs were calculated. In addition to these consumer 
dependent factors, fabric dependent factors (3D fabric properties) and their correlation 
to consumers’ VFSs have been investigated. According to the results, consumers’ 
VBSs are correlated to their VFSs. For this dissertation a circular skirt sample was 
studied, hence the highest correlation between VBSs and VFSs was found for the VBS 
around hips area and the lowest correlation was found for the VBS of upper body. 
Aside VBS, body measurements of consumers were also correlated with their VFSs. 
Only waist height and overall height were not found significantly correlated. On the 
other hand, consumers’ interaction with 3D body scanning and their acceptance of 
virtual try-on technology were weakly correlated with their VFSs. 
In this study, participants’ real and virtual fit satisfactions for seven different fabrics 
were examined. Real fabric properties were measured, and their units were converted 
by a “Fabric Converter” to plug into the simulation software. The simulations were 
generated according to these 3D fabric properties. According to the study results, none 
of the 3D fabric properties inserted to the software were correlated to participants’ 


---

 
 
 
113 
VFSs. This could be interpreted as the 3D garment simulation was not sufficient 
enough to reflect fabric properties yet. Moreover, this study showed that unit 
conversion of 3D fabric simulation software is ambiguous and needs to be improved 
and clarified. In addition to this, the software used in this study restricts fabric 
thickness value with a maximum of 0.05 cm. However, a considerable amount of fabric 
used in fashion are thinner than 0.05 cm. This thickness obstacle of the software may 
be the reason of the insufficient reflection of fabric properties to the simulations.  
The main purpose of this dissertation was to predict consumers’ RFSs. To achieve this 
goal, some predictor variables were determined (real body satisfaction, body 
measurements, virtual fit satisfaction and fabric properties). By using these predictor 
variables, a multilevel linear regression model was developed to predict RFSs of 
participants attending to the study experiments. Eighty percent of the collected data 
were used to train the model, and 20 percent were used to test the model. According 
to the results of the test data, predicted RFSs were strongly correlated to actually 
measured RFSs, and according to paired t-test results there were no significant 
difference between these two groups.  
This study showed that it is possible to predict consumers’ garment fit satisfactions by 
using suitable variables. For skirts, lower body related measurements and body 
satisfactions are prominent for the fit satisfactions and it was confirmed by this study. 
As anticipated, for other types of garments (i.e. blouses), essential parameters to 
predict fit satisfaction should be different than the parameters used in this study. 
However, this study showed that virtual garment fit satisfaction was the best variable 
to predict real fit satisfaction and it was followed by body satisfaction and body 
measurements at the related area.  
Implications 
This study is expected to have a potential industrial implication. When inexpensive 
and easy-use 3D body scanners spread, consumers will be able to 3D scan themselves 
at their home at no or minimum cost. Then, according to anticipations, they will be 
able to log in to the web site of an apparel company, upload their 3D body to the server 
of the company, select a garment from the virtual racks and virtually try it on.  
According to the results of this study, consumer’s virtual fit satisfaction will depend 
on some of her body measurements, virtual body satisfaction, interaction with 3D fit 


---

 
 
 
114 
technologies, silhouette likeness and online shopping behaviors. If the company has a 
data pool with specific information about its customers, then by using the suggested 
factors, it would be easier to offer the correct product to the costumer. Moreover, as 
long as costumer evaluates her VFS of the product and shares it with the apparel 
company online, her approximate RFS may be predicted by the apparel company. This 
would help the costumer whether to purchase the product, and ultimately help the 
apparel company to reduce return costs.  
Research limitations 
It should be also noted that this study had some restrictions. In this study, a particular 
skirt was selected to be used during experiments. However, fashion industry offers a 
variety of product types and hundreds of style variations. Thus, for different product 
types and altering styles, the variables offered in this dissertation should be altered and 
used. For instance, the body measurements considered in this study were waist and 
body height, waist girth, hip girth and thigh girth, belly circumference and weight due 
to the product type studied. However, the body measurements that are significant for 
a blouse fit will be probably different. Similarly, virtual body satisfaction around hips 
had the highest correlation with virtual fit satisfaction in the skirt case.  Whereas, for 
a blouse case, upper body satisfaction is anticipated have the highest correlation. 
Therefore, for further studies, it is suggested that various product types and variety of 
styles are explored in terms of virtual and real garment fit satisfaction.  
 
 
 
 
 
 
 
 
 
 
 


---

 
 
 
115 
 
REFERENCES 
3D BodyScan Lab. (2018). About the Body Scanner. Retrieved September 6, 2018, 
from http://www.bodyscan.human.cornell.edu/scene60df.html 
A. De Boos, & Tester, D. (1994). SiroFAST Fabric Assurance by Simple Testing. 
Retrieved from www.tft.csiro.au 
Alexander, M., Connell, L. J., & Presley, A. B. (2005). Clothing fit preferences of 
young female adult consumers. International Journal of Clothing 
Science and Technology, 17, 52–64.  
Alexandrea, P. (2018). Top 10 Best Low Cost 3D Scanners ( 2018 Update ). Retrieved 
August 4, 2018, from https://www.3dnatives.com/en/top-10-low-cost-
3d-scanners280320174/ 
Amazon.com. (2017). Amazon Best Sellers. 
Ancutiene, K., & Sinkevičiute, D. (2011). The influence of textile materials 
mechanical properties upon virtual garment fit. Materials Science, 
17(2), 160–167.  
Ancutiene, K., Strazdiene, E., & Lekeckas, K. (2014). Quality evaluation of the 
appearance of virtual close-fitting woven garments. Journal of the 
Textile Institute, 105(3), 337–347.  
Anderson, L. J., Brannon, E. L., Ulrich, P. V., Presley, A. B., Woronka, D., 
Grasso, M., & Stevenson, D. (1999). Understanding Fitting 
Preferences of Female Consumers: Development an Expert System to 
Enhance Accurate Sizing Selection. National Textile Center Annual 
Report. 
Apeagyei, P. R. (2008). Significance of body image among UK female fashion 
consumers: The cult of size zero, the skinny trend. International 
Journal of Fashion Design, Technology and Education, 1(1), 3–11.  
Apeagyei, P. R., & Otieno, R. (2007). Usability of pattern customising technology in 
the achievement and testing of fit for mass customisation. Journal of 
Fashion Marketing and Management, 11(3), 349–365.  
Armstrong, H. (2010). Pattern Making for Fashion Design (5th ed.). Pearson. 
Ashdown, S. (2007). Sizing in Clothing : Developing Effective Sizing Systems for 
Ready-to-wear Clothing. (S. Ashdown, Ed.). Cambridge, UNITED 
KINGDOM: 
Woodhead 
Publishing. 
Retrieved 
from 
http://ebookcentral.proquest.com/lib/cornell/detail.action?docID=1639
579 
Ashdown, S., & Loker, S. (2010). Mass-customized target market sizing: Extending 
the sizing paradigm for improved apparel fit. Fashion Practice, 2(2), 


---

 
 
 
116 
147–173.  
Ashdown, S. P., Loker, S., Schoenfelder, K., & Lyman-clarke, L. (2004). Using 3D 
Scans for fit analysis. Journal of Textile and Apparel, Technology and 
Management, 4(1), 1–12. 
ASTM. (2008). D1894-08 Standard test method for static and kinetic coefficients of 
friction of plastic film and sheeting. Astm, i, 1–6.  
ASTM International. (2011). ASTM D5585-11e1, Standard Tables of Body 
Measurements for Adult Female Misses Figure Type, Size Range 00–
20. Pennsylvania. 
ASTM International. (2014). ASTM D1388-14e1, Standard Test Method for Stiffness 
of Fabrics. West Conshohocken. Retrieved from www.astm.org 
AutoDesk®. 
(2018). 
Autodesk 
Knowledge 
Network. 
Retrieved 
from 
https://knowledge.autodesk.com/ 
Baek, S. Y., & Lee, K. (2012). Parametric human body shape modeling framework 
for human-centered product design. CAD Computer Aided Design, 
44(1), 56–67.  
Bassett, R. J. J., & Postle, R. (1990). Fabric mechanical and physical properties. 
International Journal of Clothing Science and Technology, 2(2), 22–
31.  
Behery, H. M. (2005). Introduction. In H. M. B. T. Behery (Ed.), Effect of Mechanical 
and Physical Properties on Fabric Hand (pp. 1–7). Woodhead 
Publishing.  
Bell, K. (2016). Social Media and Female Body Image. Bridgewater State University. 
Retrieved 
from 
http://vc.bridgew.edu/honors_proj%0Ahttp://vc.bridgew.edu/honors_p
roj/173 
Blender. (2018). Free Software Never Looked This Awesome. Retrieved August 7, 
2018, from https://www.blender.org/features/simulation/#cloth 
Bohnhoff, T. (2016). E-commerce: Fashion. Statista Digital Outlook. Retrieved from 
https://www.statista.com/outlook/244/122/fashion/malaysia# 
Bona, M. (1994). Textile Quality - Physical Methods of Product and Process Control. 
Italy: Texilia. 
Bottino, A., Laurentini, A., & Scalabrin, S. (2001). Quantitatively comparing virtual 
and real draping of clothes. In University of West Bohemia (Ed.), 
Proceedings of 9th Int. Conf. on Computer Graphic, Visualization and 
Computer Vision WSCG’2001. Plzen: University of West Bohemia. 
Retrieved from https://otik.uk.zcu.cz/handle/11025/11252 
Bougourd, J. (2007). Sizing systems, fit models and target markets. In S. P. Ashdown 
(Ed.), Sizing in Clothing (p. 133). Woodhead Publishing. 
Bozsik, F., & Bennett, B. L. (2018). The ideal female body type is getting even harder 
to 
attain. 
Retrieved 
May 
29, 
2018, 
from 
https://theconversation.com/the-ideal-female-body-type-is-getting-


---

 
 
 
117 
even-harder-to-attain-91373 
Brand, R. H. (1964). Measurement of fabric aesthetics: Analysis of aesthetic 
components. Textile Research Journal, 34, 791–804. 
Breen, D. E., House, D. H., & Wozny, M. J. (1994). Predicting the drape of woven 
cloth using interacting particles. Proceedings of the 21st Annual 
Conference on Computer Graphics and Interactive Techniques - 
SIGGRAPH ’94, 365–372. 
Briggs, B. (2013). Web-only retailers turn in the lowest return rate. Retrieved 
December 
14, 
2017, 
from 
https://www.digitalcommerce360.com/2013/05/09/web-only-retailers-
turn-lowest-return-rate/ 
British Standard Institute. (1974). BS 5058:1973. B.S.I. Retrieved from 
http://shop.bsigroup.com/ProductDetail/?pid=000000000000087095 
British Standart Institution. (1990). BS3356 (1990), Method for determination of 
bending length and flexural rigidity of fabrics. 
Brook, E. (2015). 8 Startups Trying To Help You Find Clothing That Fits - 
Fashionista. Retrieved from http://fashionista.com/2014/07/8-tech-
startups-tackling-clothing-fit 
Browzwear. (2018). Fabric Analyzer by Browzwear ( FAB ). Retrieved August 7, 
2018, from https://browzwear.com/products/fabric-analyzer/ 
Business Insider Nordic. (2018). We finally know how H&M’s online business is 
doing - here are the numbers. Retrieved June 15, 2018, from 
https://nordic.businessinsider.com/we-finally-know-how-hms-online-
business-is-doing---here-are-the-numbers--/ 
Buyukaslan, E., Baytar, F., & Kalaoglu, F. (2018). Creating garment simulations : 
Effectiveness of traditional textile testing equipment versus KES and 
FAST Systems. In 2018 ITAA Annual Conference Proceedings : 
Posters (Vol. 25). Clevland: Iowa State University. 
Buyukaslan, E., Jevsnik, S., & Kalaoglu, F. (2015). Virtual fitting of a skirt on a 
parametric and a scanned body model. Marmara University Journal of 
Science, 27(3), 23–26.  
Buyukaslan, E., Jevsnik, S., & Kalaoglu, F. (2018). Comparative analysis of drape 
characteristics of actually and virtually draped fabrics. International 
Journal of Clothing Science and Technology, 30(3), 286–301.  
Buyukaslan, E., Kalaoglu, F., & Jevsnik, S. (2017). Drape simulation and subjective 
assessment of virtual drape. IOP Conference Series: Materials Science 
and Engineering, 254(16).  
Bye, E., & Labat, K. (2005). An analysis of apparel industry fit sessions. Journal of 
Textile and Apparel, Technology and Management, 4(3), 1–5. 
Bye, E., & McKinney, E. (2010). Fit analysis using live and 3D scan models. 
International Journal of Clothing Science and Technology, 22(2/3), 88–
100.  


---

 
 
 
118 
Cassidy, T. (2002). An investigation of the mechanical and surface properties of weft 
knitted fabrics and their influence on sewability during garment 
assembly. Montfort University. 
Chambers, H. G., & Moulton, V. (1961). Clothing selection : fashions, figures, 
fabrics. Chicago: Lippincott. 
Chan, C. K., Jiang, X. Y., Liew, K. L., Chan, L. K., Wong, W. K., & Lau, M. P. 
(2006). Evaluation of mechanical properties of uniform fabrics in 
garment manufacturing. Journal of Materials Processing Technology, 
174(1–3), 183–189. 
Chu, C. C., Cummings, C. L., & Teixeira, N. A. (1950). Mechanics of elastic 
performance of textile materials: Part V: A study of the factors affecting 
the drape of fabrics-The development of a drape meter. Textile 
Research Journal, 20(8), 539–548.  
Chun, J. (2007). Communication of sizing and fit. In S. Ashdown (Ed.), Sizing in 
Clothing (pp. 221–232). Manchester: Woodhead Publishing. 
Clot3D. (2018). What makes Clo Different. Retrieved October 25, 2018, from 
https://www.clo3d.com/explore/whyclo 
Conant, J. S., Brown, J. J., & Mokwa, M. P. (1985). Students are important 
consumers: Assessing satisfaction in a higher education context. 
Journal of Marketing Education, 7(2), 13–20.  
Cordier, F., Seo, H., & Magnenat-Thalmann, N. (2003). Made to measure 
technologies for an online clothing store. IEEE Computer Graphics and 
Applications, 23(1), 38–48.  
Crossley, K. L., Cornelissen, P. L., & Tovée, M. J. (2012). What Is an Attractive 
Body? Using an Interactive 3D Program to Create the Ideal Body for 
You and Your Partner. PLoS ONE, 7(11).  
CSIRO. (1990). CSIRO Fabric Assurance by Simple Testing (FAST) Manuel. 
Australia. 
Cusick, G. E. (1965). The dependence of fabric drape on bending and shear stiffness. 
Journal of the Textile Institute Transactions, 56(11), 596–606.  
Cusick, G. E. (1968). The measurement of fabric drape. Journal of the Textile 
Institute, 59(6), 253–260.  
D.Terzopoulos, J.Platt, Barr, A., & Fleischer, K. (1987). Elastically deformable 
models. In Proceedings of the 14th annual conference on Computer 
graphics and interactive techniques (pp. 2015–2214).  
D’Apuzzo, N. (2007). 3D body scanning technology for fashion and apparel industry, 
6491, 64910O.  
Daanen, H. A. M., & Reffektrath, P. A. (2007). Function, fit and sizing. In S. 
Ashdown (Ed.), Sizing in Clothing (1st edition, pp. 1–18). Woodhead 
Publishing. 
Daanen, H. A. M., & Ter Haar, F. B. (2013). 3D whole body scanners revisited. 
Displays, 34(4), 270–275. 


---

 
 
 
119 
Dong, G., Clapworthy, J., Krokos, M. A., & Yao, J. (2002). An anatomy-based 
approach to human muscle modeling and deformation. IEEE 
Transactions on Visualization and Computer Graphics, 8(2), 154–170. 
Dunn, C. (2015). How Sizing Technology Can Bring Online Apparel Returns Down 
to 
Zero. 
Retrieved 
May 
17, 
2018, 
from 
https://www.mytotalretail.com/article/sizing-technology-can-bring-
online-apparel-returns-zero/all/ 
Ellinwood, J. G. (2011). Ellinwood, J. G. (2011). Fashion by design. New York, NY: 
Fairchild Books. New York: NY: Fairchild Books. 
Engel, J. F., Blackwell, R., & Miniard, P. (1990). Consumer behavior. (J. F. Engel, 
Ed.). Chicago Dryden Press. 
Fan, J., Yu, W., Hunter, L., & Yu, W. (2004). 3 – Subjective assessment of clothing 
fit. In Clothing Appearance and Fit (pp. 31–42).  
Festinger, L. (1954). A theory of social comparison processes. Human Relations, 7(2), 
117–140.  
Field, A. (2013). Discovering Statistics Using IBM SPSS Statistics (4th ed.). Sage 
Publications Ltd. 
Fit Analytics GmbH. (2018). Solve sizing sell smarter. Retrieved July 5, 2018, from 
https://www.fitanalytics.com/fit-finder 
Francis, K. S., & Dickey, L. (1984). Dimensions of satisfaction with purchases of 
women’s dresses: Before and after garment care. Journal of Consumer 
Studies & Home Economics, 8(2), 153–168.  
Frost, K. (1988). Consumer’s perception of fit and comfort of pants. University of 
Minnesota. 
Frydrych, I., Dziworska, G., & Cieslinska,  a. (2000). Mechanical fabric properties 
influencing the drape and handle. International Journal of Clothing 
Science and Technology, 12(3), 171–183.  
Garcia, K. (2018). Retail E-Commerce Sales Worldwide, 2016-2021. 
Garner, M. D. (1997). The 1997 body-image survey results. Psychology Today, 30, 
30–47. 
Gensler, L. (2017). The World’s Largest Retailers 2017: Amazon & Alibaba Are 
Closing In On Wal-Mart. Retrieved June 14, 2018, from 
https://www.forbes.com/sites/laurengensler/2017/05/24/the-worlds-
largest-retailers-2017-walmart-cvs-amazon/#715205c620b5 
Geršak, J. (2002). Development of the system for qualitative prediction of garments 
appearance quality. International Journal of Clothing Science and 
Technology, 14(3/4), 169–180.  
Gill, S. (2015). A review of research and innovation in garment sizing, prototyping 
and fitting. Textile Progress, 47(1), 1–85.  
Gluck, M., & Geliebter, A. (2002). Racial/ethnic differences in body image and 
eating behaviors. Eating Behavior, 3(2), 143–151. 


---

 
 
 
120 
Gordon, L., Lastovich, T., Bye, E., & Labat, K. (2014). A Protocol for the 
Evaluation of Coverall Fit. In International Textile and Apparel 
Association (ITAA) (pp. 1–3). 
Grabe, S., Ward, L. M., & Hyde, J. (2008). The role of the media in body image 
concerns among women: A meta-analysis of experimental and 
correlational studies. Psychological Bulletin, 134, 460–476.  
Gu, B., Xu, B., Su, J., & Liu, G. (2015). Determination of distance ease of pants using 
3D scanning data. International Journal of Clothing Science and 
Technology, 27(1), 47–59.  
Hardaker, C. H. M., & Fozzard, G. J. W. (1998). Towards the virtual garment: 
three- dimensional computer environments for garment design. 
International Journal of Clothing Science and Technology, 10(2), 114–
127.  
Hawkins, N., Richards, P., Granley, H., & Stein, D. M. (2004). The impact of 
exposure to the thin-ideal media image on women. Eating Disorders, 
12, 35–50.  
Hazen, G. G. (1998). Fantastic Fit For Everybody. Rodale Press. 
Hong, Y., Bruniaux, P., Zeng, X., Curteza, A., & Liu, K. (2018). Design and 
evaluation of personalized garment block for atypical morphology 
using the knowledge-supported virtual simulation method. Textile 
Research Journal, 88(15), 1721–1734.  
House, D., & Breen, D. (2000). Cloth modeling and animation. (D. House & D. 
Breen, Eds.). Chapman and Hall/CRC. 
Howarton, R., & Lee, B. (2010). Market analysis of fit preferences of female 
boomers. Journal of Fashion Marketing and Management: An 
International Journal, 14(2), 219–229.  
Hu, J. (2004). Structure and mechanics of woven fabrics. Cambridge: Woodhead 
Publishing. 
Hu, J. (2011). Computer technology for textiles and apparel. Woodhead Pub. 
Huck, J., Maganga, O., & Kim, Y. (2006). Protective overalls : evaluation of garment 
design and fit. International Journal of Clothing Science and 
Technology, 9(1), 45–61. 
Human Solutions. (2018a). The fast one for the retail trade Ditus MC. Retrieved 
August 
6, 
2018, 
from 
https://www.human-
solutions.com/fashion/front_content.php?idcat=772&lang=7 
Human Solutions. (2018b). The innovative one – with reality plus VITUS bodyscan. 
Retrieved 
August 
6, 
2018, 
from 
https://www.human-
solutions.com/fashion/front_content.php?idcat=813&lang=7 
Human Solutions. (2018c). Vidya-Faster into Business. Retrieved August 7, 2018, 
from https://www.human-solutions.com/vidya 
Hwang, J. (1996). Relationships between body cathexis, clothing benefits sought, and 
clothing behavior; and effects of importance of meeting the ideal body 


---

 
 
 
121 
image and clothing attitude. Virginia Polytechnic Inst. and State 
University, Virginia. 
International Organization for Standardization. (1997). ISO 4287:1997 - 
Geometrical Product Specifications (GPS) -- Surface texture: Profile 
method -- Terms, definitions and surface texture parameters. Retrieved 
December 26, 2017, from https://www.iso.org/standard/10132.html 
Istook, C. L. (2011). Comparative Assessment of Virtual Garments using Direct and 
Manual Avatars. The Research Journal of the Costume Culture, 12, 
1359–1371. 
Jevšnik, S., Kalaoğlu, F., Eryuruk, S. H., & Stjepanovic, Z. (2015). Evaluation of 
a garment fit model using AHP. Fibres and Textiles in Eastern Europe, 
23(2), 116–122. 
Jevsnik, S., Pilar, T., Stjepanovic, Z., & Rudolf,  a. (2012). Virtual Prototyping of 
Garments and Their Fit to the Body. In Daaam International Scientific 
Book 2012 (pp. 601–618). Vienna:  DAAAM International.  
Jiang, Y., Cui, M., & Hu, J. (2012). Computer Generation of 3D Textile Draping 
Simulation. AASRI Procedia, 3, 661–666.  
Jiang, Y., Guo, R., Ma, F., & Shi, J. (2018). Cloth simulation for Chinese traditional 
costumes. Multimedia Tools and Applications, 1–26. 
Jin, H. (2016). The Development and Evaluation of the Tennis Shirt Pattern for a 
Wheelchair Tennis Player in a CAD Program Abstract. Oregon State 
University. 
Johnson, K., Lennon, S. J., & Rudd, N. (2014). Dress, body and self: research in the 
social psychology of dress. Fashion and Textiles, 1(1), 1–24.  
Jones, P. R. M., Li, P., Brooke-Wavell, K., & West, G. M. (1995). Format for human 
body modeling from 3-D body scanning. International Journal of 
Clothing Science and Technology, 7(1), 7–16. 
Joseph, A. (2016). Feminine Muscularity: Reshaping The Cultural Understanding of 
Beauty. 
Retrieved 
May 
27, 
2018, 
from 
https://www.huffingtonpost.com/alanah-joseph/feminine-muscularity-
resh_b_9397370.html 
Kadolph, S. J., Langford, A. L., Hollen, N., & Saddler, J. (1993). Textiles (Seventh 
Ed). New York: MacMillan Publishing. 
Kaiser, S. B. (1990). Social psychology of clothing. New York: MacMillan 
Publishing. 
Kawabata, S., & Niwa, M. (1991). Objective measurement of fabric mechanical 
property and quality: International Journal of Clothing Science and 
Technology, 3(1), 7–18.  
Kaynak, H. K. (2017). Optimization of stretch and recovery properties of woven 
stretch fabrics. Textile Research Journal, 87(5), 582–592.  
Keiser, S., & Garner, M. (2012). The role of product development in the apparel 
supply chain. In Beyond Design: The Synergy of Apparel Product 


---

 
 
 
122 
Development (3rd Editio, pp. 13–15). New York,: Fairchild 
Publications. 
Kenkare, N., & May-Plumlee, T. (2005). Evaluation of drape characteristics in 
fabrics. International Journal of Clothing Science and Technology, 
17(2), 109–123.  
Kenkare, N. S. (2005). Three dimensional modeling of garment drape. North Carolina 
State 
University. 
Retrieved 
from 
http://www.lib.ncsu.edu/resolver/1840.16/3548 
Kim, D.-E., & LaBat, K. (2013a). An exploratory study of users’ evaluations of the 
accuracy and fidelity of a three-dimensional garment simulation. Textile 
Research Journal, 83(2), 171–184.  
Kim, D.-E., & LaBat, K. (2013b). Consumer experience in using 3D virtual garment 
simulation technology. Journal of the Textile Institute, 104(8), 819–
829. 
Kim, H., & Damhorst, M. L. (2010). The relationship of body- related self-
discrepancy to body dissatisfaction, apparel involvement, concerns with 
fit and size of garments, and purchase intentions in online apparel 
shopping. Clothing & Textiles Research Journal, 28(4), 239–254.  
Kim, J. O., & Slaten, B. L. (1999). Objective evaluation of fabric hand: Part I: 
relationships of fabric hand by the extraction method and related 
physical and surface properties. Textile Research Journal, 69(1), 59–
67. 
Kim, M.-J. (2008). Consumer Perceptions of Apparel Products in Internet Shopping. 
Oregon State University. 
Kim, S., & Kyu Park, C. (2007). Basic garment pattern generation using geometric 
modeling method. International Journal of Clothing Science and 
Technology, 19(1), 7–17.  
Kinley, T. R. (2010). The effect of clothing size on self- esteem and body image. 
Family and Consumer Sciences Research Journal, 38(3), 317–332.  
Koester, A. W., & Bryant, N. O. (1991). Fashion Terms and Styles for Women’s 
Garments. Corvallis: Oregon State University. 
Kotler, P. (1989). From mass marketing to mass customization. Planning Review, 
17(5), 10–47.  
Kuijpers, A. (2017). Evaluation of Physical and Virtual Fabric Drape Created From 
Objective Fabric Properties. The University of Manchester.  
LaBat, K., & DeLong, M. R. (1990). Body cathexis and satisfaction with fit of 
apparel. Clothing and Textiles Research Journal, 8(2), 43–48.  
LaBat, K. L. (1987). Consumer satisfaction/dissatisfaction with the fit of ready-to-
wear clothing. University of Minnesota,. 
Labthink Company. (2017). PARAM MXD-02 Coefficient of Friction Tester. 
Retrieved 
December 
26, 
2017, 
from 
http://en.labthink.com/productdocumenten/MXD-02-Coefficient-of-


---

 
 
 
123 
Friction-Tester.pdf 
Lectra. (2014). Lectra Brings the 3D Revolution to the Fashion Industry. Retrieved 
August 
7, 
2018, 
from 
https://www.lectra.com/sites/lectra.com/files/document/lectra-white-
paper-3d-in-apparel-design-en.pdf 
Lee, E., & Park, H. (2017). 3D Virtual fit simulation technology: strengths and areas 
of improvement for increased industry adoption. International Journal 
of Fashion Design, Technology and Education, 10(1), 59–70.  
Lee, J., Nam, Y., Cui, M. H., Choi, K. M., & Choi, Y. L. (2007). Fit Evaluation of 
3D 
Virtual 
Garment. 
In 
N. 
Aykin 
(Ed.), 
Usability 
and 
Internationalization: HCI and Culture (pp. 550–558). NY: springer.  
Lee, Y., Hwang, C., & Baytar, F. (2018). Exploring apparel design and fit for older 
women: a technology intervention. International Journal of Fashion 
Design, Technology and Education, 0(0), 1–10.  
Leibowitz, H. W., & Post, R. B. (1982). Capabilities and limitations of the human 
being as a sensor. In J. T. Kuznicki, R. A. Johnson, & A. F. Rutkiewic 
(Eds.), Selected sensory methods: Problems and approaches to 
measuring hedonics. Philadelphia: ASTM STP 773 (American Society 
for Testing and Materials). 
Lesko, L. J. (1982). Bodice fit compared : conventional alterations with and without 
graphic somatometry. Iowa State University. Retrieved from 
https://lib.dr.iastate.edu/cgi/viewcontent.cgi?article=17807&context=r
td 
Lim, H., & Istook, C. L. (2011). Drape simulation of three-dimensional virtual 
garment enabling fabric properties. Fibers and Polymers, 12(8), 1077–
1082.  
Lim, H. S. (2009). Three Dimensional Virtual Try-on Technologies in the 
Achievement and Testing of Fit for Mass Customization. North Carolina 
State Uni. 
Lin, Y. L., & Wang, M. J. J. (2016). The development of a clothing fit evaluation 
system under virtual environment. Multimedia Tools and Applications, 
75(13), 7575–7587.  
Liu, K., Zeng, X., Bruniaux, P., Wang, J., Kamalha, E., & Tao, X. (2017). Fit 
evaluation of virtual garment try-on by learning from digital pressure 
data. Knowledge-Based Systems, 133, 174–182.  
Liu, Y.-J., Zhang, D.-L., Ming, M., & Yuen, -Fai. (2010). A survey on CAD 
methods in 3D garment design. Computers in Industry, 61, 576–593.  
Loker, S., Ashdown, S., & Carnrite, E. (2008). Dress in the third dimension: Online 
interactivity and its new horizons. Clothing and Textiles Research 
Journal, 26(2), 164–176.  
Loker, S., Ashdown, S., & Schoenfelder, K. (2005). Size-specific analysis of body 
scan data to improve apparel fit. Journal of Textile and Apparel, 
Technology 
and 
Management, 
4(3), 
1–15. 
Retrieved 
from 


---

 
 
 
124 
http://www.tx.ncsu.edu/jtatm/volume4issue3/articles/Loker/Loker_full
_136_05.pdf 
Loker, S., Cowie, L., Ashdown, S., & Lewis, V. D. (2004). Female consumers’ 
reactions to body scanning. Clothing and Textiles Research Journal, 
22(4), 151–160. 
Lu, J. M., Wang, M. J. J., Chen, C. W., & Wu, J. H. (2010). The development of 
an intelligent system for customized clothing making. Expert Systems 
with Applications, 37(1), 799–803.  
Lu, Y., Song, G., & Li, J. (2013). A novel approach for fi t analysis of thermal 
protective clothing using three-dimensional body scanning. In 4th 
International Conference on 3D Body Scanning Technologies (pp. 
1439–1446). Long Beach.  
Luible, C. (2008). Study of Mechanical Properties in the Simulation of 3D Garments. 
Universite 
de 
Geneve. 
https://doi.org/10.13097/archive-
ouverte/unige:688 
Luible, C., & Magnenat-Thalmann, N. (2007). Suitablity of standard fabric 
characterisation experiments for the use in virtual simulations. In 
Proceedings of the AUTEX conference 2007. Tampere. 
Magnenat-Thalmann, N. (2010). Modeling and Simulating Bodies and Garments. 
(N. Magnenat-Thalmann, Ed.). London: springer. 
Mahoney, E., & Finch, M. (1976). The dimensionality of body cathexis. The Journal 
of Psychology, 92, 277–279. 
Manuel, M. B., Connell, L. J., & Presley, A. B. (2010). Body shape and fit preference 
in body cathexis and clothing benefits sought for professional African-
American women. International Journal of Fashion Design, 
Technology and Education, 3(1), 25–32.  
Marvelous Designer. (2018). Bringing the efficiency of fashion design to computer 
graphics. 
Retrieved 
August 
7, 
2018, 
from 
https://www.marvelousdesigner.com 
McVey, D. (1984). Fit to be sold. Apparel Industry Magazine, 45(2), 24–26. 
Meadows, D. M., Johnson, W. O., & Allen, J. B. (1970). Generation of Surface 
Contours by Moiré Patterns. Appl. Opt., 9(4), 942–947.  
Mert, E., Psikuta, A., Arévalo, M., Charbonnier, C., Luible-Bär, C., Bueno, M. 
A., & Rossi, R. M. (2018). A validation methodology and application 
of 3D garment simulation software to determine the distribution of air 
layers in garments during walking. Journal of the International 
Measurement Confederation, 117(February 2017), 153–164.  
Metail. (2018). Try Metail. Retrieved July 6, 2018, from https://trymetail.com 
Miller, P. (2017). The iPhone X’s notch is basically a Kinect - The Verge. Retrieved 
August 
6, 
2018, 
from 
https://www.theverge.com/circuitbreaker/2017/9/17/16315510/iphone
-x-notch-kinect-apple-primesense-microsoft 


---

 
 
 
125 
Miller, R., & Washington, K. (2017). Consumer Use of the Internet and Mobile Web 
2016-2017 (4th Editio). Miramar: RKMA Market Research Handbook 
Series. 
Retrieved 
from 
http://www.rkma.com.ezproxy.library.wisc.edu/wisc/cuim16/ 
Moorthy, R. R., & Kandhavadivu, P. (2015). Surface friction characteristics of 
woven fabrics with nonconventional fibers and their blends. Journal of 
Textile and Apparel, Technology and Management, 9(3). 
Ng, R., Chan, C. K., Pong, T. Y., & Au, R. (1996). Objective measurement of the fit 
of an apparel. In 77th Textile Institute World Conference. Tampere. 
O’Brein, R., & Shelton, W. (1941). Women’s Measurements for Garment and 
Pattern Construction. U.S. Department of Agriculture. Miscellaneous. 
Optitex. (n.d.). 2D & 3D Software Solution Customers | Optitex. Retrieved April 3, 
2017, from https://optitex.com/customers/ 
Optitex. (2016). Using the Optitex Fabric Center to Test Your Fabrics. Retrieved 
January 
5, 
2018, 
from 
http://help.optitex.com/Using_the_Optitex_Fabric_Center_to_Test_Y
our_Fabrics.pdf 
Optitex. (2017). O/DEV - Design, visualize & perfect; in a single 2D/3D Environment 
| 
Optitex. 
Retrieved 
March 
31, 
2017, 
from 
http://optitex.com/solutions/odev/ 
Orendorff, A. (2018). The State of the Ecommerce Fashion Industry: Statistics, 
Trends & Strategy. 
Ozcelik, G., Supuren, G., Gulumser, T., & Tarakcioglu, I. (2008). A study on 
subjective and objective evaluation of the handle properties of shirt 
fabrics. Fibres and Textiles in Eastern Europe, 16(3), 56–62. 
Pandurangan, P., Eischen, J., Kenkare, N., & Lamar, T. a. M. (2008). Enhancing 
accuracy of drape simulation. Part II: Optimized drape simulation using 
industry-specific software. Journal of the Textile Institute, 99(3), 219–
226.  
Papahristou, E., & Bilalis, N. (2017). 3D virtual prototyping traces new avenues for 
fashion design and product development: A qualitative study. Journal 
of Textile Science & Engineering, 07(02). 
Park, J. (2018). The effect of virtual avatar experience on body image discrepancy, 
body satisfaction and weight regulation intention. Cyberpsychology, 
12(1). 
Park, J., Kim, D.-E., & Sohn, M. (2011). 3D simulation technology as an effective 
instructional tool for enhancing spatial visualization skills in apparel 
design. International Journal of Technology and Design Education, 
21(4), 505–517.  
Park, J., Kim, D., & Sohn, M. (2011). 3D simulation technology as an effective 
instructional tool for enhancing spatial visualization skills in apparel 
design. International Journal of Technology and Design Education, 
21(4), 505–517.  


---

 
 
 
126 
Park, J., Lennon, S. J., & Stoel, L. (2005). On-line product presentation: Effects on 
mood, perceived risk, and purchase intention. Psychology and 
Marketing, 22(9), 695–719.  
Peck, J., & Childers, T. L. (2003). Individual differences in haptic information 
processing: The “need for touch” scale. Journal of Consumer Research, 
30(3), 430–442. 
Peirce, F. T. (1930). The “handle” of cloths as a measurable quantity. Journal of the 
Textile Institute Transactions, 21(9), T377–T416.  
Petrova, A., & Ashdown, S. P. (2008). Three-dimensional body scan data analysis: 
Body size and shape dependence of ease values for pants’ fit. Clothing 
and Textiles Research Journal, 26(3), 227–252.  
Pine, B. J. (1993). Mass customization : the new frontier in business competition. 
Boston  MA: Harvard Business School Press. 
Pishchulin, L., Wuhrer, S., Helten, T., Theobalt, C., & Schiele, B. (2017). Building 
statistical shape spaces for 3D human modeling. Pattern Recognition, 
67, 276–286. 8 
Pisut, G., & Connell, L. J. (2007). Fit preferences of female consumers in the USA. 
Journal of Fashion Marketing and Management, 11(3), 366–379.  
Postle, R. (1999). Fabric objective measurement. International Journal of Clothing 
Science and Technology, 2(3), 7–17. 
Postle, R., Kawabata, S., & Niwa, M. (1983). Objective evaluation of the mechanical 
properties and performance of fabrics and clothing. In S. Kawabata & 
M. Niwa (Eds.), Objective evaluation of apparel fabrics (p. 1). Osaka: 
Text. Mac. Society. 
Power, J. (2013). Fabric objective measurements for commercial 3D virtual garment 
simulation. International Journal of Clothing Science and Technology, 
25(6), 423–439. 
Presley, A. B., Connell, L. J., & Alexander, M. (2005). Clothing fit preferences of 
young female adult consumers. International Journal of Clothing 
Science and Technology, 17(1), 52–64.  
Pritchard, M., & Cramblitt, B. (2014). Media influence on drive for thinness and 
drive for muscularity. Sex Roles, 71(5), 208–218.  
PwC. (2017). 10 retailer investments for an uncertain future. Retrieved June 14, 2018, 
from 
https://www.pwc.com/gx/en/industries/assets/total-retail-
2017.pdf 
Rakuten Fitsme. (2018). Rakuten Fitsme. Retrieved July 5, 2018, from https://fits.me 
Ratcliff, C. (2014). How fashion ecommerce retailers can reduce online returns. 
https://doi.org/10.1287/mnsc.1040.0298 
Refaeilzadeh, 
P., 
Tang, 
L., 
& 
Lui, 
H. 
(2018). 
Cross-Validation. 
https://doi.org/10.1159/000331070 
Ridolfi, D. R., Myers, T. A., Crowther, J. H., & Ciesla, J. A. (2011). Do appearance 
focused cognitive distortions moderate the relationship between social 


---

 
 
 
127 
comparisons to peers and media images and body image disturbance? 
Sex Roles, 65(7–8), 491–505. 
Rivero, P., & Zhu, Z. (2016). Online Clothes Shopping An Industry Landscape Study 
Focusing 
on 
Returns. 
Berkeley. 
Retrieved 
from 
http://scet.berkeley.edu/wp-
content/uploads/zhuzihan_late_4894259_68726594_IEOR-290-final-
report-1.pdf 
Robinette, K. M., Daanen, H., & Paquet, E. (1999). The CAESAR project: a 3-D 
surface anthropometry survey. In Second International Conference on 
3-D Digital Imaging and Modeling (Cat. No.PR00062) (pp. 380–386).  
Robson, D., & Long, C. C. (2000). Drape Analysis using Imaging Techniques. 
Clothing and Textiles Research Journal, 18(1), 1–8.  
Rodrigues, T., Silva, S. C., & Duarte, P. (2017). The value of textual haptic 
information in online clothing shopping. Journal of Fashion Marketing 
and Management, 21(1), 88–102. https://doi.org/10.1108/JFMM-02-
2016-0018 
Rodulfo, K. (2015, December). The Pirelli 2016 Calendar Is Here and Unlike 
Anything You’ve Seen Before. Retrieved May 30, 2018, from 
https://www.elle.com/culture/celebrities/news/a32204/pirelli-calendar-
launch-2016/ 
Romm, S. (1987, January 27). Beauty Through History. The Washington Post. 
Retrieved 
from 
https://www.washingtonpost.com/archive/lifestyle/wellness/1987/01/2
7/beauty-through-history/301f7256-0f6b-403e-abec-
f36c0a3ec313/?noredirect=on&utm_term=.f5e661973470 
Rosen, G. M., & Ross,  a O. (1968). Relationship of body image to self-concept. 
Journal of Consulting and Clinical Psychology, 32(1), 100.  
Russell, J. (2017). Apparel Finally Joins the Online Shopping Revolution. Retrieved 
June 14, 2018, from https://www.therobinreport.com/apparel-finally-
joins-the-online-shopping-revolution/ 
Samuel, H. (2017). French fashion giants ban super-skinny models from catwalks and 
adverts. 
Retrieved 
May 
31, 
2018, 
from 
https://www.telegraph.co.uk/news/2017/09/06/french-fashion-giants-
ban-super-skinny-models-catwalks-adverts/ 
Sanad, R. A., & Cassidy, T. (2015). Fabric objective measurement and drape. Textile 
Progress, 47(4), 317–406.  
Sarbolandi, H., Lefloch, D., & Kolb, A. (2015). Kinect range sensing: Structured-
light versus Time-of-Flight Kinect. Computer Vision and Image 
Understanding, 139, 1–20. 
Satam, D., Liu, Y., & Lee, H. J. (2011). Intelligent design systems for apparel mass 
customization. Journal of the Textile Institute, 102(October), 353–365.  
Sayem, A. S. M., Kennon, R., & Clarke, N. (2010). 3D CAD systems for the clothing 
industry. International Journal of Fashion Design, Technology and 


---

 
 
 
128 
Education, 3(2), 45–53.  
Sayem, M., & Bednall, A. (2017). A Novel Approach to Fit Analysis of Virtual 
Fashion Clothing. In 19th edition of the International Foundation of 
Fashion Technology Institutes Conference (pp. 1–28). Amsterdam: The 
Amsterdam Fashion Institute (AMFI). Retrieved from https://e-
space.mmu.ac.uk/618256/ 
Schneider, C. A., Rasband, W. S., & Eliceiri, K. W. (2012). NIH Image to ImageJ: 
25 years of image analysis. Nature Methods, 9(7), 671–675. Retrieved 
from http://www.ncbi.nlm.nih.gov/pubmed/22930834 
Schuessler, B. (2015). At Which Age Should You Stop Wearing Short Hemlines? 
Retrieved 
February 
15, 
2017, 
from 
https://www.whowhatwear.co.uk/skirt-hemlines-by-age 
Secord, P. F., & Jourard, S. M. (1953). The appraisal of body-cathexis: body-
cathexis and the self. Journal of Consulting Psychology, 17(7), 343–
347.  
Seo, H., & Magnenat-Thalmann, N. (2003). An Automatic Modeling of Human 
Bodies from Sizing Parameters. In Proceedings of the 2003 Symposium 
on Interactive 3D Graphics (pp. 19–26). New York, NY, USA: ACM.  
Shim, S., & Bickle, M. C. (1993). Women 55 years and older as catalog shoppers: 
Satisfaction with apparel fit and catalog attributes. Clothing and 
Textiles Research Journal, 11(4), 53–64.  
Shim, S., & Bickle, M. C. (1994). Benefit segments of the female apparel market: 
Psychographics, shopping orientations, and demographics. Clothing 
and Textiles Research Journal, 12(2), 1–12.  
Shim, S., Kotsiopulos, A., & Knoll, D. S. (1991). Body cathexis, clothing attitude, 
and their relations to clothing and shopping behavior among male 
consumers. Clothing and Textiles Research Journal, 9(3), 35–44.  
Shin, E. (2013). Exploring consumers’ fit perceptions and satisfaction with apparel 
fit in general. Iowa State University. 
Shin, E., & Baytar, F. (2013). Apparel fit and size concerns and intentions to use 
virtual try-on: Impacts of body satisfaction and images of models’ 
bodies. Clothing and Textiles Research Journal, 32(1), 20–33.  
Shin, E., & Damhorst, M. L. (2018). How young consumers think about clothing fit? 
International Journal of Fashion Design, Technology and Education, 
1–10.  
Size Stream. (2018). Commercial Grade Power and Accuracy at anAffordable Price. 
Retrieved August 6, 2018, from http://sizestream.com/products/ 
Skelton, J. (1976). Fundamentals of fabric shear. Textile Research Journal, 46(12), 
862–869.  
Solomon, M. R. (1983). The role of products as social stimuli: A symbolic 
interactionism perspective. Journal of Consumer Research, 10(3), 319–
329.  


---

 
 
 
129 
Song, H. K., & Ashdown, S. P. (2010). An exploratory study of the validity of visual 
fit assessment from three-dimensional scans. Clothing and Textiles 
Research Journal, 28, 263–278.  
Song, H. K., & Ashdown, S. P. (2013). Female apparel consumers’ understanding of 
body size and shape: Relationship among body measurements, fit 
satisfaction, and body cathexis. Clothing and Textiles Research 
Journal, 31(3), 143–156. 
Song, H. K., & Ashdown, S. P. (2015). Investigation of the validity of 3-D virtual 
fitting for pants. Clothing and Textiles Research Journal, 33(4), 1–17.  
Statista. (2016). Leading product categories bought online among internet users in the 
United States as of June 2016, by gender. Retrieved March 1, 2017, 
from 
https://www.statista.com/statistics/311406/us-online-shopping-
categories-gender/ 
Statista. (2017a). Leading product categories bought online among internet users in 
the United States as of June 2016, by age group. Retrieved September 
3, 2018, from https://www.statista.com/statistics/693629/usa-online-
shopping-product-categories-by-age/ 
Statista. (2017b). Victoria’s Secret Fashion Show viewers on TV in the U.S. 2017. 
Retrieved 
May 
31, 
2018, 
from 
https://www.statista.com/statistics/369557/people-who-watched-
victorias-secret-fashion-show-on-tv-within-the-last-12-months-usa/ 
Styku. (2016). Complete 3D full body scanning solution. Retrieved August 6, 2018, 
from http://www.styku.com/bodyscanner# 
Swiatkowski, P. (2016). Magazine influence on body dissatisfaction: Fashion vs. 
health? Cogent Social Sciences, 2(1), 1250702.  
Tan, Y. Bin, Crown, E. M., & Capjack, L. (1998). Design and evaluation of thermal 
protective flightsuits. part i: The design process and prototype 
development. Clothing and Textiles Research Journal, 16(1), 47–55.  
Taya, Y., Shibuya, A., & Nakajima, T. (1995). Evaluation method of clothing fitness 
with body. Journal of the Textile Machinery Society of Japan, 48, 48–
234.  
TC2. (2018a). TC2-105:The new era of full color 3D body scanning is here. Retrieved 
August 
6, 
2018, 
from 
https://www.tc2.com/tc2-105-full-color-
scanner.html 
TC2. (2018b). TC2-19R Mobile Scanner the new era pf mobile scanning is here. 
Retrieved August 6, 2018, from https://www.tc2.com/tc2-19r-
scanning-process.html 
The Textile Clothing Technology Corporation. (2003). SizeUSA. Retrieved June 
17, 2018, from http://www.sizeusa.com 
Thi, N., Ngoc, T., & Anh, H. N. (2010). Investigating on Fabric and Skirt Drape in 
clothing construction. In 7th International Conference, TEXSCI 2010. 
Czech Republic: Liberec University. 
Tong, J., Zhou, J., Liu, L., Pan, Z., & Yan, H. (2012). Scanning 3D full human 


---

 
 
 
130 
bodies using Kinects. IEEE Transactions Onf Visualization and 
Computer Graphics, 18(4), 6165146. 
True Fit. (2018). True Fit Confidence Engine. 
Tselepis, T., & Klerk, H. De. (2004). Early adolescent girls’ expectations about the 
fit of clothes: A conceptual framework. Journal of Family Ecology and 
Consumer 
Sciences, 
32, 
83–93. 
Retrieved 
from 
http://www.ajol.info/index.php/jfecs/article/download/52862/41464 
U.S. Department of Commerce. (1958). Body measurements for the sizing of 
women’s patterns and apparel (Commercial standard CS215-58). 
Washington DC. 
Vanderpoorten, M. A. (1973). Pattern Alteration: A comparison of two methods for 
effectiveness of fit and attainment of skill by students in beginning 
construction. Texas University. 
Vangheluwe, L., & Kiekens, P. (1993). Time dependence of the drape coefficient of 
fabrics. International Journal of Clothing Science and Technology, 
5(5), 5–8.  
Volino, P., Cordier, F., & Magnenat-Thalmann, N. (2005). From early virtual 
garment simulation to interactive fashion design. CAD Computer Aided 
Design, 37(6), 593–608.  
Volino, P., & Magnenat-Thalmann, N. (2005). Implicit midpoint integration and 
adaptive damping for efficient cloth simulation. Computer Animation 
and Virtual Worlds, 16(3–4), 163–175.  
W.Yu. (2004). Clothing Appearance and Fit. (J. Fan, W. Yu, & L. Hunter, Eds.), 
Clothing Appearance and Fit. Cambridge: Woodhead Publishing. 
Wang, C. C. L., Wang, Y., Chang, T. K. K., & Yuen, M. M. F. (2003). Virtual 
human modeling from photographs for garment industry. Computer-
Aided Design, 35(6), 577–589.  
Wang, J., Lu, G., Chen, L., Geng, Y., & Deng, W. (2010). Customer participating 
3D garment design for mass personalization. Textile Research Journal, 
81(2), 187–204.  
Wang, M., & Shen, Y. (2018). The 3D Human Body Modeling for Virtual Fitting 
Based on the Key Characteristic Parameters. In Z. Pan, A. D. Cheok, & 
W. Müller (Eds.), Transactions on Eutainment XIV, LNCS 10790, (pp. 
14–26). Berlin: Springer.  
Wang, X., Liu, X., & Hurren, C. (2008). Physical and mechanical testing of textiles. 
In J. Hu (Ed.), Fabric Testing (pp. 90–123). Woodhead Pub. 
Wang, Y., Cui, Y., Zhang, P., Feng, X., Shen, J., & Xiong, Q. (2011). A smart 
mannequin system for the pressure performance evaluation of 
compression garments. Textile Research Journal, 81(11), 1113–1123.  
Winkler, M. (2017). How to Reduce Ecommerce Return Rates & Predict What 
Customers 
Want. 
Retrieved 
May 
17, 
2018, 
from 
https://www.shopify.com/enterprise/ecommerce-return-rates 


---

 
 
 
131 
Wu, Y. Y., Mok, P. Y., Kwok, Y. L., Fan, J., & Xin, J. H. (2011). An investigation 
on the validity of 3D clothing simulation for garment fit evaluation. In 
Proceedings of the IMProVe 2011 International conference on 
Innovative Methods in Product Design (pp. 463–468). Venice. 
Xu, J. , Zhang, W. and X. P. (2008). Area ease distribution relationship between the 
body and garment. Journal of Textile Research, 29(5), 102–106. 
Xu, B., & Zhong, Y. (2003). Three-dimensional technology for apparel mass 
customization: Part III: visualization of three-dimensional garments. 
The Journal of The Textile Institute, 94(1–2), 92–102.  
Yan, W. Y. C. (2011). An Investigation on the Reliability of 3D Clothing Simulation 
for Garment Fit Evaluation. The Hong Kong Polytechnic University. 
Yang, E. L., Celestino, M., & Koeppel, K. (2015). Women’s Ideal Body Types 
Throughout 
History. 
Retrieved 
May 
27, 
2018, 
from 
https://www.buzzfeed.com/eugeneyang/womens-ideal-body-types-
throughout-history?utm_term=.rvb1nzpYB#.baNGRE6yV 
Yu, W. (2004). 3D body scanning. In J. Fan, W. Yu, & L. B. T.-C. A. and F. Hunter 
(Eds.), Clothing Appearance and Fit (pp. 135–168). Woodhead 
Publishing.  
Yu, W. (2004). 5 – Objective evaluation of clothing fit. In Clothing Appearance and 
Fit (pp. 72–88).  
Yu, W., Fan, J. T., Qian, X. M., & Tao, X. (2001). Development of a mannequin for 
garment pressure evaluation. In 1st AUTEX Conference, 2 (Vol. 1, pp. 
452–457). Portugal. 
Yu, W., Fan, J. T., Qian, X. M., & Tao, X. (2004). A soft mannequin for the 
evaluation of pressure garments on human body. Fiber, 60(2), 57–64. 
Yu, W. M., Yeung, K. W., & Lam, Y. L. (1998). Assessment of garment fit. In 
HKITA and CTES Conference on Hand in Hand Marching into 21st 
Century (pp. 125–129). Shangai. 
Zakaria, N., & Gupta, D. (2014). Apparel sizing: Existing sizing systems and the 
development of new sizing system. In N. Zakaria & D. Gupta (Eds.), 
Anthropometry, Apparel Sizing and Design (pp. 3–40). Woodhead 
Publishing. 
Zeiss Company. (2016). SURFCOM 130 - Portable skidless roughness measurement 
tester. 
Retrieved 
December 
26, 
2017, 
from 
https://www.zeiss.com/metrology/products/systems/form-and-
surface/mobile-surface-measurement/surfcom-130.html 
Zernike, K. (2004). Sizing Up America: Signs of Expansion From Head to Toe. 
Retrieved 
June 
18, 
2018, 
from 
https://www.nytimes.com/2004/03/01/us/sizing-up-america-signs-of-
expansion-from-head-to-toe.html 
Zhu, S., Mok, P. Y., & Kwok, Y. L. (2013). An efficient human model customization 
method based on orthogonal-view monocular photos. CAD Computer 
Aided Design, 45(11), 1314–1332.  


---

 
 
 
132 
 
 
 
 
 
 
 
 


---

 
 
 
133 
 
APPENDICES 
APPENDIX A: Fabric surface scans. 
APPENDIX B: Skirt simulations created by V-Stitcher. 
APPENDIX C: Notice of expedited approval from Institutional Review Board for  
Human Participants 
APPENDIX D: Research survey 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


---

 
 
 
134 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


---

 
 
 
135 
APPENDIX A  
 
(Fabric 2) 
 
(Fabric 22) 
  
(Fabric 1) 
 
(Fabric 6) 


---

 
 
 
136 
  
(Fabric 8) 
 
(Fabric 15) 
 
Fabric 21 
 
Figure A.1 : : Surface scans of fabrics. 
 
 
 
 
 
 
 
 
 


---

 
 
 
137 
 
APPENDIX B  
Table A.1 : Skirt simulations created by V-Stitcher. 
Cluster 1 
Skirt 2 
 
Skirt 22 
 
Cluster 2 
Skirt 1 
 
Skirt 6 
 
Cluster 3 
Skirt 8 
 
Skirt 15 
 
Cluster 4 
Skirt 21
 
 
 
 
 
 
 
 
 
 
 


---

 
 
 
138 
 
APPENDIX C  
 
 
Figure A.2 : Notice of expedited approval from Institutional Review Board for 
Human Participants 
 
 
 


---

 
 
 
139 
 
  APPENDIX D  
 
Figure A.3 : Survey 


---

 
 
 
140 
Figure A.3 (continueed): Survey 


---

 
 
 
141 
 
 
 
Figure A.3 (continueed): Survey 


---

 
 
 
142 
Figure A.3 (continueed): Survey 


---

 
 
 
143 
Figure A.3 (continueed): Survey 


---

 
 
 
144 
Figure A.3 (continueed): Survey 


---

 
 
 
145 
 
 
 
 
Figure A.3 (continueed): Survey 


---

 
 
 
146 
Figure A.3 (continueed): Survey 


---

 
 
 
147 
Figure A.3 (continueed): Survey 


---

 
 
 
148 
Figure A.3 (continueed): Survey 


---

 
 
 
149 
Figure A.3 (continueed): Survey 


---

 
 
 
150 
 
Figure A.3 : Survey


---

 
 
 
151 
CURRICULUM VITAE 
 
 
Name Surname 
: Evrim Buyukaslan 
  
Place and Date of Birth 
: Turkey, 15/09/198 
 
E-Mail 
: evrimbuyukaslan@gmail.com 
 
EDUCATION 
: 
 
 
• B.Sc. 
 
 
:2007, Istanbul Technical Uni., Textile Engineering  
• M.Sc. 
                       : 2010, Istanbul Technical Uni., Polymer Science 
PROFESSIONAL EXPERIENCE AND REWARDS:  
• 2017-2018 US Cornell University, Visiting scholar at Fiber Science and Apparel 
Design. 
• 2012-2017 Turkey, Research and Teaching Assistant at Istanbul Bilgi University, 
Fashion Design Department  
• 2010-2012 Istanbul, HTL Fashion, Merchandiser  
• 2007-2008 Istanbul, Hennes& Mauritz (H&M) Production Office  
PUBLICATIONS, PRESENTATIONS AND PATENTS ON THE THESIS: 
• Buyukaslan E., Jevsnik S., Kalaoglu F. (2018). Comparative analysis of drape 
characteristics of actually and virtually draped fabrics,  International Journal 
of Clothing Science and Technology, 30(3), 286-301. 
• Kalaoglu F, Buyukaslan E., Jevsnik S (2018). Psychophysical testing of 
virtual fabric drape, . J Fashion Technology Textile Eng,  Special Issue 4:017. 
• Buyukaslan E., Baytar F., Kalaoglu F. (2018). Creating garment simulations: 
Effectiveness of traditional textile testing equipment versus KES and FAST 
Systems, ITAA Annual Conference, 6-9 November 2018, Clevland/USA. 
• Buyukaslan E., Jevsnik S., Kalaoglu F. (2015). Virtual fitting of a skirt on a 
parametric and a scanned body model, Marmara Journal of Pure and Applied 
Science, Vol.27, No.5, pp.23-26. 


---

 
 
 
152 
•  Buyukaslan E., Kalaoglu F., Jevsnik S. (2017). Psychophysical testing of 
virtual fabric drape”,  International Conference on Intelligent Textiles and 
Mass Costumisation 2017 (ITMC 2017), 16-18 October 2017, Ghent 
/BELGIUM. 
• Buyukaslan E., Kalaoglu F. (2017), Drape simulation and subjective 
assesment of virtual drape, , 17th AUTEX World Textile Conference 2017, 29-
31 May 2017, Corfu/GREECE.  
• Buyukaslan E., Jevsnik S., Kalaoglu F. (2015). Drape of virtual garments on 
body models: Impact of mechanical properties of the fabrics, , 6th 3D Body 
Scanning Conference, 26-29 October 2015,  Lugano /SWITZERLAND. 
• Buyukaslan E., Jevsnik S., Kalaoglu F. (2015). Variable drape properties of 
similar woven fabrics, 5th International Istanbul Textile Congress 2015: 
Innovative Technologies “Inspire to Innovate”, September 11th -12th 2015  
Istanbul/TURKEY. 
•  Buyukaslan E., S. Jevšnik, F. Kalaoglu (2014). Virtual fitting of a skirt on a 
parametric and a scanned body model  , Future Technical Textiles Congress 
2014, Marmara University İstanbul /TURKEY.  
OTHER PUBLICATIONS, PRESENTATIONS AND PATENTS: 
• Buyukaslan E., Jevsnik S., Kalaoglu. (2015). Sustainable approaches for 
textile waste disposal in developing countries , Marmara Journal of Pure and 
Applied Science, Vol.27, No.5, pp.107-111. 
• Buyukaslan E., (2014). Design of a smart sleeping bag: Utilizing shape 
memory effect of Diaplex”, 14th AUTEX World Textile Conference 2014, 26-
28 May 2014, Uludag University Bursa/TURKEY.  
• Buyukaslan E., S.H. Eryuruk (2013). Wrist guard design for snowboarders. 
International R&D Brokerage Event of “ Innovative and Functional Textile 
Products”, 1 June 2013,  Istanbul/TURKEY. 
 
 
 
