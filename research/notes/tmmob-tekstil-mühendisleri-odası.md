---
title: TMMOB Tekstil Mühendisleri Odası
id: tmmob-tekstil-mühendisleri-odası
tags:
- modelista-producao-moda-dores-0698af
- locus-prototipagem-virtual-3d-vs-peca-piloto-fisica
created: '2026-11-27T03:53:23.206733Z'
source: https://dergipark.org.tr/en/download/article-file/4002942
source_domain: dergipark.org.tr
fetched_at: '2026-11-27T03:53:23.204725Z'
fetch_provider: builtin
status: draft
type: note
tier: institutional
content_type: paper
deprecated: false
raw_file: raw/tmmob-tekstil-mühendisleri-odası.pdf
---

*Suggested by [[virtual-fit-evaluation-for-optimization-of-garment-components-parameters-tekstil]] — Full PDF of Tekstil ve Muhendis study on virtual fit evaluation for garment component optimization*

 
 
TMMOB Tekstil Mühendisleri Odası 
UCTEA Chamber of Textile Engineers  
Tekstil ve Mühendis 
Journal of Textiles and Engineer 
Yıl (Year) : 2024/4 
Cilt (Vol) : 31 
Sayı (No) : 136 
Journal of Textiles and Engineer 
Tekstil ve Mühendis 
Cilt (Vol): 31 No: 136 
SAYFA 269 
Araştırma Makalesi / Research Article 
 
 
VIRTUAL FIT EVALUATION FOR OPTIMIZATION OF GARMENT 
COMPONENT’S PARAMETERS 
 
Sai Krishnan Arumbakkam NARASİMHAN1 
Palanisamy KANAKARAJ2
 
Ramachandran RAJAOPALAN3 
1PSG Polytechnic College, Coimbatore, India 
2PSG College of Technology, Coimbatore, India 
2National Institute of Fashion Technology, Kannur, India 
 
Gönderilme Tarihi / Received: 13.06.2024 
Kabul Tarihi / Accepted: 09.12.2024 
 
 
ABSTRACT: Apparel fit is influenced by body proportion, fabric, and design parameters, but much of the fit evaluation is carried out 
in a static model, which leads to time consumption and higher development costs. In this work, an attempt has been made to quantify 
the fit objectively for a basic crewneck T-shirt for men’s wear made of cotton and cotton-lycra blended single jersey knitted fabric. A 
parametric avatar model was created, and virtual patterns were developed by changing the design parameters at three levels in the CAD 
platform. The fit is objectively quantified as strain and ease in different garment fit zones of the body. Virtual 3D fit software evaluates 
the fit zones of the garment by incorporating the low-stress mechanical properties of the knitted fabrics into an avatar model. There is 
a significant influence on pattern parameters and material compositions; cotton-lycra garments reveal lower ease at various fit zones. 
 
Keywords: Armhole curve, ease, garment fit, low-stress 
 
 
 
GİYSİ BİLEŞENLERİNİN PARAMETRELERİNİN OPTİMİZASYONU İÇİN  
SANAL UYUM DEĞERLENDİRMESİ 
 
ÖZ: Giysi uyumu vücut oranı, kumaş ve tasarım parametrelerinden etkilenir, ancak uyum değerlendirmesinin çoğu statik bir modelde 
gerçekleştirilir, bu da zaman tüketimine ve daha yüksek geliştirme maliyetlerine yol açar. Bu çalışmada, pamuk ve pamuk-likra karışımlı 
süprem örme kumaştan yapılmış erkek giyimi için temel bir kruvaze yaka tişört için uyumu objektif olarak ölçmek için bir girişimde 
bulunulmuştur. Parametrik bir avatar model oluşturulmuş ve CAD platformunda tasarım parametreleri üç seviyede değiştirilerek sanal 
kalıplar geliştirilmiştir. Uyum, vücudun farklı giysi uyum bölgelerindeki gerginlik ve rahatlık olarak objektif olarak ölçülür. Sanal 3D 
fit yazılımı, örme kumaşların düşük gerilimli mekanik özelliklerini bir avatar modeline dahil ederek giysinin fit bölgelerini değerlendirir. 
Desen parametreleri ve malzeme bileşimleri üzerinde önemli bir etki vardır; pamuk-likra giysiler çeşitli uyum bölgelerinde daha düşük 
rahatlık gösterir. 
 
Anahtar Kelimeler: Kol deliği kıvrımı, kolaylık, giysi uyumu, düşük stres 
 
 
 
 
 
 
 
 
 
 
 
*Sorumlu Yazarlar/Corresponding Authors: vijayysai@gmail.com 
DOI: https://doi.org/10.7216//teksmuh.1500589               www.tekstilvemuhendis.org.tr  
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


---

 
 
Journal of Textiles and Engineer 
Cilt (Vol): 31 No: 136 
SAYFA 270 
Tekstil ve Mühendis 
Virtual Fit Evaluation for Optimization  
of Garment Component’s Parameters 
Sai Krishnan Arumbakkam NARASİMHAN, 
Palanisamy KANAKARAJ, Ramachandran RAJAOPALAN
 
1. INTRODUCTION 
Consumers purchasing apparel products are attracted to the design 
elements where fit plays an essential role in purchasing decisions, 
as well-fitted apparel allows freedom of movement and comfort 
for the wearer without any restrictions. [1]. It also presents 
challenges for retailers, as many apparel products are unsold due 
to fit issues, as the product is not fitted to the correct size of the 
consumer; even online retailers are facing major fit issues due to 
a lack of information on measurements and body shapes for 
producing the proper fit apparel [2, 3]. A major clothing brand is 
also experiencing sizing and fit issues with customers [4]. In the 
manufacturing process, the development of fit samples is the 
essential process of getting approval from the client to 
manufacture the right-fitting apparel for consumers, which will 
also reduce the prototype [5].To develop an apparel product with 
a good fit, a proper understanding of the relationship between 
ease, the shape of the human body, and a garment is important. To 
a certain extent, body cathexis affects the fit through negative and 
positive feelings about the body of the wearer [6, 7]. The fit of 
apparel is a combination of ease, line, grain, balance, and set. The 
ease is the difference in measurements between the individual 
wearer's body and the garment, as well as the ease that includes 
functional and styling purposes. The functional ease of the 
garment allows the body movement without any restriction. 
Functional ease, which is very crucial in apparel [8, 9]. 
The fabric elongation, recovery characteristics, and garment style 
features should also be considered as important parameters in the 
design of apparel. Negative ease is required in the design of 
products made from stretch fabric for the application of action 
sportswear. Another factor is the line, which introduces fullness in 
the form of a dart, pleat, tuck, or gathering to make the wearer 
appear shorter or taller. The set is referred to as the garment 
construction aspects, it is often termed "workmanship," where the 
finished appearance of the apparel should be free from puckering 
and have a smooth appearance without any conspicuous 
construction defects. The set indicates the absence of wrinkles in 
the constructed garments. 
The balance is achieved by making the visual space of the various 
parts of the apparel equal or unequal; the balance can be 
introduced in horizontal, vertical, or radial spaces. Understanding 
the anatomy of human figures determines the introduction of 
balance into the visual space. It is also related to how the garments 
hang evenly on the left and right sides of the body. The grain is 
the direction in which the pattern components are arranged to cut 
and sew the garment panels; grain directions affect fit and are 
frequently related to sets of yarn arrangements in fabric formation 
such as weaving or knitting. Many researchers determine the fit 
subjectively; the competent expert is asked to judge the fit in the 
critical zone by scale ratings. 
Evaluation of the apparel fit is very important for product design 
and manufacturing [10]. Nowadays, with the advent of 3D CAD 
technology that can virtually simulate the garment over the 
parametric avatar model by developing the 2D pattern in CAD 
software and virtually stitching the components of a garment, such 
an avatar can be created based on the individual body 
measurements. It also has a scope for comparing virtual and real 
fit by quantifying the ease and strain in the different fit zone 
regions [11, 12]. When making a decision, objectively quantifying 
the fit will also aid in correlating with subjective assessment. 
Deepti Gupta also reported that with CAD/CAM technologies, 
garment fit testing can be measured very accurately on a virtual 
platform with different postures [13]. The 3D technology also 
incorporates fabric properties, particularly low-stress mechanical 
properties, into the design of 2D patterns and virtual simulations. 
It has a provision to create a library of fabric properties and 
integrate it into the CAD system, which will also reduce 
prototyping and make the product in a shorter time. Automated 
virtual pattern development systems provide a better custom fit 
based on consumer demand and requirements [14]. Several 
researchers are currently attempting to relate the mechanical 
properties of various woven fabric materials by determining the 
strain and ease distribution of apparel fit. Penelope Watkins has 
also made extensive attempts in stretch garment design for 
assessing the fit objectively [15]. 
This study focuses on the optimization of pattern design variables 
on men's basic garment style made from single jersey knitted 
cotton and cotton-lycra blended fabric, which are ideal for casual 
wear due to tactile comfort characteristics [16,17,18].The aim of 
the work is to find the relationship between pattern design 
parameters and garment fit in the various critical fit zones for the 
wearer by considering the low-stress mechanical properties of the 
fabric. The strain and ease in different fit zones are quantified by 
performing experiments in a virtual simulation and reporting the 
findings in the statistical model. 
 
2. MATERIAL AND METHOD 
2.1 Material 
The single jersey knitted fabrics of 100% cotton (F1) and the 
blends of 95% cotton and 5% lycra (F2) are sourced and tested for 
their various parameters, as shown in Table 1. Low-stress 
mechanical properties of the knitted fabric are also tested with the 
specimen size of 20 cm x 20 cm in the Kawabata evaluation 
system. The tests, such as tensile, bending, shear, and friction, 
were determined and shown in Table 2. The tested values were fed 
into the virtual software. The total handle value is also determined 
for the fabrics. 
2.2 Pattern Development method in virtual platform  
The patterns for basic knitted T-shirt styles used for 100% cotton 
and 95% cotton-5% lycra fabrics were developed in the Lectra-
Modaris V8R1 3D fit software. In the virtual simulation platform, 
seventeen patterns were created to determine the garment fit. The 
patterns were developed by altering the ease and pattern shape in 
the fit zones. The selection of ease was changed in the side seam 
of the pattern in three levels, and the shoulder drop was changed 
where the shoulder length connects the neck and arm region. The 
armhole curve is concave on three levels. For the shape of the 


---

 
 
Journal of Textiles and Engineer 
Cilt (Vol): 31 No: 136 
SAYFA 271 
Tekstil ve Mühendis 
Virtual Fit Evaluation for Optimization  
of Garment Component’s Parameters 
Sai Krishnan Arumbakkam NARASİMHAN, 
Palanisamy KANAKARAJ, Ramachandran RAJAOPALAN
armhole, the sleeve patterns were made by changing the sleeve cap 
curve and sleeve cap height. The main intention of changing the 
sleeve pattern is to determine the fit in the upper arm region. To 
quantify the ease and strain at the fit zones objectively, a 
parametric avatar model has been created based on the 
measurements of the subject. The subject measurements are 104 
cm- full chest, 46 cm- across the shoulder, and 25 cm- in the upper 
arm to create a parametric avatar model to find the fit virtually, 
and zones of fit were assessed in the chest, shoulder, and upper 
arm regions.  
2.3 Garment Fit Assessment and analysis 
Design expert software 8.7.0.1 was used to analyze the effect of 
the interaction of pattern design parameters on the fit of the basic 
knitted style. The coded levels of the parameters are mentioned in 
Table 3. Ease reduction is determined  by dividing the average 
value of F2 and F1 for both chest and armhole ease from the 
optimized pattern parameters. Based on the optimized pattern 
parameter, garments were constructed and the wear study was 
carried out subjectively. The subjects were asked to wear the 
garments, the following questions were asked to the wearer:1. 
Does the garment fit exactly to your body's contour? 2. How does 
it feel while rotating the arm region 3. Does it feel compatible 
while twisting your hip region? 4. How does it feel while having 
motion in scapula region? 5. Does circumduction feel (hip) 
comfortable? 6. Would you kindly rate the comfort of the 
garment? The subject were asked to rate using a Likert scale. 
Excellent -5, Very good-4, Preferable fit-3, Fair-3, Poor fit-1, Not 
fit-0. 
 
 
 
 
Table 1. Fabric parameters of the tested samples 
Fabric particulars 
F1 
(100% cotton) 
F2 
(95% Cotton and %5 Lycra) 
Fabric weight (g/m2) 
162 
145 
Fabric thickness (mm) 
0.61 
0.73 
Loop length (cm) 
0.31 
0.38 
 
 
Table 2. Low stress mechanical properties of single jersey knitted fabric 
Fabric 
Tensile 
Bending 
Shear 
Friction 
Handle 
value 
LT 
WTgf.cm/cm2 
RT% 
EMT% 
B 
gf.cm2/cm 
2HB 
gf.cm/cm 
G 
gf/cm.deg 
2HG 
gf/cm 
MIU 
THV 
F1 
0.707 
0.83 
37.07 
9.365 
0.027 
0.010 
0.79 
3.71 
0.208 
4.13 
F2 
0.461 
1.09 
59.4 
17.07 
0.010 
0.014 
0.58 
1.88 
0.223 
4.48 
 
 
Table 3. Coded Levels For Developing Virtual Patterns 
Pattern Parameter 
F1 and F2 Garments 
Level 1 
Level 2 
Level 3 
Chest ease (cm) 
5 
6 
7 
Shoulder drop (cm) 
2 
2.5 
3 
Armhole curve (cm) 
0.5 
1 
1.5 
 
 


---

 
 
Journal of Textiles and Engineer 
Cilt (Vol): 31 No: 136 
SAYFA 272 
Tekstil ve Mühendis 
Virtual Fit Evaluation for Optimization  
of Garment Component’s Parameters 
Sai Krishnan Arumbakkam NARASİMHAN, 
Palanisamy KANAKARAJ, Ramachandran RAJAOPALAN
Table 4. Fit zone ease and strain 
S.No. 
Chest 
Ease 
(cm) 
Shoulder 
drop (cm) 
Armhole 
curve shape 
(cm) 
Chest Region –Fit 
Shoulder Region -Fit 
Upper arm Region Fit 
F1 
Fabric 
F2 Fabric 
F1 
Fabric 
F2 
Fabric 
F1 Fabric 
F2 
Fabric 
1 
6 
3 
0.5 
9.86 
4.71 
-1.71 
0 
0 
0 
2 
6 
2 
1.5 
10.83 
4.92 
-16.1 
-0.17 
-1.79 
0 
3 
6 
2.5 
1.5 
15.93 
7.62 
-7.45 
0 
5.04 
0 
4 
7 
2.5 
1.5 
9.29 
5.72 
-5.7 
-2.61 
0.3 
1.98 
5 
7 
2.5 
0.5 
12.43 
6.78 
-4.88 
-2.4 
5.6 
1.72 
6 
6 
2.5 
1.5 
15.93 
7.62 
-7.45 
0 
5.04 
0 
7 
5 
3 
1.5 
9.43 
1.78 
-1.41 
-1.98 
-0.01 
0 
8 
7 
3 
1.5 
15.56 
7.48 
-0.62 
-2.89 
3.51 
0.97 
9 
6 
2 
0.5 
6.37 
5.4 
-8.52 
-0.57 
1.51 
0 
10 
6 
3 
1.5 
12.2 
3.63 
-2.82 
-3.08 
1.29 
0.52 
11 
6 
2.5 
1.5 
15.93 
7.62 
-7.45 
0 
5.04 
0 
12 
5 
2.5 
1.5 
5.17 
5.91 
-3.76 
-2.73 
0 
0.82 
13 
6 
2.5 
1.5 
15.93 
7.62 
-7.45 
0 
5.04 
0 
14 
7 
2 
1.5 
13.74 
5.431 
-1.43 
-0.22 
0 
0 
15 
5 
2 
1.5 
5.72 
4.75 
-1.54 
-2.9 
1.89 
0.87 
16 
5 
2.5 
0.5 
7.13 
6.5 
-3.49 
-2.93 
0 
0 
17 
6 
2.5 
1.5 
15.93 
7.62 
-7.45 
0 
5.04 
0 
 
 
 
 
 
 
 
 
3. RESULTS AND DISCUSSION 
The results in Table 4 show the strain and ease obtained from the 
virtual simulation of the avatar for the various critical fit zones. 
The  Table 5 shows the ANOVA test results of the  fit repsonses 
for F1 and F2 fabric . The effect of the independent variables on 
garment fit at various fit zones is discussed.  
3.1 Effect of pattern parameters on fit in the chest region 
Figure 1 shows the effects of chest ease and shoulder drop on 
garment fit at the chest region for the garments made from F1 and 
F2 knitted fabrics. The garment fit made from F1 fabric influenced 
by the chest ease significantly (p value 0.0018<0.05), but the 
interaction between chest ease and shoulder drop, shoulder drop 
and armhole curve, and chest ease and armhole curve shows 
insignificant influence (p-value 0.5985, 0.7407, and 0.558> 0.05) 
at the 95% significant level. The F1 material’s virtual pattern side 
seam has been drafted straight without any concave shape that 
makes it more ease in the chest region, at a maximum of 15.93 cm 
and a minimum value of 5.72 cm. Sufficient ease is also required 
for the wearer to provide ergonomic comfort for normal activities. 
Winfred Aldrich reported that for leisure wear and sportswear 
made from jersey fabric, the side seam of the pattern for men’s 
wear is drawn straight for easy fitting [19]. The fit at the chest 
region for the garment made of F2 fabric was also influenced by 
chest ease (p value 0.00134<0.05). The interaction between chest 
ease and shoulder drop is having significant influences (p-value 
0.0216 is less than 0.05). As there is an increase in shoulder drop 
measurements, the ease is also reduced in the chest region. The 
other factors could be the reduction of ease for F2 fabric, and 
blending of lycra material also contributes to good elongation and 
recovery in the chest region. The interaction of shoulder drop and 
armhole curve and chest ease and armhole curve shows 
insignificant influences for F2 fabric (p-value 0.7908 and 0.7353> 
0.05) at 95% level. 
3.2 Effect of pattern parameters on fit in shoulder region 
The Figure 2 shows the effects of shoulder drop and armhole curve 
on garment fit at the shoulder region for the garments produced 
from F1 and F2 fabrics. The F1 fabric shows the selected chest 
ease, shoulder drop, and armhole curve having significant 
influences on the fit of the garment individually. The interaction 
between chest ease and shoulder drop, shoulder drop and armhole 
curve, and chest ease and armhole curve are also significant 
influences (p-value < 0.05). The F1 material exhibits more strain 
in the shoulder region due to the deeper armhole curve. Regarding 
F2 material, the interaction between chest ease and shoulder drop 
(p-value 0.0026), shoulder drop, and armhole curve (p-value 
0.0031) shows significant influences. The p-values are less than 
0.05. Figure 2 also shows an increase in the shoulder drop reflects 
strain in the shoulder fit zone, but the overall strain is less when 
compared to F1 material. Since the low-stress mechanical 
properties tensile strain (EMT) and tensile resilience (RT) are 
higher for F2 fabric, eventually it will have good wearing comfort. 
The bending rigidity and bending hysteresis are lower for the F2 
fabric. So, the F2 fabric bends easily and has a higher ability to 
recover. 


---

 
 
Journal of Textiles and Engineer 
Cilt (Vol): 31 No: 136 
SAYFA 273 
Tekstil ve Mühendis 
Virtual Fit Evaluation for Optimization  
of Garment Component’s Parameters 
Sai Krishnan Arumbakkam NARASİMHAN, 
Palanisamy KANAKARAJ, Ramachandran RAJAOPALAN
3.3 Effect of pattern parameters on fit in upper arm region  
The Figure 3 shows the effects of shoulder drop and armhole curve 
at the upper arm region for F1 and F2 fabric garments. The F1 
fabric shows the individual parameters, and the interaction 
between chest ease and shoulder drop, shoulder drop and armhole 
curve, chest ease and armhole curve shows significant influence 
as (p-value < 0.05). The interaction between chest ease and 
shoulder drop shows that an increase in the shoulder drop provides 
less ease in the upper arm region for F1 fabric garments. By 
varying the chest ease and the interaction between the chest ease 
and armhole curve for F2 fabric, it also shows significant 
influences on garment fit at the upper arm region as a p-value 
<0.05. But the F2 material's strain and ease have been noticed in 
the interaction of chest ease and shoulder drop. This may be due 
to shear properties that affect the surface fitting characteristics in 
the upper arm region; the F2 fabric has shear rigidity, shear 
hysteresis shows lower, and eventually, the fabric has an excellent 
ability to recover after it is sheared, which influences lower ease. 
It is also observed that, based on the low stress properties, the 
compression resiliency of the F2 fabric is higher when compared 
to the F1 fabric, which influences the reduction in ease in the upper 
arm region. The interaction of shoulder drop and armhole curve, 
chest ease and armhole curve shows insignificant influence for F2 
fabric (p-value 0.4886 and 0.5191> 0.05) at 95% level. 
 
 
 
Figure 1.  Effect of chest ease and shoulder drop on fit at Chest region for F1 and F2 fabric made garments 
 
 
 
Figure 2. Effect of shoulder drop and armhole curve on fit at Shoulder region for F1 and F2 made garments 


---

 
 
Journal of Textiles and Engineer 
Cilt (Vol): 31 No: 136 
SAYFA 274 
Tekstil ve Mühendis 
Virtual Fit Evaluation for Optimization  
of Garment Component’s Parameters 
Sai Krishnan Arumbakkam NARASİMHAN, 
Palanisamy KANAKARAJ, Ramachandran RAJAOPALAN
 
 
Figure 3.  Effect of chest ease and shoulder drop on fit at Upper arm region for F1 and F2 made garments 
 
Table 5. ANOVA Test results for the responses –Chest,Shoulder and Upper arm  
 
 
Chest 
Shoulder 
Upper arm 
Source 
F1 
p-value 
F2 
p-value 
F1 
p-value 
F2 
p-value 
F1 
p-value 
F2 
p-value 
Model 
0.0046 
0.0134 
< 0.0001 
0.0003 
< 0.0001 
0.0333 
A-chest 
0.0018 
0.0314 
< 0.0001 
0.0669* 
< 0.0001 
0.0285 
B-shoulder drop 
0.0693* 
0.2681* 
< 0.0001 
0.0080 
< 0.0001 
0.5851 * 
C-armhole curve 
0.7361* 
0.2249* 
< 0.0001 
0.0469 
< 0.0001 
0.1833* 
AB 
0.5985* 
0.0216 
< 0.0001 
0.0026 
< 0.0001 
0.0474 
AC 
0.7407* 
0.7908* 
< 0.0001 
0.6197* 
< 0.0001 
0.4886* 
BC 
0.5558* 
0.7353* 
< 0.0001 
0.0031 
< 0.0001 
0.5191* 
*  not significant at 95% level 
 
 
 
 
   
 
 
3.4 Determination of ease reduction  
The Table 6 shows the best optimized solutions obtained from the 
design expert software for pattern parameters. The chest and 
armhole ease have significantly reduced for the F2 fabric; the 
reduction of ease is around 12 to 13%, and a conversion factor has 
been derived by dividing the average value of F2 and F1 for both 
chest and armhole ease. The conversion factor was found as 
(5.76/5.02=0.87 for chest ease and 1.33/1.55=0.88 for armhole 
ease). This conversion factor can be used for the reduction of ease 
measurement for fabric having 95% cotton and 5% lycra 
constitution, which also contributed to the fabric savings. 
3.5 Virtual simulation and  subjective assessment 
Based on the optimized parameters obtained from the design 
expert software, the actual garment was constructed, and the fit is 
evaluated in the static and dynamic movements from the wearer's 
perspective. The opinion from the subject stated that the garment 
fits well without any discomfort in the selected critical zones, such 
as the chest region, armhole region, and upper arm region, as 
shown in Figure 4. The F2 fabric garment fits better, and it is also 
observed from Table 2 the total handle value of F2 fabric is higher 
as compared to F1 fabric. The final virtual simulated garment and 
optimized response values for crtical fit zone responses are shown 
in Figure 5 a and b. 
Table 6. Optimized pattern parameters for F1 and F2 fabrics 
Solutions 
numbers 
Chest Ease (cm) 
Armhole curve ease (cm) 
F1 
F2 
F1 
F2 
1 
5.6 
5 
1.5 
1.34 
2 
5.62 
5.02 
1.5 
1.36 
3 
5.72 
5.03 
1.5 
1.36 
4 
5.66 
5.05 
1.5 
1.38 
5 
5.42 
5.05 
1.5 
1.36 
6 
5.57 
5 
1.49 
1.28 
7 
5.6 
5 
1.5 
1.32 
8 
5.91 
5.07 
1.5 
1.39 
9 
5.37 
5 
1.5 
1.24 
10 
6.24 
5 
1.5 
1.35 
11 
6.04 
5.02 
1.46 
1.37 
12 
6.38 
5 
1.5 
1.18 
Average 
5.76 
5.02 
1.5 
1.33 
 
 
 
 


---

 
 
Journal of Textiles and Engineer 
Cilt (Vol): 31 No: 136 
SAYFA 275 
Tekstil ve Mühendis 
Virtual Fit Evaluation for Optimization  
of Garment Component’s Parameters 
Sai Krishnan Arumbakkam NARASİMHAN, 
Palanisamy KANAKARAJ, Ramachandran RAJAOPALAN
 
 
 
 
 
Figure 4. Subjects rating value 
 
      
 
Figure 5. a) Virtual simulation of F1 and F2 fabrics and  b) optimized values 
 
 
4. CONCLUSION 
The experimental investigation was conducted on a virtual 
platform by changing the pattern parameters and the strain and 
ease values for both F1 and F2 knitted materials in the critical fit 
zones. The key conclusions are summarized as follows: 
 The influence of pattern design parameters has significant 
effects on the fit zone of the chest region for both fabric 
garments due to the shaping of the pattern, but the quantum of 
ease reduction is much higher for F2 fabric garments due to the 
influence of fabric properties. 
 The shoulder fit zone exhibits strain for both styles, which is 
much higher for F1 compared to F2 due to the influence of the 
shear properties of the fabric. In the upper arm, minimum ease 
has been obtained for F2 due to the higher compression 
resiliency properties of the fabric.  
 The desirable percentage for optimized pattern parameters for 
both styles is obtained above 80%; the low stress mechanical 
properties of knitted fabrics and pattern design variables make 
a significant contribution to the apparel fit, which is exactly 
quantified in the virtual fit. As the garments are also developed 
and evaluated with the actual subject, there are significant 
differences in the fit of the actual garment made from the 
optimized design data for both materials, and F2 outperforms 
F1 due to better handle and elongation properties. 
 The optimization of pattern parameters and finding of ease 
reduction makes a significant contribution to the reduction of 
fabric waste in the apparel industry for mass production. This 
finding also helps the customized garment development based 
on fabric properties in the segment of digital marketing of 
apparel products on the online platform. 
 
(a) 
(b) 


---

 
 
Journal of Textiles and Engineer 
Cilt (Vol): 31 No: 136 
SAYFA 276 
Tekstil ve Mühendis 
Virtual Fit Evaluation for Optimization  
of Garment Component’s Parameters 
Sai Krishnan Arumbakkam NARASİMHAN, 
Palanisamy KANAKARAJ, Ramachandran RAJAOPALAN
ACKNOWLEDGEMENT 
The author wishes to thank Dr. K. Prakasan, Principal, PSG 
College of Technology, and Dr. K. Chandrasekaran, HOD-In 
charge, Fashion Technology, for their help and encouragement in 
this work. The author wishes to thank Dr. B. Giriraj, Principal, 
and Dr. V. Chandrasekaran, HOD-Apparel Technology of PSG 
Polytechnic College, for their support in the work. 
 
REFERENCES 
 
1. 
Yufu Shan., Gu Huang., XiaomingQian., (2012), Research Overview 
on Apparel Fit, Soft Computing in Information Communication 
Technology , 161, 39–44. 
2. 
Thomassey, P., Bruniaux., (2013), A template of ease allowance for 
garments based on a 3D reverse methodology, International Journal 
of Industrial Ergonomics , 43(5),406- 416. 
3. 
Hyejeong Kim., Mary Lynn Damhorst.,(2010),The Relationship of 
Body-Related Self-Discrepancy to Body Dissatisfaction, Apparel 
Involvement, Concerns With Fit and Size of Garments, and Purchase  
Intentions in Online Apparel Shopping, Clothing and  Textile  
Research  Journal , 28(4),239-254. 
4. 
Indrie liliana., et al., (1999), Computer aided design of knitted and 
woven fabrics and virtual garment Simulation, IndustriaTexila, 70(6) 
,557-563. 
5. 
Inexz L Kohn., Susan P Ashdown.,(1998), Using video capture and 
image analysis  to quantify  apparel fit,Textile Research Journal, 
68(1), 17-26. 
6. 
Ellen McKinney., et al.,(2016), Body-to-Pattern Relationships  in 
women’s Trouser Drafting Methods: Implications for Apparel Mass 
Customization. Clothing and  Textile  Research Journal ,35(1), 16-32.  
7. 
Karen L Labat., Mariyln R.Delog., (1990), Body cathexis and 
satisfaction with fit of apparel,Clothing and Textile Research Journal 
8(3), 43-48. 
8. 
Chin-Man Chen.,  (2007), Fit evaluation within the made-to-measure 
process, International Journal of Clothing Science and Technology, 
19(2),131-1443. 
9. 
Simeon Gill., Steve Hayes,  (2012), Lower body functional ease  
requirements in the garment pattern, International Journal of 
Fashion Design, Technology and Education, 5(1), 13–23. 
10. Kaixuan Liu., et al., (2022), An evaluation of garment fit to improve 
customer body fit of fashion design clothing, The International 
Journal of Advanced Manufacturing  Technology, 120 ,2685–2699. 
11. Abu Sadat Muhammad Sayem., Richard Kennon .,Nick Clarke., (2010), 
3D CAD systems for the clothing  industry, International Journal of 
Fashion Design, Technology and Education, 2(131), 45-53. 
12. Kristina Ancutiene., (2014), Comparative analysis of real and 
virtual garment fit, IndustriaTexila ,65(3), 158-165. 
13. Deepti Gupta., (2011), Design and Engineering of Functional clothing, 
Indian Journal of Fibre  and Textile  Research, 36 , 327-335. 
14. Hyunsook Han., Hyunjung Han ., Taehoon Kim, (2021) , Proposal 
for the development of sleeve patternmaking  process and the 
definition of sleeve pattern structures for mass customization, 
International Journal of Clothing Science and Technology,  33(1) , 
131-144. 
15. Penelope Watkins., (2011),  Designing with Stretch fabrics, Indian 
Journal of Fibre  and Textile  Research, 36 , 366-379. 
16. Olaru Sabina, Spânachi Elena., Filipescu Emilia., Salistean Adrian, 
(2014), Virtual Fitting– Innovative Technology for Customize 
Clothing Design , Procedia  Engineering, 69, 555 – 564. 
17. Kristina Anucutiene., DovileSinkevicute, (2011), The Influence of 
Textile Materials Mechanical Properties upon Virtual Garment Fit, 
Material Science ,17(2), 160-167. 
18. Pau-Lin Chen., Roger L.Barker., Gary W.Smith., (1992),  Handle of 
Weft Knit Fabrics, Textile  Research Journal,  62 , 200-211.  
19. Aldrich W, (1997), Metric pattern cutting for menswear, Blackwell 
Science, Oxford. 
 
 
