---
title: Open Access
id: open-access
tags:
- modelista-producao-moda-dores-0698af
- locus-prototipagem-virtual-3d-vs-peca-piloto-fisica
created: '2026-11-27T03:57:31.712188Z'
source: https://fashionandtextiles.springeropen.com/counter/pdf/10.1186/s40691-024-00388-6
source_domain: link.springer.com
fetched_at: '2026-11-27T03:57:31.712188Z'
fetch_provider: builtin
status: draft
type: note
tier: institutional
content_type: paper
deprecated: false
raw_file: raw/open-access.pdf
---

Open Access
© The Author(s) 2024. Open Access  This article is licensed under a Creative Commons Attribution 4.0 International License, which permits 
use, sharing, adaptation, distribution and reproduction in any medium or format, as long as you give appropriate credit to the original 
author(s) and the source, provide a link to the Creative Commons licence, and indicate if changes were made. The images or other third 
party material in this article are included in the article’s Creative Commons licence, unless indicated otherwise in a credit line to the mate‑
rial. If material is not included in the article’s Creative Commons licence and your intended use is not permitted by statutory regulation or 
exceeds the permitted use, you will need to obtain permission directly from the copyright holder. To view a copy of this licence, visit http://​
creat​iveco​mmons.​org/​licen​ses/​by/4.​0/.
RESEARCH
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21  
https://doi.org/10.1186/s40691-024-00388-6
Fashion and Textiles
Investigating parameters affecting 
the real and virtual drapability of silk fabrics 
for traditional Hanbok
Jeong Hwa Kim1 and Jung‑Soon Lee2*   
Abstract 
This paper presents research into the parameters affecting the real and virtual drap‑
ability of silk fabrics for traditional Hanbok. The KES-FB (Kawabata evaluation system 
of fabric) and the CLO (3D fashion design software) fabric kit system were used 
to evaluate the physical properties. The relationships between physical properties 
and the drape coefficient of silk fabrics were statistically analyzed. It was determined 
whether the objectified real fabric data could be used and applied as a database 
when implementing virtual clothing using a 3D virtual clothing program. The KES-FB 
properties and CLO fabric kit results indicated that the bending property and weight 
were significantly correlated with the drape coefficient. The bending rigidity 
and weight per unit area were influential parameters of the drape coefficient. The 
regression analysis results of both the KES-FB and the CLO fabric kit revealed that bend‑
ing rigidity and thickness were statistically significantly correlated with the drape coef‑
ficient. The bending property was the most determining parameter for the drape coef‑
ficient of silk fabrics. A statistically significant difference between the real and virtual 
drape coefficients of stiffer silk fabrics was found. In the CLO 7.1 program, the accuracy 
of drape implementation of virtual fabrics was found to be useful when the bending 
stiffness of the actual fabric was less than 0.089 gf·cm2/cm and the elasticity was more 
than 1.03%. The results revealed that more research on the program modeling method 
considering the mechanical and physical properties of the real fabric and its structure 
is needed.
Keywords:  Real and virtual drapability, Silk fabrics, Traditional Hanbok, KES-FB system, 
3D CLO system
Introduction
The commercialization of digital technology through three-dimensional (3D) technol-
ogy convergence has presented the opportunity to transform the fashion industry into 
a next-generation realistic platform. 3D virtual clothing digital technology is becoming 
an important factor in creating competitiveness in clothing design, manufacturing, pro-
duction, and marketing (Sayem, 2015). Recently, as non-face-to-face services have been 
strengthened in the fashion industry, 3D virtual clothing systems have been actively 
introduced to e-commerce, digital fashion shows, showrooms, and virtual fittings due to 
*Correspondence:   
jungsoon@cnu.ac.kr
1 Research Institute of Human 
Ecology, Chungnam National 
University, 99 Daehak‑Ro, 
Yusung‑Gu, Daejeon 34134, 
South Korea
2 Department of Clothing & 
Textiles, Chungnam National 
University, 99 Daehak‑Ro, 
Yusung‑Gu, Daejeon 34134, 
South Korea


---

Page 2 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
the strength of online markets (Plotkina & Saurel, 2019). The implementation of virtual 
clothing using a 3D computer-assisted design (CAD) program is done by users who are 
skilled in the program and have accumulated experience so that the realistic expression 
of fabric properties can be expressed. Therefore, experts familiar with computers and 
programs are required for sophisticated fabric simulation (Buyukaslan, 2017). Improve-
ment in such realistic expression depends on accurate physical property expression of 
the fabrics. Specialized physical property measurement equipment must be used to 
apply the physical properties of a specific fabric to virtual clothing. The disadvantages 
of a 3D virtual wearing system include the limitation of fabric expression, which does 
not represent the texture or drape of real fabric well, with differences between real and 
virtual fabrics (Choi & Nam, 2009). Realistically expressing the silhouette of 3D virtual 
clothing so that the virtual fabric can accurately reflect the characteristics of the real 
fabric, with drape and silhouette of the virtual fabric similar to those of the real fabric, 
is very important (Choi, 2022; Portfield & Lamar, 2017; Rudolf et al., 2016). Drapability 
is the 3D deformation of fabrics caused by gravity. It is an important factor that defines 
the appearance of clothing, such as color, gloss, and texture (Pattanayak et al., 2010). 
The drapability of fabrics differs depending on fiber composition, thread, fabric struc-
ture, and finishing type, with each fabric having its own drape shape (Abdin et al., 2013; 
Glombikova & Zdenek, 2014; Lozen & Jevsnik, 2007; Sanade et al., 2013).
In apparel products, the aesthetic perception inherent in the textile is expressed 
according to the mechanical properties of the textile material. Fabric drapability is a 
major factor that constitutes the appearance and silhouette of clothing, along with pat-
tern composition (Kenkare & May-Plumlee, 2005). Hu and Chen (1998) investigated 
the relationship between physical properties and the overall drape coefficient using the 
Kawabata estimating system (KES-F) and found that the drape coefficient was closely 
related to the bending and shear properties, the mean deviation of the friction coefficient, 
and tensile linearity. Niwa and Seto (1986) found that the drape coefficient of women’s 
dress fabrics was greatly affected by {2HB (hysteresis width at a bending curvature)/W 
(weight per unit area)}1/2 among properties such as bending stiffness, bending hysteresis, 
weight per unit area, shear stiffness, and shear hysteresis. Morooka and Niwa (1976) also 
studied drape in which the drape coefficient was correlated with mechanical proper-
ties, according to the statistical analysis, a high correlation was obtained between multi 
regression models of drape ratio-bending property-weight. Matsudaira and Yang (2000) 
proposed that bending rigidity, bending hysteresis, weight per unit area, shear stiffness, 
and shear hysteresis were closely related to the drape coefficient of new synthetic fabrics. 
Although the KES-F can measure the mechanical properties of fabrics very accurately 
and reproducibly, it also has disadvantages in that it is expensive, making it challenging 
for general users or individual designers to access this equipment (Chan et al., 2006; Ju 
& Choi, 2020; Tsukada et al., 2013). As such, the characteristics of fabrics are important 
factors constituting clothing.
The need for research on the physical properties of real and virtual fabrics for devel-
oping 3D virtual clothing systems is increasing. 3D virtual clothing programs include 
“3D Runway Designer”, developed by Optitex in Israel, “V-Stitcher” and “Lotta”, devel-
oped by Browzwear in Singapore, “I-Designer”, developed by Technoa in Japan, and 
“3D-Fit”, developed by Lectra in France. “DC-Suite”, developed by Picsen Co. Ltd., 


---

Page 3 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
	
“Qualoth”, developed by FXGear, and “CLO 3D”, developed by Clo Virtual Fashion 
Co., Ltd., are 3D virtual clothing programs developed in Korea (Kim et  al., 2014a, 
2014b; Lage & Ancutiene, 2017; Power, 2013; Sayem et al., 2010). The CLO 3D virtual 
clothing program used in this study is a 3D virtual clothing CAD program developed 
by CLO Virtual Fashion Co., Ltd. It is suitable for the fashion industry and was started 
from a program called “Marvelous Designer”, which could realistically express game 
and animation character costumes (Na & Kim, 2012).
Clothing-related studies that are being conducted using 3D virtual clothing pro-
grams include studies that compare and evaluate the appearance of virtual clothes 
and real clothes at the same time and studies that evaluate fit and suggest optimal 
patterns using virtual clothing systems (Fontana et  al., 2005). Studies belonging to 
this category include a comparative study of men’s classic fit and slim fit shirt pat-
terns (Kim et al., 2014a, 2014b), a comparison of real clothing with online and 3D vir-
tual garments (Kim & Na, 2013), and pattern corrections of women’s tailored jackets 
(Kwak, 2016). Most of these preceding studies were comparative studies of changes 
in patterns or differences in the appearance images of clothing. Since the expressive 
power of virtual clothing is very closely related to the physical properties of fabrics in 
a 3D virtual clothing system, studies (Buyukaslan et al., 2017; Lee & Kim, 2016) have 
proposed improvements in programs related to the expression of fabric properties. 
Differences between the results of real and virtual clothing were seen when virtual 
clothing was simulated by applying physical properties measured in real fabrics and 
compared to a 3D virtual clothing program (Yoon, 2022). However, such studies are 
insufficient.
Hanbok is traditional clothing that embodies the Korean lifestyle and culture. 
The form and structure of Hanbok have changed in various ways, depending on the 
style of life, culture, living environment, and aesthetics of the times (joint operation 
of related ministries, 2021). Unlike Western clothing, which is designed to fit a 3D 
shape, Hanbok is designed using a flat pattern and changes to suit the body shape of 
the wearer. High-quality silk fabric has been used throughout Korean history to make 
Hanbok for the royal family and people of high social status. Currently, silk fabric is 
used as a clothing material for Hanbok for ceremonies, such as weddings, in the gen-
eral public. Recently, global interest in Korean contents (K-contents) and Korean cul-
ture has heightened interest in traditional Hanbok clothing. As Korean pop (K-pop) 
culture has grown in popularity around the world, Hanbok has become an inspira-
tion to all K-pop fans who first discovered it on YouTube (Victoria & Albert Museum. 
London, 2023). Research on the real and virtual drapability of traditional Hanbok silk 
fabrics for the utilization of virtual garments is needed to promote the popularity of 
Korean-culture.
Therefore, in this study, 30 silk fabrics used as textiles for Hanbok, a traditional Korean 
costume, were selected to compare the physical properties of real and virtual fabrics. 
KES-FB (Kato Tech Co., Ltd) properties, the CLO fabric kit properties, and the drap-
ability of silk fabrics were measured, and correlations were analyzed to investigate the 
effects of the physical properties of real fabric and virtual fabric on drapability. Quanti-
fied and objectified property data on the silk fabrics are expected to be used to build a 
digital textile database to produce 3D virtual clothing.


---

Page 4 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
Methods
Materials
The experimental fabrics used in this study were provided by the Korea Silk Research 
Institute. Thirty types of silk fabrics were 100% silk fabric used in Korean women’s 
clothes (Hanbok), with a weight of 3.705 ~ 11.588 mg/cm2 (average weight: 6.927 mg/
cm2) and a thickness of 0.176 ~ 0.557 mm (average thickness: 0.284 mm)range. Proper-
ties of these 30 types of silk fabrics are summarized in Table 1. Scanned images of 30 silk 
fabrics are presented in Fig. 1.
Mechanical properties of silk fabrics by KES‑FB
The commonly used the KES-FB system was used in this study to obtain mechanical 
properties of silk fabrics. A square sample of 20 cm × 20 cm in size was used for meas-
urement. As shown in Table 2, physical properties of the fabric were measured three 
times in warp and weft directions under standard conditions for 17 items of six proper-
ties: tensile, bending, shearing, compression, surface properties, weight and thickness 
(Kawabata, 2000).
Physical properties of silk fabrics by CLO fabric kit
To obtain physical properties using the CLO fabric kit, a 22 cm × 3 cm rectangular sam-
ple was prepared in warp, weft, and bias directions, respectively. As measurement items, 
characteristics of tensile stiffness, bending stiffness, shear stiffness, weight, and thick-
ness were measured as shown in Table  3. Measurements were repeated three times. 
When measuring physical properties, the test was conducted in the order of weight, 
thickness, bending, and tensile characteristics with less damage. Samples in the warp, 
weft, and bias directions required to measure weight were folded and put on the scale to 
measure the weight. Weight per unit area was obtained by dividing weight by the fabric 
area. The thickness was measured with a digital thickness gauge. The contact distance 
and the bending length were obtained by testing one warp and one weft swatch as bend-
ing stiffness. The stretch stiffness was measured in five stages with the force correspond-
ing to the length of the fabric sample fixed at both ends. Shear stiffness corresponded to 
the tensile stiffness measurement of a fabric sample cut in the bias direction. Measured 
values were entered in the emulator within the CLO and digitalized.
Drape coefficient
A visual image drape meter was used to measure the drape coefficient (Kim, 2011; Park 
et al., 2004). This method adds a digital image processor to the widely used Cusick drape 
tester (Cusick, 1968). First, the drape shape was obtained using a Cusick drape tester 
according to KS K ISO 9073–9 (Korean Agency for Technology & standards, 2021). A 
sample with a diameter of 30 cm was placed on a cylinder with a disk having a diam-
eter of 18 cm. The shape of the draped sample was photographed by setting the distance 
between the drape measuring device and the camera lens to 76 cm. The drape coefficient 
was obtained by calculating the area of the draped shape by obtaining a two-dimensional 
shape using the image analysis system from data obtained through the image input 


---

Page 5 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
	
device. The drapability of the fabric was measured a total of six times on the front and 
back sides of three samples. The formula for obtaining the drape coefficient is shown in 
Eq. (1):
Table 1  Characteristics of silk fabrics
Fabric No.
Fabric contents
Weave
Fabric density 
(warp × weft/
in2)
Weight (mg/cm2)
Thickness (mm)
s1
Raw Silk 100%
Plain
112 × 76
3.705
0.311
s2
Raw Silk 100%
Jacquard
166 × 76
4.705
0.203
s3
Raw Silk 100%
Plain
148 × 72
4.718
0.288
s4
Raw Silk 100%
Plain
160 × 68
4.735
0.241
s5
Raw Silk 100%
Jacquard
100 × 68
4.785
0.215
s6
Degummed Silk 
100%
Jacquard
98 × 77
4.968
0.229
s7
Raw Silk 100%
Jacquard
128 × 82
5.095
0.176
s8
Raw Silk 100%
Plain
90 × 64
5.435
0.272
s9
Raw Silk 100%
Jacquard
204 × 102
5.515
0.220
s10
Raw Silk 100%
Plain
188 × 72
5.705
0.228
s11
Degummed Silk 
100%
Plain
214 × 68
5.870
0.217
s12
Raw Silk 100%
Unbalanced plain
104 × 36
5.960
0.557
s13
Raw Silk 100%
Jacquard
188 × 84
6.015
0.252
s14
Degummed Silk 
100%
Jacquard
324 × 92
6.328
0.213
s15
Raw Silk 100%
Plain
216 × 160
6.518
0.272
s16
Raw Silk 100%
Unbalanced plain
110 × 71
6.560
0.438
s17
Degummed Silk 
100%
Plain
96 × 63
6.843
0.221
s18
Degummed Silk 
100%
Jacquard
144 × 64
6.880
0.319
s19
Degummed Silk 
100%
Jacquard
240 × 108
7.120
0.229
s20
Degummed Silk 
100%
Plain
70 × 64
7.515
0.246
s21
Raw Silk 100%
Jacquard
112 × 112
7.880
0.327
s22
Degummed Silk 
100%
Jacquard
184 × 74
8.148
0.249
s23
Degummed Silk 
100%
Jacquard
300 × 114
8.395
0.234
s24
Degummed Silk 
100%
Jacquard
308 × 132
8.440
0.241
s25
Degummed Silk 
100%
Jacquard
302 × 112
8.590
0.296
s26
Degummed Silk 
100%
Jacquard
225 × 104
9.755
0.332
s27
Degummed Silk 
100%
Jacquard
292 × 128
9.855
0.316
s28
Degummed Silk 
100%
Jacquard
224 × 108
9.998
0.397
s29
Degummed Silk 
100%
Unbalanced plain
236 × 106
10.200
0.359
s30
Degummed Silk 
100%
Jacquard
278 × 130
11.588
0.411


---

Page 6 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
s1
s2
s3
s4
s5
s6
s7
s8
s9
s10
s11
s12
s13
s14
s15
s16
s17
s18
s19
s20
s21
s22
s23
s24
s25
s26
s27
s28
s29
s30
Fig. 1  Scanned images of 30 silk fabrics
Table 2  Characteristic values of KES-FB mechanical properties
Parameter
Description
Unit
Tensile
LT
Linearity of tensile property
None
WT
Tensile energy per unit area
gf·cm/cm2
RT
Tensile resilience
%
EM
Extensibility, strain at 500gf/cm of tensile load
%
Bending
B
Bending rigidity per unit length
gf· ­cm2/cm
2HB
Hysteresis of bending moment per unit length
gf·cm/cm
Shear
G
Shear stiffness
gf/cm·deg
2HG
Hysteresis of shear force at 0.5° shear angle
gf/cm
2HG5
Hysteresis of shear force at 5° shear angle
gf/cm
Compression
LC
Linearity of compression
None
WC
Compressional energy
gf·cm/cm2
RC
Compressional resilience
%
Surface
MIU
Coefficient of friction
None
MMD
Mean deviation of MIU
None
SMD
Geometrical roughness
μm
Thickness
T
Thickness at 0.5 gf/cm2
mm
Weight
W
Weight per unit area
mg/cm2


---

Page 7 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
	
where,
A0 = area of the supporting plate
A1 = area of the specimen
A2 = projected area by the specimen
Implementation of virtual drape image using the CLO 3D CAD
3D virtual drape shapes of 30 types of silk fabric were simulated using a 3D cloth-
ing production software CLO 3D CAD (CLO Virtual Fashion Co., Ltd., V.7.1). Physi-
cal properties measured with the CLO fabric kit were input into the emulator and 
digitized. They were converted into a virtual fabric with properties such as stretch 
stiffness-weft, stretch stiffness-warp, shear, bending stiffness-weft, bending stiffness-
warp, bending stiffness-bias, thickness, and density. Shear corresponded to a measure 
of the stretch stiffness of a fabric sample cut in the bias direction. Thus, the actual 
value was reflected as it is. Buckling is an item reflecting characteristic that the fabric 
bends when more than a certain force is applied while maintaining its shape when 
an external force is applied. In this study, the buckling value were applied according 
to the type of silk fabric fixed in program. of the type of silk fabric fixed in the pro-
gram was applied. Using this virtual fabric, the drape shape was simulated in the same 
way as the real drape measurement method. After opening the “Table OBJ” file in the 
“File” menu, the 18 cm virtual object circular plate with the same diameter as the real 
drape for measuring instrument’s supporting plate was run. Then a 30 cm circle pat-
tern was created in the pattern window tool. A virtual fabric image was then created 
and applied as shown in Fig. 2. The formula for obtaining the virtual drape coefficient 
is shown in Eq. (2):
where,
VA0 = virtual area of the supporting plate
VA1 = virtual area of the specimen
VA2 = virtual projected area by the specimen
(1)
Drape coeﬃcient (%) = {(A2 −A0)/(A1 −A0)} × 100(%)
(2)
Virtual drape coeﬃcient (%) = {(VA2 −VA0)/(VA1 −VA0)} × 100(%)
Table 3  Characteristic values of CLO fabric kit physical properties
Parameter
Description
Unit
Tensile
Stretch stiffness-weft
g/s2
Stretch stiffness-warp
g/s2
Shear
Stretch stiffness-bias
g/s2
Bending
Bending stiffness-weft
g ­mm2/ ­s2rad
Bending stiffness-weft
g ­mm3/ ­s2 rad
Bending stiffness-bias
g ­mm2/ ­s2 rad
Thickness
Thickness at 1 ± 0.01kpa
mm
Weight
Weight per unit area
g/m2


---

Page 8 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
Statistical analysis
Statistical analysis was conducted with the IBM SPSS Statistics 26 program. The KES-FB 
and CLO fabric kit evaluation systems were analyzed for correlation. Correlation analy-
sis was conducted between the drape coefficient, KES-FB properties, and CLO fabric kit 
measurements. In addition, for drape coefficient, multiple regression analysis was per-
formed with KES-FB properties and CLO fabric kit measurements as independent varia-
bles. K-means cluster analysis was performed to analyze the drapability by grouping silk 
fabrics with similar drape coefficients. Difference between the two characteristics was 
compared and evaluated using an independent t-test and correlation analysis between 
the actual drape coefficient and the virtual drape coefficient.
Results and Discussion
Comparison of measurement results by KES‑FB and CLO fabric kit
The first step of this study was to compare the two evaluation systems. As shown in 
Fig. 3, the correlation coefficient between the KES-FB properties and the CLO fabric 
kit measurement results was as high as 0.964** (p-value < 0.01) in the case of weight. In 
addition, in the case of thickness, the correlation coefficient was 0.787** and the bending 
property was 0.518**. These values showed similar correlations although the two meas-
urement systems used different measurement principles. However, no significant cor-
relation was derived for tensile property. In the case of thickness and weight, there was a 
slight difference between the values measured using the two systems (CLO fabric kit and 
KES-FB). The thickness (value) measured using the KES-FB system tended to be slightly 
larger than that measured using the CLO fabric kit. This means that the thickness meas-
urement of the KES-FB system refers to the thickness measured at the moment when 
the pressure plate comes down and touches the sample and receives force. It is the thick-
ness (value) measured when the force(0.5 gf/cm2) applied to the sample is close to 0. On 
the other hand, when measuring with the CLO fabric kit’s digimatic thickness gauge, the 
thickness is measured under a greater pressure(1 ± 0.01 kPa), so it appears to be slightly 
thinner than the thickness (value) measured with the KES-FB system. There appears 
to be a slight difference in weight values due to the difference in unit area applied to 
weight measurement in the two systems. In the case of tensile property, when measur-
ing using the CLO fabric kit, the length of increase and the force applied at that time are 
measured point by point, so there is no continuity. However, when measuring using the 
KES-FB system, the force applied as the sample is stretched is continuously measured. 
Virtual circular plate&
Virtual circular fabric creation
Virtual drape image creation
(Top view)
Virtual drape image creation
(Side view)
Fig. 2  Virtual drape image creation process in 3D CLO system


---

Page 9 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
	
Additionally, in the KES-FB system, the maximum force was set at 500 gf/cm, but in 
the CLO fabric kit system, the experiment was conducted without setting the maximum 
force. Therefore, the difference in measured values between the two systems appears to 
be due to differences in data collection and experimental methods. According to Yoon’s 
research (Yoon, 2021a), when comparing the correlation between the physical properties 
measured with the CLO fabric kit and the KES-FB system, the weight, thickness, and 
bending stiffness showed a high correlation of over 0.9. But the tensile property showed 
a very low correlation of 0.33. As mentioned in previous studies (Pattanayak et al., 2010; 
Power, 2013; Shyr et al., 2007), the stretch stiffness value of the CLO fabric kit showed 
the same result as the low correlation coefficient between physical property values of 
virtual and real fabric in the case of fabrics having a very low elasticity.
Correlation and regression analysis between KES‑FB properties and drapability of silk 
fabrics
Figure 4 shows results of the correlation analysis between drape coefficient and KES-
FB mean value properties. The drape coefficient showed significant negative correlations 
with characteristics of extensibility (− 0.503**) (p-value < 0.01), and weight (− 0.402*) 
(p-value < 0.05). In addition, drape coefficient showed significant positive correlations 
with characteristics of tensile resilience (0.432*), bending rigidity (0.431*) and mean 
deviation of MIU(Coefficient of friction) (0.533**). The extensibility representing elonga-
tion deformation when a maximum load of 500 gf/cm was applied showed a result con-
sistent with a previous study. It was found that the more difficult the stretch, the higher 
the drape coefficient. In addition, the greater the linearity caused by weight and com-
pression, the smaller the drape coefficient (Sung et al., 1987). Komatsu and Niwa (1981) 
4
6
8
10
12
4
6
8
10
12
y= 0.8886x + 0.3457
r= 0.964**
(a)
CLO Weight
KES-FB Weight
0.2
0.3
0.4
0.5
0.6
0.12
0.16
0.20
0.24
0.28
0.32
y= 0.4478x + 0.0703
r= 0.786**
CLO Thickness
KES-FB Thickness
(b)
0.05
0.10
0.15
0.20
0.25
0.30
0.35
0.40
0.45
20000
40000
60000
80000
100000
y= 4E·10.047x + -0.4314
r= -0.518**
CLO Bending stiffness
KES-FB Bending rigidity
(c)
Fig. 3  Comparison of KES-FB and CLO fabric kit parameters: a Weight, b Thickness, and c Bending property


---

Page 10 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
have reported that the greater the tensile resilience, the greater the shape retention. They 
also found that when the bending rigidity had a large value, the space was maintained 
from the body and a box-shaped silhouette was formed. Hu and Chan have suggested 
that mean deviation of the friction coefficient is closely related to the drape ratio of a 
fabric (Hu & Chan, 1998). That is, when Mean deviation of MIU (MMD) representing 
resistance to slip is large, it means that the irregularity of the surface is large. This result 
is related to the drape ratio of the fabric.
Multiple regression analysis was performed between drape coefficient and KES-FB 
properties. As shown in Table 4, ­r2 of the regression model was about 78.6%. Among 
variables as independent variables, bending rigidity, thickness, compressional energy, 
tensile energy and hysteresis width at shear angle 0.5° were influential variables that 
could explain drape coefficient of the fabrics.
0.4
0.5
0.6
0.7
0.8
0.9
1.0
1.1
1.2
0.4
0.5
0.6
0.7
0.8
0.9
1.0
y= -0.474x + 1.0823
r= -0.503**
Drape coefficient
KES-FB Extensibility
4
6
8
10
12
0.4
0.5
0.6
0.7
0.8
0.9
1.0
y= -0.032x + 0.9843
r= -0.402*
Drape coefficient
KES-FB Weight
(b)
60
80
100
120
140
0.4
0.5
0.6
0.7
0.8
0.9
1.0
y= 0.0049x + 0.3301
r= 0.432*
Drape coefficient
KES-FB Tensile resilience
(c)
0.05 0.10 0.15 0.20 0.25 0.30 0.35 0.40 0.45 0.50
0.4
0.5
0.6
0.7
0.8
0.9
1.0
y= 0.7031x + 0.5947
r= 0.431*
Drape coefficient
KES-FB Bending ridigity
(d)
0.01
0.02
0.03
0.04
0.05
0.06
0.07
0.4
0.5
0.6
0.7
0.8
0.9
1.0
y= 7.1015x + 0.6011
r= 0.533**
Drape coefficient
KES-FB Mean deviation MIU
(e)
(a)
Fig. 4  Comparisons of drape coefficient and KES-FB parameters: a Extensibility, b Weight, c Tensile resilience, 
d Bending rigidity, e Mean deviation of MIU


---

Page 11 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
	
The regression equation of this regression model was expressed in Eq. (3) as follows:
Tokmak et al. (2010) also studied drape in which the drape coefficient was correlated 
with mechanical properties, a high correlation was obtained between multi regression 
models of drape ratio-bending-shear property and the additional tightness factor. Col-
lier (1991), and Shyr et al. (2007) have also performed a step-by-step multiple regression 
analysis to study the relationship between drape coefficient and the physical properties, 
the bending and shearing properties were found to be most closely associated with the 
static drape coefficient for the test fabrics. To determine multicollinearity (Hair et al., 
1998), which represents the relationship between three or more variables, tolerance and 
VIF (variance inflation factor) checks were performed. The tolerance check revealed that 
KES-FB bending rigidity, thickness, compressional energy, tensile energy and hysteresis 
width at shear angle 0.5° had values above 0.1. The VIF revealed that these variables had 
values below 10. Therefore, it could be said that multicollinearity between independent 
variables in this regression model was not a problem. In addition, the above independ-
ent variables used for the regression equation had a p-value of less than 0.05, meaning 
that they had significant effects on the dependent variable. In contrast, KES-FB weight, 
extensibility, linearity of load, hysteresis of bending moment, shear stiffness, coefficient 
of friction, hysteresis of shear force at 5° shear angle, geometrical roughness, tensile 
resilience and mean deviation of MIU had p-value greater than 0.05, indicating no sig-
nificant effect on the dependent variable.
Correlation and regression analysis between CLO fabric kit measurement results 
and drapability of silk fabrics
Results of correlation analysis between drape coefficient and CLO fabric kit properties 
are shown in Fig. 5. The drape ratio showed a significant positive correlation with bend-
ing stiffness (0.431**) (p-value < 0.01) and a significant negative correlation with weight 
(3)
Drape coeﬃcient = 0.541−0.547 ×

KES −FB Tensile energy

+ 1.397 ×

KES −FB Bending rigidity

+ 0.185
×

KES −FB Hysteresis width at shear angle 0.5◦
+ 17.099 ×

KES −FB Compressional energy

−1.652 × (KES −FB Thickness)
Table 4  Regression analysis results of KES-FB variables for drape coefficient of silk fabrics
* p < 0.05, **p < 0.01, ***p < 0.001
Independent variables
Unstandardized 
coefficients
Standardized 
coefficients
t
r2
B
Standard error
β
(Constant)
0.541
0.247
2.186*
KES-FB Tensile energy
− 0.547
0.139
− 0.381
− 3.936**
KES-FB Bending rigidity
1.397
0.273
0.856
5.120***
0.786
KES-FB Hysteresis width at shear angle 0.5°
0.185
0.074
0.449
2.491*
KES-FB Compressional energy
17.099
5.023
1.163
3.404**
KES-FB Thickness
− 1.652
0.604
− 0.865
− 2.736**


---

Page 12 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
(-0.418**). Similar to the correlation between KES-FB properties and drape coefficient, 
bending properties and weight showed similar correlations. However, tensile properties 
and shearing properties did not show significant correlations.
Table 5 shows results of multiple regression analysis between CLO fabric kit fabric 
properties and the drape coefficient, and the explanatory power ­(r2) of the regression 
equation was 69.6%. Equation (4) is the regression equation of the regression model.
The drape coefficient is also expressed by bending property, thickness and weight with 
the CLO fabric kit results. As a result of checking the multicollinearity, CLO bending 
stiffness, thickness, and weight showed values of 0.1 or more in the case of tolerance and 
10 or less in the case of variance inflation factor, indicating no problem of collinearity. In 
addition, the above three variables were found to have significant effects on the depend-
ent variable (p-value < 0.05). On the other hand, CLO stretch stiffness and shear stiffness 
did not significantly affect the dependent variable (p-value > 0.05).
Comparison of drape coefficient between real and virtual silk fabrics
As a result of correlation analysis between drape coefficient of real fabric and the drape 
coefficient of virtual fabric, a high correlation of 0.824** was shown in Fig. 6.
(4)
Drape coeﬃcient = 0.479 + 1.209 × (CLO Thickness) −0.254
×

CLO Weight

+ 1.476 × 10−6
CLO Bending stiﬀness

0.8
1.0
1.2
1.4
1.6
1.8
2.0
2.2
0.4
0.5
0.6
0.7
0.8
0.9
1.0
y= -0.1827x + 0.9971
r= -0.418*
Drape coefficient
CLO Weight
(a)
0
20000
40000
60000
80000
100000
0.4
0.5
0.6
0.7
0.8
0.9
1.0
y= 3.632×10
-6 + 0.6908
r= 0.431*
Drape coefficient
CLO Bending stiffness
(b)
Fig. 5  Comparisons of drape coefficient and CLO fabric kit measurement values: a Weight, b Bending 
stiffness
Table 5  Regression analysis results of CLO fabric kit variables for drape coefficient of silk fabrics
* p < 0.05, **p < 0.01, ***p < 0.001
Independent variables
Unstandardized coefficients
Standardized 
coefficients
t
r2
B
Standard error
β
(Constant)
0.479
0.122
1.649*
CLO Thickness
1.209
0.411
0.360
2.940**
0.696
CLO Weight
− 0.254
0.053
− 0.580
− 4.768***
CLO Bending stiffness
1.476 × ­10–6
0.000
0.175
2.077*


---

Page 13 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
	
Although a high correlation was confirmed between the real and virtual drape coef-
ficients, an independent t-test in SPSS was performed to determine whether there 
was a statistically significant difference between the real and virtual drape coeffi-
cients. At this time, the null hypothesis was set that there was no difference between 
the drape coefficient of the real fabric and the drape coefficient of the virtual fabric, 
and the alternative hypothesis was set that there was a difference between the two 
drape coefficients, and then the analysis was conducted. The analysis results showed 
that t = 5.330, p = 0.03 were statistically significant with a significance level of < 0.05 
(Table 6). This means that there is a significant difference between the real and vir-
tual drape coefficient. The real drape coefficient was found to be 0.7619 on average, 
and the virtual drape coefficient was 0.6735, showing a tendency for the virtual drape 
coefficient to be smaller for the same fabric. In the system that measures the tensile 
stiffness of the CLO fabric kit, the force gauge does not set the maximum force, but 
measures the stretched length and the force applied at that point by point. It is pre-
sumed that the resulting values, which did not sufficiently reflect the tensile strength 
of the stiff silk fabric used in this study, were reflected in the drape coefficient.
In order to group silk fabrics with similar drape coefficient (characteristics), 
K-means cluster analysis was performed on the actual drape coefficient, and as a 
result, they were classified into 4 grades. As shown in Table 7, grade A had the lowest 
drape coefficient. The drape coefficient increased as grades B, C, and D were classified 
into fabric groups. Figure 7 shows drape images and real and virtual drape profiles 
for three silk fabrics corresponding to the median value of each grade. Comparing 
the difference in drape coefficient by grade of silk fabric, the difference between the 
0.4
0.5
0.6
0.7
0.8
0.9
1.0
0.4
0.5
0.6
0.7
0.8
0.9
1.0
y= 0.6815x + 0.1542
r= 0.824**
Virtual Drape coefficient
Real Drape coefficient
Fig. 6  Comparison between real and virtual drape coefficient of silk fabrics
Table 6  Independent samples t-test between real and virtual drape coefficient of silk fabrics
* p < 0.05
Drape coefficient
Mean
SD
Number of fabric
t
Real drape coefficient
0.7619
0.1564
30
5.330*
Virtual drape coefficient
0.6735
0.1294
30


---

Page 14 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
real and virtual drape coefficient tended to increase as the grade increased. In other 
words, it was confirmed that the worse the drapability, that is, the stiffer the fabric, 
the larger the difference in drape coefficient between real and virtual, similar to Yoon’s 
study (Yoon, 2021b). To analyze these results by grade, an independent sample t-test 
was conducted for real and virtual drape coefficient of silk fabrics belonging to each 
grade. As shown in Table 7, there was no statistically significant difference between 
real and virtual drape coefficients of fabrics belonging to grade A. There was a sta-
tistically significant difference between real and virtual drape coefficients of fabrics 
belonging to grades B, C, and D.
Table 7  Cluster analysis according to drape coefficient and independent sample t-test results 
between real & virtual drape coefficient of silk fabrics
** p < 0.01
*** p < 0.001
Grade
Fabric No
Real drape 
coefficient
Virtual drape 
coefficient
Mean
Similarity of
t
Real drape 
coefficient
Virtual drape 
coefficient
real and 
virtual 
coefficient
A
s19
0.380
0.477
s28
0.460
0.381
0.439
0.414
0.945
0.726
s14
0.478
0.379
B
s17
0.666
0.650
s12
0.647
0.534
s4
0.559
0.545
0.612
0.570
0.931
3.010**
s10
0.534
0.562
s4
0.655
0.560
C
s30
0.755
0.641
s11
0.841
0.593
s18
0.809
0.827
s24
0.726
0.668
s29
0.823
0.849
0.764
0.694
0.908
4.386***
s22
0.762
0.775
s15
0.777
0.632
s23
0.698
0.678
s21
0.709
0.652
s8
0.744
0.891
s20
0.964
0.767
s9
0.930
0.717
s7
0.831
0.689
s16
0.895
0.821
s6
0.872
0.726
D
s27
0.960
0.813
0.902
0.763
0.845
15.752***
s25
0.841
0.765
s13
0.865
0.859
s3
0.891
0.775
s2
0.975
0.764
s26
0.931
0.825
s1
0.878
0.695


---

Page 15 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
	
Looking at similarity of real and virtual drape coefficients according to grades 
divided by cluster analysis, the similarity between real and virtual drape coefficients 
of fabrics belonging to grade A was 94.5%, showing no statistical difference. However, 
it was found that there was a difference between real and virtual drape coefficients 
of silk fabrics belonging to grades B, C, and D. To analyze the cause of these results, 
physical properties of silk fabrics belonging to each grade were examined.
Table 8 shows weight, thickness, bending rigidity, and extensibility among KES-FB 
properties. These parameters showed high correlations with the drape coefficient. Silk 
fabrics belonging to grade A are plain weave fabrics woven with degummed silk yarns 
and patterned jacquard fabrics with a plain weave ground texture woven with deg-
ummed silk yarns. The bending rigidity had the smallest value of 0.089 gf·cm2/cm and 
the extensibility had the highest value of 1.03%. Therefore, silk fabrics belonging to 
grade A were thin and flexible fabrics woven with degummed yarns having low fabric 
Grade
Grade A
Grade B
Fabric
No.
s22
s6
s17
s30
s23
s20
Real
drape
image
Real
drape
profile
Virtual
drape
profile
Grade
Grade C
Grade D
Fabric
No.
s28
s2
s19
s13
s12
s8
Real
drape
image
Real
drape
profile
Virtual
drape
profile
Fig. 7  Drape images and profiles of real and virtual silk fabrics


---

Page 16 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
density. It is known that if the bending rigidity value is small, it is easy to form a sil-
houette that is rich in elasticity, thus emphasizing curves of the body because it shows 
flexibility (Omeroglu et al., 2010). Lagé et al. (2020) have reported that the accuracy 
of the virtual try-on is significantly more useful than that of the actual garment when 
the bending rigidity of the fabric is less than 5.3 Nm (0.054 gf·cm2/cm) and the ten-
sile strain in the warp direction is 1.80% or more similar to our results. The fabrics 
belonging to grades B and C were heavy in weight because they were woven with high 
warp and weft densities using degummed silk yarn. The jacquard fabrics and plain 
weave fabrics belonging to the middle group in thickness and bending property were 
groups with small values of extensibility. Fabrics belonging to grade D had the highest 
bending rigidity. They were mostly plain weave fabrics woven with thicker weft raw 
silk yarns.
Su¨le (2012) has reported that the drape coefficient of fabrics with high bending stiff-
ness was found to be high, which proved that the effect of bending stiffness of fabrics on 
drape properties is quite important. Therefore, when a virtual fabric was implemented 
with the CLO 3D virtual clothing program, the drape coefficient of the virtual fabric was 
realized almost similar to that of the real fabric for flexible and yielding fabrics. However, 
it was found that the drape coefficient difference between real and virtual fabrics was 
large for stiff and less stretchable fabrics. Lim and Istook (2011) have found that as flex-
ural properties of fabrics increase, the stretch decreases and the drape becomes stiffer 
similar to results to the present study. When implementing virtual materials using the 
CLO 3D virtual clothing program, Lee and Kim (2011) have reported that the similarity 
between real fabrics and virtual fabrics with high warp and weft stiffness characteristics 
such as organza or thick and form-stable fabrics such as denim is generally low.
There is a lack of practical data for fabric properties in the 3D virtual clothing indus-
try (Lee et al., 2011). To compensate for this, it is possible to express fabric properties 
in virtual space by applying physical properties measured in real fabrics. However, in 
addition to fabric properties provided by the virtual program, it is necessary to find 
appropriate values through various manual simulations (Chang & Lee, 2017). Based 
on the results of this study, virtual drape images were implemented for eight types 
of silk fabrics built in the fabric library in the CLO 7.1 program. As shown in Fig. 8, 
these eight types of virtual silk fabrics were taffeta, charmeuse, faille, crepe de-chine, 
double georgette, chiffon, duchess satin, and organza. Among them, taffeta, faille, and 
Table 8  Physical properties of silk fabrics belonging to each grade
Grade
Mean/SD
Weight (mg/cm2)
Thickness (mm)
Bending Rigidity 
(gf·cm2/cm)
Extensibility (%)
A
Mean
6.653
0.233
0.089
1.03
SD
1.598
0.014
0.015
0.139
B
Mean
9.159
0.290
0.241
0.636
SD
1.596
0.075
0.084
0.081
C
Mean
7.515
0.279
0.271
0.594
SD
1.983
0.070
0.097
0.079
D
Mean
5.577
0.297
0.331
0.673
SD
1.101
0.105
0.086
0.150


---

Page 17 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
	
organza showed large drape coefficient of 0.814, 0.822, and 0.872, respectively. Drape 
coefficient of the other five silk fabrics showed small values of 0.284 to 0.420. In other 
words, looking at the drape coefficient of silk fabric built into the CLO 3D program, 
the drapability of silk fabric in a low and high range can be realized. However, in the 
case of silk fabrics with a drape coefficient in the range of 0.5 to 0.7, there is a lack of 
actual silk fabric data base for use in implementing 3D virtual clothing. It seems nec-
essary to secure a substantial data base that can accurately reflect the physical char-
acteristics of silk fabric. In the virtual clothing simulation system currently in use, 
unlike the actual physical properties that have units, the bending and tensile property 
defined based on the particle system exist as dimensionless constant values without 
units, making it difficult to find a connection with the properties of the actual fabric. 
The three required fabric specimens through database creation.
Conclusions
The basic physical properties of fabrics were measured and conducted statistical analysis 
to investigate parameters affecting drapability for realizing 3D virtual clothing made of 
silk fabric. Additionally, the drapability of a virtual fabric implemented by the 3D CLO 
virtual clothing program and that of real fabrics were compared.
The drape coefficient of silk fabric was significantly correlated with extensibility, 
weight, tensile resilience, bending stiffness, and mean MIU deviation among KES-FB 
properties, and significantly correlated with bending stiffness and weight among CLO 
fabric kit measurements. The bending rigidity and weight per unit area were parameters 
influencing the drape coefficient.
Among the KES-FB properties, the tensile energy, bending stiffness, hysteresis width, 
thickness, and compression energy variables at a 0.5° shear angle predicted 78.6% of the 
drape coefficient. In addition, the drape coefficient could be predicted by 69.6% through 
Silk
Fabric
Taffeta
Charmeuse
Faille
Crepe de-chine
Drape 
coefficient
0.814
0.323
0.822
0.284
Virtual
drape
profile
Silk
Fabric
Double 
georgette
Chiffon
Duchess
satin
Organza
Drape 
coefficient
0.313
0.420
0.247
0.872
Virtual
drape
profile
Fig. 8  Drape profile and drape coefficient of virtual silk fabrics in 3D CLO fabric library


---

Page 18 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
thickness, weight, and bending stiffness variables among the CLO fabric kit properties. 
It was found that bending is the variable that determines the drape coefficient of the silk 
fabric the most.
The physical property evaluation values of KES-FB and CLO fabric kits showed a high 
correlation in weight, thickness, and bending characteristics. However, no significant 
correlation was obtained between the two systems in terms of tensile properties. There-
fore, it is necessary to adjust the physical properties of the program according to the 
tensile characteristics of the sample.
For stretchable and flexible silk fabrics, the real and virtual drape coefficients were in 
statistically significant agreement, confirming the possibility of clothing material imple-
mentation of the 3D digital clothing program. The CLO 7.1 program showed that the 
accuracy of virtual fabric was quite useful compared to real fabric if bending rigidity was 
lower than 0.089 gf·cm2/cm and extensibility was higher than 1.03%. However, it also 
confirmed a difference in similarity between real and virtual silk fabrics, which had a 
large drape coefficient of 0.6 or more with stiffness. In the case of stiff fabrics with low 
elasticity and high bending properties, more research is needed on the program mod-
eling method considering the mechanical and physical properties of real fabric and its 
structure.
Author contributions
JL proposed the research idea and JHK carried out the research. JHK were mainly responsible for data analysis and the 
experiment along with writing the manuscript, and JL was involved in the edition of the manuscript as well as data 
analysis and the experiments. All of the authors read and approved the final version of the manuscript.
Funding
This work was supported by the National Research Foundation of Korea(NRF) grant funded by the Korea 
government(MCST)(2022M3C1C5A02094018).
Availability of data and materials
The datasets used and/or analysed during the current study are available from the corresponding author on reasonable 
request.
Declarations
Ethics approval and consent to participate
Not applicable.
Competing interests
The author declares no competing interests.
Received: 9 January 2024   Accepted: 3 May 2024
References
Abdin, Y., Taha, I., El-Sabbagh, A., & Ebeid, S. (2013). Description of draping behaviour of woven fabrics over single curva‑
tures by image processing and simulation techniques. Composites Part B: Engineering, 45(1), 792–799. https://​doi.​
org/​10.​1016/j.​compo​sitesb.​2012.​06.​004
Buyukaslan, E., Kalaoglu, F., & Jevsnik, S. (2017). Drape simulation and subjective assessment of virtual drape. Materials 
Science and Engineering, 254(16), 1–6. https://​doi.​org/​10.​1088/​1757-​899X/​254/​16/​162002
Chan, C. K., Jiang, X. Y., Liew, K. L., Wong, W. K., & Lau, M. P. (2006). Evaluation of mechanical properties of uniform fabrics 
in garment manufacturing. Journal of Materials Processing Technology., 174(1–3), 183–189. https://​doi.​org/​10.​1016/j.​
jmatp​rotec.​2006.​01.​002
Chang, H., & Lee, J. (2017). A compative analysis of virtual clothing materials using a digital clothing. Journal of Fashion 
Business, 21(5), 30–42. https://​doi.​org/​10.​12940/​jfb.​2017.​21.5.​30
Choi, K. H. (2022). 3D dynamic fashion design development using digital technology and its potential in online platforms. 
Fashion and Textiles, 9(9). https://​doi.​org/​10.​1186/​s40691-​021-​00286-1


---

Page 19 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
	
Choi, Y. L., & Nam, Y. J. (2009). The qualitative study on the evaluation and the application of 3D scan and virtual try-on 
technology. Journal of the Korean Society for Clothing Industry, 11(3), 437–444.
Collier, B. J. (1991). Measurement of fabric drape and its relation to fabric mechanical properties and subjective evalua‑
tion. Clothing and Textile Research Journal, 10(1), 46–52. https://​doi.​org/​10.​1177/​08873​02X91​01000​107
Cusick, G. E. (1968). 21-The measurement of fabric drape. The Journal of the Textile Institute, 59(6), 253–260. https://​doi.​org/​
10.​1080/​00405​00680​86599​85
Fontana, M., Rizzi, C., & Cugini, U. (2005). 3D virtual apparel design for industrial applications. Computer-Aided Design, 
37(6), 609–622. https://​doi.​org/​10.​1016/j.​cad.​2004.​09.​004
Glombikova, V., & Zdenek, K. U. S. (2014). Drape evaluation by the 3D drape scanner. Textile and Apparel, 24(3), 279–285.
Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2009). Multivariate data analysis (7th ed.). New Jersey: Prentice-Hall.
Hu, J. L., & Chan, Y. F. (1998). Effect of fabric mechanical properties on drape. Textile Research Journal, 68(1), 57–64. https://​
doi.​org/​10.​1177/​00405​17598​06800​107
Ju, E., & Choi, M. G. (2020). Estimating cloth simulation parameters from a static drape using neural networks. IEEE Access, 
8, 195113–195121. https://​doi.​org/​10.​1109/​ACCESS.​2020.​30337​65
Kawabata, S. (2000). Fabric quality desubjectivised. Textile Asia, 31(7), 30–32.
Kenkare, N., & May-Plumlee, T. (2005). Evaluation of drape characteristics in fabrics. International Journal of Clothing Science 
and Technology, 17(2), 109–123.
Kim, H. S., & Na, M. H. (2013). Effects of bending properties and drapability on the hand and appearance of wool-blended 
fabrics: Comparison of real clothing with online and 3D virtual garments. Fibers & Polymers, 14(12), 2148–2156. 
https://​doi.​org/​10.​1007/​s12221-​013-​2148-2
Kim, M., Kim, M. O., & Park, S. (2014a). Comparison and analysis of men’s classic-fit and slim-fit shirt patterns-Utilizing the 
3D virtual try-on system-. The Research Journal of the Costume Culture, 22(2), 209–224. https://​doi.​org/​10.​7741/​rjcc.​
2014.​22.2.​209
Kim, S. (2011). Determination of fabric physical properties for the simulation of Cusick drapemeter. Fibers and Polymers, 
12(1), 132–136. https://​doi.​org/​10.​1007/​s12221-​011-​0132-2
Kim, Y., Yin, S., & Song, H. K. (2014b). A comparison of fit and appearance between real pants with 3D virtual pants. Fash-
ion & Textile Research Journal, 16(6), Article 961. https://​doi.​org/​10.​5805/​SFTI.​2014.​16.6.​961
Komatsu, K., & Niwa, M. (1981). Characteristics of physical properties of kimono fabric. Research Journal of Living Science, 
28(1), 235–243. https://​doi.​org/​10.​5772/​48585
Korean Agency for Technology and standards. (2021, October). KS K ISO9073-9 Textiles-Test methods for nonwovens-Part 
9: Determination of drapability including drape coefficient. Korean Standards & Certifications. Korean Agency for 
Technology and standards.   https://​stand​ard.​go.​kr/​strea​mdocs/​view/​sd;​strea​mdocs​Id=​72059​30779​96330​49
Lage, A., & Ancutiene, K. (2017). Virtual try-on technologies in the clothing industry. Part 1: investigation of distance ease 
between body and garment. The Journal of the Textile Insitute, 108(10), 1787–1793. https://​doi.​org/​10.​1080/​00405​
000.​2017.​12867​01
Lagé, A., Ancutiené, K., Pukiené, R., Lapkovska, E., & Dãbolina, I. (2020). Comparative study of real and virtual garments 
appearance and distance ease. Material Science, 26(2), 233–239. https://​doi.​org/​10.​5755/​j01.​ms.​26.2.​22162
Lee, M., Sohn, H., & Kim, J. (2011). A study on representation of 3D virtual fabric simulation with drape image analysis II-
focus on the comparison between real clothing and 3D virtual clothing-. Journal of Fashion Business, 15(3), 97–111.
Lee, R., & Kim, J. (2016). A study on the three-dimensional expression of fashionable textiles based on analysis of 3D scan‑
ning and textile properties-focus on the work of Iris van Herpen-. Journal of Fashion Business, 20(2), 124–133. https://​
doi.​org/​10.​12940/​jfb.​2016.​20.2.​124
Lee, Y., & Kim, J. (2011). A study on the drape profile analysis of the apparel textiles and 3D virtual textiles using a 3D 
digital clothing software. Journal of Fashion Business, 15(5), 103–114.
Lim, H., & Istook, C. L. (2011). Drape simulation of three-dimensional virtual garment enabling fabric properties. Fibers and 
Polymers, 12(8), 1077–1082. https://​doi.​org/​10.​1007/​s12221-​011-​1077-1
Lozen, D. Z., & Jevsnik, S. (2007). Some aspects of fabric drape. Fibres and Textiles in Eastern Europe, 15(4), 39–45.
Matsudaira, M., & Yang, M. (2000). Some features of the static and dynamic drape behaviour of polyester-fibre Shingosen 
fabrics. The Journal of the Textile Institute, 91(4), 600–615. https://​doi.​org/​10.​1080/​00405​00000​86591​31
Ministry of Culture, Sports and Tourism (2021). Korean traditional Hanbok clothes, expressing linear beauty. Ministry of 
Culture, Sports and Tourism. https://​www.​mcst.​go.​kr/​engli​sh/​useful/​issue.​jsp?​pTab=​02
Morooka, H., & Niwa, M. (1976). Relation between drape coefficients and mechanical properties of fabrics. Journal of the 
Textile Machinery Society of Japan, 22(3), 67–73. https://​doi.​org/​10.​4188/​jte19​55.​22.​67
Na, Y., & Kim, S. (2012). The comparative study on a characteristic expressivity of movie clothings and 3D virtual cloth‑
ings- focusing on the software: CLO 3D & Mavrelous Design2. The Society of Fashion and Textile Industry, 14(1), 1–12. 
https://​doi.​org/​10.​5805/​KSCI.​2012.​14.1.​001
Niwa, M., & Seto, F. (1986). Relationship between drapability and mechanical properties of fabrics. Journal of Textile 
Machinery Society of Japan, 39(11), 161–168. https://​doi.​org/​10.​4188/​trans​jtmsj.​39.​11_​T161
Omeroglu, S., Karaca, E., & Becerir, B. (2010). Comparison of bending, drapability and crease recovery behaviours woven 
fabrics produced from polyester fibers having different cross-sectional shapes. Textile Research Journal, 80(12), 
1180–1190. https://​doi.​org/​10.​1177/​00405​17509​355351
Park, C. K., Kim, S. M., & Yu, W. R. (2004). Quantitative fabric drape evaluation system using image processing 
technology(part 1: Measurement system and geometric model). Journal of Testing and Evaluation, 32(2), 131–137. 
https://​doi.​org/​10.​1520/​JTE11​755
Pattanayak, A. K., Luximon, A., & Khandual, A. (2010). Prediction of drape profile of cotton woven fabrics using artificial 
neural network and multiple regression method. Textile Research Journal, 81(6), 559–566. https://​doi.​org/​10.​1177/​
00405​17510​380783
Plotkina, D., & Saurel, H. (2019). Me or just like me? the role of virtual try-on and physical appearance in apparel m-retail‑
ing. Journal of Retailing and Consumer Services, 51, 362–377. https://​doi.​org/​10.​1016/j.​jretc​onser.​2019.​07.​002


---

Page 20 of 20
Kim and Lee ﻿Fashion and Textiles           (2024) 11:21 
Porterfield, A., & Lamar, T. A. (2017). Examining the effectiveness of virtual fitting with 3D garment simulation. Interna-
tional Journal of Fashion Design, Technology and Education, 10(3), 320–330. https://​doi.​org/​10.​1080/​17543​266.​2016.​
12502​90
Power, J. (2013). Fabric objective measurements for commercial 3D virtual garment simulation. International Journal of 
Clothing Science and Technology, 25(6), 423–439. https://​doi.​org/​10.​1108/​IJCST-​12-​2012-​0080
Rudolf, A., Zadravec, M., & Stjepanovic, Z. V. (2016). Investigations regarding the effects of simulating parameters during 
3D garments’ drape simulations. Fibers & Textiles in Estern Europe, 6(120), 143–150.
Sanad, R., Cassidy, T., Cheung, V., & Evans, E. (2013). Fabric and garment measurement- part 2. Journal of Fiber Bioengineer-
ing and Informatics, 6(1), 1–22. https://​doi.​org/​10.​3993/​jfbi0​32013​01
Sayem, A. S. M. (2015, December 26). Advances in virtual prototyping: Opportunities for clothing manufacturers [Confer‑
ence presentation]. Textile Research Conference, Dhaka, Bangladesh. https://​www.​resea​rchga​te.​net/​publi​cation/​
30891​7861
Sayem, A. S. M., Kennon, R., & Clarke, N. (2010). 3D CAD system for the clothing industry. International Journal of Fashion 
Design, Technoogy and Education, 3(2), 45–53. https://​doi.​org/​10.​1080/​17543​26100​36898​88
Shyr, T. W., Wang, P. N., & Cheng, K. B. (2007). A comparison of the key parameters affecting the dynamic and static drape 
coefficients of natural-fibre woven fabrics by a newly devised dynamic drape automatic measuring system. Fibres & 
Textiles in Eastern Europe, 15(3), 81–86.
Su¨le, G. (2012). Investigation of bending and drape properties of woven fabrics and the effects of fabric constructional 
parameters and warp tension on these properties. Textile Research Journal, 82(8), 810–819. https://​doi.​org/​10.​1177/​
00405​17511​433152
Sung, S. K., Kouh, J. O., & Kwon, O. K. (1987). A study on the mechanical properties of fabrics for Korean folk clothes(Part 1: 
On the women’s summer fabric). Journal of the Korean Society of Clothing and Textiles, 11(3), 79–88.
Tokmak, O., Berkalp, O. B., & Gersak, J. (2010). Investigation of mechanics and performance of woven fabrics using objec‑
tive evaluation techniques. Part I : The relationship between FAST, KES-F and Cusick’s drape meter parameters. Fibers 
& Textiles in Eastern Europe, 18(2), 55–59.
Tsukada, M., Khan, M. M. R., Miura, T., Postle, R., & Sakaguchi, A. (2013). Mechanical performance of wool fabrics grafted 
with methacrylamide and 2-hydroxyethyl methacrylate by the Kawabata evaluation system for fabric method. 
Textile Research Journal, 83(12), 1242–1250. https://​doi.​org/​10.​1177/​00405​17512​458338
Victoria and Albert Museum. (2023). Hanbok – traditional Korean dress. https://​www.​vam.​ac.​uk/​artic​les/​hanbok-​tradi​
tional-​korean-​dress
Yoon, H. J. (2021a). A study on the method of deriving emotional images of digital materials using KES-FB hand evalua‑
tion data. Fashion & Textile Research Journal, 23(5), 667–672. https://​doi.​org/​10.​5805/​SFTI.​2021.​23.5.​667
Yoon, H. J. (2021b). Drape comparison between virtual fabric and real fabric for the production of virtual clothing. Journal 
of Human Ecology, 25(3), 95–104. https://​doi.​org/​10.​36357/​johe.​2021.​25.3.​95
Yoon, H. J. (2022). Comparison of the silhouette of virtual cloth by fabric characteristics of nylon fabric for the utilization 
of virtual clothes. American Chemical Society Omega., 7(50), 47156–47164. https://​doi.​org/​10.​1021/​acsom​ega.​2c063​
02
Publisher’s Note
Springer Nature remains neutral with regard to jurisdictional claims in published maps and institutional affiliations.
Jeong Hwa Kim  Is a researcher at the Research Institute of Human Ecology, Chungnam National Univer‑
sity, Daejeon, South Korea.
Jung‑Soon Lee  Is a professor of Department of Clothing & Textiles, Chungnam National University, Dae‑
jeon, South Korea.
